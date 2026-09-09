package calc

import (
	"bufio"
	"fmt"
	"io"
	"strconv"
	"strings"

	"prototype_kl/parser"
)

// Calculator is an interactive read-evaluate-print loop.
//
// Variable resolution is done at the token level: expressions are tokenized
// by the lexer, and only whole identifier tokens that name a defined variable
// or "ans" are rewritten to their numeric literals before the strict parser
// package evaluates them. This keeps the parser's own lexer untouched while
// giving the calculator first-class variables.
type Calculator struct {
	vars      map[string]float64
	ans       float64
	hasAns    bool
	memory    float64
	hasMem    bool
	history   []string
	results   []string
	statePath string
	degMode   bool
	sci       bool
	prec      int
	undoStack []state
	redoStack []state
	quiet     bool
	lastExpr  string
	eng       bool
	in        *bufio.Reader
	out       io.Writer
}

// New returns a Calculator reading lines from reader and writing to writer.
func New(reader io.Reader, writer io.Writer) *Calculator {
	return &Calculator{
		vars: make(map[string]float64),
		prec: 15,
		in:   bufio.NewReader(reader),
		out:  writer,
	}
}

// NewBatch returns a quiet calculator for scripting: no banner, prompts, or
// state persistence.
func NewBatch(reader io.Reader, writer io.Writer) *Calculator {
	c := New(reader, writer)
	c.quiet = true
	return c
}

// NewPersistent returns a calculator that loads a saved session from path and
// persists it back when the session ends.
func NewPersistent(reader io.Reader, writer io.Writer, path string) (*Calculator, error) {
	c := New(reader, writer)
	c.statePath = path
	if err := c.loadState(path); err != nil {
		return nil, err
	}
	return c, nil
}

// Run starts the interactive loop. It returns when input reaches EOF or the
// user types "quit"/"exit".
func (c *Calculator) Run() {
	if !c.quiet {
		fmt.Fprintln(c.out, "Math Calculator - type 'help' for commands, 'quit' to exit.")
	}
	for {
		if !c.quiet {
			fmt.Fprint(c.out, c.prompt())
		}
		line, err := c.in.ReadString('\n')
		line = strings.TrimSpace(line)
		if line != "" {
			quit, err := c.handle(line)
			if err != nil {
				fmt.Fprintf(c.out, "error: %v\n", err)
			}
			if quit {
				break
			}
		}
		if err != nil {
			break // EOF after the final line
		}
	}
	if c.statePath != "" {
		_ = c.saveState(c.statePath)
	}
}

// snapshot returns a copy of the full session state for undo.
func (c *Calculator) snapshot() state {
	vars := make(map[string]float64, len(c.vars))
	for k, v := range c.vars {
		vars[k] = v
	}
	hist := make([]string, len(c.history))
	copy(hist, c.history)
	return state{
		Vars:    vars,
		Memory:  c.memory,
		HasMem:  c.hasMem,
		Ans:     c.ans,
		HasAns:  c.hasAns,
		History: hist,
	}
}

// restore resets the calculator to a saved snapshot.
func (c *Calculator) restore(st state) {
	c.vars = st.Vars
	c.memory = st.Memory
	c.hasMem = st.HasMem
	c.ans = st.Ans
	c.hasAns = st.HasAns
	c.history = st.History
}

// handle processes one input line: commands, assignments, or expressions.
func (c *Calculator) handle(line string) (bool, error) {
	if strings.HasPrefix(line, "#") {
		return false, nil // comment
	}
	if strings.HasPrefix(strings.ToLower(line), "help ") {
		return false, c.help(line[5:])
	}
	if n, ok := parsePrec(line); ok {
		if n < 1 || n > 17 {
			return false, fmt.Errorf("prec must be 1..17")
		}
		c.prec = n
		fmt.Fprintf(c.out, "precision = %d\n", n)
		return false, nil
	}
	switch strings.ToLower(line) {
	case "help", "?":
		c.printHelp()
		return false, nil
	case "quit", "exit", "q":
		return true, nil
	case "vars":
		c.printVars()
		return false, nil
	case "clear":
		c.vars = make(map[string]float64)
		c.hasAns = false
		fmt.Fprintln(c.out, "cleared")
		return false, nil
	case "reset":
		c.vars = make(map[string]float64)
		c.hasAns = false
		c.memory = 0
		c.hasMem = false
		c.history = nil
		c.results = nil
		c.undoStack = nil
		c.redoStack = nil
		c.lastExpr = ""
		fmt.Fprintln(c.out, "reset")
		return false, nil
	case "history":
		c.printHistory()
		return false, nil
	case "ans":
		if !c.hasAns {
			return false, fmt.Errorf("no previous result")
		}
		fmt.Fprintln(c.out, c.format(c.ans))
		return false, nil
	case "ms", "m+", "m-", "mr", "mc", "mem":
		return false, c.memoryCommand(strings.ToLower(line))
	case "deg":
		c.degMode = true
		fmt.Fprintln(c.out, "trig in degrees")
		return false, nil
	case "rad":
		c.degMode = false
		fmt.Fprintln(c.out, "trig in radians")
		return false, nil
	case "last":
		if c.lastExpr == "" {
			return false, fmt.Errorf("no expression yet")
		}
		fmt.Fprintf(c.out, "%s = %s\n", c.lastExpr, c.format(c.ans))
		return false, nil
	case "status":
		c.status()
		return false, nil
	case "undo":
		if len(c.undoStack) == 0 {
			return false, fmt.Errorf("nothing to undo")
		}
		c.redoStack = append(c.redoStack, c.snapshot())
		c.restore(c.undoStack[len(c.undoStack)-1])
		c.undoStack = c.undoStack[:len(c.undoStack)-1]
		fmt.Fprintln(c.out, "undone")
		return false, nil
	case "redo":
		if len(c.redoStack) == 0 {
			return false, fmt.Errorf("nothing to redo")
		}
		c.undoStack = append(c.undoStack, c.snapshot())
		c.restore(c.redoStack[len(c.redoStack)-1])
		c.redoStack = c.redoStack[:len(c.redoStack)-1]
		fmt.Fprintln(c.out, "redone")
		return false, nil
	case "sci":
		c.sci = true
		fmt.Fprintln(c.out, "scientific notation on")
		return false, nil
	case "fix":
		c.sci = false
		fmt.Fprintln(c.out, "scientific notation off")
		return false, nil
	case "eng":
		c.eng = true
		c.sci = false
		fmt.Fprintln(c.out, "engineering notation on")
		return false, nil
	case "std":
		c.eng = false
		fmt.Fprintln(c.out, "standard notation")
		return false, nil
	case "prec":
		return false, fmt.Errorf("usage: prec <n> (1..17 significant digits)")
	}

	for _, stmt := range splitStatements(line) {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}
		c.history = append(c.history, stmt)
		quit, err := c.process(stmt)
		if err != nil {
			return false, fmt.Errorf("%s: %v", stmt, err)
		}
		if quit {
			return true, nil
		}
	}
	return false, nil
}

// process handles a single statement: assignment or expression.
func (c *Calculator) process(stmt string) (bool, error) {
	c.redoStack = nil
	c.undoStack = append(c.undoStack, c.snapshot())
	if stmt[0] == '@' {
		return false, c.recall(stmt)
	}
	if name, expr, ok := parseAssignment(stmt); ok {
		return false, c.assign(name, expr)
	}

	v, err := c.eval(stmt)
	if err != nil {
		return false, err
	}
	c.ans = v
	c.hasAns = true
	c.lastExpr = stmt
	c.results = append(c.results, c.format(v))
	fmt.Fprintln(c.out, c.format(v))
	return false, nil
}

// recall re-evaluates a history entry by index: @N refers to entry N (1-based).
func (c *Calculator) recall(stmt string) error {
	n := 0
	for i := 1; i < len(stmt); i++ {
		d := stmt[i]
		if d < '0' || d > '9' {
			return fmt.Errorf("expected @<number>, got %q", stmt)
		}
		n = n*10 + int(d-'0')
	}
	if n < 1 || n > len(c.history) {
		return fmt.Errorf("no history entry %d", n)
	}
	line := c.history[n-1]
	if name, expr, ok := parseAssignment(line); ok {
		return c.assign(name, expr)
	}
	v, err := c.eval(line)
	if err != nil {
		return err
	}
	c.ans = v
	c.hasAns = true
	fmt.Fprintln(c.out, c.format(v))
	return nil
}

// assign defines a user variable. Function names, constants, and "ans" are
// reserved.
func (c *Calculator) assign(name, expr string) error {
	if _, ok := parser.SupportedFunctions[name]; ok {
		return fmt.Errorf("cannot assign to function name %q", name)
	}
	if _, ok := parser.SupportedConstants[name]; ok {
		return fmt.Errorf("cannot assign to constant %q", name)
	}
	if name == "ans" {
		return fmt.Errorf("'ans' is reserved")
	}
	expr = c.substitute(expr)
	v, err := c.eval(expr)
	if err != nil {
		return err
	}
	c.vars[name] = v
	c.results = append(c.results, name+" = "+c.format(v))
	fmt.Fprintf(c.out, "%s = %s\n", name, c.format(v))
	return nil
}

// eval evaluates a single expression string after substituting variables.
func (c *Calculator) eval(line string) (float64, error) {
	if !c.hasAns && hasIdent(line, "ans") {
		return 0, fmt.Errorf("no previous result yet")
	}
	line = c.substitute(line)
	if c.degMode {
		line = applyDeg(line)
	}
	return parser.Evaluate(line)
}

// substitute rewrites whole identifier tokens naming a defined variable or
// "ans" to their numeric literals. Everything else is copied verbatim.
func (c *Calculator) substitute(expr string) string {
	toks := lexIdentifiers(expr)
	var b strings.Builder
	b.Grow(len(expr) + 16)

	for _, t := range toks {
		if !t.ident {
			b.WriteString(t.text)
			continue
		}
		if c.hasAns && t.text == "ans" {
			b.WriteString(strconv.FormatFloat(c.ans, 'g', -1, 64))
		} else if c.hasMem && t.text == "mem" {
			b.WriteString(strconv.FormatFloat(c.memory, 'g', -1, 64))
		} else if v, ok := c.vars[t.text]; ok {
			b.WriteString(strconv.FormatFloat(v, 'g', -1, 64))
		} else {
			b.WriteString(t.text)
		}
	}
	return b.String()
}

// parseAssignment parses "name = expression" by reading the first identifier
// token, then an '=' literal, then the remainder. It returns ok=false for any
// other form (e.g. bare expressions).
func parseAssignment(line string) (name, expr string, ok bool) {
	toks := lexIdentifiers(line)
	if len(toks) == 0 || !toks[0].ident {
		return "", "", false
	}
	name = toks[0].text

	rest := line[len(name):]
	eq := strings.IndexByte(rest, '=')
	if eq < 0 {
		return "", "", false
	}
	expr = strings.TrimSpace(rest[eq+1:])
	if expr == "" {
		return "", "", false
	}
	return name, expr, true
}

// splitStatements splits a line on ';' into separate statements.
func splitStatements(line string) []string {
	return strings.Split(line, ";")
}

// prompt renders the interactive prompt with active modes, e.g. "deg> ".
func (c *Calculator) prompt() string {
	var b strings.Builder
	if c.degMode {
		b.WriteString("deg")
	}
	if c.sci {
		b.WriteString(" sci")
	}
	b.WriteString("> ")
	return b.String()
}

// status prints the current calculator configuration.
func (c *Calculator) status() {
	fmt.Fprintf(c.out, "trig: %s\n", modeName(c.degMode, "degrees", "radians"))
	fmt.Fprintf(c.out, "notation: %s\n", modeName(c.sci, "scientific", "fixed"))
	fmt.Fprintf(c.out, "precision: %d\n", c.prec)
	fmt.Fprintf(c.out, "memory: %s\n", memName(c))
	fmt.Fprintf(c.out, "variables: %d\n", len(c.vars))
}

func modeName(on bool, yes, no string) string {
	if on {
		return yes
	}
	return no
}

func memName(c *Calculator) string {
	if !c.hasMem {
		return "empty"
	}
	return c.format(c.memory)
}

func (c *Calculator) printHelp() {
	fmt.Fprintln(c.out, `
expressions  arithmetic with + - * / ( ), constants pi/e, and functions
functions    sqrt cbrt abs floor ceil round trunc sin cos tan asin acos atan
             sinh cosh tanh ln log exp pow(x,y) hypot(x,y) min(a,...) max(a,...) fact(n)
variables    name = expression    e.g. x = 3 + 2 ; then use x anywhere
ans          last result; usable in later expressions
statements   separate with ';'   e.g. x = 2; x * 3
commands     help, vars, history, clear, deg/rad, mem, ms, m+, m-, mr, mc, quit/exit`)
}

func (c *Calculator) printVars() {
	if len(c.vars) == 0 {
		fmt.Fprintln(c.out, "no variables defined")
		return
	}
	for name, val := range c.vars {
		fmt.Fprintf(c.out, "%s = %s\n", name, c.format(val))
	}
}

func (c *Calculator) printHistory() {
	if len(c.history) == 0 {
		fmt.Fprintln(c.out, "no history yet")
		return
	}
	for i, stmt := range c.history {
		if i < len(c.results) {
			fmt.Fprintf(c.out, "%2d  %s = %s\n", i+1, stmt, c.results[i])
		} else {
			fmt.Fprintf(c.out, "%2d  %s\n", i+1, stmt)
		}
	}
}

// SetDisplay configures precision, scientific notation, and degree mode for
// batch/one-shot evaluation.
func (c *Calculator) SetDisplay(prec int, sci, deg bool) {
	if prec >= 1 && prec <= 17 {
		c.prec = prec
	}
	c.sci = sci
	c.degMode = deg
}

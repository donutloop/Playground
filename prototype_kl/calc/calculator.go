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
	vars    map[string]float64
	ans     float64
	hasAns  bool
	memory  float64
	hasMem  bool
	history []string
	in      *bufio.Reader
	out     io.Writer
}

// New returns a Calculator reading lines from reader and writing to writer.
func New(reader io.Reader, writer io.Writer) *Calculator {
	return &Calculator{
		vars: make(map[string]float64),
		in:   bufio.NewReader(reader),
		out:  writer,
	}
}

// Run starts the interactive loop. It returns when input reaches EOF or the
// user types "quit"/"exit".
func (c *Calculator) Run() {
	fmt.Fprintln(c.out, "Math Calculator - type 'help' for commands, 'quit' to exit.")
	for {
		fmt.Fprint(c.out, "> ")
		line, err := c.in.ReadString('\n')
		if err != nil {
			break // EOF
		}
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		quit, err := c.handle(line)
		if err != nil {
			fmt.Fprintf(c.out, "error: %v\n", err)
		}
		if quit {
			break
		}
	}
}

// handle processes one input line: commands, assignments, or expressions.
func (c *Calculator) handle(line string) (bool, error) {
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
	case "history":
		c.printHistory()
		return false, nil
	case "ans":
		if !c.hasAns {
			return false, fmt.Errorf("no previous result")
		}
		fmt.Fprintln(c.out, Format(c.ans))
		return false, nil
	case "ms", "m+", "m-", "mr", "mc", "mem":
		return false, c.memoryCommand(strings.ToLower(line))
	}

	for _, stmt := range splitStatements(line) {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}
		c.history = append(c.history, stmt)
		quit, err := c.process(stmt)
		if err != nil {
			return false, err
		}
		if quit {
			return true, nil
		}
	}
	return false, nil
}

// process handles a single statement: assignment or expression.
func (c *Calculator) process(stmt string) (bool, error) {
	if name, expr, ok := parseAssignment(stmt); ok {
		return false, c.assign(name, expr)
	}

	v, err := c.eval(stmt)
	if err != nil {
		return false, err
	}
	c.ans = v
	c.hasAns = true
	fmt.Fprintln(c.out, Format(v))
	return false, nil
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
	fmt.Fprintf(c.out, "%s = %s\n", name, Format(v))
	return nil
}

// eval evaluates a single expression string after substituting variables.
func (c *Calculator) eval(line string) (float64, error) {
	if !c.hasAns && hasIdent(line, "ans") {
		return 0, fmt.Errorf("no previous result yet")
	}
	line = c.substitute(line)
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

func (c *Calculator) printHelp() {
	fmt.Fprintln(c.out, `
expressions  arithmetic with + - * / ( ), constants pi/e, and functions
functions    sqrt cbrt abs floor ceil round trunc sin cos tan asin acos atan
             sinh cosh tanh ln log exp pow(x,y) hypot(x,y) min(a,...) max(a,...) fact(n)
variables    name = expression    e.g. x = 3 + 2 ; then use x anywhere
ans          last result; usable in later expressions
statements   separate with ';'   e.g. x = 2; x * 3
commands     help, vars, history, clear, mem, ms, m+, m-, mr, mc, quit/exit`)
}

func (c *Calculator) printVars() {
	if len(c.vars) == 0 {
		fmt.Fprintln(c.out, "no variables defined")
		return
	}
	for name, val := range c.vars {
		fmt.Fprintf(c.out, "%s = %s\n", name, Format(val))
	}
}

func (c *Calculator) printHistory() {
	if len(c.history) == 0 {
		fmt.Fprintln(c.out, "no history yet")
		return
	}
	for i, stmt := range c.history {
		fmt.Fprintf(c.out, "%2d  %s\n", i+1, stmt)
	}
}

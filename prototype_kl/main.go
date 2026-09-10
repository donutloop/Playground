// Command calculator is a full-featured interactive math calculator.
//
// Usage:
//
//	calculator                 start the interactive REPL
//	calculator --eval "expr"   evaluate one expression and print the result
//	calculator --help          show usage
//
// Expressions support arithmetic (+ - * /), parentheses, the constants pi/e,
// and a rich set of functions (trig, hyperbolic, logs, pow, min/max, fact).
// In the REPL you can also assign variables and recall the last result as
// "ans".
package main

import (
	"bytes"
	"flag"
	"fmt"
	"os"
	"strings"

	"prototype_kl/calc"
)

// Version is the calculator release version.
const Version = "1.0.0"

func main() {
	var evals []string
	json := flag.Bool("json", false, "emit JSON results for --eval")
	vars := flag.Bool("vars", false, "list defined variables after evaluation")
	base := flag.Int("base", 0, "output radix for integral results (2, 8, 16, or 0=decimal)")
	flag.Var(&multiFlag{&evals}, "eval", "evaluate an expression and print the result; may be given multiple times")
	state := flag.String("state", ".calc-state.json", "persist variables/history across sessions")
	noState := flag.Bool("no-state", false, "disable state persistence")
	prec := flag.Int("prec", 15, "significant digits for --eval output (1..17)")
	sci := flag.Bool("sci", false, "scientific notation for --eval output")
	demo := flag.Bool("demo", false, "run a guided tour")
	file := flag.String("file", "", "evaluate expressions from a file (batch)")
	deg := flag.Bool("deg", false, "trig in degrees for --eval")
	version := flag.Bool("version", false, "print version and exit")
	eng := flag.Bool("eng", false, "engineering notation for output")
	verify := flag.Bool("verify", false, "run the self-test battery")
	rad := flag.Bool("rad", false, "trig in radians (default)")
	flag.Parse()
	if *noState {
		*state = ""
	}

	if *version {
		fmt.Println("math calculator", Version)
		return
	}

	if *verify {
		passed, failed := calc.Verify(os.Stdout)
		if failed > 0 {
			os.Exit(1)
		}
		fmt.Fprintf(os.Stderr, "verify: %d ok\n", passed)
		return
	}

	if *demo {
		calc.Demo(os.Stdout)
		return
	}

	if *file != "" {
		f, err := os.Open(*file)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
		defer f.Close()
		c := calc.NewBatch(f, os.Stdout)
		if *state != "" {
			_ = c.LoadState(*state)
		}
		c.SetDisplay(*prec, *sci, *deg)
		if *eng {
			c.Eng()
		}
		c.Run()
		if *state != "" {
			_ = c.SaveState(*state)
		}
		return
	}

	if len(evals) == 1 && evals[0] == "-" {
		var out bytes.Buffer
		c := calc.NewBatch(os.Stdin, &out)
		c.SetDisplay(*prec, *sci, *deg)
		if *eng {
			c.Eng()
		}
		if *rad {
			c.SetRad()
		}
		if *state != "" {
			_ = c.LoadState(*state)
		}
		c.Run()
		fmt.Print(out.String())
		if *state != "" {
			_ = c.SaveState(*state)
		}
		return
	}

	if len(evals) > 0 {
		var out bytes.Buffer
		c := calc.NewBatch(strings.NewReader(strings.Join(evals, ";")), &out)
		if *state != "" {
			_ = c.LoadState(*state)
		}
		c.SetDisplay(*prec, *sci, *deg)
		if *rad {
			c.SetRad()
		}
		if *eng {
			c.Eng()
		}
		if *base != 0 {
			if err := c.SetBase(*base); err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(1)
			}
		}
		if *json {
			for _, e := range evals {
				if strings.Contains(e, "=") {
					name, v, err := c.AssignExpr(e)
					if err != nil {
						fmt.Fprintf(os.Stderr, "{\"expr\": %q, \"error\": %q}\n", e, err.Error())
						os.Exit(1)
					}
					fmt.Printf("{\"expr\": %q, \"assign\": %q, \"value\": %s}\n", e, name, c.FormatValue(v))
					continue
				}
				v, err := c.EvalExpr(e)
				if err != nil {
					fmt.Fprintf(os.Stderr, "{\"expr\": %q, \"error\": %q}\n", e, err.Error())
					os.Exit(1)
				}
				fmt.Printf("{\"expr\": %q, \"value\": %s}\n", e, c.FormatValue(v))
			}
			if *vars {
				for name, v := range c.Vars() {
					fmt.Printf("{\"var\": %q, \"value\": %s}\n", name, c.FormatValue(v))
				}
			}
			if *state != "" {
				if err := c.SaveState(*state); err != nil {
					fmt.Fprintln(os.Stderr, err)
					os.Exit(1)
				}
			}
			return
		}
		c.Run()
		if strings.TrimSpace(out.String()) == "" {
			fmt.Fprintln(os.Stderr, "error: empty evaluation")
			os.Exit(1)
		}
		fmt.Print(out.String())
		if *vars {
			c.PrintVars()
		}
		if *state != "" {
			_ = c.SaveState(*state)
		}
		if c.ErrorCount() > 0 {
			os.Exit(1)
		}
		return
	}

	c, err := calc.NewPersistent(os.Stdin, os.Stdout, *state)
	if err != nil {
		fmt.Fprintf(os.Stderr, "warning: could not load state %s: %v\n", *state, err)
		c = calc.New(os.Stdin, os.Stdout)
	}
	if *base != 0 {
		if err := c.SetBase(*base); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
	}
	c.Run()
}

// multiFlag accumulates a repeatable string flag.
type multiFlag struct{ list *[]string }

func (m multiFlag) String() string {
	return strings.Join(*m.list, ",")
}

func (m multiFlag) Set(v string) error {
	*m.list = append(*m.list, v)
	return nil
}

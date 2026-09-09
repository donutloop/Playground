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

func main() {
	eval := flag.String("eval", "", "evaluate one expression and print the result")
	state := flag.String("state", ".calc-state.json", "persist variables/history across sessions")
	prec := flag.Int("prec", 15, "significant digits for --eval output (1..17)")
	sci := flag.Bool("sci", false, "scientific notation for --eval output")
	demo := flag.Bool("demo", false, "run a guided tour")
	file := flag.String("file", "", "evaluate expressions from a file (batch)")
	deg := flag.Bool("deg", false, "trig in degrees for --eval")
	flag.Parse()

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
		calc.NewBatch(f, os.Stdout).Run()
		return
	}

	if *eval != "" {
		var out bytes.Buffer
		c := calc.NewBatch(strings.NewReader(*eval), &out)
		c.SetDisplay(*prec, *sci, *deg)
		c.Run()
		if strings.TrimSpace(out.String()) == "" {
			fmt.Fprintln(os.Stderr, "error: empty evaluation")
			os.Exit(1)
		}
		fmt.Print(out.String())
		return
	}

	c, err := calc.NewPersistent(os.Stdin, os.Stdout, *state)
	if err != nil {
		fmt.Fprintf(os.Stderr, "warning: could not load state %s: %v\n", *state, err)
		c = calc.New(os.Stdin, os.Stdout)
	}
	c.Run()
}

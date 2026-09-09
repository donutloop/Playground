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
	"flag"
	"fmt"
	"os"

	"prototype_kl/calc"
	"prototype_kl/parser"
)

func main() {
	eval := flag.String("eval", "", "evaluate one expression and print the result")
	state := flag.String("state", ".calc-state.json", "persist variables/history across sessions")
	flag.Parse()

	if *eval != "" {
		v, err := parser.Evaluate(*eval)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
		fmt.Println(calc.Format(v))
		return
	}

	c, err := calc.NewPersistent(os.Stdin, os.Stdout, *state)
	if err != nil {
		fmt.Fprintf(os.Stderr, "warning: could not load state %s: %v\n", *state, err)
		c = calc.New(os.Stdin, os.Stdout)
	}
	c.Run()
}

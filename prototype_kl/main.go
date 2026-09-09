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
	eval := flag.String("eval", "", "evaluate one expression and print the result")
	state := flag.String("state", ".calc-state.json", "persist variables/history across sessions")
	prec := flag.Int("prec", 15, "significant digits for --eval output (1..17)")
	sci := flag.Bool("sci", false, "scientific notation for --eval output")
	demo := flag.Bool("demo", false, "run a guided tour")
	file := flag.String("file", "", "evaluate expressions from a file (batch)")
	deg := flag.Bool("deg", false, "trig in degrees for --eval")
	version := flag.Bool("version", false, "print version and exit")
	eng := flag.Bool("eng", false, "engineering notation for output")
	verify := flag.Bool("verify", false, "run the self-test battery")
	flag.Parse()

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
		c.SetDisplay(*prec, *sci, *deg)
		if *eng {
			c.Eng()
		}
		if *state != "" {
			_ = c.LoadState(*state)
		}
		c.Run()
		if *state != "" {
			_ = c.SaveState(*state)
		}
		return
	}

	if *eval != "" {
		var out bytes.Buffer
		c := calc.NewBatch(strings.NewReader(*eval), &out)
		c.SetDisplay(*prec, *sci, *deg)
		if *eng {
			c.Eng()
		}
		if *state != "" {
			_ = c.LoadState(*state)
		}
		c.Run()
		if strings.TrimSpace(out.String()) == "" {
			fmt.Fprintln(os.Stderr, "error: empty evaluation")
			os.Exit(1)
		}
		fmt.Print(out.String())
		if *state != "" {
			_ = c.SaveState(*state)
		}
		return
	}

	c, err := calc.NewPersistent(os.Stdin, os.Stdout, *state)
	if err != nil {
		fmt.Fprintf(os.Stderr, "warning: could not load state %s: %v\n", *state, err)
		c = calc.New(os.Stdin, os.Stdout)
	}
	c.Run()
}

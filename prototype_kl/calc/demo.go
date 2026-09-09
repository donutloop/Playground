package calc

import (
	"fmt"
	"io"
	"strings"
)

// Demo runs a short guided tour demonstrating the calculator's features.
func Demo(w io.Writer) {
	var out strings.Builder
	out.WriteString("Math Calculator - guided tour\n\n")

	tour := []struct{ in, out string }{
		{"2 + 3 * 4", "14"},
		{"pow(2, 10)", "1024"},
		{"sin(pi / 2)", "1"},
		{"5!", "120"},
		{"50%", "0.5"},
		{"0.1 + 0.2", "0.3"},
	}
	for _, t := range tour {
		fmt.Fprintf(&out, "> %s\n%s\n", t.in, t.out)
	}

	out.WriteString("\nVariables:\n")
	fmt.Fprintln(&out, "> x = 3 + 2\nx = 5")
	fmt.Fprintln(&out, "> x * 3\n15")
	fmt.Fprintln(&out, "> ans + 1\n16")

	out.WriteString("\nMemory & degrees:\n")
	fmt.Fprintln(&out, "> 7\n7\n> ms\nmemory = 7")
	fmt.Fprintln(&out, "> deg\nsin(30) = 0.5")

	out.WriteString("\nCommands: help, vars, history, undo, status, clear, quit\n")
	io.WriteString(w, out.String())
}

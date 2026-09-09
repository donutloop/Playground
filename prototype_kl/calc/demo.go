package calc

import (
	"bytes"
	"fmt"
	"io"
	"strings"
)

// Demo runs a guided tour by driving a real calculator session and printing
// the captured transcript, so the tour always reflects actual behavior.
func Demo(w io.Writer) {
	script := strings.Join([]string{
		"# arithmetic, precedence, and the '^' operator",
		"2 + 3 * 4",
		"2 * 3 ^ 2",
		"# functions and constants",
		"pow(2, 10)",
		"sin(pi / 2)",
		"5!",
		"200% + 10",
		"# variables and ans",
		"x = 3 + 2",
		"x * 3",
		"ans + 1",
		"# memory and degrees",
		"10",
		"ms",
		"deg",
		"sin(30)",
		"rad",
		"# display controls",
		"12345",
		"eng",
		"12345",
		"std",
	}, "\n")

	var out bytes.Buffer
	New(strings.NewReader(script), &out).Run()
	fmt.Fprintln(w, "Math Calculator - guided tour\n")
	io.WriteString(w, out.String())
	fmt.Fprintln(w, "\nCommands: help, vars, history, undo, redo, status, reset, quit")
}

package calc

import (
	"bytes"
	"strings"
	"testing"
)

// TestFullSession drives a realistic calculator session end-to-end and checks
// the key results across features.
func TestFullSession(t *testing.T) {
	input := strings.Join([]string{
		"# tour",
		"x = 3 + 2",  // variable
		"x * 4",      // 20
		"pow(2, 10)", // 1024
		"5!",         // 120
		"200% + 10",  // 12
		"deg",
		"sin(30)", // 0.5
		"rad",
		"10",
		"ms",      // memory 10
		"mem * 2", // 20
		"undo",    // revert mem * 2
		"redo",    // restore
		"@1",      // recall history entry 1 (comment -> no result, so skip)
		"vars",
		"status",
		"quit",
	}, "\n")

	var out bytes.Buffer
	New(strings.NewReader(input), &out).Run()
	got := out.String()

	for _, want := range []string{
		"x = 5", // assignment
		"20",    // x * 4
		"1024",  // pow
		"120",   // 5!
		"12",    // percent
		"0.5",   // degree sin
		"memory = 10",
		"20", // mem * 2
		"undone",
		"redone",
		"variables: 1",
	} {
		if !strings.Contains(got, want) {
			t.Errorf("full session missing %q:\n%s", want, got)
		}
	}
}

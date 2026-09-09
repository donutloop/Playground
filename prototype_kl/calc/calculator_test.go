package calc

import (
	"bytes"
	"strings"
	"testing"
)

// run feeds input to a calculator and returns the captured output.
func run(t *testing.T, input string) string {
	t.Helper()
	var out bytes.Buffer
	New(strings.NewReader(input), &out).Run()
	return out.String()
}

func TestFormat(t *testing.T) {
	cases := []struct {
		in   float64
		want string
	}{
		{0.1 + 0.2, "0.3"},
		{1024, "1024"},
		{3.141592653589793, "3.14159265358979"},
		{1e20, "1e+20"},
		{0, "0"},
		{-2.5, "-2.5"},
	}
	for _, tc := range cases {
		if got := Format(tc.in); got != tc.want {
			t.Errorf("Format(%v) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestBasicEval(t *testing.T) {
	got := run(t, "2 + 3\npow(2, 10)\nsin(pi / 2)\n")
	for _, want := range []string{"5", "1024", "1"} {
		if !strings.Contains(got, want) {
			t.Errorf("output missing %q:\n%s", want, got)
		}
	}
}

func TestVariables(t *testing.T) {
	got := run(t, "x = 3 + 2\nx * 4\nvars\n")
	for _, want := range []string{"x = 5", "20", "x = 5"} {
		if !strings.Contains(got, want) {
			t.Errorf("output missing %q:\n%s", want, got)
		}
	}
}

func TestMultiStatement(t *testing.T) {
	got := run(t, "y = 2; y * 3\n")
	if !strings.Contains(got, "y = 2") || !strings.Contains(got, "6") {
		t.Errorf("multi-statement failed:\n%s", got)
	}
}

func TestAns(t *testing.T) {
	got := run(t, "4 + 1\nans * 2\n")
	if !strings.Contains(got, "5") || !strings.Contains(got, "10") {
		t.Errorf("ans failed:\n%s", got)
	}
}

func TestAnsBeforeResult(t *testing.T) {
	got := run(t, "ans\n")
	if !strings.Contains(got, "no previous result") {
		t.Errorf("expected error, got:\n%s", got)
	}
}

func TestReservedNames(t *testing.T) {
	got := run(t, "sin = 1\npi = 3\n")
	if !strings.Contains(got, "cannot assign to function name") ||
		!strings.Contains(got, "cannot assign to constant") {
		t.Errorf("reserved names not rejected:\n%s", got)
	}
}

func TestClear(t *testing.T) {
	got := run(t, "z = 1\nclear\nz + 1\n")
	// After clear, z is undefined; parser should error (unknown function z).
	if !strings.Contains(got, "cleared") {
		t.Errorf("clear missing:\n%s", got)
	}
}

func TestHistory(t *testing.T) {
	got := run(t, "1 + 1\n2 + 2\nhistory\n")
	if !strings.Contains(got, "1  ") || !strings.Contains(got, "2  ") {
		t.Errorf("history failed:\n%s", got)
	}
}

func TestQuit(t *testing.T) {
	got := run(t, "help\nquit\n")
	if !strings.Contains(got, "expressions") || !strings.Contains(got, "Math Calculator") {
		t.Errorf("help/banner missing:\n%s", got)
	}
}

func TestMemoryRegisters(t *testing.T) {
	got := run(t, "10\nms\n5\nm+\nmem\nmr\nmc\nmem\n")
	for _, want := range []string{
		"memory = 10", // ms
		"memory = 15", // m+ (10 + 5)
		"15",          // mem
		"15",          // mr
		"memory cleared",
		"memory is empty", // mem after mc
	} {
		if !strings.Contains(got, want) {
			t.Errorf("memory flow missing %q:\n%s", want, got)
		}
	}
}

func TestMemInExpression(t *testing.T) {
	got := run(t, "7\nms\nmem * 2\n")
	if !strings.Contains(got, "14") {
		t.Errorf("mem not usable in expressions:\n%s", got)
	}
}

func TestMPlusBeforeAnyResult(t *testing.T) {
	got := run(t, "m+\n")
	if !strings.Contains(got, "no previous result") {
		t.Errorf("expected error, got:\n%s", got)
	}
}

package main

import (
	"bytes"
	"flag"
	"io"
	"os"
	"strings"
	"testing"
)

// runMain executes main() with the given args and returns captured stdout.
func runMain(statePath string, args ...string) string {
	flag.CommandLine = flag.NewFlagSet("calculator-test", flag.ExitOnError)
	os.Args = append([]string{"calculator", "-state", statePath}, args...)

	old := os.Stdout
	r, w, err := os.Pipe()
	if err != nil {
		return ""
	}
	os.Stdout = w
	main()
	w.Close()
	os.Stdout = old
	var buf bytes.Buffer
	io.Copy(&buf, r)
	return buf.String()
}

func TestMultiEvalSharesState(t *testing.T) {
	got := runMain(t.TempDir()+"/s.json", "-eval", "x=5", "-eval", "x*2")
	if !strings.Contains(got, "10") {
		t.Errorf("repeatable --eval should share variables:\n%s", got)
	}
}

func TestMultiEvalAnsChaining(t *testing.T) {
	got := runMain(t.TempDir()+"/s.json", "-eval", "1+1", "-eval", "ans*10")
	if !strings.Contains(got, "20") {
		t.Errorf("repeatable --eval should chain ans:\n%s", got)
	}
}

func TestStdinEvalMode(t *testing.T) {
	old := os.Stdin
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	os.Stdin = r
	flag.CommandLine = flag.NewFlagSet("calculator-test2", flag.ExitOnError)
	os.Args = []string{"calculator", "--eval", "-"}
	io.WriteString(w, "1+1\nans*10\nquit\n")
	w.Close()
	oldOut := os.Stdout
	pr, pw, _ := os.Pipe()
	os.Stdout = pw
	main()
	pw.Close()
	os.Stdout = oldOut
	os.Stdin = old
	var buf bytes.Buffer
	io.Copy(&buf, pr)
	if !strings.Contains(buf.String(), "20") {
		t.Errorf("stdin eval mode should chain ans:\n%s", buf.String())
	}
}

func TestVarsFlagListsVariables(t *testing.T) {
	got := runMain(t.TempDir()+"/v.json", "-eval", "a=3", "-eval", "b=4", "--vars")
	if !strings.Contains(got, "a = 3") || !strings.Contains(got, "b = 4") {
		t.Errorf("--vars should list variables:\n%s", got)
	}
}

func TestNoStateDisablesPersistence(t *testing.T) {
	got := runMain(t.TempDir()+"/ns.json", "-eval", "x=5", "-eval", "x*2", "--no-state")
	if !strings.Contains(got, "10") {
		t.Errorf("--no-state should still evaluate:\n%s", got)
	}
	// The temp state file should not be created.
	if _, err := os.Stat(t.TempDir() + "/ns.json"); err == nil {
		t.Errorf("state file should not exist with --no-state")
	}
}

func TestJSONEvalOutput(t *testing.T) {
	got := runMain(t.TempDir()+"/j.json", "-eval", "1+1", "-eval", "gcd(12,18)", "--json", "--no-state")
	if !strings.Contains(got, `"value": 2`) || !strings.Contains(got, `"value": 6`) {
		t.Errorf("JSON eval output missing values:\n%s", got)
	}
}

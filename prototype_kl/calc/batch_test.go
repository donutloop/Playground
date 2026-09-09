package calc

import (
	"bytes"
	"strings"
	"testing"
)

func TestBatchQuiet(t *testing.T) {
	var out bytes.Buffer
	NewBatch(strings.NewReader("x = 5\nx * 3\nquit\n"), &out).Run()
	got := out.String()
	if strings.Contains(got, "> ") {
		t.Errorf("batch should have no prompts:\n%s", got)
	}
	if !strings.Contains(got, "15") {
		t.Errorf("batch result missing:\n%s", got)
	}
}

func TestBatchNoTrailingNewline(t *testing.T) {
	var out bytes.Buffer
	// No trailing newline: the final line must still be processed.
	NewBatch(strings.NewReader("x = 5"), &out).Run()
	if !strings.Contains(out.String(), "x = 5") {
		t.Errorf("final line without newline lost:\n%s", out.String())
	}
}

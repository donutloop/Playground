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

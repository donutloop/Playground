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

func TestQuietReplCommand(t *testing.T) {
	var out bytes.Buffer
	c := New(strings.NewReader("quiet\na=3\na*2\n"), &out)
	c.Run()
	if strings.Contains(out.String(), "a = 3") {
		t.Fatalf("quiet should suppress assignment echo:\n%s", out.String())
	}
	if !strings.Contains(out.String(), "6") {
		t.Fatalf("result missing:\n%s", out.String())
	}
}

func TestJSONReplToggle(t *testing.T) {
	var out bytes.Buffer
	c := New(strings.NewReader("json\n1+1\n"), &out)
	c.Run()
	if !strings.Contains(out.String(), `{"value": 2}`) {
		t.Fatalf("json toggle should emit JSON value:\n%s", out.String())
	}
}

func TestCSVReplToggle(t *testing.T) {
	var out bytes.Buffer
	c := New(strings.NewReader("csv\n1+1\n"), &out)
	c.Run()
	if !strings.Contains(out.String(), "value,2") {
		t.Fatalf("csv toggle should emit value,2:\n%s", out.String())
	}
}

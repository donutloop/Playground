package calc

import (
	"bytes"
	"strings"
	"testing"
)

func TestErrorCountTracksFailures(t *testing.T) {
	var out bytes.Buffer
	c := New(strings.NewReader("log10(-1)\nsqrt(-1)\n1+1\n"), &out)
	c.Run()
	if got := c.ErrorCount(); got != 2 {
		t.Fatalf("ErrorCount = %d, want 2", got)
	}
}

func TestErrorCountZeroOnCleanInput(t *testing.T) {
	var out bytes.Buffer
	c := New(strings.NewReader("1+1\nx=2\nx*3\n"), &out)
	c.Run()
	if got := c.ErrorCount(); got != 0 {
		t.Fatalf("ErrorCount = %d, want 0", got)
	}
}

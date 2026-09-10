package calc

import (
	"bytes"
	"strings"
	"testing"
)

func TestBaseOutput(t *testing.T) {
	var out bytes.Buffer
	c := New(strings.NewReader("255\n8\n"), &out)
	if err := c.SetBase(16); err != nil {
		t.Fatal(err)
	}
	c.Run()
	if !strings.Contains(out.String(), "0xff") || !strings.Contains(out.String(), "0x8") {
		t.Fatalf("hex output missing:\n%s", out.String())
	}
}

func TestBaseBinary(t *testing.T) {
	var out bytes.Buffer
	c := New(strings.NewReader("5\n"), &out)
	c.SetBase(2)
	c.Run()
	if !strings.Contains(out.String(), "0b101") {
		t.Fatalf("binary output missing:\n%s", out.String())
	}
}

func TestSetBaseRejectsUnknown(t *testing.T) {
	c := New(strings.NewReader("1\n"), new(bytes.Buffer))
	if err := c.SetBase(5); err == nil {
		t.Fatal("expected error for base 5")
	}
}

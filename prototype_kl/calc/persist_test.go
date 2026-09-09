package calc

import (
	"bytes"
	"strings"
	"testing"
)

func TestPersistDisplaySettings(t *testing.T) {
	path := t.TempDir() + "/disp.json"
	var out1 bytes.Buffer
	c, err := NewPersistent(strings.NewReader("deg\nsci\nprec 3\nquit\n"), &out1, path)
	if err != nil {
		t.Fatal(err)
	}
	c.Run()

	var out2 bytes.Buffer
	c2, err := NewPersistent(strings.NewReader("status\nquit\n"), &out2, path)
	if err != nil {
		t.Fatal(err)
	}
	c2.Run()
	got := out2.String()
	for _, want := range []string{"degrees", "scientific", "precision: 3"} {
		if !strings.Contains(got, want) {
			t.Errorf("display settings not persisted (%q):\n%s", want, got)
		}
	}
}

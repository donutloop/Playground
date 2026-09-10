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

func TestDisplayFlagsAfterLoad(t *testing.T) {
	path := t.TempDir() + "/dl.json"
	var out1 bytes.Buffer
	c, err := NewPersistent(strings.NewReader("quit\n"), &out1, path)
	if err != nil {
		t.Fatal(err)
	}
	c.Run() // saves default state (deg off)

	var out2 bytes.Buffer
	c2, err := NewPersistent(strings.NewReader("sin(30)\nquit\n"), &out2, path)
	if err != nil {
		t.Fatal(err)
	}
	c2.SetDisplay(15, false, true) // --deg must survive the load
	c2.Run()
	if !strings.Contains(out2.String(), "0.5") {
		t.Errorf("--deg dropped by state load:\n%s", out2.String())
	}
}

func TestBaseSettingPersists(t *testing.T) {
	path := t.TempDir() + "/base.json"
	var buf bytes.Buffer
	c := New(strings.NewReader("base hex\n"), &buf)
	c.Run()
	if err := c.SaveState(path); err != nil {
		t.Fatal(err)
	}
	var out bytes.Buffer
	d := New(strings.NewReader("255\n"), &out)
	if err := d.LoadState(path); err != nil {
		t.Fatal(err)
	}
	d.Run()
	if !strings.Contains(out.String(), "0xff") {
		t.Fatalf("base not persisted:\n%s", out.String())
	}
}

func TestQuietSettingPersists(t *testing.T) {
	path := t.TempDir() + "/quiet.json"
	var buf bytes.Buffer
	c := New(strings.NewReader("quiet\na=3\n"), &buf)
	c.Run()
	if err := c.SaveState(path); err != nil {
		t.Fatal(err)
	}
	var out bytes.Buffer
	d := New(strings.NewReader("a=3\na*2\n"), &out)
	if err := d.LoadState(path); err != nil {
		t.Fatal(err)
	}
	d.Run()
	if strings.Contains(out.String(), "a = 3") {
		t.Fatalf("quiet not persisted:\n%s", out.String())
	}
	if !strings.Contains(out.String(), "6") {
		t.Fatalf("result missing:\n%s", out.String())
	}
}

func TestJSONSettingPersists(t *testing.T) {
	path := t.TempDir() + "/json.json"
	var buf bytes.Buffer
	c := New(strings.NewReader("json\n"), &buf)
	c.Run()
	if err := c.SaveState(path); err != nil {
		t.Fatal(err)
	}
	var out bytes.Buffer
	d := New(strings.NewReader("1+1\n"), &out)
	if err := d.LoadState(path); err != nil {
		t.Fatal(err)
	}
	d.Run()
	if !strings.Contains(out.String(), `{"value": 2}`) {
		t.Fatalf("json mode not persisted:\n%s", out.String())
	}
}

func TestCSVSettingPersists(t *testing.T) {
	path := t.TempDir() + "/csv.json"
	var buf bytes.Buffer
	c := New(strings.NewReader("csv\n"), &buf)
	c.Run()
	if err := c.SaveState(path); err != nil {
		t.Fatal(err)
	}
	var out bytes.Buffer
	d := New(strings.NewReader("1+1\n"), &out)
	if err := d.LoadState(path); err != nil {
		t.Fatal(err)
	}
	d.Run()
	if !strings.Contains(out.String(), "value,2") {
		t.Fatalf("csv mode not persisted:\n%s", out.String())
	}
}

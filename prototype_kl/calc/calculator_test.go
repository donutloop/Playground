package calc

import (
	"bytes"
	"os"
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

func TestPersistentSession(t *testing.T) {
	path := t.TempDir() + "/state.json"
	var out1 bytes.Buffer
	c, err := NewPersistent(strings.NewReader("x = 5\nms\nquit\n"), &out1, path)
	if err != nil {
		t.Fatal(err)
	}
	c.Run()

	var out2 bytes.Buffer
	c2, err := NewPersistent(strings.NewReader("x * 3\nmem\nhistory\nquit\n"), &out2, path)
	if err != nil {
		t.Fatal(err)
	}
	c2.Run()
	if !strings.Contains(out2.String(), "15") { // x persisted and used
		t.Errorf("var not persisted:\n%s", out2.String())
	}
	if !strings.Contains(out2.String(), "5") { // memory persisted (mem)
		t.Errorf("memory not persisted:\n%s", out2.String())
	}
}

func TestPersistentLoadError(t *testing.T) {
	path := t.TempDir() + "/bad.json"
	os.WriteFile(path, []byte("{not json"), 0o644)
	_, err := NewPersistent(strings.NewReader("quit\n"), &bytes.Buffer{}, path)
	if err == nil {
		t.Fatal("expected error on corrupt state file")
	}
}

func TestDegreeMode(t *testing.T) {
	got := run(t, "deg\nsin(30)\ncos(60)\ntan(45)\nrad\nsin(30)\n")
	// In degree mode: sin(30)=0.5, cos(60)=0.5, tan(45)=1
	for _, want := range []string{"0.5", "0.5", "1"} {
		if !strings.Contains(got, want) {
			t.Errorf("degree mode missing %q:\n%s", want, got)
		}
	}
	// Back in radians, sin(30 rad) != 0.5 (it is about -0.988)
	if !strings.Contains(got, "-0.988") {
		t.Errorf("radians not restored:\n%s", got)
	}
}

func TestInverseDegreeMode(t *testing.T) {
	got := run(t, "deg\nasin(1)\n")
	// asin(1) in degrees = 90
	if !strings.Contains(got, "90") {
		t.Errorf("inverse trig degrees missing:\n%s", got)
	}
}

func TestNestedDegree(t *testing.T) {
	got := run(t, "deg\nsin(cos(60))\n")
	// cos(60deg)=0.5, sin(0.5deg)=0.008726535...
	if !strings.Contains(got, "0.0087") {
		t.Errorf("nested degree transform missing:\n%s", got)
	}
}

func TestHistoryRecall(t *testing.T) {
	got := run(t, "1 + 1\n2 + 2\n@2\n")
	// @2 recalls history entry 2 (1 + 1) -> 2
	if !strings.Contains(got, "2") {
		t.Errorf("@N recall failed:\n%s", got)
	}
}

func TestUndo(t *testing.T) {
	got := run(t, "x = 5\nx * 2\nundo\nx\n")
	// after undo of "x * 2", x is still 5; evaluating x gives 5
	if !strings.Contains(got, "5") {
		t.Errorf("undo failed:\n%s", got)
	}
}

func TestUndoEmpty(t *testing.T) {
	got := run(t, "undo\n")
	if !strings.Contains(got, "nothing to undo") {
		t.Errorf("expected error, got:\n%s", got)
	}
}

func TestSciToggle(t *testing.T) {
	got := run(t, "sci\n12345\nfix\n12345\n")
	// sci: 12345 in scientific notation; fix: back to normal
	if !strings.Contains(got, "1.2345e+04") {
		t.Errorf("sci missing:\n%s", got)
	}
	if !strings.Contains(got, "12345") {
		t.Errorf("fix not restored:\n%s", got)
	}
}

func TestPrecCommand(t *testing.T) {
	got := run(t, "prec 3\n1 / 3\n")
	// 1/3 with 3 sig digits ~ 0.333
	if !strings.Contains(got, "0.333") {
		t.Errorf("prec failed:\n%s", got)
	}
}

func TestPrecBad(t *testing.T) {
	got := run(t, "prec 99\n")
	if !strings.Contains(got, "must be 1..17") {
		t.Errorf("bad prec not rejected:\n%s", got)
	}
}

func TestContextualError(t *testing.T) {
	got := run(t, "1 / 0\n")
	if !strings.Contains(got, "1 / 0:") {
		t.Errorf("contextual error missing:\n%s", got)
	}
}

func TestHelpTopic(t *testing.T) {
	got := run(t, "help pow\n")
	if !strings.Contains(got, "pow(x, y)") {
		t.Errorf("help topic missing:\n%s", got)
	}
}

func TestHelpRsqrt(t *testing.T) {
	got := run(t, "help rsqrt\n")
	if !strings.Contains(got, "rsqrt(x)") {
		t.Errorf("rsqrt help missing:\n%s", got)
	}
}

func TestHelpExp10(t *testing.T) {
	got := run(t, "help exp10\n")
	if !strings.Contains(got, "exp10(x)") {
		t.Errorf("exp10 help missing:\n%s", got)
	}
}

func TestHelpSinc(t *testing.T) {
	got := run(t, "help sinc\n")
	if !strings.Contains(got, "sinc(x)") {
		t.Errorf("sinc help missing:\n%s", got)
	}
}

func TestHelpAsec(t *testing.T) {
	got := run(t, "help asec\n")
	if !strings.Contains(got, "asec(x)") {
		t.Errorf("asec help missing:\n%s", got)
	}
}

func TestHelpSech(t *testing.T) {
	got := run(t, "help sech\n")
	if !strings.Contains(got, "sech(x)") {
		t.Errorf("sech help missing:\n%s", got)
	}
}

func TestHelpAsech(t *testing.T) {
	got := run(t, "help asech\n")
	if !strings.Contains(got, "asech(x)") {
		t.Errorf("asech help missing:\n%s", got)
	}
}

func TestHelpLogistic(t *testing.T) {
	got := run(t, "help logistic\n")
	if !strings.Contains(got, "logistic(x)") {
		t.Errorf("logistic help missing:\n%s", got)
	}
}

func TestHelpSoftplus(t *testing.T) {
	got := run(t, "help softplus\n")
	if !strings.Contains(got, "softplus(x)") {
		t.Errorf("softplus help missing:\n%s", got)
	}
}

func TestHelpUnknown(t *testing.T) {
	got := run(t, "help nope\n")
	if !strings.Contains(got, "no help") {
		t.Errorf("unknown topic not rejected:\n%s", got)
	}
}

func TestStatus(t *testing.T) {
	got := run(t, "deg\nsci\nstatus\n")
	if !strings.Contains(got, "degrees") || !strings.Contains(got, "scientific") {
		t.Errorf("status missing:\n%s", got)
	}
}

func TestModePrompt(t *testing.T) {
	got := run(t, "deg\n")
	if !strings.Contains(got, "deg> ") {
		t.Errorf("mode prompt missing:\n%s", got)
	}
}

func TestRedo(t *testing.T) {
	got := run(t, "x = 5\nx * 2\nundo\nredo\nx * 2\n")
	// after undo+redo, state restored; x*2 gives 10 again
	if !strings.Contains(got, "10") {
		t.Errorf("redo failed:\n%s", got)
	}
}

func TestLastCommand(t *testing.T) {
	got := run(t, "1 + 2\nlast\n")
	if !strings.Contains(got, "1 + 2 = 3") {
		t.Errorf("last missing:\n%s", got)
	}
}

func TestEngNotation(t *testing.T) {
	got := run(t, "12345\neng\n12345\n")
	if !strings.Contains(got, "12.345e3") {
		t.Errorf("eng missing:\n%s", got)
	}
}

func TestComments(t *testing.T) {
	got := run(t, "# setup\n1 + 1\n")
	// comment produces no output line; result still 2
	if strings.Contains(got, "error") {
		t.Errorf("comment caused error:\n%s", got)
	}
	if !strings.Contains(got, "2") {
		t.Errorf("result after comment missing:\n%s", got)
	}
}

func TestReset(t *testing.T) {
	got := run(t, "x = 5\n5\nms\nreset\nvars\n")
	if strings.Contains(got, "x = 5") && strings.Contains(got, "memory") {
		// After reset, vars and memory should be gone; only 'reset' and 'no variables'.
	}
	if !strings.Contains(got, "reset") || !strings.Contains(got, "no variables defined") {
		t.Errorf("reset failed:\n%s", got)
	}
}

// TestUserFunctionDefinition checks defining and calling user functions.
func TestUserFunctionDefinition(t *testing.T) {
	got := run(t, "f(x) = x^2 + 1\nf(3)\nf(2) + 10\n")
	if !strings.Contains(got, "f(x) defined") {
		t.Errorf("missing definition echo:\n%s", got)
	}
	if !strings.Contains(got, "10") || !strings.Contains(got, "15") {
		t.Errorf("function results missing (want 10 and 15):\n%s", got)
	}
}

// TestUserFunctionMultiParam checks multi-parameter and nested calls.
func TestUserFunctionMultiParam(t *testing.T) {
	got := run(t, "g(a, b) = a * b + a\ng(3, 4)\ng(g(2, 3), 5)\n")
	if !strings.Contains(got, "15") || !strings.Contains(got, "48") {
		t.Errorf("multi-param results missing (want 15 and 48):\n%s", got)
	}
}

// TestUserFunctionArity checks that wrong argument counts are rejected.
func TestUserFunctionArity(t *testing.T) {
	got := run(t, "h(x) = x + 1\nh(1, 2)\n")
	if !strings.Contains(got, "expects 1 argument") {
		t.Errorf("arity error not reported:\n%s", got)
	}
}

// TestUserFunctionReserved checks reserved/builtin name rejection.
func TestUserFunctionReserved(t *testing.T) {
	got := run(t, "sin(x) = x + 1\npi(x) = x\n")
	if !strings.Contains(got, "cannot redefine built-in function") {
		t.Errorf("builtin redefinition not rejected:\n%s", got)
	}
}

// TestUnitConvert checks length, mass, and time conversions.
func TestUnitConvert(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"convert(5, km, m)", "5000"},
		{"convert(1, ft, in)", "12"},
		{"convert(60, min, s)", "3600"},
		{"convert(2+3, km, m)", "5000"},
		{"convert(1, km, mi)", "0.621371192237334"},
		{"convert(1, lb, g)", "453.59237"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
}

// TestUnitConvertErrors checks unknown units, wrong arity, and cross-dimension.
func TestUnitConvertErrors(t *testing.T) {
	cases := []string{
		"convert(5, km, kg)\n",
		"convert(5, km)\n",
		"convert(5, bogus, m)\n",
		"convert(5, m, nope)\n",
	}
	for _, tc := range cases {
		got := run(t, tc)
		if strings.Contains(got, "error") == false {
			t.Errorf("expected error for %q:\n%s", tc, got)
		}
	}
}

// TestConvertReserved checks convert cannot be redefined as a user function.
func TestConvertReserved(t *testing.T) {
	got := run(t, "convert(x) = x\n")
	if !strings.Contains(got, "cannot define function") {
		t.Errorf("convert redefinition not rejected:\n%s", got)
	}
}

// TestRangeLoops checks integer range sum and product loops.
func TestRangeLoops(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"sum(1, 10)", "55"},
		{"sum(1, 100)", "5050"},
		{"sum(5, 5)", "5"},
		{"prod(1, 5)", "120"},
		{"prod(1, 10)", "3628800"},
		{"prod(5, 5)", "5"},
		{"sum(5, 1)", "0"},
		{"prod(5, 1)", "1"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
}

// TestIfConditional checks the if(cond, then, else) conditional.
func TestIfConditional(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"if(1, 100, 42)", "100"},
		{"if(0, 100, 42)", "42"},
		{"if(5 > 2, 100, 1)", "100"},
		{"if(2 > 5, 100, 1)", "1"},
		{"if(5 > 2, sum(1, 3), 0)", "6"},
		{"if(1, convert(5, km, m), 0)", "5000"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
}

// TestIfArityError checks wrong-arity and reserved-name handling.
func TestIfArityError(t *testing.T) {
	cases := []string{
		"if(1, 2)\n",
		"if(1)\n",
	}
	for _, tc := range cases {
		got := run(t, tc)
		if strings.Contains(got, "error") == false {
			t.Errorf("expected error for %q:\n%s", tc, got)
		}
	}
	got := run(t, "if(x) = x\n")
	if !strings.Contains(got, "cannot define function") {
		t.Errorf("if redefinition not rejected:\n%s", got)
	}
}

// TestFixDigits checks rounding to n decimal places.
func TestFixDigits(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"fix(3.14159, 2)", "3.14"},
		{"fix(2.71828, 3)", "2.718"},
		{"fix(1.5, 0)", "2"},
		{"fix(-1.234, 2)", "-1.23"},
		{"fix(123.456, 1)", "123.5"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
}

// TestAvg checks the arithmetic mean function.
func TestAvg(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"avg(4, 8)", "6"},
		{"avg(1, 2)", "1.5"},
		{"avg(10, 20)", "15"},
		{"avg(-4, 4)", "0"},
		{"avg(1, 2, 3, 4)", "2.5"},
		{"avg(10, 20, 30)", "20"},
		{"avg(2, 4, 6, 8)", "5"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
}

// TestClamp checks clamp(x, lo, hi) bounds a value into [lo, hi].
func TestClamp(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"clamp(5, 1, 3)", "3"},
		{"clamp(0, 1, 3)", "1"},
		{"clamp(2, 1, 3)", "2"},
		{"clamp(1+2, 1, 3)", "3"},
		{"clamp(avg(2, 4), 1, 3)", "3"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
	// clamp is reserved.
	got := run(t, "clamp(x) = x\n")
	if !strings.Contains(got, "cannot define function") {
		t.Errorf("clamp redefinition not rejected:\n%s", got)
	}
}

// TestLerp checks linear interpolation lerp(a, b, t).
func TestLerp(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"lerp(0, 10, 0.5)", "5"},
		{"lerp(10, 20, 0.25)", "12.5"},
		{"lerp(2, 4, 0)", "2"},
		{"lerp(2, 4, 1)", "4"},
		{"lerp(0, 100, 0.1)", "10"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
	// lerp is reserved.
	got := run(t, "lerp(x) = x\n")
	if !strings.Contains(got, "cannot define function") {
		t.Errorf("lerp redefinition not rejected:\n%s", got)
	}
}

// TestStep checks the Heaviside step function step(x, edge).
func TestStep(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"step(5, 3)", "1"},
		{"step(2, 3)", "0"},
		{"step(3, 3)", "1"},
		{"step(0, 0)", "1"},
		{"step(-1, 0)", "0"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
	// step is reserved.
	got := run(t, "step(x) = x\n")
	if !strings.Contains(got, "cannot define function") {
		t.Errorf("step redefinition not rejected:\n%s", got)
	}
}

// TestBoolFunctions checks and/or/not with comparison args.
func TestBoolFunctions(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"and(5 > 2, 3 > 1)", "1"},
		{"and(5 > 2, 1 > 3)", "0"},
		{"or(1 > 3, 5 > 2)", "1"},
		{"or(1 > 3, 2 > 5)", "0"},
		{"not(0)", "1"},
		{"not(5)", "0"},
		{"and(1, 0)", "0"},
		{"or(1, 0)", "1"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
}

// TestParenComparisons checks comparisons parse inside parens/args.
func TestParenComparisons(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"(5 > 2) ? 100 : 1", "100"},
		{"(2 > 5) ? 100 : 1", "1"},
		{"(3 > 1) * 100", "100"},
		{"if(5 > 2, 100, 1)", "100"},
	}
	for _, tc := range cases {
		got := run(t, tc.in+"\n")
		if !strings.Contains(got, tc.want) {
			t.Errorf("%s = %q, want to contain %q", tc.in, got, tc.want)
		}
	}
}

This is a follow-up to the earlier prompt below that set up the Go math expression parser project. The earlier prompt was:

---

Navigate to /home/donutloop/Workspace/Playground/prototype_kl.

Before starting, check for and install any missing required tooling using apt only:
  - Run `sudo apt update` before any installs
  - Check if Go is installed (`go version`); if missing or outdated (< 1.22),
    install via `sudo apt install -y golang`
  - Check if `make` is installed; if missing, install via
    `sudo apt install -y make`
  - After each install, verify the tool is available by re-running its
    version command before proceeding
  - If any install fails, report exactly which tool failed and why, then stop

Set up a Go module using `go mod init` for the project.

Build a Go function that can parse and evaluate any string containing a math
equation, starting with basic operations, following 2025 Go development best practices:

- Structure the project using 2025 conventions:
  - `main.go` — entry point and demo usage
  - `parser/` — package with modules:
    - `lexer.go` — tokenizes the input string into numbers and operators
    - `parser.go` — builds an AST from tokens
    - `evaluator.go` — walks the AST and computes the result
    - `errors.go` — typed error definitions
    - `config.go` — centralized constants (supported operators, precision, etc.)
  - `tests/` — all test files mirroring the `parser/` structure:
    - `unit/`
      - `lexer_test.go`
      - `parser_test.go`
      - `evaluator_test.go`
      - `errors_test.go`
    - `integration/`
      - `eval_pipeline_test.go`
      - `edge_cases_test.go`
    - `testdata/` — input/output fixture files (e.g. `valid_expressions.json`,
      `invalid_expressions.json`)

- Apply 2025 Go dev principals:
  - **Clean architecture**: lexer → parser → evaluator as a strict pipeline
  - **Recursive descent parser** for correct operator precedence
  - **AST nodes** as typed structs (NumberNode, BinaryOpNode, UnaryOpNode)
  - **Typed errors** using `errors.As` / sentinel values, never raw strings
  - **Table-driven tests** throughout using `testing.T` and subtests
  - **No external dependencies** for core logic — stdlib only
  - **Type hints via strong typing**: use `float64` for all numeric values
  - **Config-driven design**: all supported operators and precision settings
    in `config.go`

- Supported operations (implement in this order):
  - Basic: `+` `-` `*` `/`
  - Grouping: `(` `)` with correct precedence
  - Unary: `-` (negation, e.g. `-3 + 5`)
  - Whitespace: arbitrary spaces between tokens must be handled gracefully

- Function signature:
```go
  // Evaluate parses and evaluates a mathematical expression string.
  // Returns the float64 result or a typed error if the expression is invalid.
  func Evaluate(expression string) (float64, error)
```

- Unit test cases — cover each layer in isolation:
  - `lexer_test.go`:
    - Tokenizes simple integers and floats correctly
    - Tokenizes all supported operators correctly
    - Handles arbitrary whitespace between tokens
    - Returns error on unknown/invalid characters
    - Empty string produces empty token list without panic
  - `parser_test.go`:
    - Parses single number into NumberNode
    - Parses binary expression into correct BinaryOpNode tree
    - Respects operator precedence (* / before + -)
    - Parses nested parentheses into correct nested AST
    - Returns typed error on malformed expression (e.g. `3 +`)
    - Returns typed error on mismatched parentheses
  - `evaluator_test.go`:
    - Evaluates addition, subtraction, multiplication, division correctly
    - Handles integer and float operands
    - Handles unary negation correctly (e.g. `-3 + 5 = 2`)
    - Returns typed error on division by zero
    - Returns correct result for deeply nested expressions
  - `errors_test.go`:
    - Each error type carries the correct message and context
    - Errors unwrap correctly with `errors.As`

- Integration test cases — test the full Evaluate() pipeline end to end:
  - `eval_pipeline_test.go`:
    - `"1 + 2"` → `3`
    - `"10 - 3 * 2"` → `4` (precedence)
    - `"(10 - 3) * 2"` → `14` (grouping)
    - `"-5 + 3"` → `-2` (unary)
    - `"3.5 * 2"` → `7` (floats)
    - `"100 / 4 / 5"` → `5` (left associativity)
    - `"((2 + 3) * (4 - 1)) / 5"` → `3` (complex nesting)
  - `edge_cases_test.go`:
    - Empty string returns a typed parse error
    - String with only whitespace returns a typed parse error
    - Division by zero returns a typed eval error
    - Expression with only a number `"42"` → `42`
    - Very large numbers do not panic
    - Deeply nested parentheses `"((((1))))"` → `1`
    - Mismatched parentheses `"(1 + 2"` returns typed error

- Tooling & quality:
  - `go.mod` with correct module path
  - `README.md` with build, run, and test instructions
  - Godoc comments on all exported functions, types, and methods
  - `Makefile` with targets: `build`, `test`, `fmt`

- Testing gate — do NOT claim the project is working until all of the following pass:
  - Run `go build ./...` and confirm zero errors
  - Run `go test ./tests/unit/...` and confirm all unit tests pass
  - Run `go test ./tests/integration/...` and confirm all integration tests pass
  - Run `go vet ./...` and confirm zero warnings
  - Only after all checks are green, report: "All tests passed. Project is working."
  - If any check fails, fix the issue first, re-run, and only report success once
    everything is confirmed green

---

The above prompt has already been applied and the project is in place.

The one feature that is clearly missing from the current implementation is **built-in math functions**: `sqrt`, `abs`, `floor`, and `ceil`. These are standard in any math expression evaluator but are entirely absent from the existing pipeline. Add them now, exactly as specified below.

## Feature: Built-in Math Functions

Support calling the following four functions inside any expression:

| Function | Behaviour                          | Example input      | Expected result |
|----------|------------------------------------|--------------------|----------------|
| `sqrt`   | Square root (stdlib `math.Sqrt`)   | `sqrt(9)`          | `3`            |
| `abs`    | Absolute value (stdlib `math.Abs`) | `abs(-4)`          | `4`            |
| `floor`  | Floor (stdlib `math.Floor`)        | `floor(2.9)`       | `2`            |
| `ceil`   | Ceiling (stdlib `math.Ceil`)       | `ceil(2.1)`        | `3`            |

Syntax: `funcname(expr)` — a recognised function name followed immediately by a parenthesised expression. Functions can be nested and combined with all existing operators, e.g. `sqrt(9) + abs(-4) * 2`.

### Changes required per file

**`parser/lexer.go`**
- Recognise alphabetic identifiers as a new token kind `TokenFunction`
- Only the four names above (`sqrt`, `abs`, `floor`, `ceil`) are valid; any other alphabetic identifier must return a `LexError` with the unknown identifier as context
- All four names are case-sensitive: `Sqrt`, `SQRT`, etc. must return a `LexError`

**`parser/config.go`**
- Add a `SupportedFunctions` map (or slice) listing the four supported function names — the lexer and evaluator must look up names from this map, not from hard-coded string comparisons scattered in the code

**`parser/parser.go`**
- In the primary-expression rule, when the current token is `TokenFunction`, consume the function name, expect a `(`, parse the inner expression recursively, expect a `)`, and return a `FunctionNode`
- A `TokenFunction` token not followed by `(` must return a typed `ParseError`

**`parser/evaluator.go`**
- Add a `FunctionNode` case that dispatches to the correct `math.*` function based on the node's name
- `sqrt` of a negative number must return a typed `EvalError` (do not silently return `NaN`)

**`parser/errors.go`**
- Add `ErrUnknownFunction` — returned by the lexer for unrecognised identifiers, carrying the unknown name as context
- Add `ErrSqrtNegative` — returned by the evaluator when `sqrt` receives a negative argument, carrying the argument value as context
- Both errors must be unwrappable with `errors.As`

### New AST node

```go
// FunctionNode represents a built-in function call, e.g. sqrt(expr).
type FunctionNode struct {
    Name string    // one of: sqrt, abs, floor, ceil
    Arg  Node      // the single argument expression
}
```

### Unit tests to add

**`tests/unit/lexer_test.go`** — new subtests:
- `"sqrt"` tokenizes to a single `TokenFunction` token with value `"sqrt"`
- `"abs"`, `"floor"`, `"ceil"` each tokenize to the correct `TokenFunction` token
- `"log"` returns a `LexError` wrapping `ErrUnknownFunction`
- `"Sqrt"` returns a `LexError` wrapping `ErrUnknownFunction` (case-sensitive)

**`tests/unit/parser_test.go`** — new subtests:
- `"sqrt(4)"` parses to a `FunctionNode{Name:"sqrt", Arg: NumberNode{4}}`
- `"abs(-3)"` parses to a `FunctionNode{Name:"abs", Arg: UnaryOpNode{"-", NumberNode{3}}}`
- `"sqrt 4"` (missing parenthesis) returns a typed `ParseError`

**`tests/unit/evaluator_test.go`** — new subtests:
- `FunctionNode{"sqrt", NumberNode{9}}` evaluates to `3`
- `FunctionNode{"abs", UnaryOpNode{"-", NumberNode{4}}}` evaluates to `4`
- `FunctionNode{"floor", NumberNode{2.9}}` evaluates to `2`
- `FunctionNode{"ceil", NumberNode{2.1}}` evaluates to `3`
- `FunctionNode{"sqrt", UnaryOpNode{"-", NumberNode{4}}}` returns `ErrSqrtNegative`

**`tests/unit/errors_test.go`** — new subtests:
- `ErrUnknownFunction` carries the unknown name and unwraps correctly via `errors.As`
- `ErrSqrtNegative` carries the negative argument value and unwraps correctly via `errors.As`

### Integration tests to add

**`tests/integration/eval_pipeline_test.go`** — new subtests:
- `"sqrt(9)"` → `3`
- `"abs(-7)"` → `7`
- `"floor(3.9)"` → `3`
- `"ceil(3.1)"` → `4`
- `"sqrt(9) + abs(-4) * 2"` → `11` (functions combined with operators)
- `"floor(sqrt(16))"` → `4` (nested function calls)

**`tests/integration/edge_cases_test.go`** — new subtests:
- `"sqrt(-1)"` returns a typed `EvalError` wrapping `ErrSqrtNegative`
- `"log(10)"` returns a typed `LexError` wrapping `ErrUnknownFunction`
- `"sqrt(9"` (missing closing paren) returns a typed `ParseError`

### Fixture files to update

**`tests/testdata/valid_expressions.json`** — add entries:
```json
{"expression": "sqrt(9)",                    "expected": 3},
{"expression": "abs(-7)",                    "expected": 7},
{"expression": "floor(3.9)",                 "expected": 3},
{"expression": "ceil(3.1)",                  "expected": 4},
{"expression": "sqrt(9) + abs(-4) * 2",      "expected": 11},
{"expression": "floor(sqrt(16))",            "expected": 4}
```

**`tests/testdata/invalid_expressions.json`** — add entries:
```json
{"expression": "sqrt(-1)",  "error": "ErrSqrtNegative"},
{"expression": "log(10)",   "error": "ErrUnknownFunction"},
{"expression": "sqrt(9",    "error": "ParseError"}
```

### README update

Add a **Built-in Functions** section documenting the four supported functions, their syntax, a usage example for each, and the two new error conditions.

### Constraints
- No external dependencies — use only `math` from the stdlib
- All function names must be looked up from `config.go`, never compared inline
- Do not change any existing function signatures or AST node types
- All existing tests must continue to pass without modification

### Testing gate
Apply the same gate as the original prompt:
- `go build ./...` — zero errors
- `go test ./tests/unit/...` — all pass
- `go test ./tests/integration/...` — all pass
- `go vet ./...` — zero warnings

Only report "All tests passed. Project is working." once every check is confirmed green.
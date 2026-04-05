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
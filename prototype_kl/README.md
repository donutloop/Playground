# Math Expression Evaluator

A high-performance, clean-architecture math expression evaluator written in Go.

## Features
- Basic operations: `+`, `-`, `*`, `/`
- Correct operator precedence and associativity
- Grouping with parentheses `()`
- Unary negation (e.g., `-3 + 5`)
- Floating point support
- Comprehensive error handling with typed errors
- Built-in math functions: `sqrt`, `abs`, `floor`, `ceil`

## Getting Started

### Prerequisites
- Go 1.22+
- Make

### Building
```bash
make build
```

### Running the Demo
```bash
go run main.go
```

### Testing
```bash
make test
```

### Formatting
```bash
make fmt
```

## Built-in Functions

The evaluator supports the following built-in mathematical functions:

| Function | Description | Example | Result |
|----------|-------------|---------|--------|
| `sqrt(x)` | Square root of x (x ≥ 0) | `sqrt(9)` | `3` |
| `abs(x)` | Absolute value of x | `abs(-4)` | `4` |
| `floor(x)` | Greatest integer ≤ x | `floor(2.9)` | `2` |
| `ceil(x)` | Smallest integer ≥ x | `ceil(2.1)` | `3` |

### Usage
Function calls can be nested and combined with operators:

```
sqrt(9) + abs(-4) * 2    # evaluates to 11
floor(sqrt(16))          # evaluates to 4
```

### Errors
- `sqrt` of a negative number returns an `ErrSqrtNegative` error.
- Unknown function names (e.g., `log`) return an `ErrUnknownFunction` error.


package parser_test

import (
	"prototype_kl/parser"
	"testing"
)

func TestLexer(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantLen int
		wantErr bool
	}{
		{"SimpleInteger", "123", 2, false}, // Number, EOF
		{"Float", "123.45", 2, false},
		{"Operators", "+-*/()", 7, false},   // +, -, *, /, (, ), EOF
		{"Whitespace", " 1 + 2 ", 4, false}, // 1, +, 2, EOF
		{"InvalidChar", "1 @ 2", 0, true},
		{"EmptyString", "", 1, false}, // EOF
		{"Sqrt", "sqrt", 2, false},        // Function, EOF
		{"Abs", "abs", 2, false},
		{"Floor", "floor", 2, false},
		{"Ceil", "ceil", 2, false},
		{"UnknownFunction", "log", 0, true},
		{"CaseSensitive", "Sqrt", 0, true},
		{"FunctionWithWhitespace", " sqrt ", 2, false},
		{"FunctionThenOperator", "sqrt+1", 4, false}, // Function, Plus, Number, EOF
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			lexer := parser.NewLexer(tt.input)
			tokens, err := lexer.Tokenize()
			if (err != nil) != tt.wantErr {
				t.Errorf("Tokenize() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && len(tokens) != tt.wantLen {
				t.Errorf("Tokenize() got %d tokens, want %d", len(tokens), tt.wantLen)
			}
		})
	}
}

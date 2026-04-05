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

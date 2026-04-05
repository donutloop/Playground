package parser_test

import (
	"prototype_kl/parser"
	"testing"
)

func TestParser(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"SingleNumber", "42", false},
		{"BinaryExpr", "1 + 2", false},
		{"Precedence", "1 + 2 * 3", false},
		{"Grouping", "(1 + 2) * 3", false},
		{"NestedParens", "((1))", false},
		{"UnaryNegation", "-1 + 2", false},
		{"MalformedExpr", "1 +", true},
		{"MismatchedParen", "(1 + 2", true},
		{"Empty", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			lexer := parser.NewLexer(tt.input)
			tokens, err := lexer.Tokenize()
			if err != nil {
				if !tt.wantErr {
					t.Fatalf("Lexer failed: %v", err)
				}
				return
			}
			p := parser.NewParser(tokens)
			_, err = p.Parse()
			if (err != nil) != tt.wantErr {
				t.Errorf("Parse() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

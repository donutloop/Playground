package parser

import (
	"fmt"
	"unicode"
)

// TokenType defines the type of a lexed token.
type TokenType int

const (
	TokenNumber TokenType = iota
	TokenPlus
	TokenMinus
	TokenMultiply
	TokenDivide
	TokenLParen
	TokenRParen
	TokenEOF
)

// Token represents a single lexical unit.
type Token struct {
	Type  TokenType
	Value string
	Pos   int
}

// Lexer breaks the input string into a slice of tokens.
type Lexer struct {
	input string
	pos   int
}

func NewLexer(input string) *Lexer {
	return &Lexer{input: input, pos: 0}
}

// Tokenize converts the input string into tokens.
func (l *Lexer) Tokenize() ([]Token, error) {
	var tokens []Token

	for l.pos < len(l.input) {
		char := l.input[l.pos]

		if unicode.IsSpace(rune(char)) {
			l.pos++
			continue
		}

		switch char {
		case OpAdd:
			tokens = append(tokens, Token{Type: TokenPlus, Value: string(char), Pos: l.pos})
		case OpSub:
			tokens = append(tokens, Token{Type: TokenMinus, Value: string(char), Pos: l.pos})
		case OpMul:
			tokens = append(tokens, Token{Type: TokenMultiply, Value: string(char), Pos: l.pos})
		case OpDiv:
			tokens = append(tokens, Token{Type: TokenDivide, Value: string(char), Pos: l.pos})
		case OpLParen:
			tokens = append(tokens, Token{Type: TokenLParen, Value: string(char), Pos: l.pos})
		case OpRParen:
			tokens = append(tokens, Token{Type: TokenRParen, Value: string(char), Pos: l.pos})
		default:
			if unicode.IsDigit(rune(char)) || char == '.' {
				start := l.pos
				for l.pos < len(l.input) && (unicode.IsDigit(rune(l.input[l.pos])) || l.input[l.pos] == '.') {
					l.pos++
				}
				tokens = append(tokens, Token{Type: TokenNumber, Value: l.input[start:l.pos], Pos: start})
				continue
			}
			return nil, &ParseError{Err: ErrInvalidCharacter, Pos: l.pos, Message: fmt.Sprintf("unknown character %q", char)}
		}
		l.pos++
	}

	tokens = append(tokens, Token{Type: TokenEOF, Value: "", Pos: l.pos})
	return tokens, nil
}

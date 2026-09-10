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
	TokenComma
	TokenFunction
	TokenConstant
	TokenFactorial
	TokenPercent
	TokenModulo
	TokenPower
	TokenEOF
	TokenQuestion
	TokenColon
	TokenLT
	TokenGT
	TokenLE
	TokenGE
	TokenEQ
	TokenNE
	TokenAND
	TokenOR
)

// Token represents a single lexical unit.
type Token struct {
	Type     TokenType
	Value    string
	Constant float64 // populated for TokenConstant
	Pos      int
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
		case OpAND:
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '&' {
				tokens = append(tokens, Token{Type: TokenAND, Value: "&&", Pos: l.pos})
				l.pos++
			} else {
				return nil, fmt.Errorf("unexpected character '&'")
			}
		case OpOR:
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '|' {
				tokens = append(tokens, Token{Type: TokenOR, Value: "||", Pos: l.pos})
				l.pos++
			} else {
				return nil, fmt.Errorf("unexpected character '|'")
			}
		case OpEQ:
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '=' {
				tokens = append(tokens, Token{Type: TokenEQ, Value: "==", Pos: l.pos})
				l.pos++
			} else {
				return nil, fmt.Errorf("unexpected character '='")
			}
		case OpFactorial:
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '=' {
				tokens = append(tokens, Token{Type: TokenNE, Value: "!=", Pos: l.pos})
				l.pos++
			} else {
				tokens = append(tokens, Token{Type: TokenFactorial, Value: string(char), Pos: l.pos})
			}
		case OpPercent:
			// Binary modulo (7 % 3) vs postfix percent (50%). A modulo needs an
			// operand following (skip whitespace): digit, letter, or '('.
			j := l.pos + 1
			for j < len(l.input) && unicode.IsSpace(rune(l.input[j])) {
				j++
			}
			if j < len(l.input) {
				n := l.input[j]
				if unicode.IsDigit(rune(n)) || unicode.IsLetter(rune(n)) || n == '(' {
					tokens = append(tokens, Token{Type: TokenModulo, Value: string(char), Pos: l.pos})
					l.pos++
					continue
				}
			}
			tokens = append(tokens, Token{Type: TokenPercent, Value: string(char), Pos: l.pos})
		case OpPower:
			tokens = append(tokens, Token{Type: TokenPower, Value: string(char), Pos: l.pos})
		case OpLParen:
			tokens = append(tokens, Token{Type: TokenLParen, Value: string(char), Pos: l.pos})
		case OpRParen:
			tokens = append(tokens, Token{Type: TokenRParen, Value: string(char), Pos: l.pos})
		case OpComma:
			tokens = append(tokens, Token{Type: TokenComma, Value: string(char), Pos: l.pos})
		case OpQuestion:
			tokens = append(tokens, Token{Type: TokenQuestion, Value: string(char), Pos: l.pos})
		case OpColon:
			tokens = append(tokens, Token{Type: TokenColon, Value: string(char), Pos: l.pos})
		case OpLT:
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '=' {
				tokens = append(tokens, Token{Type: TokenLE, Value: "<=", Pos: l.pos})
				l.pos++
			} else {
				tokens = append(tokens, Token{Type: TokenLT, Value: string(char), Pos: l.pos})
			}
		case OpGT:
			if l.pos+1 < len(l.input) && l.input[l.pos+1] == '=' {
				tokens = append(tokens, Token{Type: TokenGE, Value: ">=", Pos: l.pos})
				l.pos++
			} else {
				tokens = append(tokens, Token{Type: TokenGT, Value: string(char), Pos: l.pos})
			}
		default:
			if unicode.IsDigit(rune(char)) || char == '.' {
				start := l.pos
				for l.pos < len(l.input) && (unicode.IsDigit(rune(l.input[l.pos])) || l.input[l.pos] == '.') {
					l.pos++
				}
				tokens = append(tokens, Token{Type: TokenNumber, Value: l.input[start:l.pos], Pos: start})
				continue
			}
			if unicode.IsLetter(rune(char)) {
				start := l.pos
				for l.pos < len(l.input) {
					ch := l.input[l.pos]
					if unicode.IsLetter(rune(ch)) || unicode.IsDigit(rune(ch)) || ch == '_' {
						l.pos++
						continue
					}
					break
				}
				value := l.input[start:l.pos]
				// Constants take precedence: pi and e resolve to numeric values.
				if val, ok := SupportedConstants[value]; ok {
					tokens = append(tokens, Token{Type: TokenConstant, Value: value, Constant: val, Pos: start})
					continue
				}
				// Check if it's a supported function
				if _, ok := SupportedFunctions[value]; !ok {
					return nil, &ParseError{Err: ErrUnknownFunction, Pos: start, Message: fmt.Sprintf("unknown function %q", value)}
				}
				tokens = append(tokens, Token{Type: TokenFunction, Value: value, Pos: start})
				continue
			}
			return nil, &ParseError{Err: ErrInvalidCharacter, Pos: l.pos, Message: fmt.Sprintf("unknown character %q", char)}
		}
		l.pos++
	}

	tokens = append(tokens, Token{Type: TokenEOF, Value: "", Pos: l.pos})
	return tokens, nil
}

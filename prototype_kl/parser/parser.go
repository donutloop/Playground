package parser

import (
	"fmt"
	"strconv"
)

// Node represents a node in the Abstract Syntax Tree (AST).
type Node interface {
	isNode()
}

type NumberNode struct {
	Value float64
}

type BinaryOpNode struct {
	Op    rune
	Left  Node
	Right Node
}

type UnaryOpNode struct {
	Op    rune
	Right Node
}

// FunctionNode represents a built-in function call, e.g. sqrt(expr).
type FunctionNode struct {
	Name string    // one of: sqrt, abs, floor, ceil
	Arg  Node      // the single argument expression
}

func (n *NumberNode) isNode()   {}
func (n *BinaryOpNode) isNode() {}
func (n *UnaryOpNode) isNode()  {}
func (n *FunctionNode) isNode() {}

// Parser converts tokens into an AST.
type Parser struct {
	tokens []Token
	pos    int
}

func NewParser(tokens []Token) *Parser {
	return &Parser{tokens: tokens, pos: 0}
}

func (p *Parser) current() Token {
	if p.pos >= len(p.tokens) {
		return Token{Type: TokenEOF}
	}
	return p.tokens[p.pos]
}

func (p *Parser) consume() Token {
	t := p.current()
	p.pos++
	return t
}

// Parse starts the recursive descent parsing.
func (p *Parser) Parse() (Node, error) {
	if len(p.tokens) == 0 || p.tokens[0].Type == TokenEOF {
		return nil, ErrEmptyExpression
	}
	node, err := p.parseExpression()
	if err != nil {
		return nil, err
	}
	if p.current().Type != TokenEOF {
		return nil, &ParseError{
			Err:     ErrUnexpectedToken,
			Pos:     p.current().Pos,
			Message: fmt.Sprintf("unexpected token %q", p.current().Value),
		}
	}
	return node, nil
}

// parseExpression handles addition and subtraction (lowest precedence).
func (p *Parser) parseExpression() (Node, error) {
	left, err := p.parseTerm()
	if err != nil {
		return nil, err
	}

	for p.current().Type == TokenPlus || p.current().Type == TokenMinus {
		token := p.consume()
		right, err := p.parseTerm()
		if err != nil {
			return nil, err
		}
		left = &BinaryOpNode{
			Op:    rune(token.Value[0]),
			Left:  left,
			Right: right,
		}
	}
	return left, nil
}

// parseTerm handles multiplication and division.
func (p *Parser) parseTerm() (Node, error) {
	left, err := p.parseUnary()
	if err != nil {
		return nil, err
	}

	for p.current().Type == TokenMultiply || p.current().Type == TokenDivide {
		token := p.consume()
		right, err := p.parseUnary()
		if err != nil {
			return nil, err
		}
		left = &BinaryOpNode{
			Op:    rune(token.Value[0]),
			Left:  left,
			Right: right,
		}
	}
	return left, nil
}

// parseUnary handles unary negation.
func (p *Parser) parseUnary() (Node, error) {
	if p.current().Type == TokenMinus {
		token := p.consume()
		right, err := p.parseUnary()
		if err != nil {
			return nil, err
		}
		return &UnaryOpNode{
			Op:    rune(token.Value[0]),
			Right: right,
		}, nil
	}
	return p.parsePrimary()
}

// parsePrimary handles numbers, parentheses, and function calls.
func (p *Parser) parsePrimary() (Node, error) {
	token := p.consume()
	switch token.Type {
	case TokenNumber:
		val, err := strconv.ParseFloat(token.Value, 64)
		if err != nil {
			return nil, &ParseError{
				Err:     fmt.Errorf("invalid number: %w", err),
				Pos:     token.Pos,
				Message: "failed to parse float",
			}
		}
		return &NumberNode{Value: val}, nil
	case TokenLParen:
		node, err := p.parseExpression()
		if err != nil {
			return nil, err
		}
		if p.current().Type != TokenRParen {
			return nil, &ParseError{
				Err:     ErrMismatchedParen,
				Pos:     p.current().Pos,
				Message: "missing closing parenthesis",
			}
		}
		p.consume() // consume RParen
		return node, nil
	case TokenFunction:
		funcName := token.Value
		if p.current().Type != TokenLParen {
			return nil, &ParseError{
				Err:     ErrUnexpectedToken,
				Pos:     p.current().Pos,
				Message: fmt.Sprintf("expected '(' after function name %q", funcName),
			}
		}
		p.consume() // consume '('
		arg, err := p.parseExpression()
		if err != nil {
			return nil, err
		}
		if p.current().Type != TokenRParen {
			return nil, &ParseError{
				Err:     ErrMismatchedParen,
				Pos:     p.current().Pos,
				Message: "missing closing parenthesis after function argument",
			}
		}
		p.consume() // consume RParen
		return &FunctionNode{Name: funcName, Arg: arg}, nil
	default:
		return nil, &ParseError{
			Err:     ErrUnexpectedToken,
			Pos:     token.Pos,
			Message: fmt.Sprintf("expected number, '(', or function, got %q", token.Value),
		}
	}
}

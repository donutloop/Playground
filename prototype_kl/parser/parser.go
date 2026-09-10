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

// FunctionNode represents a built-in function call, e.g. sqrt(expr) or pow(x, y).
type FunctionNode struct {
	Name string // one of the supported functions
	Args []Node // positional argument expressions
}

// PostfixNode represents a postfix operator applied to a primary expression:
// '!' (factorial) or '%' (percent).
type PostfixNode struct {
	Op    byte // '!' or '%'
	Right Node
}

func (n *NumberNode) isNode()   {}
func (n *BinaryOpNode) isNode() {}
func (n *UnaryOpNode) isNode()  {}
func (n *FunctionNode) isNode() {}
func (n *PostfixNode) isNode()  {}

// TernaryNode represents cond ? then : else.
type TernaryNode struct {
	Cond Node
	Then Node
	Else Node
}

func (n *TernaryNode) isNode() {}

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
	node, err := p.parseTernary()
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

// parseComparison parses a comparison: a < b or a > b, yielding 1 (true) or 0 (false).
func (p *Parser) parseComparison() (Node, error) {
	left, err := p.parseExpression()
	if err != nil {
		return nil, err
	}
	if p.current().Type != TokenLT && p.current().Type != TokenGT {
		return left, nil
	}
	op := rune(p.current().Value[0])
	p.consume()
	right, err := p.parseExpression()
	if err != nil {
		return nil, err
	}
	return &BinaryOpNode{Op: op, Left: left, Right: right}, nil
}

// parseTernary parses a conditional expression: cond ? then : else.
// It wraps parseExpression so ternary has the lowest precedence.
func (p *Parser) parseTernary() (Node, error) {
	cond, err := p.parseComparison()
	if err != nil {
		return nil, err
	}
	if p.current().Type != TokenQuestion {
		return cond, nil
	}
	p.consume() // '?'
	then, err := p.parseComparison()
	if err != nil {
		return nil, err
	}
	if p.current().Type != TokenColon {
		return nil, &ParseError{
			Err:     ErrUnexpectedToken,
			Pos:     p.current().Pos,
			Message: "expected ':' in ternary expression",
		}
	}
	p.consume() // ':'
	els, err := p.parseComparison()
	if err != nil {
		return nil, err
	}
	return &TernaryNode{Cond: cond, Then: then, Else: els}, nil
}

// parseTerm handles multiplication and division.
func (p *Parser) parseTerm() (Node, error) {
	left, err := p.parseExponent()
	if err != nil {
		return nil, err
	}

	for p.current().Type == TokenMultiply || p.current().Type == TokenDivide {
		token := p.consume()
		right, err := p.parseExponent()
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

// parseExponent parses a right-associative power operator '^' (binds tighter
// than multiplication): 2 * 3^2 == 18.
func (p *Parser) parseExponent() (Node, error) {
	left, err := p.parseUnary()
	if err != nil {
		return nil, err
	}
	for {
		switch p.current().Type {
		case TokenPower:
			p.consume()
			right, err := p.parseExponent()
			if err != nil {
				return nil, err
			}
			left = &BinaryOpNode{Left: left, Op: OpPower, Right: right}
		default:
			return left, nil
		}
	}
}

func (p *Parser) parseUnary() (Node, error) {
	if p.current().Type == TokenMinus {
		token := p.consume()
		right, err := p.parseExponent()
		if err != nil {
			return nil, err
		}
		return &UnaryOpNode{
			Op:    rune(token.Value[0]),
			Right: right,
		}, nil
	}
	return p.parsePostfix()
}

// parsePrimary handles numbers, parentheses, and function calls.

// parsePostfix parses a primary expression followed by any number of
// postfix operators ('!' factorial and '%' percent). Postfix binds tighter
// than multiplication, so 3 * 4! is 3 * (4!).
func (p *Parser) parsePostfix() (Node, error) {
	node, err := p.parsePrimary()
	if err != nil {
		return nil, err
	}
	for {
		switch p.current().Type {
		case TokenFactorial:
			p.consume()
			node = &PostfixNode{Op: '!', Right: node}
		case TokenPercent:
			p.consume()
			node = &PostfixNode{Op: '%', Right: node}
		default:
			return node, nil
		}
	}
}

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
	case TokenConstant:
		return &NumberNode{Value: token.Constant}, nil
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
		arity, ok := SupportedFunctions[funcName]
		if !ok {
			return nil, &ParseError{
				Err:     ErrUnknownFunction,
				Pos:     token.Pos,
				Message: fmt.Sprintf("unknown function %q", funcName),
			}
		}
		if p.current().Type != TokenLParen {
			return nil, &ParseError{
				Err:     ErrUnexpectedToken,
				Pos:     p.current().Pos,
				Message: fmt.Sprintf("expected '(' after function name %q", funcName),
			}
		}
		p.consume() // consume '('
		var args []Node
		for {
			arg, err := p.parseExpression()
			if err != nil {
				return nil, err
			}
			args = append(args, arg)
			if p.current().Type == TokenComma {
				p.consume() // consume ','
				continue
			}
			break
		}
		if p.current().Type != TokenRParen {
			return nil, &ParseError{
				Err:     ErrMismatchedParen,
				Pos:     p.current().Pos,
				Message: "missing closing parenthesis after function arguments",
			}
		}
		p.consume() // consume RParen

		// Validate arity.
		want := len(args)
		if arity == 1 && want != 1 {
			return nil, &ParseError{
				Err:     ErrBadArity,
				Pos:     token.Pos,
				Message: fmt.Sprintf("%s expects 1 argument, got %d", funcName, want),
			}
		}
		if arity == 2 && want != 2 {
			return nil, &ParseError{
				Err:     ErrBadArity,
				Pos:     token.Pos,
				Message: fmt.Sprintf("%s expects 2 arguments, got %d", funcName, want),
			}
		}
		if arity == -1 && want < 2 {
			return nil, &ParseError{
				Err:     ErrBadArity,
				Pos:     token.Pos,
				Message: fmt.Sprintf("%s expects at least 2 arguments, got %d", funcName, want),
			}
		}
		return &FunctionNode{Name: funcName, Args: args}, nil
	default:
		return nil, &ParseError{
			Err:     ErrUnexpectedToken,
			Pos:     token.Pos,
			Message: fmt.Sprintf("expected number, '(', or function, got %q", token.Value),
		}
	}
}

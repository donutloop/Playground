package parser

// Evaluate parses and evaluates a mathematical expression string.
// Returns the float64 result or a typed error if the expression is invalid.
func Evaluate(expression string) (float64, error) {
	lexer := NewLexer(expression)
	tokens, err := lexer.Tokenize()
	if err != nil {
		return 0, err
	}

	parser := NewParser(tokens)
	ast, err := parser.Parse()
	if err != nil {
		return 0, err
	}

	evaluator := NewEvaluator()
	return evaluator.Evaluate(ast)
}

// Parse lexes and parses input into an AST node without evaluating.
func Parse(input string) (Node, error) {
	l := NewLexer(input)
	toks, err := l.Tokenize()
	if err != nil {
		return nil, err
	}
	p := NewParser(toks)
	node, err := p.Parse()
	if err != nil {
		return nil, err
	}
	return node, nil
}

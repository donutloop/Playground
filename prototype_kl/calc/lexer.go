package calc

// lexer is a tiny single-purpose tokenizer for variable substitution.
//
// It mirrors the parser package's lexer style: it scans an expression string
// and emits alternating tokens of literal text and whole identifiers, so that
// substitution operates on complete identifier tokens rather than substrings.
// Function and constant names (e.g. "sin", "pi") are never touched because
// matching happens on whole tokens only.

type token struct {
	text  string
	ident bool // true when this token is a complete identifier
}

// lexIdentifiers scans s and returns its tokens.
func lexIdentifiers(s string) []token {
	var toks []token
	i := 0
	for i < len(s) {
		if isIdentStart(s[i]) {
			j := i + 1
			for j < len(s) && isIdentChar(s[j]) {
				j++
			}
			toks = append(toks, token{text: s[i:j], ident: true})
			i = j
			continue
		}
		j := i + 1
		for j < len(s) && !isIdentStart(s[j]) {
			j++
		}
		toks = append(toks, token{text: s[i:j]})
		i = j
	}
	return toks
}

// firstIdent returns the first identifier token in s, or "" if none.
func firstIdent(s string) string {
	for _, t := range lexIdentifiers(s) {
		if t.ident {
			return t.text
		}
	}
	return ""
}

// hasIdent reports whether s contains the standalone identifier w.
func hasIdent(s, w string) bool {
	for _, t := range lexIdentifiers(s) {
		if t.ident && t.text == w {
			return true
		}
	}
	return false
}

func isIdentStart(ch byte) bool {
	return ch == '_' || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
}

func isIdentChar(ch byte) bool {
	return isIdentStart(ch) || (ch >= '0' && ch <= '9')
}

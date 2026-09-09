package calc

// parsePrec parses "prec <n>" with a small real parser (no regex).
func parsePrec(line string) (int, bool) {
	i := 0
	// skip spaces
	for i < len(line) && (line[i] == ' ' || line[i] == '\t') {
		i++
	}
	if i+4 > len(line) || line[i:i+4] != "prec" {
		return 0, false
	}
	i += 4
	// skip spaces
	for i < len(line) && (line[i] == ' ' || line[i] == '\t') {
		i++
	}
	if i >= len(line) || line[i] < '0' || line[i] > '9' {
		return 0, false
	}
	n := 0
	for i < len(line) && line[i] >= '0' && line[i] <= '9' {
		n = n*10 + int(line[i]-'0')
		i++
	}
	// trailing non-space junk should not be present
	for i < len(line) {
		if line[i] != ' ' && line[i] != '\t' {
			return 0, false
		}
		i++
	}
	return n, true
}

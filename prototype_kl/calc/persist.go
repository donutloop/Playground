package calc

import (
	"encoding/json"
	"os"
)

// state is the JSON-persisted session: variables, memory, last result, history.
type state struct {
	Vars    map[string]float64 `json:"vars"`
	Memory  float64            `json:"memory"`
	HasMem  bool               `json:"has_mem"`
	Ans     float64            `json:"ans"`
	HasAns  bool               `json:"has_ans"`
	History []string           `json:"history"`
}

// saveState writes the calculator session to path.
func (c *Calculator) saveState(path string) error {
	st := state{
		Vars:    c.vars,
		Memory:  c.memory,
		HasMem:  c.hasMem,
		Ans:     c.ans,
		HasAns:  c.hasAns,
		History: c.history,
	}
	data, err := json.MarshalIndent(&st, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o644)
}

// loadState reads a persisted session into the calculator. A missing file is
// not an error (fresh session).
func (c *Calculator) loadState(path string) error {
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	var st state
	if err := json.Unmarshal(data, &st); err != nil {
		return err
	}
	if st.Vars != nil {
		c.vars = st.Vars
	}
	c.memory = st.Memory
	c.hasMem = st.HasMem
	c.ans = st.Ans
	c.hasAns = st.HasAns
	c.history = st.History
	return nil
}

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
	DegMode bool               `json:"deg_mode"`
	Sci     bool               `json:"sci"`
	Eng     bool               `json:"eng"`
	Prec    int                `json:"prec"`
	Base    int                `json:"base"`
	Quiet   bool               `json:"quiet"`
	JSON    bool               `json:"json"`
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
		DegMode: c.degMode,
		Sci:     c.sci,
		Eng:     c.eng,
		Prec:    c.prec,
		Base:    c.base,
		Quiet:   c.quietAssign,
		JSON:    c.jsonMode,
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
	c.degMode = st.DegMode
	c.sci = st.Sci
	c.eng = st.Eng
	if st.Prec >= 1 && st.Prec <= 17 {
		c.prec = st.Prec
		c.base = st.Base
		c.quietAssign = st.Quiet
		c.jsonMode = st.JSON
	}
	return nil
}

// LoadState loads a persisted session from path (missing file is not an error).
func (c *Calculator) LoadState(path string) error {
	return c.loadState(path)
}

// SaveState writes the current session to path.
func (c *Calculator) SaveState(path string) error {
	return c.saveState(path)
}

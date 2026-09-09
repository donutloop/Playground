package calc

import (
	"fmt"
)

// memory registers follow the classic calculator conventions:
//
//	MS   store the last result into memory
//	M+   add the last result to memory
//	M-   subtract the last result from memory
//	MR   recall memory as the new result
//	MC   clear memory
//	mem  view the current memory value (also usable in expressions)
func (c *Calculator) memoryCommand(cmd string) error {
	if cmd == "mc" {
		c.memory = 0
		c.hasMem = false
		fmt.Fprintln(c.out, "memory cleared")
		return nil
	}

	if cmd == "mr" {
		if !c.hasMem {
			return fmt.Errorf("memory is empty")
		}
		c.ans = c.memory
		c.hasAns = true
		fmt.Fprintln(c.out, Format(c.memory))
		return nil
	}

	if cmd == "mem" {
		if !c.hasMem {
			fmt.Fprintln(c.out, "memory is empty")
			return nil
		}
		fmt.Fprintln(c.out, Format(c.memory))
		return nil
	}

	// ms / m+ / m- all operate on the last result.
	if !c.hasAns {
		return fmt.Errorf("no previous result")
	}
	switch cmd {
	case "ms":
		c.memory = c.ans
	case "m+":
		if !c.hasMem {
			c.memory = c.ans
		} else {
			c.memory += c.ans
		}
	case "m-":
		if !c.hasMem {
			c.memory = -c.ans
		} else {
			c.memory -= c.ans
		}
	}
	c.hasMem = true
	fmt.Fprintf(c.out, "memory = %s\n", Format(c.memory))
	return nil
}

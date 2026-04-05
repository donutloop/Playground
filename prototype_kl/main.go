package main

import (
	"fmt"
	"prototype_kl/parser"
)

func main() {
	expressions := []string{
		"1 + 2",
		"10 - 3 * 2",
		"(10 - 3) * 2",
		"-5 + 3",
		"3.5 * 2",
		"100 / 4 / 5",
		"((2 + 3) * (4 - 1)) / 5",
		"42",
		"((((1))))",
		"invalid + expr",
		"10 / 0",
		"(1 + 2",
	}

	fmt.Println("Evaluating expressions:")
	fmt.Println("-----------------------")
	for _, expr := range expressions {
		result, err := parser.Evaluate(expr)
		if err != nil {
			fmt.Printf("%-25s -> Error: %v\n", expr, err)
		} else {
			fmt.Printf("%-25s -> Result: %g\n", expr, result)
		}
	}
}

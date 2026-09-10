package parser

import (
	"fmt"
	"math"
	"sort"
)

// Evaluator walks the AST and computes the numeric result.
type Evaluator struct{}

func NewEvaluator() *Evaluator {
	return &Evaluator{}
}

// Evaluate computes the value of the given AST node.
func (e *Evaluator) Evaluate(node Node) (float64, error) {
	switch n := node.(type) {
	case *NumberNode:
		return n.Value, nil

	case *UnaryOpNode:
		val, err := e.Evaluate(n.Right)
		if err != nil {
			return 0, err
		}
		if n.Op == '-' {
			return -val, nil
		}
		if n.Op == OpTilde {
			return float64(^int64(val)), nil
		}
		return 0, &EvalError{Err: fmt.Errorf("unsupported unary operator %c", n.Op), Message: "unary operation failed"}

	case *BinaryOpNode:
		left, err := e.Evaluate(n.Left)
		if err != nil {
			return 0, err
		}
		right, err := e.Evaluate(n.Right)
		if err != nil {
			return 0, err
		}

		switch n.Op {
		case OpAdd:
			return left + right, nil
		case OpSub:
			return left - right, nil
		case OpMul:
			return left * right, nil
		case OpDiv:
			if right == 0 {
				return 0, &EvalError{Err: ErrDivisionByZero, Message: "cannot divide by zero"}
			}
			return left / right, nil
		case OpPower:
			return math.Pow(left, right), nil
		case OpMod:
			if right == 0 {
				return 0, &EvalError{Err: ErrDivisionByZero, Message: "modulo by zero"}
			}
			return math.Mod(left, right), nil
		case OpLT:
			if left < right {
				return 1, nil
			}
			return 0, nil
		case OpGT:
			if left > right {
				return 1, nil
			}
			return 0, nil
		case OpLE:
			if left <= right {
				return 1, nil
			}
			return 0, nil
		case OpGE:
			if left >= right {
				return 1, nil
			}
			return 0, nil
		case OpEQ:
			if left == right {
				return 1, nil
			}
			return 0, nil
		case OpNE:
			if left != right {
				return 1, nil
			}
			return 0, nil
		case OpANDAND:
			if left != 0 && right != 0 {
				return 1, nil
			}
			return 0, nil
		case OpOROR:
			if left != 0 || right != 0 {
				return 1, nil
			}
			return 0, nil
		case OpAND: // bitwise AND
			return float64(int64(left) & int64(right)), nil
		case OpOR: // bitwise OR
			return float64(int64(left) | int64(right)), nil
		case OpShiftLeft:
			return float64(int64(left) << uint(int64(right)&63)), nil
		case OpShiftRight:
			return float64(int64(left) >> uint(int64(right)&63)), nil
		default:
			return 0, &EvalError{Err: fmt.Errorf("unsupported binary operator %c", n.Op), Message: "binary operation failed"}
		}

	case *FunctionNode:
		return e.callFunction(n)

	case *PostfixNode:
		v, err := e.Evaluate(n.Right)
		if err != nil {
			return 0, err
		}
		switch n.Op {
		case '!':
			return factorial(v)
		case '%':
			return v / 100, nil
		default:
			return 0, &EvalError{Err: fmt.Errorf("unknown postfix operator %q", n.Op), Message: "postfix evaluation failed"}
		}

	case *TernaryNode:
		cond, err := e.Evaluate(n.Cond)
		if err != nil {
			return 0, err
		}
		if cond != 0 {
			return e.Evaluate(n.Then)
		}
		return e.Evaluate(n.Else)
	default:
		return 0, &EvalError{Err: fmt.Errorf("unknown node type %T", node), Message: "evaluation failed"}
	}
}

// callFunction evaluates a function node by name, evaluating its arguments first.
func (e *Evaluator) callFunction(n *FunctionNode) (float64, error) {
	args := make([]float64, len(n.Args))
	for i, a := range n.Args {
		v, err := e.Evaluate(a)
		if err != nil {
			return 0, err
		}
		args[i] = v
	}

	switch n.Name {
	case "sqrt":
		if args[0] < 0 {
			return 0, &EvalError{Err: ErrSqrtNegative, Message: fmt.Sprintf("sqrt of negative number %v", args[0])}
		}
		return math.Sqrt(args[0]), nil
	case "rsqrt":
		if args[0] <= 0 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("rsqrt requires x > 0, got %v", args[0])}
		}
		return 1 / math.Sqrt(args[0]), nil
	case "isqrt":
		if args[0] < 0 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("isqrt requires x >= 0, got %v", args[0])}
		}
		return math.Floor(math.Sqrt(args[0])), nil
	case "cbrt":
		return math.Cbrt(args[0]), nil
	case "abs":
		return math.Abs(args[0]), nil
	case "floor":
		return math.Floor(args[0]), nil
	case "fract":
		return args[0] - math.Floor(args[0]), nil
	case "ceil":
		return math.Ceil(args[0]), nil
	case "round":
		if len(args) == 1 {
			return math.Round(args[0]), nil
		}
		scale := math.Pow(10, args[1])
		return math.Round(args[0]*scale) / scale, nil
	case "trunc":
		return math.Trunc(args[0]), nil
	case "sin":
		return math.Sin(args[0]), nil
	case "sinc":
		if args[0] == 0 {
			return 1, nil
		}
		return math.Sin(args[0]) / args[0], nil
	case "deg":
		return args[0] * 180 / math.Pi, nil
	case "rad":
		return args[0] * math.Pi / 180, nil
	case "cos":
		return math.Cos(args[0]), nil
	case "tan":
		return math.Tan(args[0]), nil
	case "sec":
		c := math.Cos(args[0])
		if c == 0 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("sec undefined at x=%v", args[0])}
		}
		return 1 / c, nil
	case "csc":
		s := math.Sin(args[0])
		if s == 0 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("csc undefined at x=%v", args[0])}
		}
		return 1 / s, nil
	case "cot":
		t := math.Tan(args[0])
		if t == 0 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("cot undefined at x=%v", args[0])}
		}
		return 1 / t, nil
	case "asec":
		if math.Abs(args[0]) < 1 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("asec requires |x| >= 1, got %v", args[0])}
		}
		return math.Acos(1 / args[0]), nil
	case "acsc":
		if math.Abs(args[0]) < 1 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("acsc requires |x| >= 1, got %v", args[0])}
		}
		return math.Asin(1 / args[0]), nil
	case "acot":
		if args[0] == 0 {
			return 0, &EvalError{Err: ErrDomain, Message: "acot undefined at x=0"}
		}
		return math.Atan(1 / args[0]), nil
	case "asin":
		return math.Asin(args[0]), nil
	case "acos":
		return math.Acos(args[0]), nil
	case "atan":
		return math.Atan(args[0]), nil
	case "atan2":
		return math.Atan2(args[0], args[1]), nil
	case "gcd":
		return gcd(args[0], args[1]), nil
	case "log10":
		if args[0] <= 0 {
			return math.NaN(), ErrDomain
		}
		return math.Log10(args[0]), nil
	case "log1p":
		if args[0] <= -1 {
			return math.NaN(), ErrDomain
		}
		return math.Log1p(args[0]), nil
	case "asinh":
		return math.Asinh(args[0]), nil
	case "acosh":
		if args[0] < 1 {
			return math.NaN(), ErrDomain
		}
		return math.Acosh(args[0]), nil
	case "atanh":
		if args[0] <= -1 || args[0] >= 1 {
			return math.NaN(), ErrDomain
		}
		return math.Atanh(args[0]), nil
	case "expm1":
		return math.Expm1(args[0]), nil
	case "exp2":
		return math.Exp2(args[0]), nil
	case "exp10":
		return math.Pow(10, args[0]), nil
	case "gamma":
		if args[0] <= 0 && math.Mod(args[0], 1) == 0 {
			return math.NaN(), ErrDomain
		}
		return math.Gamma(args[0]), nil
	case "mod":
		return math.Mod(args[0], args[1]), nil
	case "sign":
		switch {
		case args[0] > 0:
			return 1, nil
		case args[0] < 0:
			return -1, nil
		default:
			return 0, nil
		}
	case "clamp":
		x, lo, hi := args[0], args[1], args[2]
		if lo > hi {
			return math.NaN(), ErrDomain
		}
		if x < lo {
			return lo, nil
		}
		if x > hi {
			return hi, nil
		}
		return x, nil
	case "lerp":
		a, b, t := args[0], args[1], args[2]
		return a + (b-a)*t, nil
	case "fma":
		a, b, c := args[0], args[1], args[2]
		return math.FMA(a, b, c), nil
	case "copysign":
		return math.Copysign(args[0], args[1]), nil
	case "erf":
		return math.Erf(args[0]), nil
	case "erfc":
		return math.Erfc(args[0]), nil
	case "beta":
		return math.Gamma(args[0]) * math.Gamma(args[1]) / math.Gamma(args[0]+args[1]), nil
	case "logb":
		return math.Logb(args[0]), nil
	case "nextafter":
		return math.Nextafter(args[0], args[1]), nil
	case "ldexp":
		return math.Ldexp(args[0], int(args[1])), nil
	case "dim":
		return math.Dim(args[0], args[1]), nil
	case "signbit":
		if math.Signbit(args[0]) {
			return 1, nil
		}
		return 0, nil
	case "jn":
		return math.Jn(int(args[0]), args[1]), nil
	case "yn":
		return math.Yn(int(args[0]), args[1]), nil
	case "lgamma":
		if args[0] <= 0 && math.Mod(args[0], 1) == 0 {
			return math.NaN(), ErrDomain
		}
		l, _ := math.Lgamma(args[0])
		return l, nil
	case "sumdigits":
		// sum of decimal digits: sumdigits(1234)=10, sumdigits(0)=0.
		if len(args) != 1 {
			return 0, &EvalError{Err: ErrBadArity, Message: "sumdigits expects 1 argument"}
		}
		n, err := checkIntArg(args[0])
		if err != nil {
			return 0, err
		}
		return float64(sumDigits(n)), nil

	case "rev":
		// reverse decimal digits, dropping leading zeros: rev(1234)=4321, rev(120)=21.
		if len(args) != 1 {
			return 0, &EvalError{Err: ErrBadArity, Message: "rev expects 1 argument"}
		}
		n, err := checkIntArg(args[0])
		if err != nil {
			return 0, err
		}
		return float64(reverseDigits(n)), nil

	case "powmod":
		// modular exponentiation a^b mod m: powmod(2,10,1000)=24, powmod(3,4,7)=4.
		if len(args) != 3 {
			return 0, &EvalError{Err: ErrBadArity, Message: "powmod expects 3 arguments"}
		}
		ia, err := checkIntArg(args[0])
		if err != nil {
			return 0, err
		}
		ib, err := checkIntArg(args[1])
		if err != nil {
			return 0, err
		}
		im, err := checkIntArg(args[2])
		if err != nil {
			return 0, err
		}
		if im <= 0 {
			return 0, &EvalError{Err: ErrDomain, Message: "powmod requires m > 0"}
		}
		return float64(powmod(ia, ib, im)), nil

	case "fib":
		// Fibonacci number: fib(0)=0, fib(1)=1, fib(10)=55. Exact for n <= 97.
		if len(args) != 1 {
			return 0, &EvalError{Err: ErrBadArity, Message: "fib expects 1 argument"}
		}
		n, err := checkIntArg(args[0])
		if err != nil {
			return 0, err
		}
		if n > 97 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("fib requires n <= 97, got %d", n)}
		}
		return float64(fib(n)), nil

	case "ispal":
		// palindrome check: 1 if n reads the same forward and backward, else 0.
		if len(args) != 1 {
			return 0, &EvalError{Err: ErrBadArity, Message: "ispal expects 1 argument"}
		}
		n, err := checkIntArg(args[0])
		if err != nil {
			return 0, err
		}
		if n == reverseDigits(n) {
			return 1, nil
		}
		return 0, nil

	case "lcm":
		return lcm(args[0], args[1]), nil
	case "sinh":
		return math.Sinh(args[0]), nil
	case "cosh":
		return math.Cosh(args[0]), nil
	case "tanh":
		return math.Tanh(args[0]), nil
	case "logistic":
		return 1 / (1 + math.Exp(-args[0])), nil
	case "softplus":
		return math.Log(1 + math.Exp(args[0])), nil
	case "softsign":
		return args[0] / (1 + math.Abs(args[0])), nil
	case "swish":
		return args[0] / (1 + math.Exp(-args[0])), nil
	case "isfinite":
		if math.IsInf(args[0], 0) || math.IsNaN(args[0]) {
			return 0, nil
		}
		return 1, nil
	case "mish":
		sp := math.Log(1 + math.Exp(args[0]))
		return args[0] * math.Tanh(sp), nil
	case "sech":
		return 1 / math.Cosh(args[0]), nil
	case "csch":
		s := math.Sinh(args[0])
		if s == 0 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("csch undefined at x=%v", args[0])}
		}
		return 1 / s, nil
	case "coth":
		t := math.Tanh(args[0])
		if t == 0 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("coth undefined at x=%v", args[0])}
		}
		return 1 / t, nil
	case "asech":
		if args[0] <= 0 || args[0] > 1 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("asech requires 0 < x <= 1, got %v", args[0])}
		}
		return math.Acosh(1 / args[0]), nil
	case "acsch":
		if args[0] == 0 {
			return 0, &EvalError{Err: ErrDomain, Message: "acsch undefined at x=0"}
		}
		return math.Asinh(1 / args[0]), nil
	case "acoth":
		if math.Abs(args[0]) <= 1 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("acoth requires |x| > 1, got %v", args[0])}
		}
		return math.Atanh(1 / args[0]), nil
	case "ln":
		return math.Log(args[0]), nil
	case "log":
		return math.Log10(args[0]), nil
	case "log2":
		return math.Log2(args[0]), nil
	case "exp":
		return math.Exp(args[0]), nil
	case "pow":
		return math.Pow(args[0], args[1]), nil
	case "hypot":
		return math.Hypot(args[0], args[1]), nil
	case "root":
		return math.Pow(args[0], 1/args[1]), nil
	case "min":
		m := args[0]
		for _, v := range args[1:] {
			if v < m {
				m = v
			}
		}
		return m, nil
	case "max":
		m := args[0]
		for _, v := range args[1:] {
			if v > m {
				m = v
			}
		}
		return m, nil
	case "fact":
		return factorial(args[0])
	case "fix":
		return fixDigits(args[0], args[1]), nil
	case "avg":
		if len(args) == 0 {
			return 0, nil
		}
		sum := 0.0
		for _, a := range args {
			sum += a
		}
		return sum / float64(len(args)), nil
	case "var":
		mean := 0.0
		for _, a := range args {
			mean += a
		}
		mean /= float64(len(args))
		v := 0.0
		for _, a := range args {
			d := a - mean
			v += d * d
		}
		return v / float64(len(args)), nil
	case "stddev":
		mean := 0.0
		for _, a := range args {
			mean += a
		}
		mean /= float64(len(args))
		v := 0.0
		for _, a := range args {
			d := a - mean
			v += d * d
		}
		return math.Sqrt(v / float64(len(args))), nil
	case "median":
		s := make([]float64, len(args))
		copy(s, args)
		sort.Float64s(s)
		n := len(s)
		if n%2 == 1 {
			return s[n/2], nil
		}
		return (s[n/2-1] + s[n/2]) / 2, nil
	case "mode":
		best, bestCount := args[0], 1
		for i := 0; i < len(args); i++ {
			cnt := 0
			for j := 0; j < len(args); j++ {
				if args[j] == args[i] {
					cnt++
				}
			}
			if cnt > bestCount {
				best, bestCount = args[i], cnt
			}
		}
		return best, nil
	case "sum":
		if len(args) == 2 {
			return rangeSum(args[0], args[1], 1), nil
		}
		return rangeSum(args[0], args[1], args[2]), nil
	case "prod":
		if len(args) == 2 {
			return rangeProd(args[0], args[1], 1), nil
		}
		return rangeProd(args[0], args[1], args[2]), nil
	case "count":
		if len(args) == 2 {
			return rangeCount(args[0], args[1], 1), nil
		}
		return rangeCount(args[0], args[1], args[2]), nil
	case "isprime":
		if len(args) != 1 {
			return 0, &EvalError{Err: ErrBadArity, Message: "isprime expects 1 argument"}
		}
		if isPrime(int64(args[0])) {
			return 1, nil
		}
		return 0, nil

	case "prime":
		// nth prime, 1-indexed: prime(1)=2, prime(2)=3, prime(3)=5, ...
		if len(args) != 1 {
			return 0, &EvalError{Err: ErrBadArity, Message: "prime expects 1 argument"}
		}
		n := int64(args[0])
		if n < 1 {
			return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("prime requires n >= 1, got %v", args[0])}
		}
		return float64(nthPrime(n)), nil

	case "nextprime":
		// smallest prime >= n: nextprime(1)=2, nextprime(10)=11.
		if len(args) != 1 {
			return 0, &EvalError{Err: ErrBadArity, Message: "nextprime expects 1 argument"}
		}
		n := int64(args[0])
		if n < 2 {
			return 2, nil
		}
		return float64(nextPrime(n)), nil

	case "divcount":
		// number of positive divisors: divcount(6)=4, divcount(12)=6.
		if len(args) != 1 {
			return 0, &EvalError{Err: ErrBadArity, Message: "divcount expects 1 argument"}
		}
		n := int64(args[0])
		if n == 0 {
			return 0, &EvalError{Err: ErrDomain, Message: "divcount(0) is undefined"}
		}
		return float64(divCount(n)), nil

	case "npr":
		// permutations nPr(n, r) = n! / (n-r)! : npr(5, 2)=20, npr(10, 3)=720.
		if len(args) != 2 {
			return 0, &EvalError{Err: ErrBadArity, Message: "npr expects 2 arguments"}
		}
		return perm(args[0], args[1])

	case "ncr":
		// combinations nCr(n, r) = n! / (r! * (n-r)!) : ncr(5, 2)=10, ncr(10, 3)=120.
		if len(args) != 2 {
			return 0, &EvalError{Err: ErrBadArity, Message: "ncr expects 2 arguments"}
		}
		return comb(args[0], args[1])

	default:
		return 0, &EvalError{Err: fmt.Errorf("unsupported function %s", n.Name), Message: "function evaluation failed"}
	}
}

// factorial computes n! for a non-negative integer argument.
func gcd(a, b float64) float64 {
	ia, ib := int64(a), int64(b)
	if ia < 0 {
		ia = -ia
	}
	if ib < 0 {
		ib = -ib
	}
	if ia == 0 || ib == 0 {
		return 1
	}
	for ib != 0 {
		ia, ib = ib, ia%ib
	}
	return float64(ia)
}

func lcm(a, b float64) float64 {
	if a == 0 || b == 0 {
		return 0
	}
	g := gcd(a, b)
	return float64(int64(a) / int64(g) * int64(b))
}

// sumDigits returns the sum of the decimal digits of a non-negative integer n.
// sumDigits(0) = 0.
func sumDigits(n int64) int64 {
	sum := int64(0)
	for n > 0 {
		sum += n % 10
		n /= 10
	}
	return sum
}

// reverseDigits returns the decimal digits of n reversed, dropping any leading
// zeros of the reversed form (so rev(120) = 21). reverseDigits(0) = 0.
func reverseDigits(n int64) int64 {
	rev := int64(0)
	for n > 0 {
		rev = rev*10 + n%10
		n /= 10
	}
	return rev
}

// fib returns the n-th Fibonacci number (fib(0)=0, fib(1)=1) computed
// iteratively. Results are exact for n <= 97 (fib(97) < 2^63).
func fib(n int64) int64 {
	if n == 0 {
		return 0
	}
	a, b := int64(0), int64(1)
	for i := int64(1); i < n; i++ {
		a, b = b, a+b
	}
	return b
}

// powmod computes (a^b) mod m using fast modular exponentiation, requiring
// a, b >= 0 and m > 0. Each step keeps intermediate products reduced mod m.
func powmod(a, b, m int64) int64 {
	res := int64(1) % m
	a %= m
	for b > 0 {
		if b&1 == 1 {
			res = res * a % m
		}
		a = a * a % m
		b >>= 1
	}
	return res
}

func factorial(x float64) (float64, error) {
	if x < 0 {
		return 0, &EvalError{Err: ErrFactorial, Message: fmt.Sprintf("factorial of negative number %v", x)}
	}
	if x != math.Trunc(x) {
		return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("factorial requires an integer, got %v", x)}
	}
	if x > 170 {
		return 0, &EvalError{Err: ErrOverflow, Message: fmt.Sprintf("factorial of %v overflows float64", x)}
	}
	res := 1.0
	for i := 2.0; i <= x; i++ {
		res *= i
	}
	return res, nil
}

// fixDigits rounds x to n decimal places.
func fixDigits(x, n float64) float64 {
	scale := math.Pow(10, math.Floor(n))
	return math.Round(x*scale) / scale
}

// rangeSum sums the integers from floor(a) to floor(b) inclusive.
func rangeSum(a, b, step float64) float64 {
	lo, hi := math.Floor(a), math.Floor(b)
	if hi < lo || step <= 0 {
		return 0
	}
	step = math.Floor(step)
	if step < 1 {
		step = 1
	}
	sum := 0.0
	for i := lo; i <= hi; i += step {
		sum += i
	}
	return sum
}

// rangeProd multiplies the integers from floor(a) to floor(b) inclusive.
func rangeProd(a, b, step float64) float64 {
	lo, hi := math.Floor(a), math.Floor(b)
	if hi < lo || step <= 0 {
		return 1
	}
	step = math.Floor(step)
	if step < 1 {
		step = 1
	}
	prod := 1.0
	for i := lo; i <= hi; i += step {
		prod *= i
	}
	return prod
}

// rangeCount returns the number of integers from floor(a) to floor(b)
// inclusive (0 when b < a).
func rangeCount(a, b, step float64) float64 {
	lo, hi := math.Floor(a), math.Floor(b)
	if hi < lo || step <= 0 {
		return 0
	}
	step = math.Floor(step)
	if step < 1 {
		step = 1
	}
	cnt := 0
	for i := lo; i <= hi; i += step {
		cnt++
	}
	return float64(cnt)
}

// isPrime reports whether n is a prime number (n must be >= 0).
func isPrime(n int64) bool {
	if n < 2 {
		return false
	}
	if n == 2 {
		return true
	}
	if n%2 == 0 {
		return false
	}
	for d := int64(3); d*d <= n; d += 2 {
		if n%d == 0 {
			return false
		}
	}
	return true
}

// nthPrime returns the n-th prime (1-indexed): 2, 3, 5, 7, ...
func nthPrime(n int64) int64 {
	if n <= 0 {
		return 0
	}
	count := int64(0)
	candidate := int64(2)
	for count < n {
		if isPrime(candidate) {
			count++
			if count == n {
				return candidate
			}
		}
		candidate++
	}
	return 0
}

// nextPrime returns the smallest prime >= n (n must be >= 1).
func nextPrime(n int64) int64 {
	if n < 2 {
		return 2
	}
	candidate := n
	if candidate%2 == 0 && candidate != 2 {
		candidate++
	}
	for {
		if isPrime(candidate) {
			return candidate
		}
		candidate += 2
	}
}

// divCount returns the number of positive divisors of n (n != 0).
func divCount(n int64) int64 {
	if n == 0 {
		return 0
	}
	if n < 0 {
		n = -n
	}
	cnt := int64(1)
	for d := int64(2); d*d <= n; d++ {
		if n%d == 0 {
			e := int64(0)
			for n%d == 0 {
				n /= d
				e++
			}
			cnt *= (e + 1)
		}
	}
	if n > 1 {
		cnt *= 2
	}
	return cnt
}

// checkIntArg validates that x is a non-negative integer and returns its
// int64 value. It returns an error when x is not an integer or is negative.
func checkIntArg(x float64) (int64, error) {
	if x < 0 {
		return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("requires a non-negative integer, got %v", x)}
	}
	if x != math.Trunc(x) {
		return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("requires an integer, got %v", x)}
	}
	return int64(x), nil
}

// perm computes the number of permutations nPr(n, r) = n! / (n-r)!,
// the number of ways to pick r ordered items from n, using a multiplicative
// loop that avoids huge intermediate factorials.
func perm(n, r float64) (float64, error) {
	in, err := checkIntArg(n)
	if err != nil {
		return 0, err
	}
	ir, err := checkIntArg(r)
	if err != nil {
		return 0, err
	}
	if ir > in {
		return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("npr requires r <= n, got n=%d r=%d", in, ir)}
	}
	res := 1.0
	for i := in - ir + 1; i <= in; i++ {
		res *= float64(i)
	}
	return res, nil
}

// comb computes the number of combinations nCr(n, r) = n! / (r! * (n-r)!),
// the number of ways to pick r unordered items from n. It uses the symmetric
// multiplicative formula and reduces the loop to min(r, n-r) iterations.
func comb(n, r float64) (float64, error) {
	in, err := checkIntArg(n)
	if err != nil {
		return 0, err
	}
	ir, err := checkIntArg(r)
	if err != nil {
		return 0, err
	}
	if ir > in {
		return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("ncr requires r <= n, got n=%d r=%d", in, ir)}
	}
	k := ir
	if k > in/2 {
		k = in - ir
	}
	res := 1.0
	for i := int64(1); i <= k; i++ {
		res = res * float64(in-k+i) / float64(i)
	}
	return res, nil
}

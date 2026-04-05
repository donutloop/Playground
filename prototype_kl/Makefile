.PHONY: build test fmt clean

build:
	go build -o evaluator main.go

test:
	go test -v ./tests/unit/... ./tests/integration/...

fmt:
	go fmt ./...

clean:
	rm -f evaluator

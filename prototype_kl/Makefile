.PHONY: build test run fmt vet clean bench install verify

build:
	go build -o calculator main.go

test:
	go test -v ./...

run:
	go run main.go

fmt:
	gofmt -l -w .

vet:
	go vet ./...

bench:
	go test ./calc/ ./parser/ -bench . -benchmem

install:
	go install .

verify:
	go vet ./... && go test ./... && go build -o calculator main.go && ./calculator --verify

clean:
	rm -f calculator

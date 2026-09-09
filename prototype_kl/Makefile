.PHONY: build test run fmt vet clean bench install

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

clean:
	rm -f calculator

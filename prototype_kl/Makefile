.PHONY: build test run fmt vet clean

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

clean:
	rm -f calculator

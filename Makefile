# Run each maintained implementation's test suite from the repository root.

.PHONY: test test-go test-moonbit test-tools todo-gc help

## test: run all Go and MoonBit tests, plus the tools' own checks
test: test-go test-moonbit test-tools

## test-go: run the Go suite with embedded content refreshed
test-go:
	$(MAKE) -C go test

## test-moonbit: run MoonBit tests, JS parser tests, and Node integration tests
test-moonbit:
	$(MAKE) -C moonbit test

## test-tools: run the tools' own checks (slops-nav and todo-gc tests, svg-gen lint)
test-tools:
	cd tools/slops-nav && go test ./...
	cd tools/todo-gc && go test ./...
	$(MAKE) -C tools/svg-gen check

## todo-gc: move [x] entries from TODO.md to TODO-archive.md, one line per item
todo-gc:
	cd tools/todo-gc && go run . -w ../..

help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)

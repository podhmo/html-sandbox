# Run each maintained implementation's test suite from the repository root.

.PHONY: test test-go test-moonbit test-ts help

## test: run all Go, MoonBit, and TypeScript tests
test: test-go test-moonbit test-ts

## test-go: run the Go suite with embedded content refreshed
test-go:
	$(MAKE) -C go test

## test-moonbit: run MoonBit tests, JS parser tests, and Node integration tests
test-moonbit:
	$(MAKE) -C moonbit test

## test-ts: run the TypeScript suite
test-ts:
	npm --prefix ts test

help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)

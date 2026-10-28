# Run each maintained implementation's test suite from the repository root.

.PHONY: test test-go test-moonbit help

## test: run all Go and MoonBit tests
test: test-go test-moonbit

## test-go: run the Go suite with embedded content refreshed
test-go:
	$(MAKE) -C go test

## test-moonbit: run MoonBit tests, JS parser tests, and Node integration tests
test-moonbit:
	$(MAKE) -C moonbit test

help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)

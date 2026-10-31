# Run each maintained implementation's test suite from the repository root.

.PHONY: test test-go test-moonbit help

## test: run all Go and MoonBit tests, plus the tools' own checks
test: test-go test-moonbit test-tools

## test-go: run the Go suite with embedded content refreshed
test-go:
	$(MAKE) -C go test

## test-moonbit: run MoonBit tests, JS parser tests, and Node integration tests
test-moonbit:
	$(MAKE) -C moonbit test

## test-tools: run the tools' own checks (slops-nav tests, svg-gen lint)
test-tools:
	cd tools/slops-nav && go test ./...
	$(MAKE) -C tools/svg-gen check

help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)

# The profile-demo experiment for docs/sketch/ja/profiling-moonbit-guide.md:
# one document rendered by a naive renderer and by a StringBuilder one, so
# that the profiler's answer (copying and allocation) can be seen and then
# made to go away.  Run `make help` for the targets.
#
# `profile*` use moon's own profiler.  They put bin/perf first on PATH: it is a
# small wrapper that adds `--sample-cpu` to `perf record`, which moon's report
# parser needs but moon does not pass.  They still need a perf built with
# libdw/libelf; the WSL2 one is not, and `record*` + `top*` (plain perf, ranked
# with nm by top.py) remain the fallback for such machines.
# See docs/sketch/ja/profiling-moonbit-guide.md and profiling-moonbit-setup.md.

# Where moon puts the release executables.
NAIVE := _build/native/release/build/naive/naive.exe
FAST := _build/native/release/build/fast/fast.exe

# The workload's size, and repetitions: enough work that 100 samples a second
# still leaves a few hundred samples.
LINES ?= 2000
NAIVE_REPS ?= 70
FAST_REPS ?= 4000

# moon's profiler needs `[cpu]` in perf script output; bin/perf adds
# `--sample-cpu` to `perf record`.  Only the `profile*` targets use it.
PROFILE_PATH := $(CURDIR)/bin:$(PATH)

.PHONY: build run test profile profile-fast profile-test record record-fast top top-fast clean help

## build: build the two native executables in release
build:
	moon build --target native --release

## run: time both renderers on the same document
run: build
	moon run --target native naive -- $(LINES) $(NAIVE_REPS)
	moon run --target native fast -- $(LINES) $(FAST_REPS)

## test: run the tests
test:
	moon test

## profile: moon's profiler on the naive executable (writes _build/native/release/profile/naive/<stamp>/)
profile:
	PATH=$(PROFILE_PATH) moon run --profile naive -- $(LINES) $(NAIVE_REPS)

## profile-fast: moon's profiler on the fast executable
profile-fast:
	PATH=$(PROFILE_PATH) moon run --profile fast -- $(LINES) $(FAST_REPS)

## profile-test: moon's profiler on the test executable
profile-test:
	PATH=$(PROFILE_PATH) moon test --profile

## record: record the naive run with plain perf into build/naive.data (the fallback)
record: build
	@mkdir -p build
	perf record -e cpu-clock -F 100 -o build/naive.data -- $(NAIVE) $(LINES) $(NAIVE_REPS)

## record-fast: record the fast run into build/fast.data
record-fast: build
	@mkdir -p build
	perf record -e cpu-clock -F 100 -o build/fast.data -- $(FAST) $(LINES) $(FAST_REPS)

## top: rank build/naive.data by self time
top:
	python3 top.py build/naive.data

## top-fast: rank build/fast.data by self time
top-fast:
	python3 top.py build/fast.data

clean:
	rm -rf build

help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)

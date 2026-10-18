#!/usr/bin/env python3
"""top.py -- a small self-time ranking for a perf.data recorded on Linux.

Why this exists
---------------
`moon run --profile <exe>` records with

    perf record --quiet -F 100 -e cpu-clock --call-graph dwarf -o <dir>/perf.data -- <exe> <args>

and then ranks the samples itself.  That works when `perf` was built with
libunwind/libdw (to unwind the DWARF call graph) and when the kernel reports the
CPU for the `cpu-clock` event.  Some environments -- WSL2 with a `perf` built
without libunwind, in particular -- satisfy neither: `perf script` prints stacks
with `[unknown]` symbols (or none at all) and `perf` refuses to print the CPU
field, at which point `moon run --profile` reports `Samples: 0`.

`perf` there also cannot symbolize addresses, because it was not linked against
libelf/libdw.  This script fills the gap with tools that are always present:
`perf script` for the raw samples and the mmap records, `nm` for the symbols.
It resolves each sample's leaf address and prints the symbols that own the most
samples -- a flat, self-time profile, which is what usually drives the first
round of tuning.

Usage
-----
    perf record -e cpu-clock -F 100 -o out.data -- ./prog args
    python3 top.py out.data

The load address of every object is read back from the mmap records that
`perf script --show-mmap-events` prints, so ASLR does not have to be disabled.
"""

from __future__ import annotations

import argparse
import bisect
import collections
import os
import re
import subprocess
import sys


def _is_hex(text: str) -> bool:
    try:
        int(text, 16)
        return True
    except ValueError:
        return False


# A sample or mmap line:
#   naive.exe    2941  1363.751296:   10000000 cpu-clock:u:   7ffff7db0cdb [unknown] (libc.so.6)
HEADER_RE = re.compile(
    r"^\s*(?P<comm>\S.*?)\s+(?P<pid>\d+)\s+(?:\[(?P<cpu>\d+)\]\s+)?"
    r"(?P<time>\d+\.\d+):\s+(?P<period>\d+)\s+(?P<event>\S+):\s*(?P<rest>.*)$"
)
# An indented frame of a call graph (when `perf` can unwind):
#      7ffff7db0cab [unknown] (/usr/lib/x86_64-linux-gnu/libc.so.6)
FRAME_RE = re.compile(r"^\s*(?P<addr>[0-9a-f]+)\s+(?P<sym>.*?)\s+\((?P<dso>[^)]*)\)\s*$")
MMAP_RE = re.compile(
    r"PERF_RECORD_MMAP\d* \d+/\d+: \[(?P<start>0x[0-9a-f]+)\((?P<size>0x[0-9a-f]+)\)"
    r" @ (?P<off>0x[0-9a-f]+)[^\]]*\]: \S+ (?P<path>\S+)\s*$"
)

CODE_TYPES = set("tTwWiI")


class Dso:
    """One ELF object: its load ranges (for address -> file offset) and symbols."""

    def __init__(self, path: str) -> None:
        self.path = path
        self.ranges: list[tuple[int, int, int]] = []  # (start, end, base)
        self.addrs: list[int] = []
        self.sizes: list[int] = []
        self.names: list[str] = []
        self._loaded = False

    def add_mapping(self, start: int, size: int, file_off: int) -> None:
        self.ranges.append((start, start + size, start - file_off))
        self.ranges.sort()

    def _load(self) -> None:
        self._loaded = True
        table: dict[int, tuple[int, str]] = {}
        # `-S` prints the size, which is what lets us tell "inside this
        # function" from "somewhere after the last exported one".  Shared
        # libraries are stripped to their dynamic symbols, so ask for those too.
        for args in (
            ["nm", "-n", "-S", self.path],
            ["nm", "-D", "-n", "-S", self.path],
        ):
            try:
                out = subprocess.run(
                    args, capture_output=True, text=True, check=False
                ).stdout
            except OSError:
                continue
            for line in out.splitlines():
                parts = line.split(maxsplit=3)
                if len(parts) < 3:
                    continue
                if len(parts) == 4 and parts[1] != "" and _is_hex(parts[1]):
                    addr_s, size_s, kind, name = parts
                else:
                    addr_s, kind, name = parts
                    size_s = "0"
                if len(kind) != 1 or kind not in CODE_TYPES:
                    continue
                try:
                    addr = int(addr_s, 16)
                    size = int(size_s, 16)
                except ValueError:
                    continue
                table.setdefault(addr, (size, name))
        for addr in sorted(table):
            size, name = table[addr]
            self.addrs.append(addr)
            self.sizes.append(size)
            self.names.append(name)

    def resolve(self, addr: int) -> str | None:
        """Turn a runtime address into `symbol+0xoffset`, or None."""
        base = None
        for start, end, candidate in self.ranges:
            if start <= addr < end:
                base = candidate
                break
        if base is None:
            return None
        if not self._loaded:
            self._load()
        off = addr - base
        i = bisect.bisect_right(self.addrs, off) - 1
        if i < 0:
            return None
        start, size, name = self.addrs[i], self.sizes[i], self.names[i]
        if off - start < max(size, 1):
            delta = off - start
            return name if delta == 0 else f"{name}+0x{delta:x}"
        # Inside the object, but the symbol table does not cover it (a stripped
        # library's static functions).  Name the object and keep the offset.
        return f"{os.path.basename(self.path)}+0x{off:x}"


def read_script(data: str) -> str:
    result = subprocess.run(
        ["perf", "script", "--show-mmap-events", "-i", data],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0 and not result.stdout:
        sys.stderr.write(result.stderr)
        raise SystemExit(f"perf script failed on {data}")
    return result.stdout


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("data", help="a perf.data file (perf record -o <data>)")
    parser.add_argument("-n", "--top", type=int, default=20, help="rows to print")
    args = parser.parse_args()

    # One pass over the perf script output: samples tell us the leaf frame, and
    # the mmap records that perf emits alongside tell us where each object was
    # loaded, which is what turns a runtime address into a file offset.
    dsos: dict[str, Dso] = {}

    def resolve(dso_path: str, addr: int) -> str | None:
        dso = dsos.get(dso_path)
        if dso is None:
            dso = dsos[dso_path] = Dso(dso_path)
        return dso.resolve(addr)

    text = read_script(args.data)

    counter: collections.Counter[str] = collections.Counter()
    unresolved = 0
    total = 0
    pending: list[tuple[str, int]] = []

    def take():
        nonlocal unresolved, total
        if not pending:
            return
        total += 1
        dso_path, addr = pending[0]
        name = resolve(dso_path, addr) if dso_path else None
        if name is None:
            unresolved += 1
        else:
            counter[name] += 1

    for line in text.splitlines():
        if "PERF_RECORD_MMAP" in line:
            mmap = MMAP_RE.search(line)
            if mmap:
                path = mmap.group("path")
                dso = dsos.get(path)
                if dso is None:
                    dso = dsos[path] = Dso(path)
                dso.add_mapping(
                    int(mmap.group("start"), 16),
                    int(mmap.group("size"), 16),
                    int(mmap.group("off"), 16),
                )
            continue
        header = HEADER_RE.match(line)
        if header:
            take()
            pending.clear()
            rest = header.group("rest")
            if rest:
                frame = FRAME_RE.match(rest)
                if frame:
                    pending.append((frame.group("dso"), int(frame.group("addr"), 16)))
            continue
        frame = FRAME_RE.match(line)
        if frame and not pending:
            pending.append((frame.group("dso"), int(frame.group("addr"), 16)))
    take()

    if total == 0:
        print("no samples found in", args.data, file=sys.stderr)
        return 1

    print(f"samples: {total}  resolved: {total - unresolved}  unresolved: {unresolved}")
    print()
    print(f"{'self%':>6}  {'samples':>7}  symbol")
    for name, count in counter.most_common(args.top):
        pct = 100.0 * count / total
        print(f"{pct:6.2f}  {count:7d}  {name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

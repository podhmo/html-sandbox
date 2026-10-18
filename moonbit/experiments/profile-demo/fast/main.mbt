// The fast renderer, profiled by `moon run --profile fast`.
//
// It does the same work as `naive`, but the same document can be rendered many
// more times in the few seconds the sampler needs, which is why the default
// repetition count is higher:
//
//   moon run --profile fast -- 2000 4000

///|
/// main renders the document with the builder-based renderer, over and over,
/// so that the profile has enough samples to rank. Its per-repetition cost is
/// what to compare against the naive one.
fn main {
  let (lines, reps) = @work.workload_args(default_lines=2000, default_reps=4000)
  let doc = @work.generate(lines)
  let mut bytes = 0
  let start = @bench.monotonic_clock_start()
  for i = 0; i < reps; i = i + 1 {
    bytes = @work.render_fast(doc).length()
  }
  let elapsed_us = @bench.monotonic_clock_end(start)
  let checksum = @work.checksum(@work.render_fast(doc))
  println(
    "fast: lines=\{lines} reps=\{reps} bytes=\{bytes} checksum=\{checksum} elapsed=\{elapsed_us}us (\{elapsed_us / reps.to_double()}us per rep)",
  )
}

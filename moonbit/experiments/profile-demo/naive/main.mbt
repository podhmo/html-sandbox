// The naive renderer, profiled by `moon run --profile naive`.
//
// The two arguments are the number of lines and the number of repetitions, so
// the same program can be sized to run for the few seconds the sampler needs
// (about 100 samples a second):
//
//   moon run --profile naive -- 2000 70

///|
/// main renders the document with the naive renderer carelessly often, which
/// is the point: the profile should point at the escaping and the
/// concatenation, not at this loop.
fn main {
  let (lines, reps) = @work.workload_args(default_lines=2000, default_reps=70)
  let doc = @work.generate(lines)
  let mut bytes = 0
  let start = @bench.monotonic_clock_start()
  for i = 0; i < reps; i = i + 1 {
    bytes = @work.render_naive(doc).length()
  }
  let elapsed_us = @bench.monotonic_clock_end(start)
  let checksum = @work.checksum(@work.render_naive(doc))
  println(
    "naive: lines=\{lines} reps=\{reps} bytes=\{bytes} checksum=\{checksum} elapsed=\{elapsed_us}us (\{elapsed_us / reps.to_double()}us per rep)",
  )
}

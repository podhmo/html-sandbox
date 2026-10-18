// The workload's tests. `moon test --profile` profiles the test executable
// these build, so one of them is deliberately heavy: the easiest way to give
// the sampler something to see is a test that calls the renderer many times.

///|
/// test_doc is the document both tests use: large enough that rendering it is
/// real work, not a rounding error.
fn test_doc() -> Array[String] {
  @work.generate(2000)
}

///|
test "render_fast agrees with render_naive" {
  let doc = test_doc()
  assert_eq(@work.render_fast(doc), @work.render_naive(doc))
}

///|
test "render_naive on a large document" {
  let doc = test_doc()
  let mut bytes = 0
  for i = 0; i < 60; i = i + 1 {
    bytes = @work.render_naive(doc).length()
  }
  assert_true(bytes > 0)
}

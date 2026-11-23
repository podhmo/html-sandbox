// data.mbt -- the shared virtual datasets for fig-chart-*.mbtx, so a
// "same data, different figure" comparison (boxplot vs histogram)
// reads from one source. Everything is seeded; values are virtual,
// not measurements. Like data.ts, one seeded PRNG stream feeds the
// datasets in a fixed order — bench() first, then traffic() — and
// each is computed once and memoized, so the values do not depend on
// which figure runs or in what order accessors are called.

///|
let data_stream : Ref[(() -> Double, () -> Double)?] = { val: None, }

///|
fn stream() -> (() -> Double, () -> Double) {
  match data_stream.val {
    Some(s) => s
    None => {
      let rand = rng(20261102)
      let s = (rand, gauss(rand))
      data_stream.val = Some(s)
      s
    }
  }
}

///|
let bench_memo : Ref[Array[BoxGroup]?] = { val: None, }

///|
/// Virtual benchmark trials (ms), n=160 per implementation. "cached"
/// is secretly bimodal: a fast path hit vs. a miss path. A box plot
/// reports it as one compact distribution; a histogram shows the two
/// modes. The choice of figure changes what the data says — which is
/// the guideline's own warning, reproduced on purpose.
pub fn bench() -> Array[BoxGroup] {
  match bench_memo.val {
    Some(b) => b
    None => {
      let (rand, g) = stream()
      let nrm = fn(mu : Double, sd : Double, n : Int32) -> Array[Double] {
        [
          for _ in 0..<n => mu + sd * g()
        ]
      }
      let b = [
        { label: "naive", values: nrm(150.0, 18.0, 160), },
        { label: "simd", values: nrm(105.0, 12.0, 160), },
        { label: "cached", values: nrm(88.0, 9.0, 96) + nrm(168.0, 14.0, 64), },
        {
          label: "async-io",
          values: nrm(120.0, 22.0, 160).map(fn(v) {
            if v > 150.0 {
              v + 40.0 * rand()
            } else {
              v
            }
          }),
        },
      ]
      bench_memo.val = Some(b)
      b
    }
  }
}

///|
let traffic_memo : Ref[Array[Array[Double]]?] = { val: None, }

///|
/// Virtual hourly traffic (req/s), 7 days x 24 hours: a daytime
/// plateau, a lunchtime dip, quieter weekends, and an incident
/// window on Tuesday 14:00-17:00.
pub fn traffic() -> Array[Array[Double]] {
  match traffic_memo.val {
    Some(t) => t
    None => {
      ignore(bench()) // data.ts consumes bench's draws first on the shared stream
      let (_, g) = stream()
      let t = compute_traffic(g)
      traffic_memo.val = Some(t)
      t
    }
  }
}

///|
fn compute_traffic(g : () -> Double) -> Array[Array[Double]] {
  let hourly = fn(h : Int32) -> Double {
    if h < 7 {
      15.0
    } else if h < 9 {
      40.0 + (h - 7).to_double() * 20.0
    } else if h < 12 {
      80.0
    } else if h < 13 {
      55.0
    } else if h < 18 {
      95.0
    } else if h < 22 {
      60.0
    } else {
      25.0
    }
  }
  traffic_days.mapi(fn(d, _name) {
    let weekend = if d >= 5 { 0.35 } else { 1.0 }
    Array::makei(24, fn(h) {
      // Tue incident and the Sunday late-night batch show up as
      // multiplicative bumps on the baseline.
      let bump = (if d == 1 && h >= 14 && h <= 16 { 2.2 } else { 1.0 }) *
        (if d == 6 && h >= 1 && h <= 4 { 1.8 } else { 1.0 })
      ((hourly(h) * weekend + 6.0 * g()) * bump).max(1.0)
    })
  })
}

///|
pub let traffic_days : Array[String] = [
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
]

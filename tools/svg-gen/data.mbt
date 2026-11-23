// data.mbt -- the shared virtual datasets for fig-chart-*.mbtx, so a
// "same data, different figure" comparison (boxplot vs histogram)
// reads from one source. Everything is seeded; values are virtual,
// not measurements. Each accessor re-seeds its own PRNG, so callers
// get identical data every time.

///|
/// Virtual benchmark trials (ms), n=160 per implementation. "cached"
/// is secretly bimodal: a fast path hit vs. a miss path. A box plot
/// reports it as one compact distribution; a histogram shows the two
/// modes. The choice of figure changes what the data says — which is
/// the guideline's own warning, reproduced on purpose.
pub fn bench() -> Array[BoxGroup] {
  let rand = rng(20261102)
  let g = gauss(rand)
  let nrm = fn(mu : Double, sd : Double, n : Int32) -> Array[Double] {
    [
      for _ in 0..<n => mu + sd * g()
    ]
  }
  [
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
}

///|
/// Virtual hourly traffic (req/s), 7 days x 24 hours: a daytime
/// plateau, a lunchtime dip, quieter weekends, and an incident
/// window on Tuesday 14:00-17:00.
pub fn traffic() -> Array[Array[Double]] {
  let rand = rng(20261102)
  let g = gauss(rand)
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
      let mut v = hourly(h) * weekend + 6.0 * g()
      if d == 1 && h >= 14 && h <= 16 {
        v *= 2.2 // Tue incident
      }
      if d == 6 && h >= 1 && h <= 4 {
        v *= 1.8 // Sunday late-night batch
      }
      v.max(1.0)
    })
  })
}

///|
pub let traffic_days : Array[String] = [
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
]

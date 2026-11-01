// data.ts -- the shared virtual datasets for fig-chart-*.ts, so a
// "same data, different figure" comparison (boxplot vs histogram)
// reads from one source. Everything is seeded; values are virtual,
// not measurements.
import { gauss, rng } from "../chart.ts";

const rand = rng(20261102);
const g = gauss(rand);
const nrm = (mu: number, sd: number, n: number): number[] =>
  Array.from({ length: n }, () => mu + sd * g());

// Virtual benchmark trials (ms), n=160 per implementation. "cached"
// is secretly bimodal: a fast path hit vs. a miss path. A box plot
// reports it as one compact distribution; a histogram shows the two
// modes. The choice of figure changes what the data says — which is
// the guideline's own warning, reproduced on purpose.
export const bench: { label: string; values: number[] }[] = [
  { label: "naive", values: nrm(150, 18, 160) },
  { label: "simd", values: nrm(105, 12, 160) },
  {
    label: "cached",
    values: [...nrm(88, 9, 96), ...nrm(168, 14, 64)],
  },
  {
    label: "async-io",
    values: nrm(120, 22, 160).map((v) => (v > 150 ? v + 40 * rand() : v)),
  },
];

// Virtual hourly traffic (req/s), 7 days x 24 hours: a daytime
// plateau, a lunchtime dip, quieter weekends, and an incident
// window on Tuesday 14:00-17:00.
export const traffic: number[][] = (() => {
  const hourly = (h: number) =>
    h < 7 ? 15 : h < 9 ? 40 + (h - 7) * 20 : h < 12 ? 80 : h < 13 ? 55 : h < 18 ? 95 : h < 22 ? 60 : 25;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((_, d) => {
    const weekend = d >= 5 ? 0.35 : 1;
    return Array.from({ length: 24 }, (_, h) => {
      let v = hourly(h) * weekend + 6 * g();
      if (d === 1 && h >= 14 && h <= 16) v *= 2.2; // Tue incident
      if (d === 6 && h >= 1 && h <= 4) v *= 1.8; // Sunday late-night batch
      return Math.max(v, 1);
    });
  });
})();
export const trafficDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

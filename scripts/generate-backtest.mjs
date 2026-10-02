import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const source = JSON.parse(await readFile(resolve(root, "data/rbi-export-surveys.json"), "utf8"));
const median = (xs) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const metrics = (pairs, forecastKey) => {
  const errors = pairs.map((row) => row.actualGrowthPct - row[forecastKey]);
  return {
    maePp: errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length,
    rmsePp: Math.sqrt(errors.reduce((sum, error) => sum + error ** 2, 0) / errors.length),
    meanErrorPp: errors.reduce((sum, error) => sum + error, 0) / errors.length,
  };
};

const rows = source.series;
if (rows.length < 3) throw new Error("At least three RBI release observations are required.");
for (let i = 0; i < rows.length; i += 1) {
  if (!Number.isFinite(rows[i].growthPct) || (i && rows[i].published <= rows[i - 1].published)) {
    throw new Error(`Invalid or non-chronological observation at index ${i}.`);
  }
}

const forecasts = rows.slice(1).map((target, index) => {
  const prior = rows.slice(0, index + 1);
  const origin = prior.at(-1);
  return {
    originFy: origin.fy,
    originPublished: origin.published,
    targetFy: target.fy,
    targetPublished: target.published,
    actualGrowthPct: target.growthPct,
    persistenceForecastPct: origin.growthPct,
    expandingMedianForecastPct: median(prior.map((row) => row.growthPct)),
    targetSource: target.source,
  };
});

const intervalsMonths = forecasts.map((row) => {
  const days = (Date.parse(`${row.targetPublished}T00:00:00Z`) - Date.parse(`${row.originPublished}T00:00:00Z`)) / 86_400_000;
  return days / 30.4375;
});
const output = {
  version: "rbi-software-export-growth-backtest-1",
  asOf: "2026-10-02",
  target: source.target,
  scope: source.scope,
  method: source.method,
  observationCount: rows.length,
  outOfSampleForecastCount: forecasts.length,
  horizonMonths: {
    min: Math.min(...intervalsMonths),
    mean: intervalsMonths.reduce((sum, value) => sum + value, 0) / intervalsMonths.length,
    max: Math.max(...intervalsMonths),
  },
  benchmarks: {
    persistence: metrics(forecasts, "persistenceForecastPct"),
    expandingMedian: metrics(forecasts, "expandingMedianForecastPct"),
  },
  forecasts,
  caveats: [
    "Only eleven expanding-window test origins are available; the benchmark ranking is still descriptive, with limited power and possible RBI survey-method breaks.",
    "RBI release gaps vary, so these are next-release forecasts (6.2–15.9 months), not fixed-horizon forecasts. RBI survey estimation and classification methods changed over time, so the longer sample may contain measurement breaks.",
    "This tests only annual software-export growth. It does not validate the scenario-score mix, hiring, AI productivity, margins, or employment assumptions.",
    "Export values are in current US dollars and therefore combine volume, price/mix, and annual-average exchange-rate effects.",
    "The RBI series excludes software services supplied via overseas commercial presence; do not equate it with total revenue of Indian IT companies."
  ]
};
await writeFile(resolve(root, "public/data/generated/rbi-export-backtest.json"), `${JSON.stringify(output, null, 2)}\n`);

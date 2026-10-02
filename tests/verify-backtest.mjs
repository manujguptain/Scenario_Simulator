import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../public/data/generated/rbi-export-backtest.json", import.meta.url), "utf8"));
assert.equal(data.observationCount, 8);
assert.equal(data.outOfSampleForecastCount, 7);
assert.ok(Math.abs(data.benchmarks.persistence.maePp - 5.8285714286) < 1e-8);
assert.ok(Math.abs(data.benchmarks.persistence.rmsePp - 8.1608823052) < 1e-8);
assert.ok(Math.abs(data.benchmarks.expandingMedian.maePp - 4.5214285714) < 1e-8);
assert.ok(Math.abs(data.benchmarks.expandingMedian.rmsePp - 5.6974618409) < 1e-8);
for (const row of data.forecasts) {
  assert.ok(row.originPublished < row.targetPublished, "forecast origin must precede target release");
  assert.ok(row.originFy < row.targetFy, "forecast origin fiscal year must precede target");
}
assert.equal(data.forecasts.at(-1).expandingMedianForecastPct, 8.8);
console.log("Backtest validation passed: release ordering, sample size, forecasts, MAE and RMSE.");

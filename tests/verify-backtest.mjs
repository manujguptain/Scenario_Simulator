import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../public/data/generated/rbi-export-backtest.json", import.meta.url), "utf8"));
assert.equal(data.observationCount, 12);
assert.equal(data.outOfSampleForecastCount, 11);
assert.ok(Math.abs(data.benchmarks.persistence.maePp - 5.0363636364) < 1e-8);
assert.ok(Math.abs(data.benchmarks.persistence.rmsePp - 7.0128453569) < 1e-8);
assert.ok(Math.abs(data.benchmarks.expandingMedian.maePp - 4.2) < 1e-8);
assert.ok(Math.abs(data.benchmarks.expandingMedian.rmsePp - 5.2325467465) < 1e-8);
for (const row of data.forecasts) {
  assert.ok(row.originPublished < row.targetPublished, "forecast origin must precede target release");
  assert.ok(row.originFy < row.targetFy, "forecast origin fiscal year must precede target");
}
assert.equal(data.forecasts.at(-1).expandingMedianForecastPct, 9.1);
assert.equal(data.forecasts.length, 11);
console.log("Backtest validation passed: release ordering, sample size, forecasts, MAE and RMSE.");

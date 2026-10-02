import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const panel = JSON.parse(await readFile(resolve("data/company-outcomes-panel.json"), "utf8"));
if (panel.observations.length !== 10) throw new Error("Expected 10 company-year observations in the initial panel.");
const companies = [...new Set(panel.observations.map((row) => row.company))];
if (companies.length !== 5) throw new Error("Expected five companies in the initial panel.");

for (const company of companies) {
  const rows = panel.observations.filter((row) => row.company === company);
  if (rows.length !== 2 || !rows.some((row) => row.fiscalYear === "FY2025") || !rows.some((row) => row.fiscalYear === "FY2026")) {
    throw new Error(`Expected FY2025 and FY2026 observations for ${company}.`);
  }
}

const keys = new Set();
for (const row of panel.observations) {
  const key = `${row.company}/${row.fiscalYear}`;
  if (keys.has(key)) throw new Error(`Duplicate observation: ${key}`);
  keys.add(key);
  if (!/^\d{4}-03-31$/.test(row.fiscalYearEnd)) throw new Error(`Invalid fiscal year end for ${key}.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.disclosedOn)) throw new Error(`Invalid disclosure date for ${key}.`);
  if (!Number.isFinite(row.ccRevenueGrowthPct)) throw new Error(`Missing constant-currency growth for ${key}.`);
  if (!Number.isFinite(row.operatingMarginPct) || row.operatingMarginPct <= 0 || row.operatingMarginPct >= 40) {
    throw new Error(`Invalid margin for ${key}.`);
  }
  if (!Number.isInteger(row.headcount) || row.headcount <= 0) throw new Error(`Invalid headcount for ${key}.`);
  if (!row.revenueScope || !row.marginBasis || !row.headcountBasis) throw new Error(`Missing metric scope for ${key}.`);
  if (!row.sources.length || row.sources.some((source) => !source.startsWith("https://"))) {
    throw new Error(`Missing primary source URL for ${key}.`);
  }
}

console.log("Company panel integrity passed: 10 sourced annual outcomes across five firms. No coefficients are fitted; sample is not yet a backtest.");

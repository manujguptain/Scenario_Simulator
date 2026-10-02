import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const panel = JSON.parse(await readFile(resolve("data/company-quarterly-outcomes.json"), "utf8"));
if (panel.observations.length !== 10) throw new Error("Expected ten quarterly observations.");
if (panel.quarterPairs.join("|") !== "Q1 FY2026|Q1 FY2027") throw new Error("Unexpected matched quarter pair.");

const companies = [...new Set(panel.observations.map((row) => row.company))];
if (companies.length !== 5) throw new Error("Expected five Indian IT services companies.");
const keys = new Set();

for (const company of companies) {
  const rows = panel.observations.filter((row) => row.company === company);
  if (rows.length !== 2 || !rows.some((row) => row.quarter === "Q1 FY2026") || !rows.some((row) => row.quarter === "Q1 FY2027")) {
    throw new Error(`Expected Q1 FY2026 and Q1 FY2027 observations for ${company}.`);
  }
}

for (const row of panel.observations) {
  const key = `${row.company}/${row.quarter}`;
  if (keys.has(key)) throw new Error(`Duplicate observation: ${key}`);
  keys.add(key);
  for (const field of ["periodEnd", "disclosedOn"]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row[field])) throw new Error(`Invalid ${field} date for ${key}.`);
  }
  if (!Number.isFinite(row.revenueGrowthYoYPct)) throw new Error(`Missing revenue growth for ${key}.`);
  if (!row.revenueGrowthBasis) throw new Error(`Missing revenue basis for ${key}.`);
  if (!Number.isFinite(row.operatingMarginPct) || row.operatingMarginPct <= 0 || row.operatingMarginPct >= 40) {
    throw new Error(`Invalid reported operating margin for ${key}.`);
  }
  for (const field of ["headcount", "utilizationPct"]) {
    if (row[field] != null && (!Number.isFinite(row[field]) || row[field] <= 0)) throw new Error(`Invalid ${field} for ${key}.`);
  }
  for (const field of ["headcountBasis", "utilizationBasis"]) {
    if (row[field] == null && row[field.replace("Basis", "")] != null) throw new Error(`Missing ${field} for ${key}.`);
  }
  if (!Array.isArray(row.sources) || row.sources.length === 0 || row.sources.some((url) => !url.startsWith("https://"))) {
    throw new Error(`Missing primary source links for ${key}.`);
  }
}

if (panel.backtestReadiness?.status !== "quarterly actuals panel only; no rolling score backtest or coefficient estimation") {
  throw new Error("Panel must explicitly state that it is not a score backtest or coefficient fit.");
}
if (!panel.backtestReadiness?.historicalSimulatorInputs || !panel.backtestReadiness?.historicalModelOutputs || !panel.backtestReadiness?.nextRequirement) {
  throw new Error("Missing point-in-time backtest readiness details.");
}

console.log("Quarterly panel integrity passed: 10 sourced outcomes across five firms; no historical score backtest or coefficient fit is claimed.");

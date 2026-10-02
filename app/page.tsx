"use client";

import { useEffect, useMemo, useState } from "react";

type Horizon = "short" | "medium" | "long";
type Mode = "build" | "one";
type CausalModel = { modelVersion?: string; edges: Array<{ source: string; target: string; weight: number }> };
type ExportBacktest = {
  target: string; scope: string; method: string; observationCount: number; outOfSampleForecastCount: number;
  horizonMonths: { min: number; mean: number; max: number };
  benchmarks: Record<string, { maePp: number; rmsePp: number; meanErrorPp: number }>;
  forecasts: Array<{ originFy: string; originPublished: string; targetFy: string; targetPublished: string; actualGrowthPct: number; persistenceForecastPct: number; expandingMedianForecastPct: number; targetSource: string }>;
  caveats: string[];
};

const modelHistory = [
  {
    date: "04 Aug 2026",
    version: "0.1",
    expansion: 34,
    compression: 52,
    mixed: 13,
    note: "Initial illustrative model snapshot.",
    changeType: "model release",
  },
  {
    date: "04 Sep 2026",
    version: "0.2",
    expansion: 36,
    compression: 51,
    mixed: 13,
    note: "Why it changed: H-1B and dependent-work uncertainty was mapped to delivery-location economics; AI adoption and reported job-risk signals to automation and work redesign; Japanese GCC expansion to client operating-model shift and India capability capture. The 34%→36% expansion change is a model-structure recalibration, not a claim that the industry itself improved.",
    changeType: "structural recalibration",
    updates: [
      { label: "H-1B and dependent-work uncertainty", effect: "Mixed / uncertain", detail: "Downward pressure on onsite mobility; potential upside if delivery moves to India, but downside if clients hire locally or insource." },
      { label: "AI adoption and job-risk signals", effect: "Mixed", detail: "Near-term negative pressure on routine work and hiring; longer-term upside only if Indian firms capture new AI and engineering work." },
      { label: "Japanese GCC expansion", effect: "Positive, confidence-weighted", detail: "Potential increase in India-based engineering and higher-value capability demand; scale and timing are still uncertain." },
    ],
  },
  {
    date: "02 Oct 2026",
    version: "0.3",
    expansion: 35,
    compression: 52,
    mixed: 13,
    note: "Why it changed: added FY26 RBI export calibration, separate AI-released capacity and hiring, and a lagged macro/FX overlay. The small score-share movement is an illustrative structural recalculation, not a measured sector forecast.",
    changeType: "evidence-linked recalibration",
    updates: [
      { label: "RBI software export survey", effect: "Positive, confidence-weighted", detail: "FY26 exports +8.2%; 91.7% off-site; US 54.1%. Historical anchors only; not a FY27 forecast or sector payroll proxy." },
      { label: "AI capacity and hiring", effect: "Mixed", detail: "Wipro reported capacity equivalent to 20,000 employees redeployed. Model capacity release separately from layoffs; do not extrapolate one company mechanically." },
      { label: "Macro, FX and policy", effect: "Mixed / uncertain", detail: "Oil above $100 and INR near ₹96.3 are near-term nowcast inputs; H-1B fee is blocked by two courts pending litigation. Apply lags and policy branches." },
      { label: "Global demand check", effect: "Positive, confidence-weighted", detail: "Accenture FY27 outlook is 3–6% local-currency growth with Q4 bookings +5% local currency; lower pricing in some areas still supports an AI productivity-to-price channel." },
      { label: "GCC and specialist capability", effect: "Positive, confidence-weighted", detail: "Japanese GCC expansion remains a long-run India capability signal; ANSR's GCC survey informs gross hiring and skill mix, not net sector employment." },
      { label: "TCS AI moves", effect: "Mixed / uncertain", detail: "MHP/Porsche remains conditional; HyperVault is phased infrastructure capacity. Neither is counted as immediate offshore services revenue or equivalent IT hiring." },
    ],
  },
  {
    date: "02 Oct 2026",
    version: "0.4",
    expansion: 35,
    compression: 52,
    mixed: 13,
    note: "Why it changed: added an expanding-window, publication-date backtest for one observable target—RBI software-export growth. This tests only the export-growth persistence assumption; it does not validate the three-way scenario weights or hiring coefficients.",
    changeType: "first backtest",
    updates: [
      { label: "RBI export-growth benchmark", effect: "Provisional", detail: "Eleven next-release forecasts: expanding-median MAE 4.20 pp / RMSE 5.23 pp versus persistence MAE 5.04 pp / RMSE 7.01 pp. Longer sample, but small and potentially affected by survey-method breaks; no fitted weights." },
      { label: "Scenario score language", effect: "Clarified", detail: "Expansion/compression/mixed shares are normalized model-score weights, not calibrated probabilities. No empirical class-probability test exists yet." },
    ],
  },
];

const inputs = [
  { id: "aiSpend", label: "Enterprise AI spending growth", short: "AI spend growth", unit: "% / year", min: 0, max: 30, step: 1, baseline: 14, observed: 16, note: "Global enterprise spend flowing into AI integration and transformation work." },
  { id: "adoption", label: "Enterprise AI adoption", short: "Enterprise adoption", unit: "% of firms", min: 10, max: 90, step: 1, baseline: 42, observed: 47, note: "Share of large enterprises moving beyond pilots into production use." },
  { id: "productivity", label: "AI productivity improvement", short: "Productivity lift", unit: "%", min: 0, max: 45, step: 1, baseline: 18, observed: 15, note: "Estimated output lift for teams with mature AI workflows." },
  { id: "pricing", label: "Client pricing pressure", short: "Pricing pressure", unit: "%", min: 0, max: 40, step: 1, baseline: 18, observed: 20, note: "Commercial pressure from automation, competition and outcome-based pricing." },
  { id: "reskilling", label: "Workforce reskilling rate", short: "Reskilling rate", unit: "% / year", min: 5, max: 75, step: 1, baseline: 28, observed: 25, note: "Share of the delivery workforce gaining practical AI capability each year." },
  { id: "capability", label: "Domain-skilled AI capability", short: "AI capability", unit: "% of workforce", min: 10, max: 80, step: 1, baseline: 34, observed: 31, note: "People who combine technical AI fluency with sector and client context." },
  { id: "gdp", label: "Global economic growth", short: "Global GDP growth", unit: "%", min: -2, max: 7, step: 0.5, baseline: 3.2, observed: 2.9, note: "Illustrative macro backdrop for discretionary technology spend." },
  { id: "insourcing", label: "Client operating-model shift", short: "Client model shift", unit: "index", min: 5, max: 50, step: 1, baseline: 22, observed: 23, note: "How quickly clients use GCCs, local hiring or insourcing rather than external delivery. Japanese GCC growth is evidence that can update this category." },
  { id: "h1bShock", label: "Delivery-location economics", short: "Delivery location", unit: "index", min: 0, max: 100, step: 1, baseline: 35, observed: 35, note: "Relative attractiveness of onsite, India-based and local delivery. H-1B and dependent-work rules are evidence that can update this category; the net effect is not automatic." },
  { id: "aiExposure", label: "Automation and work redesign", short: "Work redesign", unit: "% of work", min: 5, max: 20, step: 1, baseline: 10, observed: 10, note: "Routine work exposed to AI-related redesign. It captures short-term pressure, not a forecast of total job losses; longer-term role creation is reflected through capability capture." },
  { id: "japanGcc", label: "India capability capture", short: "Capability capture", unit: "index", min: 0, max: 100, step: 1, baseline: 55, observed: 55, note: "India’s ability to capture higher-value work in AI, engineering, embedded systems, robotics and industrial domains. Japanese GCC expansion is one evidence signal for this category." },
  { id: "exports", label: "Software-export demand growth", short: "Export growth", unit: "% / year", min: -5, max: 18, step: 0.1, baseline: 8.2, observed: 8.2, note: "FY2025–26 RBI survey growth (+8.2%) is used as a historical calibration anchor. The slider is a scenario assumption for forward demand, not a forecast." },
  { id: "capacityRelease", label: "Sector AI capacity released", short: "Capacity released", unit: "% of FTE", min: 0, max: 15, step: 1, baseline: 0, observed: 8, note: "Set to zero in the sector baseline because Wipro’s ~8% output-equivalent figure is company-specific and redeployed. Test 5–15% as a sector sensitivity; this is not a layoff rate." },
  { id: "oil", label: "Brent oil price", short: "Brent", unit: "$/barrel", min: 40, max: 150, step: 0.1, baseline: 102.6, observed: 102.6, note: "Near-term macro nowcast: Brent closed at $102.60 on 2 Oct 2026. Oil affects Indian cost/inflation and global demand with lags; it is not a long-run equilibrium assumption." },
  { id: "fx", label: "USD/INR spot", short: "USD/INR", unit: "₹ per $", min: 80, max: 110, step: 0.1, baseline: 96.3, observed: 96.3, note: "Near-term nowcast: ₹96.315/$ on 1 Oct 2026. A spot move changes reported INR translation only on net unhedged exposure; this slider is not a long-run FX forecast." },
  { id: "gccHiring", label: "GCC gross hiring momentum", short: "GCC gross hires", unit: "% / year", min: 0, max: 30, step: 1, baseline: 13, observed: 13, note: "ANSR's H1 2026 survey estimate of 12–15% hiring growth is rounded to 13% as a gross-hiring signal. It is not net GCC headcount growth or total IT employment." },
  { id: "usExportShock", label: "US software-export demand shock", short: "US export shock", unit: "% vs base", min: -15, max: 15, step: 0.5, baseline: 0, observed: 0, note: "Apply a separate shock only to the RBI survey's US destination share (54.1% of FY26 software-services exports). It does not shock all domestic or GCC revenue." },
  { id: "fedRate", label: "US federal funds target rate", short: "US policy rate", unit: "%", min: 0, max: 7, step: 0.25, baseline: 3.875, observed: 3.875, note: "Observed range midpoint after the 16 Sep 2026 increase to 3.75–4.00%. Future hikes are scenarios; rate transmission fades with horizon." },
] as const;

const baseline = Object.fromEntries(inputs.map((input) => [input.id, input.baseline])) as Record<string, number>;

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function signed(value: number, digits = 0) { return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}${digits ? " pts" : "%"}`; }

function simulate(values: Record<string, number>, horizon: Horizon, model?: CausalModel) {
  const edgeWeight = (source: string, target: string, fallback: number) => model?.edges.find((edge) => edge.source === source && edge.target === target)?.weight ?? fallback;
  const h = horizon === "short" ? 0.72 : horizon === "medium" ? 1 : 1.22;
  const macroPersistence = horizon === "short" ? 1 : horizon === "medium" ? 0.55 : 0.2;
  const exportDemand = (values.exports - 8.2) * edgeWeight("exports", "demand", 0.45) + values.usExportShock * 0.541 * edgeWeight("usExportShock", "demand", 0.45);
  const oilDrag = Math.max(0, values.oil - 80) * edgeWeight("oil", "demand", 0.035) * macroPersistence;
  const oilCostPressure = Math.max(0, values.oil - 80) * edgeWeight("oil", "costPressure", 0.025) * macroPersistence;
  const fedDrag = Math.max(0, values.fedRate - 3.5) * edgeWeight("fedRate", "demand", 0.35) * macroPersistence;
  const fxTranslation = (values.fx - 96.3) * edgeWeight("fx", "reportedRevenue", 0.025);
  const demand = clamp(40 + (values.aiSpend - 14) * edgeWeight("aiSpend", "integration", 1.35) + (values.adoption - 42) * edgeWeight("adoption", "integration", 0.48) + (values.gdp - 3.2) * 3.4 + exportDemand - oilDrag - fedDrag, 8, 92);
  const capacity = clamp(35 + (values.reskilling - 28) * edgeWeight("reskilling", "capacity", 0.7) + (values.capability - 34) * edgeWeight("capability", "capacity", 0.62) + (values.productivity - 18) * 0.25, 8, 92);
  const automation = clamp(26 + (values.adoption - 42) * 0.5 + (values.productivity - 18) * 0.86 - (values.reskilling - 28) * 0.16, 5, 88);
  const pressure = clamp(24 + (values.pricing - 18) * 0.92 + (values.productivity - 18) * 0.38 + (values.insourcing - 22) * 0.48 + oilCostPressure + fedDrag * 0.35, 5, 80);
  const integration = clamp(demand * 0.55 + capacity * 0.26 + values.aiSpend * 0.55, 12, 92);
  const captured = clamp(integration * 0.6 + capacity * 0.3 - pressure * 0.27 - values.insourcing * edgeWeight("insourcing", "captured", 0.18), 5, 90);
  const revenue = clamp((captured - 40) * 0.42 * h + (values.gdp - 2.5) * 1.4 + values.japanGcc * 0.025 - values.h1bShock * 0.012 - oilDrag * edgeWeight("oil", "revenue", 0.55) + (values.gccHiring - 13) * 0.025, -12, 24);
  const headcount = clamp(revenue * 0.8 + (values.reskilling - 28) * 0.12 - automation * 0.1 - values.aiExposure * 0.18 + values.japanGcc * 0.025 - values.capacityRelease * edgeWeight("capacityRelease", "headcountOutlook", 0.16) + (values.gccHiring - 13) * edgeWeight("gccHiring", "headcountOutlook", 0.09) + 2, -18, 18);
  const aiRoles = clamp(44 + capacity * 0.32 + values.adoption * 0.2 - pressure * 0.1 + values.japanGcc * 0.12, 20, 92);
  const traditionalRoles = clamp(62 - automation * 0.42 - pressure * 0.16 + values.gdp * 0.4 - values.aiExposure * 0.5 - values.h1bShock * 0.08, 8, 78);
  const expansion = clamp(42 + revenue * 1.65 + (capacity - pressure) * 0.2, 8, 88);
  const compression = clamp(41 - revenue * 1.15 + pressure * 0.42 - capacity * 0.16, 8, 82);
  const mixed = clamp(100 - expansion - compression, 6, 80);
  const total = expansion + compression + mixed;
  return { demand, capacity, automation, pressure, integration, captured, revenue, reportedRevenue: revenue + fxTranslation, fxTranslation, headcount, aiRoles, traditionalRoles, expansion: expansion / total * 100, compression: compression / total * 100, mixed: mixed / total * 100 };
}

function explain(changed: string, delta: number, result: ReturnType<typeof simulate>) {
  const direction = delta >= 0 ? "increased" : "decreased";
  const limiting = result.capacity < result.pressure ? "domain-skilled AI capability" : "client pricing pressure";
  return `The ${changed.toLowerCase()} ${direction}, shifting the model through AI-integration demand and delivery capacity. The largest limiting factor remains ${limiting}. Effects are model-based estimates, not fixed predictions.`;
}

export default function Home() {
  const [model, setModel] = useState<CausalModel | undefined>();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [backtest, setBacktest] = useState<ExportBacktest | null>(null);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/generated/causal-models.json`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Model unavailable")))
      .then((data: CausalModel) => { setModel(data); setModelLoaded(true); })
      .catch(() => setModelLoaded(false));
    fetch(`${import.meta.env.BASE_URL}data/generated/rbi-export-backtest.json`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Backtest unavailable")))
      .then((data: ExportBacktest) => setBacktest(data))
      .catch(() => setBacktest(null));
  }, []);
  const [values, setValues] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return baseline;
    const encoded = new URLSearchParams(window.location.search).get("s");
    if (!encoded) return baseline;
    try { return { ...baseline, ...JSON.parse(atob(encoded)) }; } catch { return baseline; }
  });
  const [horizon, setHorizon] = useState<Horizon>("medium");
  const [mode, setMode] = useState<Mode>("build");
  const [focus, setFocus] = useState("reskilling");
  const [scenarioName, setScenarioName] = useState("Untitled scenario");
  const [saved, setSaved] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("scenario-simulator-saved") ?? "[]"); } catch { return []; }
  });
  const base = useMemo(() => simulate(baseline, horizon, model), [horizon, model]);
  const result = useMemo(() => simulate(values, horizon, model), [values, horizon, model]);
  const changedInput = inputs.find((input) => values[input.id] !== baseline[input.id]);
  const sensitivity = useMemo(() => inputs.map((input) => {
    const changed = { ...baseline, [input.id]: clamp(baseline[input.id] + input.step * 3, input.min, input.max) };
    const impact = simulate(changed, horizon, model).expansion - base.expansion;
    return { ...input, impact };
  }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)), [base.expansion, horizon, model]);

  function updateValue(id: string, value: number) { setValues((current) => ({ ...current, [id]: value })); }
  function reset() { setValues({ ...baseline }); }
  function saveScenario() {
    const next = [...saved.filter((item) => item !== scenarioName), scenarioName];
    setSaved(next); localStorage.setItem("scenario-simulator-saved", JSON.stringify(next));
  }
  function share() {
    const url = `${window.location.origin}${window.location.pathname}?s=${btoa(JSON.stringify(values))}`;
    navigator.clipboard?.writeText(url); window.history.replaceState({}, "", `?s=${btoa(JSON.stringify(values))}`);
  }
  function exportScenario() {
    const blob = new Blob([JSON.stringify({ scenarioName, horizon, geography: "India", inputs: values, modelVersion: "evidence-linked-0.4" }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${scenarioName.replace(/\s+/g, "-").toLowerCase()}.json`; link.click(); URL.revokeObjectURL(link.href);
  }
  async function importScenario(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as { inputs?: Record<string, number>; horizon?: Horizon; scenarioName?: string };
      if (!imported.inputs) throw new Error("Inputs are missing");
      setValues({ ...baseline, ...imported.inputs });
      if (imported.horizon && ["short", "medium", "long"].includes(imported.horizon)) setHorizon(imported.horizon);
      if (imported.scenarioName) setScenarioName(imported.scenarioName);
    } catch {
      window.alert("That file is not a valid Scenario Simulator JSON export.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="shell">
      <section className="site-heading" aria-labelledby="site-title">
        <p className="site-kicker">Future Scenario Mapping — 2026 Edition</p>
        <h1 id="site-title">Indian IT Scenario Simulator</h1>
        <p>This tool does not predict one fixed future. It shows how plausible outcomes change when evidence or assumptions change.</p>
        <span className="model-status">Current model status: Evidence-linked model v0.4 · export submodel benchmarked; other coefficients not statistically calibrated{modelLoaded ? " · model loaded" : ""}</span>
        <label className="file-button">Import JSON<input type="file" accept="application/json,.json" onChange={importScenario} /></label>
      </section>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">↗</span><span>SCENARIO <b>SIMULATOR</b></span></div>
        <div className="topbar-right"><span className="live-dot" /> Browser-only model <span className="divider" /> <span className="version">MODEL 0.4 · BACKTESTED EXPORT SUBMODEL</span></div>
      </header>

      <section className="intro">
        <div><p className="eyebrow">INDIA · TECHNOLOGY SERVICES · EVIDENCE-LINKED BASELINE</p><h1>What changes when<br /><em>the assumptions change?</em></h1><p className="dek">Explore how demand, AI productivity, pricing, hiring, delivery location and macro conditions shape plausible Indian IT outcomes — one causal path at a time.</p></div>
        <div className="intro-note"><span className="note-icon">◎</span><div><b>Not a fixed prediction</b><p>This tool shows how plausible outcomes move when evidence or user assumptions change.</p></div></div>
      </section>

      <div className="toolbar"><div className="tabs"><button className={mode === "build" ? "active" : ""} onClick={() => setMode("build")}>Build your scenario</button><button className={mode === "one" ? "active" : ""} onClick={() => setMode("one")}>Change one factor</button></div><div className="horizon"><span>HORIZON</span>{(["short", "medium", "long"] as Horizon[]).map((item) => <button key={item} className={horizon === item ? "selected" : ""} onClick={() => setHorizon(item)}>{item === "short" ? "0–3 yrs" : item === "medium" ? "3–7 yrs" : "7–15 yrs"}</button>)}</div></div>

      <section className="workspace">
        <div className="map-panel panel"><div className="panel-head"><div><p className="eyebrow">IMPACT PATH · {horizon === "short" ? "SHORT TERM" : horizon === "medium" ? "MEDIUM TERM" : "LONG TERM"}</p><h2>Indian IT transition map</h2></div><span className="status-pill"><span className="live-dot" /> recalculates live</span></div>
          <div className="map-intro">A transparent weighted causal model. Brighter paths show where your assumptions are moving the evidence-based baseline.</div>
          <div className="causal-map">
            <div className="map-column inputs-col"><span className="column-label">ASSUMPTIONS</span>{inputs.slice(0, 4).map((input) => <button title={input.note} className={`map-node input-node ${values[input.id] !== baseline[input.id] ? "changed" : ""}`} key={input.id} onClick={() => { setFocus(input.id); setMode("one"); }}><span className="node-dot" /><span>{input.short}</span><b>{values[input.id]}{input.id === "gdp" ? "%" : "%"}</b></button>)}</div>
            <div className="map-column middle-col"><span className="column-label">TRANSMISSION</span>{["AI integration demand", "Delivery capacity", "Revenue captured", "Work automated"].map((label, index) => <div className={`map-node middle-node ${index < 3 && changedInput ? "lit" : ""}`} key={label}><span className="node-dot" /><span>{label}</span><b>{Math.round([result.integration, result.capacity, result.captured, result.automation][index])}%</b></div>)}</div>
            <div className="map-column outputs-col"><span className="column-label">OUTCOMES</span>{[["Illustrative CC revenue score", `${result.revenue >= 0 ? "+" : "−"}${Math.abs(result.revenue).toFixed(1)} pts`], ["AI-role demand", `${Math.round(result.aiRoles)}/100`], ["Hiring outlook score", `${result.headcount >= 0 ? "+" : "−"}${Math.abs(result.headcount).toFixed(1)} pts`], ["Traditional-role demand", `${Math.round(result.traditionalRoles)}/100`]].map(([label, value]) => <div className="map-node output-node" key={label}><span className="node-dot" /><span>{label}</span><b>{value}</b></div>)}</div>
            <div className="map-arrows"><span>→</span><span>→</span><span>→</span><span>→</span></div>
          </div>
          <div className="map-legend"><span><i className="legend-line strong" /> stronger influence</span><span><i className="legend-line dashed" /> lower confidence</span><span>↑ improving</span><span>↓ pressured</span></div>
        </div>

        <aside className="controls panel"><div className="panel-head"><div><p className="eyebrow">USER ASSUMPTIONS</p><h2>{mode === "one" ? "One factor mode" : "Tune the model"}</h2></div><button className="reset" onClick={reset}>↺ Reset baseline</button></div>{mode === "one" && <div className="one-mode"><b>Only one factor is unlocked.</b><span>Change a single input to isolate its direct and indirect effects.</span><select value={focus} onChange={(event) => setFocus(event.target.value)}>{inputs.map((input) => <option key={input.id} value={input.id}>{input.label}</option>)}</select></div>}<div className="assumptions-list">{inputs.map((input) => <label title={input.note} className={`assumption ${mode === "one" && input.id !== focus ? "locked" : ""}`} key={input.id}><div className="assumption-top"><span>{input.label}</span><b>{values[input.id]}<small>{input.unit}</small></b></div><input aria-label={input.label} type="range" min={input.min} max={input.max} step={input.step} value={values[input.id]} disabled={mode === "one" && input.id !== focus} onChange={(event) => updateValue(input.id, Number(event.target.value))} /><div className="range-meta"><span>min {input.min}</span><span className="baseline-mark">baseline {input.baseline}</span><span>max {input.max}</span></div></label>)}</div></aside>
      </section>

      <section className="lower-grid"><div className="forecast panel"><div className="panel-head"><div><p className="eyebrow">ILLUSTRATIVE SCENARIO SCORE MIX</p><h2>Baseline versus modified</h2></div><span className="confidence">Weights · not calibrated probabilities</span></div><div className="forecast-row"><div className="probability"><div className="prob-label"><span>Expansion score</span><b>{Math.round(result.expansion)}% <small>{signed(result.expansion - base.expansion, 0)}</small></b></div><div className="bar"><i style={{ width: `${base.expansion}%` }} /><strong style={{ width: `${result.expansion}%` }} /></div><div className="bar-labels"><span>baseline {Math.round(base.expansion)}%</span><span>modified {Math.round(result.expansion)}%</span></div></div><div className="probability"><div className="prob-label"><span>Compression score</span><b>{Math.round(result.compression)}% <small className="negative">{signed(result.compression - base.compression, 0)}</small></b></div><div className="bar warm"><i style={{ width: `${base.compression}%` }} /><strong style={{ width: `${result.compression}%` }} /></div><div className="bar-labels"><span>baseline {Math.round(base.compression)}%</span><span>modified {Math.round(result.compression)}%</span></div></div><div className="probability"><div className="prob-label"><span>Mixed score</span><b>{Math.round(result.mixed)}% <small>{signed(result.mixed - base.mixed, 0)}</small></b></div><div className="bar neutral"><i style={{ width: `${base.mixed}%` }} /><strong style={{ width: `${result.mixed}%` }} /></div><div className="bar-labels"><span>baseline {Math.round(base.mixed)}%</span><span>modified {Math.round(result.mixed)}%</span></div></div></div><div className="outlook"><span className="outlook-icon">↗</span><div><b>{result.revenue >= base.revenue ? "Expansion score rises" : "Compression score rises"}</b><p>{explain(changedInput?.label ?? "selected assumptions", changedInput ? values[changedInput.id] - baseline[changedInput.id] : 0, result)}</p></div></div></div>
        <div className="impact panel"><div className="panel-head"><div><p className="eyebrow">IMPACT PANEL</p><h2>What moved downstream</h2></div><span className="tag">{horizon === "medium" ? "lag-aware" : "horizon-adjusted"}</span></div><div className="impact-list"><div><span className="impact-icon up">↑</span><div><b>AI-role demand</b><p>Domain-skilled roles and integration work</p></div><strong>{signed(result.aiRoles - base.aiRoles, 1)}</strong></div><div><span className="impact-icon up">↑</span><div><b>Revenue opportunity</b><p>Captured value after delivery capacity</p></div><strong>{signed(result.captured - base.captured, 1)}</strong></div><div><span className="impact-icon down">↓</span><div><b>Traditional-role demand</b><p>Routine work exposed to redesign, not job losses</p></div><strong>{signed(result.traditionalRoles - base.traditionalRoles, 1)}</strong></div><div><span className="impact-icon lag">◌</span><div><b>Hiring outlook</b><p>Growth follows demand after redeployment and capacity absorption</p></div><strong>{signed(result.headcount - base.headcount, 1)}</strong></div><div><span className="impact-icon lag">₹</span><div><b>FX translation</b><p>Reported INR revenue only; constant-currency demand is unchanged</p></div><strong>{signed(result.fxTranslation - base.fxTranslation, 1)}</strong></div></div><div className="assumption-callout"><span>i</span><p>Largest sensitivity: <b>{sensitivity[0].short}</b> · each configured step moves the expansion score by {Math.abs(sensitivity[0].impact).toFixed(1)} pts.</p></div></div></section>

      <section className="bottom-grid"><div className="sensitivity panel"><div className="panel-head"><div><p className="eyebrow">SENSITIVITY RANKING</p><h2>Which assumptions matter most?</h2></div><span className="help">local · one-step impact</span></div>{sensitivity.slice(0, 5).map((item) => <div className="sensitivity-row" key={item.id}><span>{item.short}</span><div className="sensitivity-track"><i className={item.impact >= 0 ? "positive" : "negative-bar"} style={{ width: `${Math.min(100, Math.abs(item.impact) * 12)}%` }} /></div><b>{item.impact >= 0 ? "+" : "−"}{Math.abs(item.impact).toFixed(1)} pts</b></div>)}</div><div className="scenario panel"><div className="panel-head"><div><p className="eyebrow">SCENARIO WORKSPACE</p><h2>Save, compare, share</h2></div><span className="saved-count">{saved.length} saved locally</span></div><input className="scenario-name" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} aria-label="Scenario name" /><div className="scenario-actions"><button onClick={saveScenario}>＋ Save scenario</button><button onClick={share}>↗ Copy share link</button><button onClick={exportScenario}>↓ Export JSON</button></div><div className="model-note"><b>Model transparency</b><p>Evidence-linked causal model · illustrative coefficients · version 0.4. Export-growth persistence has an initial, small-sample benchmark; the scenario-score weights and hiring/margin equations remain uncalibrated. Recalibrated 02 Oct 2026.</p></div></div></section>

      <details className="methodology panel"><summary>How the update changes the model mathematically</summary><div className="formula-grid"><article><b>Demand and export exposure</b><code>Demand index += 0.45 × (export growth − 8.2%) + 0.45 × US shock × 54.1% − oil drag − Fed-rate drag</code><p>8.2% and the 54.1% US share are FY26 RBI historical anchors. The US shock applies only to that export-series exposure. Oil/rate effects fade by horizon; the $80 oil reference is an illustrative threshold, not a forecast.</p></article><article><b>Capacity, productivity and hiring</b><code>Hiring score = 0.80 × CC revenue score − 0.16 × AI capacity release + 0.09 × (GCC gross hiring − 13%) + skill / routine-work terms</code><p>Wipro’s ~8% output-equivalent figure is a company-specific scenario sensitivity. The sector baseline remains zero released capacity until comparable evidence exists; released capacity reduces hiring pressure, not headcount one-for-one.</p></article><article><b>Price capture</b><code>Captured-value score = integration × 0.60 + capacity × 0.30 − pricing pressure × 0.27 − client model shift × 0.18</code><p>AI can create implementation work and release capacity while clients capture savings through lower prices. The current engine separates demand/capture scores; it does not claim an empirically estimated price elasticity or labour-hours series.</p></article><article><b>Macro and currency</b><code>Reported INR revenue score = constant-currency revenue score + 0.025 × (USD/INR − 96.3)</code><p>FX changes reported INR translation only, not constant-currency demand. The multiplier is an illustrative net-exposure proxy; actual hedge coverage, foreign costs and margin effects require company disclosures.</p></article><article><b>Scenario-score mix</b><code>Expansion / compression / mixed = normalized bounded model scores</code><p>These percentages are score shares, not probabilities. Oil and Fed rates add a separate cost-pressure term; H‑1B litigation changes a policy branch, not demand automatically. Only the RBI export-growth persistence submodel has an initial benchmark. The scenario-score mix, hiring and margin equations remain uncalibrated.</p></article></div></details>

      <section className="backtest panel"><div className="panel-head"><div><p className="eyebrow">EMPIRICAL CHECK · EXPANDING WINDOW</p><h2>RBI export-growth backtest</h2></div><span className="help">one submodel only</span></div>{backtest ? <><p className="observed-copy">Target: {backtest.target}. At each RBI release, compare two no-fit baselines for the next published growth rate. The latest 8.2% is still a historical anchor in the simulator; this test does not calibrate the wider scenario model.</p><div className="backtest-metrics"><article><span>EXPANDING MEDIAN · MAE</span><b>{backtest.benchmarks.expandingMedian.maePp.toFixed(2)} pp</b><small>RMSE {backtest.benchmarks.expandingMedian.rmsePp.toFixed(2)} pp</small></article><article><span>PERSISTENCE · MAE</span><b>{backtest.benchmarks.persistence.maePp.toFixed(2)} pp</b><small>RMSE {backtest.benchmarks.persistence.rmsePp.toFixed(2)} pp</small></article><article><span>TEST SAMPLE</span><b>{backtest.outOfSampleForecastCount} forecasts</b><small>{backtest.observationCount} RBI releases · no fitted weights</small></article></div><div className="backtest-table-wrap"><table className="backtest-table"><thead><tr><th>Origin release</th><th>Target release</th><th>Actual</th><th>Persistence</th><th>Expanding median</th><th>Source</th></tr></thead><tbody>{backtest.forecasts.map((row) => <tr key={row.targetFy}><td>{row.originFy}<small>{row.originPublished}</small></td><td>{row.targetFy}<small>{row.targetPublished}</small></td><td>{row.actualGrowthPct.toFixed(1)}%</td><td>{row.persistenceForecastPct.toFixed(1)}%</td><td>{row.expandingMedianForecastPct.toFixed(2)}%</td><td><a href={row.targetSource} target="_blank" rel="noreferrer">RBI ↗</a></td></tr>)}</tbody></table></div><p className="observed-note"><b>Read this cautiously:</b> the expanding median has lower error in this tiny sample (MAE {backtest.benchmarks.expandingMedian.maePp.toFixed(2)} vs {backtest.benchmarks.persistence.maePp.toFixed(2)} pp), but only seven test origins mean this is descriptive—not proof it is superior or a reason to change the baseline. Release gaps vary from {backtest.horizonMonths.min.toFixed(1)} to {backtest.horizonMonths.max.toFixed(1)} months (average {backtest.horizonMonths.mean.toFixed(1)}), so this is not a fixed 12-month-ahead test.</p><details className="backtest-notes"><summary>Method, scope and limits</summary><p>{backtest.method}</p><ul>{backtest.caveats.map((item) => <li key={item}>{item}</li>)}</ul><a href="https://www.rbi.org.in/scripts/Pr_DataRelease.aspx?SectionID=364" target="_blank" rel="noreferrer">RBI survey release archive ↗</a></details></> : <p className="observed-copy">Backtest data could not be loaded. The model’s scenario scores remain illustrative.</p>}</section>

      <section className="observed panel"><div className="panel-head"><div><p className="eyebrow">EVIDENCE REGISTER · AS OF 02 OCT 2026</p><h2>What is observed, and what remains uncertain</h2></div><span className="help">inputs have dates and scope</span></div><p className="observed-copy">Confirmed historical data anchor the update. Company statements, surveys, market observations and legal actions retain their original scope; none is silently converted into a whole-sector forecast.</p><div className="observed-grid"><article><span className="source-tag official">RBI · HISTORICAL ANCHOR</span><h3>FY2025–26 software exports</h3><strong>$221.4bn · +8.2% YoY</strong><p>91.7% delivered off-site; US share 54.1%, Europe 31.8%. Use only for the RBI software-services series and matching backtest definitions.</p><a href="https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63625" target="_blank" rel="noreferrer">RBI survey and tables ↗</a></article><article><span className="source-tag">COMPANY STATEMENT · AI CAPACITY</span><h3>Wipro productivity</h3><strong>~20,000 FTE-equivalent output</strong><p>CTO said capacity was redeployed within Wipro. This is not 20,000 layoffs and not a sector-wide productivity estimate.</p><a href="https://www.reuters.com/world/india/wipros-ai-push-frees-capacity-equivalent-20000-workers-cto-says-2026-09-10/" target="_blank" rel="noreferrer">Reuters, 10 Sep 2026 ↗</a></article><article><span className="source-tag">INDUSTRY SURVEY · GCC GROSS HIRING</span><h3>GCC skill mix</h3><strong>12–15% hiring growth estimate</strong><p>ANSR’s H1 survey also finds AI skills in roughly 65% of new roles. These are hiring and role-mix signals, not net workforce growth.</p><a href="https://ansr.com/ebooks/gcc-talent-trends-india-2026/" target="_blank" rel="noreferrer">ANSR report ↗</a></article><article><span className="source-tag">GLOBAL PEER · DEMAND CHECK</span><h3>Accenture FY27 outlook</h3><strong>3–6% local-currency growth</strong><p>Q4 bookings rose 5% in local currency. Supports continued services demand, but is not Indian vendor guidance; company pricing and AI productivity still affect revenue per unit.</p><a href="https://newsroom.accenture.com/content/4q-full-fy26-earnings/accenture-reports-fourth-quarter-and-full-year-fiscal-2026-results.pdf" target="_blank" rel="noreferrer">Accenture results, 1 Oct 2026 ↗</a></article><article><span className="source-tag">MACRO NOWCAST · 01–02 OCT</span><h3>Oil, rupee and rates</h3><strong>Brent $102.60 · USD/INR ₹96.315</strong><p>Near-term market observations only; the Fed target range is 3.75–4.00%. Oil duration, inflation pass-through, hedging and client-budget effects remain uncertain.</p><a href="https://www.reuters.com/business/energy/oil-rises-slightly-market-weighs-mixed-supply-signals-2026-10-02/" target="_blank" rel="noreferrer">Reuters Brent close, 2 Oct ↗</a> <a href="https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm" target="_blank" rel="noreferrer">Federal Reserve, 16 Sep ↗</a> <a href="https://www.reuters.com/world/india/rupee-weaken-oil-us-yields-weigh-fading-fed-hike-bets-offer-no-relief-2026-10-01/" target="_blank" rel="noreferrer">Reuters USD/INR, 1 Oct ↗</a></article><article><span className="source-tag">POLICY · LITIGATION PENDING</span><h3>H‑1B $100,000 fee</h3><strong>Blocked by two federal judges</strong><p>Current baseline treats the new fee as not in force while injunctions operate. Appeal, reversal or a separately completed rulemaking remain explicit policy branches.</p><a href="https://www.reuters.com/legal/government/second-judge-blocks-trumps-100000-fee-new-h-1b-worker-visas-2026-10-01/" target="_blank" rel="noreferrer">Reuters, 1 Oct 2026 ↗</a></article><article><span className="source-tag">TCS · CONDITIONAL / PHASED</span><h3>AI consulting and compute</h3><strong>MHP/Porsche deal + up-to-1 GW campus</strong><p>Consulting acquisition remains subject to approval; HyperVault build is phased to customer demand. Both are company-specific strategic options, not present-day sector hiring or services revenue.</p><a href="https://www.tcs.com/who-we-are/newsroom/press-release/tcs-porsche-ag-partner-accelerate-future-of-ai-powered-mobility" target="_blank" rel="noreferrer">TCS–Porsche, 24 Aug ↗</a> <a href="https://www.tcs.com/who-we-are/newsroom/press-release/tcs-hypervault-establish-large-scale-ai-data-center-campus-telangana" target="_blank" rel="noreferrer">TCS HyperVault, 5 Sep ↗</a></article><article><span className="source-tag">GCC · DIRECTIONAL</span><h3>Japanese GCC expansion</h3><strong>Positive capability signal</strong><p>Retained from the prior release as a confidence-weighted India engineering and higher-value work driver. Scale, timing and whether activity is additive to or substitutes for outsourced services remain uncertain.</p><a href="https://manujg.com/notes/indian-it-h1b-ai-japanese-gccs/" target="_blank" rel="noreferrer">Prior evidence note ↗</a></article></div><p className="observed-note"><b>Next model check:</b> Indian Q2 FY27 results and company guidance were not yet reported in this 2 Oct release. Treat broker previews as forecasts and add actuals only when published. TCS was scheduled to report on 8 Oct. No monthly all-India IT revenue or employment series is inferred from partial company data.</p></section>

      <section className="trend panel"><div className="panel-head"><div><p className="eyebrow">MODEL HISTORY</p><h2>Published score-mix history</h2></div><span className="help">released baselines · not actuals</span></div><p className="trend-copy">This records the model’s normalized score shares at each release. These are not calibrated probabilities and do not change when a visitor adjusts a scenario. The 0.4 backtest added empirical evidence for one export-growth benchmark only.</p><div className="trend-chart"><svg viewBox="0 0 720 190" preserveAspectRatio="none"><line x1="45" y1="20" x2="45" y2="155" /><line x1="45" y1="155" x2="690" y2="155" /><polyline className="expansion-line" points="70,109 265,106 455,108 650,108" /><polyline className="compression-line" points="70,85 265,86 455,85 650,85" /><polyline className="mixed-line" points="70,137 265,137 455,137 650,137" />{[70,265,455,650].map((x, i) => <g key={x}><circle className="expansion-point" cx={x} cy={[109,106,108,108][i]} r="5" /><circle className="compression-point" cx={x} cy={[85,86,85,85][i]} r="5" /><circle className="mixed-point" cx={x} cy="137" r="5" /></g>)}</svg><div className="trend-labels"><span><i className="trend-key expansion-key" />Expansion score <b>34% → 36% → 35% → 35%</b></span><span><i className="trend-key compression-key" />Compression score <b>52% → 51% → 52% → 52%</b></span><span><i className="trend-key mixed-key" />Mixed score <b>13% → 13% → 13% → 13%</b></span></div></div><div className="release-list">{modelHistory.map((release) => <div key={release.version}><b>{release.date} · v{release.version}</b><span><em>{release.changeType}</em> · {release.note}</span>{release.updates && <ul className="release-updates">{release.updates.map((update) => <li key={update.label}><b>{update.label}</b><em className={`effect effect-${update.effect.startsWith("Positive") ? "positive" : update.effect.startsWith("Mixed") ? "mixed" : "uncertain"}`}>{update.effect}</em><span>{update.detail}</span></li>)}</ul>}<strong>Expansion score {release.expansion}% · Compression score {release.compression}% · Mixed score {release.mixed}%</strong></div>)}</div></section>

      <footer><span>SCENARIO SIMULATOR · INDIAN IT</span><span>Illustrative coefficients, not empirically validated. <button>View methodology ↗</button></span></footer>
    </main>
  );
}

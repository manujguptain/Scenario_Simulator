"use client";

import { useEffect, useMemo, useState } from "react";

type Horizon = "short" | "medium" | "long";
type Mode = "build" | "one";
type CausalModel = { edges: Array<{ source: string; target: string; weight: number }> };

const modelHistory = [
  { date: "04 Aug 2026", version: "0.1", gdp: 6.1, it: 7.0, note: "Initial illustrative baseline" },
  { date: "04 Sep 2026", version: "0.2", gdp: 6.2, it: 7.4, note: "Added H-1B, AI employment risk and Japanese GCC signals" },
];

const inputs = [
  { id: "aiSpend", label: "Enterprise AI spending growth", short: "AI spend growth", unit: "% / year", min: 0, max: 30, step: 1, baseline: 14, observed: 16, note: "Global enterprise spend flowing into AI integration and transformation work." },
  { id: "adoption", label: "Enterprise AI adoption", short: "Enterprise adoption", unit: "% of firms", min: 10, max: 90, step: 1, baseline: 42, observed: 47, note: "Share of large enterprises moving beyond pilots into production use." },
  { id: "productivity", label: "AI productivity improvement", short: "Productivity lift", unit: "%", min: 0, max: 45, step: 1, baseline: 18, observed: 15, note: "Estimated output lift for teams with mature AI workflows." },
  { id: "pricing", label: "Client pricing pressure", short: "Pricing pressure", unit: "%", min: 0, max: 40, step: 1, baseline: 18, observed: 20, note: "Commercial pressure from automation, competition and outcome-based pricing." },
  { id: "reskilling", label: "Workforce reskilling rate", short: "Reskilling rate", unit: "% / year", min: 5, max: 75, step: 1, baseline: 28, observed: 25, note: "Share of the delivery workforce gaining practical AI capability each year." },
  { id: "capability", label: "Domain-skilled AI capability", short: "AI capability", unit: "% of workforce", min: 10, max: 80, step: 1, baseline: 34, observed: 31, note: "People who combine technical AI fluency with sector and client context." },
  { id: "gdp", label: "Global economic growth", short: "Global GDP growth", unit: "%", min: -2, max: 7, step: 0.5, baseline: 3.2, observed: 2.9, note: "Illustrative macro backdrop for discretionary technology spend." },
  { id: "insourcing", label: "Client insourcing rate", short: "Client insourcing", unit: "%", min: 5, max: 50, step: 1, baseline: 22, observed: 23, note: "Share of work clients choose to bring in-house as capabilities mature." },
  { id: "h1bShock", label: "H-1B policy shock", short: "H-1B shock", unit: "index", min: 0, max: 100, step: 1, baseline: 35, observed: 35, note: "Likelihood and intensity of higher visa costs or restrictions. This is a scenario input, not a confirmed policy outcome." },
  { id: "aiExposure", label: "Routine work AI exposure", short: "AI job exposure", unit: "% of work", min: 5, max: 20, step: 1, baseline: 10, observed: 10, note: "Bounded estimate of routine work exposed to AI-related redesign. It is not a forecast of total job losses." },
  { id: "japanGcc", label: "Japanese GCC expansion", short: "Japanese GCCs", unit: "index", min: 0, max: 100, step: 1, baseline: 55, observed: 55, note: "Strength of the Japanese GCC expansion signal in India, including engineering and digital work." },
] as const;

const baseline = Object.fromEntries(inputs.map((input) => [input.id, input.baseline])) as Record<string, number>;

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function signed(value: number, digits = 0) { return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}${digits ? " pts" : "%"}`; }

function simulate(values: Record<string, number>, horizon: Horizon, model?: CausalModel) {
  const edgeWeight = (source: string, target: string, fallback: number) => model?.edges.find((edge) => edge.source === source && edge.target === target)?.weight ?? fallback;
  const h = horizon === "short" ? 0.72 : horizon === "medium" ? 1 : 1.22;
  const demand = clamp(40 + (values.aiSpend - 14) * edgeWeight("aiSpend", "integration", 1.35) + (values.adoption - 42) * edgeWeight("adoption", "integration", 0.48) + (values.gdp - 3.2) * 3.4, 8, 92);
  const capacity = clamp(35 + (values.reskilling - 28) * edgeWeight("reskilling", "capacity", 0.7) + (values.capability - 34) * edgeWeight("capability", "capacity", 0.62) + (values.productivity - 18) * 0.25, 8, 92);
  const automation = clamp(26 + (values.adoption - 42) * 0.5 + (values.productivity - 18) * 0.86 - (values.reskilling - 28) * 0.16, 5, 88);
  const pressure = clamp(24 + (values.pricing - 18) * 0.92 + (values.productivity - 18) * 0.38 + (values.insourcing - 22) * 0.48, 5, 80);
  const integration = clamp(demand * 0.55 + capacity * 0.26 + values.aiSpend * 0.55, 12, 92);
  const captured = clamp(integration * 0.6 + capacity * 0.3 - pressure * 0.27 - values.insourcing * edgeWeight("insourcing", "captured", 0.18), 5, 90);
  const revenue = clamp((captured - 40) * 0.42 * h + (values.gdp - 2.5) * 1.4 + values.japanGcc * 0.025 - values.h1bShock * 0.012, -12, 24);
  const headcount = clamp(revenue * 0.8 + (values.reskilling - 28) * 0.12 - automation * 0.1 - values.aiExposure * 0.18 + values.japanGcc * 0.025 + 2, -18, 18);
  const aiRoles = clamp(44 + capacity * 0.32 + values.adoption * 0.2 - pressure * 0.1 + values.japanGcc * 0.12, 20, 92);
  const traditionalRoles = clamp(62 - automation * 0.42 - pressure * 0.16 + values.gdp * 0.4 - values.aiExposure * 0.5 - values.h1bShock * 0.08, 8, 78);
  const expansion = clamp(42 + revenue * 1.65 + (capacity - pressure) * 0.2, 8, 88);
  const compression = clamp(41 - revenue * 1.15 + pressure * 0.42 - capacity * 0.16, 8, 82);
  const mixed = clamp(100 - expansion - compression, 6, 80);
  const total = expansion + compression + mixed;
  return { demand, capacity, automation, pressure, integration, captured, revenue, headcount, aiRoles, traditionalRoles, expansion: expansion / total * 100, compression: compression / total * 100, mixed: mixed / total * 100 };
}

function explain(changed: string, delta: number, result: ReturnType<typeof simulate>) {
  const direction = delta >= 0 ? "increased" : "decreased";
  const limiting = result.capacity < result.pressure ? "domain-skilled AI capability" : "client pricing pressure";
  return `The ${changed.toLowerCase()} ${direction}, shifting the model through AI-integration demand and delivery capacity. The largest limiting factor remains ${limiting}. Effects are model-based estimates, not fixed predictions.`;
}

export default function Home() {
  const [model, setModel] = useState<CausalModel | undefined>();
  const [modelLoaded, setModelLoaded] = useState(false);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/generated/causal-models.json`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Model unavailable")))
      .then((data: CausalModel) => { setModel(data); setModelLoaded(true); })
      .catch(() => setModelLoaded(false));
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
    const blob = new Blob([JSON.stringify({ scenarioName, horizon, geography: "India", inputs: values, modelVersion: "illustrative-0.1" }, null, 2)], { type: "application/json" });
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
        <span className="model-status">Current model status: Demonstration model using illustrative coefficients{modelLoaded ? " · model loaded" : ""}</span>
        <label className="file-button">Import JSON<input type="file" accept="application/json,.json" onChange={importScenario} /></label>
      </section>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">↗</span><span>SCENARIO <b>SIMULATOR</b></span></div>
        <div className="topbar-right"><span className="live-dot" /> Browser-only model <span className="divider" /> <span className="version">MODEL 0.1 · ILLUSTRATIVE</span></div>
      </header>

      <section className="intro">
        <div><p className="eyebrow">INDIA · TECHNOLOGY SERVICES · EVIDENCE-BASED BASELINE</p><h1>What changes when<br /><em>the assumptions change?</em></h1><p className="dek">Explore how AI adoption, capability and macro conditions shape plausible outcomes for Indian IT — one causal path at a time.</p></div>
        <div className="intro-note"><span className="note-icon">◎</span><div><b>Not a fixed prediction</b><p>This tool shows how plausible outcomes move when evidence or user assumptions change.</p></div></div>
      </section>

      <div className="toolbar"><div className="tabs"><button className={mode === "build" ? "active" : ""} onClick={() => setMode("build")}>Build your scenario</button><button className={mode === "one" ? "active" : ""} onClick={() => setMode("one")}>Change one factor</button></div><div className="horizon"><span>HORIZON</span>{(["short", "medium", "long"] as Horizon[]).map((item) => <button key={item} className={horizon === item ? "selected" : ""} onClick={() => setHorizon(item)}>{item === "short" ? "0–3 yrs" : item === "medium" ? "3–7 yrs" : "7–15 yrs"}</button>)}</div></div>

      <section className="workspace">
        <div className="map-panel panel"><div className="panel-head"><div><p className="eyebrow">IMPACT PATH · {horizon === "short" ? "SHORT TERM" : horizon === "medium" ? "MEDIUM TERM" : "LONG TERM"}</p><h2>Indian IT transition map</h2></div><span className="status-pill"><span className="live-dot" /> recalculates live</span></div>
          <div className="map-intro">A transparent weighted causal model. Brighter paths show where your assumptions are moving the evidence-based baseline.</div>
          <div className="causal-map">
            <div className="map-column inputs-col"><span className="column-label">ASSUMPTIONS</span>{inputs.slice(0, 4).map((input) => <button className={`map-node input-node ${values[input.id] !== baseline[input.id] ? "changed" : ""}`} key={input.id} onClick={() => { setFocus(input.id); setMode("one"); }}><span className="node-dot" /><span>{input.short}</span><b>{values[input.id]}{input.id === "gdp" ? "%" : "%"}</b></button>)}</div>
            <div className="map-column middle-col"><span className="column-label">TRANSMISSION</span>{["AI integration demand", "Delivery capacity", "Revenue captured", "Work automated"].map((label, index) => <div className={`map-node middle-node ${index < 3 && changedInput ? "lit" : ""}`} key={label}><span className="node-dot" /><span>{label}</span><b>{Math.round([result.integration, result.capacity, result.captured, result.automation][index])}%</b></div>)}</div>
            <div className="map-column outputs-col"><span className="column-label">OUTCOMES</span>{[["IT-services revenue growth", `${result.revenue >= 0 ? "+" : "−"}${Math.abs(result.revenue).toFixed(1)}%`], ["AI-role demand", `${Math.round(result.aiRoles)}/100`], ["Fresher hiring outlook", `${result.headcount >= 0 ? "+" : "−"}${Math.abs(result.headcount).toFixed(1)}%`], ["Traditional-role demand", `${Math.round(result.traditionalRoles)}/100`]].map(([label, value]) => <div className="map-node output-node" key={label}><span className="node-dot" /><span>{label}</span><b>{value}</b></div>)}</div>
            <div className="map-arrows"><span>→</span><span>→</span><span>→</span><span>→</span></div>
          </div>
          <div className="map-legend"><span><i className="legend-line strong" /> stronger influence</span><span><i className="legend-line dashed" /> lower confidence</span><span>↑ improving</span><span>↓ pressured</span></div>
        </div>

        <aside className="controls panel"><div className="panel-head"><div><p className="eyebrow">USER ASSUMPTIONS</p><h2>{mode === "one" ? "One factor mode" : "Tune the model"}</h2></div><button className="reset" onClick={reset}>↺ Reset baseline</button></div>{mode === "one" && <div className="one-mode"><b>Only one factor is unlocked.</b><span>Change a single input to isolate its direct and indirect effects.</span><select value={focus} onChange={(event) => setFocus(event.target.value)}>{inputs.map((input) => <option key={input.id} value={input.id}>{input.label}</option>)}</select></div>}<div className="assumptions-list">{inputs.map((input) => <label className={`assumption ${mode === "one" && input.id !== focus ? "locked" : ""}`} key={input.id}><div className="assumption-top"><span>{input.label}</span><b>{values[input.id]}<small>{input.unit}</small></b></div><input aria-label={input.label} type="range" min={input.min} max={input.max} step={input.step} value={values[input.id]} disabled={mode === "one" && input.id !== focus} onChange={(event) => updateValue(input.id, Number(event.target.value))} /><div className="range-meta"><span>min {input.min}</span><span className="baseline-mark">baseline {input.baseline}</span><span>max {input.max}</span></div></label>)}</div></aside>
      </section>

      <section className="lower-grid"><div className="forecast panel"><div className="panel-head"><div><p className="eyebrow">PROBABILISTIC FORECAST</p><h2>Baseline versus modified</h2></div><span className="confidence">● 62% confidence</span></div><div className="forecast-row"><div className="probability"><div className="prob-label"><span>Expansion</span><b>{Math.round(result.expansion)}% <small>{signed(result.expansion - base.expansion, 0)}</small></b></div><div className="bar"><i style={{ width: `${base.expansion}%` }} /><strong style={{ width: `${result.expansion}%` }} /></div><div className="bar-labels"><span>baseline {Math.round(base.expansion)}%</span><span>modified {Math.round(result.expansion)}%</span></div></div><div className="probability"><div className="prob-label"><span>Compression</span><b>{Math.round(result.compression)}% <small className="negative">{signed(result.compression - base.compression, 0)}</small></b></div><div className="bar warm"><i style={{ width: `${base.compression}%` }} /><strong style={{ width: `${result.compression}%` }} /></div><div className="bar-labels"><span>baseline {Math.round(base.compression)}%</span><span>modified {Math.round(result.compression)}%</span></div></div><div className="probability"><div className="prob-label"><span>Mixed transition</span><b>{Math.round(result.mixed)}% <small>{signed(result.mixed - base.mixed, 0)}</small></b></div><div className="bar neutral"><i style={{ width: `${base.mixed}%` }} /><strong style={{ width: `${result.mixed}%` }} /></div><div className="bar-labels"><span>baseline {Math.round(base.mixed)}%</span><span>modified {Math.round(result.mixed)}%</span></div></div></div><div className="outlook"><span className="outlook-icon">↗</span><div><b>{result.revenue >= base.revenue ? "Expansion outlook improves" : "Compression risk increases"}</b><p>{explain(changedInput?.label ?? "selected assumptions", changedInput ? values[changedInput.id] - baseline[changedInput.id] : 0, result)}</p></div></div></div>
        <div className="impact panel"><div className="panel-head"><div><p className="eyebrow">IMPACT PANEL</p><h2>What moved downstream</h2></div><span className="tag">{horizon === "medium" ? "lag-aware" : "horizon-adjusted"}</span></div><div className="impact-list"><div><span className="impact-icon up">↑</span><div><b>AI-role demand</b><p>Domain-skilled roles and integration work</p></div><strong>{signed(result.aiRoles - base.aiRoles, 1)}</strong></div><div><span className="impact-icon up">↑</span><div><b>Revenue opportunity</b><p>Captured value after delivery capacity</p></div><strong>{signed(result.captured - base.captured, 1)}</strong></div><div><span className="impact-icon down">↓</span><div><b>Traditional-role demand</b><p>Repetitive work under automation pressure</p></div><strong>{signed(result.traditionalRoles - base.traditionalRoles, 1)}</strong></div><div><span className="impact-icon lag">◌</span><div><b>Fresher hiring</b><p>Expected to follow revenue with a 1–2 year lag</p></div><strong>{signed(result.headcount - base.headcount, 1)}</strong></div></div><div className="assumption-callout"><span>i</span><p>Largest sensitivity: <b>{sensitivity[0].short}</b> · each configured step moves expansion probability by {Math.abs(sensitivity[0].impact).toFixed(1)} pts.</p></div></div></section>

      <section className="bottom-grid"><div className="sensitivity panel"><div className="panel-head"><div><p className="eyebrow">SENSITIVITY RANKING</p><h2>Which assumptions matter most?</h2></div><span className="help">local · one-step impact</span></div>{sensitivity.slice(0, 5).map((item) => <div className="sensitivity-row" key={item.id}><span>{item.short}</span><div className="sensitivity-track"><i className={item.impact >= 0 ? "positive" : "negative-bar"} style={{ width: `${Math.min(100, Math.abs(item.impact) * 12)}%` }} /></div><b>{item.impact >= 0 ? "+" : "−"}{Math.abs(item.impact).toFixed(1)} pts</b></div>)}</div><div className="scenario panel"><div className="panel-head"><div><p className="eyebrow">SCENARIO WORKSPACE</p><h2>Save, compare, share</h2></div><span className="saved-count">{saved.length} saved locally</span></div><input className="scenario-name" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} aria-label="Scenario name" /><div className="scenario-actions"><button onClick={saveScenario}>＋ Save scenario</button><button onClick={share}>↗ Copy share link</button><button onClick={exportScenario}>↓ Export JSON</button></div><div className="model-note"><b>Model transparency</b><p>Weighted causal model · deterministic templates · bounded values · model version illustrative-0.1 · recalibration 04 Aug 2026.</p></div></div></section>

      <section className="trend panel"><div className="panel-head"><div><p className="eyebrow">MODEL HISTORY</p><h2>How the house view is changing</h2></div><span className="help">release snapshots · not actuals</span></div><p className="trend-copy">The line records the published, probability-weighted view at each model release. It changes when evidence changes the house probabilities. It is not a claim that GDP or IT growth will follow a straight line.</p><div className="trend-chart"><svg viewBox="0 0 720 190" preserveAspectRatio="none"><line x1="45" y1="20" x2="45" y2="155" /><line x1="45" y1="155" x2="690" y2="155" /><polyline className="gdp-line" points="70,93 650,84" /><polyline className="it-line" points="70,73 650,61" /><circle cx="70" cy="93" r="5" /><circle cx="650" cy="84" r="5" /><circle cx="70" cy="73" r="5" /><circle cx="650" cy="61" r="5" /></svg><div className="trend-labels"><span>GDP growth <b>6.1 → 6.2%</b></span><span>IT growth <b>7.0 → 7.4%</b></span></div></div><div className="release-list">{modelHistory.map((release) => <div key={release.version}><b>{release.date} · v{release.version}</b><span>{release.note}</span><strong>GDP {release.gdp}% · IT {release.it}%</strong></div>)}</div></section>

      <footer><span>SCENARIO SIMULATOR · INDIAN IT</span><span>Illustrative coefficients, not empirically validated. <button>View methodology ↗</button></span></footer>
    </main>
  );
}

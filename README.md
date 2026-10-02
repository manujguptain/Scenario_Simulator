# Indian IT Scenario Simulator

Future Scenario Mapping is a browser-only simulator for exploring how 18 assumptions can change plausible Indian IT outcomes across short (0–3 year), medium (3–7 year), and long (7–15 year) horizons. It includes a live causal impact map, Build Your Scenario and Change One Factor modes, baseline-versus-modified scenario scores, impact analysis, sensitivity ranking, local saving, JSON export/import, a dated evidence register, mathematical methodology, a release-by-release export-growth backtest, and shareable URL state.

The scenario-score weights and hiring, AI, margin, and macro coefficients are illustrative and not empirically validated. The RBI export-growth benchmark and the initial company-outcomes panel are separate evidence checks; neither validates the broader model or its coefficients. The model is deterministic: the same inputs always produce the same result, and no API key, account, server, or backend is required. The published trendline records dated model snapshots; it is not a record of actual GDP or IT growth.

## Public changelog

### 04 September 2026 — model 0.2

- Grouped developments into durable categories: delivery-location economics, client operating-model shift, automation and work redesign, and India capability capture. H-1B and Japanese GCC developments are now evidence for categories, not permanent standalone model dimensions.
- The structural update was prompted by three evidence updates, each with an explicit directional assessment:
  1. **H-1B and dependent-work uncertainty — mixed / uncertain.** It puts downward pressure on onsite mobility, but could increase India-based delivery; the opposing risk is more local hiring, GCC expansion or client insourcing.
  2. **AI adoption and reported job-risk signals — mixed.** It adds near-term negative pressure on routine work and hiring, with a longer-term upside only if Indian firms capture new AI and engineering work.
  3. **Japanese GCC expansion — positive, confidence-weighted.** It may increase India-based engineering and higher-value capability demand, but the eventual scale and timing are uncertain.
- The 34%→36% expansion movement reflects this model redesign, not an observed improvement in the sector. No individual development has been assigned a fabricated percentage-point contribution.
- Added a historical release view for the three calculated outcomes: expansion, compression and mixed-transition score shares. They are not calibrated probabilities. The initial change is marked as a structural recalibration, not as evidence of a real industry move.
- Treated AI employment risk as bounded exposure to work redesign, not a forecast that 20% of all jobs will disappear.
- At this release, all figures were illustrative and had not been empirically backtested.

### 02 October 2026 — model 0.3

- Added the RBI FY2025–26 software-export survey as a dated historical anchor: exports +8.2%, 91.7% off-site and 54.1% US destination share. The export-growth slider is an assumption compared with this anchor, not a forecast.
- Added separate scenario controls for US software-export demand, Brent oil, the Fed target rate, USD/INR translation, GCC gross-hiring momentum and AI capacity released. The new controls preserve the evidence scope: Wipro's ~20,000 FTE-equivalent productivity capacity is redeployed and company-specific; ANSR's 12–15% is a survey gross-hiring signal, not net GCC employment.
- Updated the current near-term macro nowcast to Brent $102.60 (2 Oct), USD/INR ₹96.315 (1 Oct) and the 3.75–4.00% Fed target range (16 Sep). Macro effects decay across the displayed horizon; FX affects reported INR translation separately from constant-currency demand.
- Reflected the 30 Sep H‑1B fee injunction as a policy branch with the fee inactive while court orders operate. Appeal/reversal or a new rule remains a scenario, not a baseline forecast.
- Kept the Accenture FY27 outlook as a peer demand check, TCS/Porsche MHP as a conditional transaction, HyperVault as phased data-centre capacity, and Japanese GCC growth as a confidence-weighted capability signal.
- Added model equations, dated source links and a v0.3 changelog to the public app. At the current medium-horizon default, rounded model scores are Expansion 35%, Compression 52%, Mixed 13%, compared with v0.2's 36%, 51%, 13%. The shift is an illustrative structural recalculation, not an observed sector change or statistically calibrated probability.
- At v0.3, coefficients remained illustrative and no held-out historical backtest had been completed; Version 0.2 remained the score-mix comparison benchmark.

### 02 October 2026 — model 0.4

- Added a reproducible expanding-window backtest of RBI annual software-services export growth using twelve RBI releases from FY2014–15 to FY2025–26, producing eleven next-release forecast origins. Data, dates and direct RBI source links are stored in `data/rbi-export-surveys.json`; `scripts/generate-backtest.mjs` regenerates the reported results.
- Compared two no-fit benchmarks at every origin: latest-growth persistence and the median of all growth rates available by that release date. Across the eleven forecasts, expanding median MAE/RMSE were **4.20/5.23 percentage points**; persistence MAE/RMSE were **5.04/7.01 points**. Errors are absolute and squared forecast errors in annual growth percentage points.
- No coefficients were fit and the scenario baseline was not changed based on this small sample. The ranking is descriptive only: eleven observations span pre-pandemic growth and pandemic-era boom/bust, the survey methodology may have changed, and release gaps vary from 6.2 to 15.9 months, so this is not a fixed-horizon forecasting test.
- Added the fold-level forecast table, metrics, data-scope caveats and build-time integrity checks to the simulator. The current FY2025–26 +8.2% slider value remains a historical anchor, not a newly generated forecast.
- Explicitly renamed the expansion/compression/mixed outputs as normalized **scenario-score shares**, not probabilities. The backtest does not validate those scores or hiring, AI-productivity, margin, or employment coefficients.
- Started a source-linked company outcome panel with FY2025 and FY2026 reported constant-currency revenue growth, operating margin, and headcount for TCS, Infosys, Wipro, HCLTech, and Tech Mahindra. The raw observations and metric scopes are in `data/company-outcomes-panel.json`; `scripts/verify-company-panel.mjs` checks source links, dates, scope fields, duplicates, and coverage.
- This ten-row annual panel is a collection and coverage check, **not** an out-of-sample backtest: it has only two years per firm and no matched historical simulator inputs. No scenario weights or coefficients were fitted. Wipro segment-level revenue/margin and company-wide headcount, acquisition-related headcount changes, and reported-versus-adjusted margins are explicitly flagged.
- Corrected the displayed RBI test count to use its computed eleven forecast origins rather than the stale text “seven”.

### 02 October 2026 — quarterly company outcome coverage (data update; model 0.4 unchanged)

- Added a source-linked Q1 FY2026/Q1 FY2027 outcome panel for TCS, Infosys, Wipro, HCLTech, and Tech Mahindra, covering disclosed year-over-year revenue growth and operating margins plus headcount/utilization where the cited company release provides them.
- Kept each observation's release date, revenue basis, margin basis, source link, and comparability limits visible. Missing values remain blank rather than being inferred; Wipro's segment revenue is not presented as consolidated, Tech Mahindra Q1 FY2026 is reported USD rather than constant currency, and HCLTech's reported and adjusted FY2027 margins are distinguished.
- Added a validator for the 10 source-linked quarterly observations and rendered the panel in the simulator.
- **No simulator input, formula, coefficient, scenario score, or backtest score changed.** The new panel is a record of actual outcomes, not a historical model forecast test.
- Historical quarterly simulator inputs and output forecasts were not archived, and the current three-way scores are normalized scores rather than numeric company forecasts. A valid rolling test therefore cannot be reconstructed from these actuals. Going forward, a forecast must be timestamped against a specific numeric target and full input vector before company results, then joined to the actual release after publication.

## Run locally on Windows

Install Node.js 22 or newer, open PowerShell in this repository, and run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173/`). To preview the repository subdirectory path locally, set `$env:VITE_BASE_PATH = '/Scenario_Simulator/'` before `npm run dev`. Use the sliders, switch horizons, save a local scenario, copy a share link, or export JSON.

## Build and test

```powershell
npm run lint
npm test
npm run build
```

The static output is written to `dist/`. The build regenerates the backtest JSON from its source data, then checks the HTML, JavaScript and CSS assets, model and backtest JSON, relative paths, subdirectory compatibility, and absence of server or Cloudflare endpoints. `npm test` also checks the walk-forward forecast count, chronology and benchmark error metrics.

## Base path

The single configuration setting is `VITE_BASE_PATH`. The default is `./`, which makes the same static files portable under both `/Scenario_Simulator/` and `/future-map/`. To emit an explicit Hugo integration path, use:

```powershell
$env:VITE_BASE_PATH = '/future-map/'
npm run build
```

The value must start and end with `/`. Clear the variable or set it to `/Scenario_Simulator/` for the standalone repository path.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` runs on pushes to `main` and manual runs. It installs Node 22, runs lint and tests, builds the app, uploads only `dist/`, and deploys with the official Pages actions.

In GitHub, open **Settings → Pages**, choose **GitHub Actions** as the source, then push to `main` or select **Actions → Deploy static simulator to GitHub Pages → Run workflow**. In **Settings → Actions → General**, ensure workflows are allowed. The repository is currently private; an open-source Pages deployment should use a public repository unless the GitHub account plan supports Pages from private repositories. This project does not change visibility automatically.

For a repository named `Scenario_Simulator`, the expected URL is `https://manujg.github.io/Scenario_Simulator/`. The exact URL is shown in the workflow’s `github-pages` environment after deployment.

## Hugo PaperMod integration

Build with `VITE_BASE_PATH=/future-map/`, copy the contents of `dist/` into the Hugo site’s `static/future-map/` directory, and publish the Hugo site. The simulator should then be available at `https://manujg.com/future-map/`. Keep the trailing slash and copy the `data/` directory so `causal-models.json` remains available.

## Updating the model

Edit `public/data/generated/causal-models.json` and the corresponding inputs/formulas in `app/page.tsx`, preserving the schema and dated evidence scope. The browser fetches the model JSON at startup. Update the model version, displayed release history and README changelog when coefficients or edges change; run `npm run lint` and `npm test`, then verify the sliders and published static copy.

## Known limitations

This is a demonstration model, not a forecast or investment recommendation. Scenario saves use browser-local storage and do not sync between devices. Share URLs encode inputs in the query string. GitHub Pages serves the static application only; direct refresh works for query-string scenario URLs, while additional clean URL routes are not part of this one-page app.

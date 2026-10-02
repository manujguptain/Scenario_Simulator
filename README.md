# Indian IT Scenario Simulator

Future Scenario Mapping is a browser-only simulator for exploring how 18 assumptions can change plausible Indian IT outcomes across short (0–3 year), medium (3–7 year), and long (7–15 year) horizons. It includes a live causal impact map, Build Your Scenario and Change One Factor modes, baseline-versus-modified probabilities, impact analysis, sensitivity ranking, local saving, JSON export/import, a dated evidence register, mathematical methodology and shareable URL state.

The coefficients are currently illustrative and are not empirically validated. The model is deterministic: the same inputs always produce the same result, and no API key, account, server, or backend is required. The published trendline records dated model snapshots; it is not a record of actual GDP or IT growth.

## Public changelog

### 04 September 2026 — model 0.2

- Grouped developments into durable categories: delivery-location economics, client operating-model shift, automation and work redesign, and India capability capture. H-1B and Japanese GCC developments are now evidence for categories, not permanent standalone model dimensions.
- The structural update was prompted by three evidence updates, each with an explicit directional assessment:
  1. **H-1B and dependent-work uncertainty — mixed / uncertain.** It puts downward pressure on onsite mobility, but could increase India-based delivery; the opposing risk is more local hiring, GCC expansion or client insourcing.
  2. **AI adoption and reported job-risk signals — mixed.** It adds near-term negative pressure on routine work and hiring, with a longer-term upside only if Indian firms capture new AI and engineering work.
  3. **Japanese GCC expansion — positive, confidence-weighted.** It may increase India-based engineering and higher-value capability demand, but the eventual scale and timing are uncertain.
- The 34%→36% expansion movement reflects this model redesign, not an observed improvement in the sector. No individual development has been assigned a fabricated percentage-point contribution.
- Added a historical release view for the three calculated outcomes: expansion probability, compression probability and mixed-transition probability. The initial change is marked as a structural recalibration, not as evidence of a real industry move.
- Treated AI employment risk as bounded exposure to work redesign, not a forecast that 20% of all jobs will disappear.
- The current figures remain illustrative pending empirical calibration and backtesting.

### 02 October 2026 — model 0.3

- Added the RBI FY2025–26 software-export survey as a dated historical anchor: exports +8.2%, 91.7% off-site and 54.1% US destination share. The export-growth slider is an assumption compared with this anchor, not a forecast.
- Added separate scenario controls for US software-export demand, Brent oil, the Fed target rate, USD/INR translation, GCC gross-hiring momentum and AI capacity released. The new controls preserve the evidence scope: Wipro's ~20,000 FTE-equivalent productivity capacity is redeployed and company-specific; ANSR's 12–15% is a survey gross-hiring signal, not net GCC employment.
- Updated the current near-term macro nowcast to Brent $102.60 (2 Oct), USD/INR ₹96.315 (1 Oct) and the 3.75–4.00% Fed target range (16 Sep). Macro effects decay across the displayed horizon; FX affects reported INR translation separately from constant-currency demand.
- Reflected the 30 Sep H‑1B fee injunction as a policy branch with the fee inactive while court orders operate. Appeal/reversal or a new rule remains a scenario, not a baseline forecast.
- Kept the Accenture FY27 outlook as a peer demand check, TCS/Porsche MHP as a conditional transaction, HyperVault as phased data-centre capacity, and Japanese GCC growth as a confidence-weighted capability signal.
- Added model equations, dated source links and a v0.3 changelog to the public app. At the current medium-horizon default, rounded model scores are Expansion 35%, Compression 52%, Mixed 13%, compared with v0.2's 36%, 51%, 13%. The shift is an illustrative structural recalculation, not an observed sector change or statistically calibrated probability.
- Coefficients remain illustrative. No held-out historical backtest or sector-wide AI productivity estimate has been completed; keep Version 0.2 as the comparison benchmark.

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

The static output is written to `dist/`. The build verification checks the HTML, JavaScript and CSS assets, model JSON, relative paths, subdirectory compatibility, and absence of server or Cloudflare endpoints.

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

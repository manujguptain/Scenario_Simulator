# Indian IT Scenario Simulator

Future Scenario Mapping is a browser-only simulator for exploring how eight assumptions can change plausible Indian IT outcomes across short (0–3 year), medium (3–7 year), and long (7–15 year) horizons. It includes a live causal impact map, Build Your Scenario and Change One Factor modes, baseline-versus-modified probabilities, impact analysis, sensitivity ranking, local saving, JSON export/import, and shareable URL state.

The coefficients are currently illustrative and are not empirically validated. The model is deterministic: the same inputs always produce the same result, and no API key, account, server, or backend is required. The published trendline records dated model snapshots; it is not a record of actual GDP or IT growth.

## Public changelog

### 04 September 2026 — model 0.2

- Grouped developments into durable categories: delivery-location economics, client operating-model shift, automation and work redesign, and India capability capture. H-1B and Japanese GCC developments are now evidence for categories, not permanent standalone model dimensions.
- The structural update was prompted by: (1) H-1B and dependent-work uncertainty, which changes delivery-location economics but can lead either to India-based delivery or to more local hiring/insourcing; (2) AI adoption and reported job-risk signals, which increase short-term work-redesign pressure while creating longer-term capability demand; and (3) Japanese GCC expansion, which is evidence for India capability capture and client operating-model shift. The initial probability movement reflects this model redesign, not an observed improvement in the sector.
- Added a historical release view for the three calculated outcomes: expansion probability, compression probability and mixed-transition probability. The initial change is marked as a structural recalibration, not as evidence of a real industry move.
- Treated AI employment risk as bounded exposure to work redesign, not a forecast that 20% of all jobs will disappear.
- The current figures remain illustrative pending empirical calibration and backtesting.

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

Edit `public/data/generated/causal-models.json`, preserving its schema and valid JSON. The browser fetches this file at startup. Update the model version and description when coefficients or edges change, then run `npm test` and manually move each slider to verify that downstream values, probabilities, impact analysis, and sensitivity ranking update.

## Known limitations

This is a demonstration model, not a forecast or investment recommendation. Scenario saves use browser-local storage and do not sync between devices. Share URLs encode inputs in the query string. GitHub Pages serves the static application only; direct refresh works for query-string scenario URLs, while additional clean URL routes are not part of this one-page app.

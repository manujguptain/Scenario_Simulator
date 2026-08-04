import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname.replace(/^\//, "").replaceAll("/", "\\");
assert.ok(existsSync(join(dist, "index.html")), "dist/index.html is required");
assert.ok(existsSync(join(dist, "data", "generated", "causal-models.json")), "causal-models.json is required");
const html = readFileSync(join(dist, "index.html"), "utf8");
assert.match(html, /<script[^>]+src="(?:\.\/|\/[^\"]+\/)?assets\//, "JavaScript asset path is required");
assert.match(html, /<link[^>]+href="(?:\.\/|\/[^\"]+\/)?assets\//, "CSS asset path is required");
assert.doesNotMatch(html, /(?:src|href)="\/(?:assets|data)\//, "Assets must not use an unconfigured root path");
const assetNames = readdirSync(join(dist, "assets"));
assert.ok(assetNames.some((name) => name.endsWith(".js")), "JavaScript asset is required");
assert.ok(assetNames.some((name) => name.endsWith(".css")), "CSS asset is required");
assert.doesNotMatch(html, /(?:https?:)?\/\/(?:api|localhost|127\.0\.0\.1)/i);
assert.doesNotMatch(readFileSync(join(dist, "assets", assetNames.find((name) => name.endsWith(".js"))), "utf8"), /cloudflare|wrangler|server endpoint|vinext/i);
console.log("Static deployment verification passed.");

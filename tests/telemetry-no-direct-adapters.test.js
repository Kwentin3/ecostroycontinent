import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const PUBLIC_SCAN_ROOTS = [
  "components/public",
  "app"
];
const APPROVED_YM_FILES = [
  path.normalize("components/public/MetricaCounter.js"),
  path.normalize("components/public/telemetry-metrica-adapter.js")
];

function listJavaScriptFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      return listJavaScriptFiles(entryPath);
    }

    return entry.isFile() && /\.js$/.test(entry.name) ? [entryPath] : [];
  });
}

test("public UI has no direct external analytics calls", () => {
  const directAdapterPattern = /\bym\s*\(|\bgtag\s*\(|posthog|plausible|matomo/i;
  const offenders = PUBLIC_SCAN_ROOTS
    .flatMap(listJavaScriptFiles)
    .map((filePath) => path.normalize(filePath))
    .filter((filePath) => !APPROVED_YM_FILES.includes(filePath))
    .filter((filePath) => directAdapterPattern.test(fs.readFileSync(filePath, "utf8")));

  assert.deepEqual(offenders, []);
});

test("direct ym calls stay in approved Metrica bootstrap/adapter files", () => {
  const ymPattern = /\bym\s*\(/i;
  const offenders = PUBLIC_SCAN_ROOTS
    .flatMap(listJavaScriptFiles)
    .map((filePath) => path.normalize(filePath))
    .filter((filePath) => ymPattern.test(fs.readFileSync(filePath, "utf8")))
    .filter((filePath) => !APPROVED_YM_FILES.includes(filePath));

  assert.deepEqual(offenders, []);
});

test("public tracker sends to telemetry contract, not old analytics endpoint", () => {
  const trackerSource = fs.readFileSync(path.join("components", "public", "AnalyticsTracker.js"), "utf8");

  assert.match(trackerSource, /\/api\/telemetry\/events/);
  assert.doesNotMatch(trackerSource, /\/api\/analytics\/events/);
});

test("public tracking code does not expose server-only Yandex secrets", () => {
  const publicTrackingFiles = [
    "components/public/AnalyticsTracker.js",
    "components/public/MetricaCounter.js",
    "components/public/PublicTrackingBoundary.js",
    "components/public/telemetry-metrica-adapter.js",
    "lib/telemetry/metrica-config.js",
    "lib/telemetry/metrica-goals.js"
  ];
  const secretPattern = /YANDEX_(?:METRICA|WEBMASTER)_OAUTH_TOKEN|YANDEX_OAUTH_CLIENT_SECRET|YANDEX_OAUTH_REFRESH_TOKEN/i;
  const offenders = publicTrackingFiles
    .filter((filePath) => fs.existsSync(filePath))
    .filter((filePath) => secretPattern.test(fs.readFileSync(filePath, "utf8")));

  assert.deepEqual(offenders, []);
});

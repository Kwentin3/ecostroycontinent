import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const UI_FILES = [
  "components/public/AnalyticsTracker.js",
  "components/public/PublicRenderers.js",
  "app/page.js",
  "app/services/page.js",
  "app/services/[slug]/page.js",
  "app/cases/page.js",
  "app/cases/[slug]/page.js"
];

test("public UI has no direct external analytics calls", () => {
  const directAdapterPattern = /\bym\s*\(|\bgtag\s*\(|posthog|plausible|matomo/i;
  const offenders = UI_FILES
    .filter((filePath) => fs.existsSync(filePath))
    .filter((filePath) => directAdapterPattern.test(fs.readFileSync(filePath, "utf8")));

  assert.deepEqual(offenders, []);
});

test("public tracker sends to telemetry contract, not old analytics endpoint", () => {
  const trackerSource = fs.readFileSync(path.join("components", "public", "AnalyticsTracker.js"), "utf8");

  assert.match(trackerSource, /\/api\/telemetry\/events/);
  assert.doesNotMatch(trackerSource, /\/api\/analytics\/events/);
});

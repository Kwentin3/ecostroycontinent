import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { normalizeCaseTaskDisplayText } from "../lib/public-launch/case-copy.js";

test("case task display text removes a repeated long task paragraph without hiding distinct content", () => {
  const duplicated = [
    "Completed a comprehensive renovation of the building with roof, facade, landscaping, and fencing.",
    "The main task was to return the site to working condition and prepare it for continued operation.",
    "Complete a comprehensive renovation of the building with roof, facade, landscaping, and fencing.",
    "The main task was to return the site to working condition and prepare it for continued operation."
  ].join("");
  const expected = [
    "Completed a comprehensive renovation of the building with roof, facade, landscaping, and fencing.",
    "The main task was to return the site to working condition and prepare it for continued operation."
  ].join(" ");

  assert.equal(normalizeCaseTaskDisplayText(duplicated), expected);
});

test("case task duplicate protection is wired only into the case task renderer", () => {
  const rendererSource = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");

  assert.match(rendererSource, /normalizeCaseTaskDisplayText\(item\.task\)/);
  assert.doesNotMatch(rendererSource, /normalizeCaseTaskDisplayText\(item\.result\)/);
  assert.doesNotMatch(rendererSource, /normalizeCaseTaskDisplayText\(service\./);
});

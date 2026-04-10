import test from "node:test";
import assert from "node:assert/strict";

import { normalizePageMetadata } from "../../lib/admin/page-metadata-state.js";

test("normalizePageMetadata tolerates null metadata payloads from registry modal boot", () => {
  const metadata = normalizePageMetadata(null);

  assert.equal(metadata.slug, "");
  assert.equal(metadata.pageType, "about");
  assert.equal(metadata.pageThemeKey, "earth_sand");
  assert.equal(metadata.seo.indexationFlag, "index");
});

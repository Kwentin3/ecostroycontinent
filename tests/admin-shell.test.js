import test from "node:test";
import assert from "node:assert/strict";

import { getNavItems } from "../lib/admin/nav.js";

function hrefs(items) {
  return items.map((item) => item.href);
}

test("admin shell exposes a single Pages domain and no top-level AI workspace entry", () => {
  const seoManagerNav = getNavItems({ role: "seo_manager" });
  const businessOwnerNav = getNavItems({ role: "business_owner" });
  const superadminNav = getNavItems({ role: "superadmin" });
  const guestNav = getNavItems({ role: "guest" });

  assert.equal(hrefs(seoManagerNav).includes("/admin/entities/page"), true);
  assert.equal(hrefs(businessOwnerNav).includes("/admin/entities/page"), true);
  assert.equal(hrefs(superadminNav).includes("/admin/entities/page"), true);
  assert.equal(hrefs(guestNav).includes("/admin/entities/page"), true);
  assert.equal(hrefs(seoManagerNav).includes("/admin/workspace/landing"), false);
  assert.equal(hrefs(businessOwnerNav).includes("/admin/workspace/landing"), false);
  assert.equal(hrefs(superadminNav).includes("/admin/workspace/landing"), false);
  assert.equal(hrefs(guestNav).includes("/admin/workspace/landing"), false);
  assert.equal(hrefs(superadminNav).includes("/admin/diagnostics/llm"), true);
});

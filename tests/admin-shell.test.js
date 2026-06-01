import test from "node:test";
import assert from "node:assert/strict";

import { getNavItems } from "../lib/admin/nav.js";

function hrefs(items) {
  return items.map((item) => item.href);
}

test("admin shell navigation follows role boundaries", () => {
  const seoManagerNav = getNavItems({ role: "seo_manager" });
  const businessOwnerNav = getNavItems({ role: "business_owner" });
  const superadminNav = getNavItems({ role: "superadmin" });
  const guestNav = getNavItems({ role: "guest" });

  assert.deepEqual(hrefs(businessOwnerNav), [
    "/admin",
    "/admin/review",
    "/admin/visibility"
  ]);
  assert.deepEqual(hrefs(guestNav), ["/admin"]);
  assert.equal(hrefs(seoManagerNav).includes("/admin/entities/page"), true);
  assert.equal(hrefs(seoManagerNav).includes("/admin/entities/media_asset"), true);
  assert.equal(hrefs(seoManagerNav).includes("/admin/visibility"), true);
  assert.equal(hrefs(seoManagerNav).includes("/admin/users"), false);
  assert.equal(hrefs(superadminNav).includes("/admin/entities/page"), true);
  assert.equal(hrefs(superadminNav).includes("/admin/entities/media_asset"), true);
  assert.equal(hrefs(superadminNav).includes("/admin/users"), true);
  assert.equal(hrefs(superadminNav).includes("/admin/visibility"), true);
  assert.equal(hrefs(seoManagerNav).includes("/admin/entities/equipment"), true);
  assert.equal(hrefs(superadminNav).includes("/admin/entities/equipment"), true);
  assert.equal(hrefs(seoManagerNav).includes("/admin/workspace/landing"), false);
  assert.equal(hrefs(businessOwnerNav).includes("/admin/workspace/landing"), false);
  assert.equal(hrefs(superadminNav).includes("/admin/workspace/landing"), false);
  assert.equal(hrefs(guestNav).includes("/admin/workspace/landing"), false);
  assert.equal(hrefs(superadminNav).includes("/admin/diagnostics/llm"), true);
});

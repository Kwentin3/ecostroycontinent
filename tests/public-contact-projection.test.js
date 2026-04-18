import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildPublicContactProjection } from "../lib/public-launch/contact-projection.js";

test("contact projection uses direct channel actions only when contact truth is confirmed", () => {
  const projection = buildPublicContactProjection({
    contactTruthConfirmed: true,
    primaryPhone: "+7 (999) 123-45-67",
    publicEmail: "hello@example.com",
    serviceArea: "Moscow",
    activeMessengers: ["telegram"]
  }, { currentPath: "/" });

  assert.equal(projection.readiness.code, "ready");
  assert.equal(projection.primaryAction.kind, "call");
  assert.match(projection.primaryAction.href, /^tel:/);
  assert.equal(projection.displayPhone, "+7 (999) 123-45-67");
  assert.equal(projection.bindingMode, "confirmed_truth");
  assert.match(projection.consistencyToken, /confirmed_truth\|ready\|/);
});

test("contact projection falls back to route CTA when contact truth is not confirmed", () => {
  const projection = buildPublicContactProjection({
    contactTruthConfirmed: false,
    primaryPhone: "+7 (999) 123-45-67",
    publicEmail: "hello@example.com",
    defaultCtaLabel: "Связаться"
  }, { currentPath: "/services/drainage" });

  assert.equal(projection.readiness.code, "pending_confirmation");
  assert.equal(projection.primaryAction.kind, "route");
  assert.equal(projection.primaryAction.href, "/contacts#contact-request");
  assert.equal(projection.primaryAction.label, "Связаться");
  assert.equal(projection.displayPhone, "Контактные данные еще не подтверждены.");
  assert.equal(projection.displayEmail, "Публичная почта еще не подтверждена.");
  assert.equal(projection.bindingMode, "fallback_projection");
  assert.match(projection.consistencyToken, /fallback_projection\|pending_confirmation\|/);
});

test("stage4a wiring uses shared contact projection helper on home and public renderer", () => {
  const homeSource = readFileSync(new URL("../app/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const rendererSource = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(homeSource, /buildPublicContactProjection/);
  assert.match(homeSource, /contactProjection\.primaryAction/);
  assert.match(rendererSource, /buildPublicContactProjection/);
  assert.match(rendererSource, /ContactAction/);
  assert.match(rendererSource, /contact-request/);
  assert.match(rendererSource, /data-contact-binding-mode/);
  assert.match(rendererSource, /data-contact-consistency-token/);
});

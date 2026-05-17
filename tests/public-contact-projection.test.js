import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildPublicContactProjection } from "../lib/public-launch/contact-projection.js";

test("contact projection uses direct channel actions only when contact truth is confirmed", () => {
  const projection = buildPublicContactProjection({
    contactTruthConfirmed: true,
    primaryPhone: "+7 (999) 123-45-67",
    publicEmail: "hello@example.com",
    serviceArea: "Сочи и Большой Сочи",
    activeMessengers: ["telegram"]
  }, { currentPath: "/" });

  assert.equal(projection.readiness.code, "ready");
  assert.equal(projection.primaryAction.kind, "call");
  assert.match(projection.primaryAction.href, /^tel:/);
  assert.equal(projection.displayPhone, "+7 (999) 123-45-67");
  assert.equal(projection.publicRegion, "Сочи и Большой Сочи");
  assert.equal(projection.hasPublicRegion, true);
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
  assert.equal(projection.publicRegion, "");
  assert.equal(projection.hasPublicRegion, false);
  assert.equal(projection.bindingMode, "fallback_projection");
  assert.match(projection.consistencyToken, /fallback_projection\|pending_confirmation\|/);
});

test("contact projection exposes service area without requiring a physical address", () => {
  const projection = buildPublicContactProjection({
    contactTruthConfirmed: false,
    serviceArea: "Сочи и Большой Сочи",
    primaryRegion: "Сочи"
  }, { currentPath: "/services/arenda-tehniki" });

  assert.equal(projection.publicRegion, "Сочи и Большой Сочи");
  assert.equal(projection.displayRegion, "Сочи и Большой Сочи");
  assert.equal(projection.hasPublicRegion, true);
  assert.equal(projection.readiness.code, "pending_confirmation");
});

test("contact projection supports confirmed email-only public contacts", () => {
  const projection = buildPublicContactProjection({
    contactTruthConfirmed: true,
    primaryPhone: "",
    publicEmail: "ecostroycontinet@gmail.com",
    serviceArea: "Краснодарский край",
    activeMessengers: []
  }, { currentPath: "/services/arenda-tehniki" });

  assert.equal(projection.readiness.code, "ready");
  assert.equal(projection.primaryAction.kind, "email");
  assert.equal(projection.primaryAction.href, "mailto:ecostroycontinet@gmail.com");
  assert.equal(projection.phone, "");
  assert.equal(projection.email, "ecostroycontinet@gmail.com");
  assert.deepEqual(projection.publicContactItems, [
    {
      key: "email",
      kind: "email",
      label: "ecostroycontinet@gmail.com",
      href: "mailto:ecostroycontinet@gmail.com"
    }
  ]);
});

test("stage4a wiring keeps contact projection inside shared public renderers", () => {
  const homeSource = readFileSync(new URL("../app/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const rendererSource = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const publicUiSource = readFileSync(new URL("../components/public/public-ui.module.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(homeSource, /StandalonePage/);
  assert.doesNotMatch(homeSource, /contactProjection\.primaryAction/);
  assert.match(rendererSource, /buildPublicContactProjection/);
  assert.match(rendererSource, /ContactAction/);
  assert.match(rendererSource, /PublicContactMeta/);
  assert.match(rendererSource, /publicContactItems/);
  assert.match(rendererSource, /ServiceAreaNote/);
  assert.match(rendererSource, /contactProjection\.hasPublicRegion/);
  assert.match(rendererSource, /const ctaAction = contactProjection\?\.primaryAction/);
  assert.match(rendererSource, /<ContactAction\s+action=\{ctaAction\}/);
  assert.doesNotMatch(rendererSource, /<p className=\{styles\.ctaChip\}/);
  assert.match(publicUiSource, /\.ctaChip:focus-visible/);
  assert.match(rendererSource, /contact-request/);
  assert.match(rendererSource, /data-contact-binding-mode/);
  assert.match(rendererSource, /data-contact-consistency-token/);
});

import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../lib/content-core/content-types.js";
import {
  userCanPublish,
  userCanPublishEntity,
  userCanPublishRevision
} from "../lib/auth/roles.js";

test("publish role matrix keeps global publish reserved for superadmin", () => {
  assert.equal(userCanPublish({ role: "superadmin" }), true);
  assert.equal(userCanPublish({ role: "seo_manager" }), false);
  assert.equal(userCanPublish({ role: "business_owner" }), false);
});

test("seo manager can publish only page entities", () => {
  const seoUser = { role: "seo_manager" };

  assert.equal(userCanPublishEntity(seoUser, ENTITY_TYPES.PAGE), true);
  assert.equal(userCanPublishEntity(seoUser, ENTITY_TYPES.SERVICE), false);
  assert.equal(userCanPublishEntity(seoUser, ENTITY_TYPES.CASE), false);
  assert.equal(userCanPublishEntity(seoUser, ENTITY_TYPES.GLOBAL_SETTINGS), false);
});

test("revision-level publish helper keeps seo manager inside reviewed pages only", () => {
  const seoUser = { role: "seo_manager" };

  assert.equal(
    userCanPublishRevision(seoUser, ENTITY_TYPES.PAGE, { state: "review" }),
    true
  );
  assert.equal(
    userCanPublishRevision(seoUser, ENTITY_TYPES.PAGE, { state: "draft" }),
    false
  );
  assert.equal(
    userCanPublishRevision(seoUser, ENTITY_TYPES.SERVICE, { state: "review" }),
    false
  );
});

test("superadmin keeps revision-level publish access for every entity type", () => {
  const superadmin = { role: "superadmin" };

  assert.equal(
    userCanPublishRevision(superadmin, ENTITY_TYPES.PAGE, { state: "draft" }),
    true
  );
  assert.equal(
    userCanPublishRevision(superadmin, ENTITY_TYPES.SERVICE, { state: "review" }),
    true
  );
});

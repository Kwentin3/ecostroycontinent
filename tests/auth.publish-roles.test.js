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

test("seo manager can publish every content entity type", () => {
  const seoUser = { role: "seo_manager" };

  for (const entityType of Object.values(ENTITY_TYPES)) {
    assert.equal(userCanPublishEntity(seoUser, entityType), true, entityType);
  }
});

test("revision-level publish helper lets seo publish only approved review revisions", () => {
  const seoUser = { role: "seo_manager" };

  for (const entityType of Object.values(ENTITY_TYPES)) {
    assert.equal(
      userCanPublishRevision(seoUser, entityType, { state: "review", ownerApprovalStatus: "approved" }),
      true,
      entityType
    );
  }

  assert.equal(
    userCanPublishRevision(seoUser, ENTITY_TYPES.MEDIA_ASSET, { state: "review", ownerApprovalStatus: "pending" }),
    false
  );
  assert.equal(
    userCanPublishRevision(seoUser, ENTITY_TYPES.SERVICE, { state: "draft", ownerApprovalStatus: "approved" }),
    false
  );
  assert.equal(
    userCanPublishRevision(seoUser, ENTITY_TYPES.PAGE, { state: "published", ownerApprovalStatus: "approved" }),
    false
  );
  assert.equal(
    userCanPublishRevision(seoUser, ENTITY_TYPES.PAGE),
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

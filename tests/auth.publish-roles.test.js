import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../lib/content-core/content-types.js";
import { AUTH_PERMISSIONS, AUTH_ROLES, canUser } from "../lib/auth/policy.js";
import {
  userCanEditContent,
  userCanOwnerApprove,
  userCanPublish,
  userCanPublishEntity,
  userCanReadAdminMediaPreview,
  userCanRollback,
  userCanRunMaintenancePurge,
  userCanPublishRevision
} from "../lib/auth/roles.js";

test("auth policy is the canonical permission matrix behind runtime role helpers", () => {
  const superadmin = { role: AUTH_ROLES.SUPERADMIN };
  const seoUser = { role: AUTH_ROLES.SEO_MANAGER };
  const owner = { role: AUTH_ROLES.BUSINESS_OWNER };

  assert.equal(canUser(seoUser, AUTH_PERMISSIONS.CONTENT_EDIT), userCanEditContent(seoUser));
  assert.equal(canUser(owner, AUTH_PERMISSIONS.OWNER_APPROVE), userCanOwnerApprove(owner));
  assert.equal(canUser(superadmin, AUTH_PERMISSIONS.REVISION_ROLLBACK), userCanRollback(superadmin));
  assert.equal(canUser(superadmin, AUTH_PERMISSIONS.MAINTENANCE_PURGE), userCanRunMaintenancePurge(superadmin));
});

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

test("review-scoped media preview permission does not turn owner into an editor", () => {
  const owner = { role: AUTH_ROLES.BUSINESS_OWNER };

  assert.equal(userCanEditContent(owner), false);
  assert.equal(userCanReadAdminMediaPreview(owner, { reviewVisible: false }), false);
  assert.equal(userCanReadAdminMediaPreview(owner, { reviewVisible: true }), true);
  assert.equal(userCanReadAdminMediaPreview({ role: AUTH_ROLES.SEO_MANAGER }, { reviewVisible: false }), true);
});

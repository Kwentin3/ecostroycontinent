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
  userCanExecuteRemovalSweep,
  userCanRunMaintenancePurge,
  userCanViewRemovalSweep,
  userCanPublishRevision,
  userCanUnpublish
} from "../lib/auth/roles.js";

test("auth policy is the canonical permission matrix behind runtime role helpers", () => {
  const superadmin = { role: AUTH_ROLES.SUPERADMIN };
  const seoUser = { role: AUTH_ROLES.SEO_MANAGER };
  const owner = { role: AUTH_ROLES.BUSINESS_OWNER };

  assert.equal(canUser(seoUser, AUTH_PERMISSIONS.CONTENT_EDIT), userCanEditContent(seoUser));
  assert.equal(canUser(owner, AUTH_PERMISSIONS.OWNER_APPROVE), userCanOwnerApprove(owner));
  assert.equal(canUser(superadmin, AUTH_PERMISSIONS.REVISION_ROLLBACK), userCanRollback(superadmin));
  assert.equal(canUser(superadmin, AUTH_PERMISSIONS.MAINTENANCE_PURGE), userCanRunMaintenancePurge(superadmin));
  assert.equal(canUser(owner, AUTH_PERMISSIONS.REMOVAL_SWEEP_EXECUTE), userCanExecuteRemovalSweep(owner));
});

test("removal sweep permissions stay narrow and role-specific", () => {
  const superadmin = { role: AUTH_ROLES.SUPERADMIN };
  const seoUser = { role: AUTH_ROLES.SEO_MANAGER };
  const owner = { role: AUTH_ROLES.BUSINESS_OWNER };

  assert.equal(userCanViewRemovalSweep(superadmin), true);
  assert.equal(userCanViewRemovalSweep(seoUser), true);
  assert.equal(userCanViewRemovalSweep(owner), true);
  assert.equal(userCanExecuteRemovalSweep(superadmin), true);
  assert.equal(userCanExecuteRemovalSweep(owner), true);
  assert.equal(userCanExecuteRemovalSweep(seoUser), false);
  assert.equal(userCanRunMaintenancePurge(owner), false);
  assert.equal(userCanEditContent(owner), false);
});

test("publish role matrix keeps global publish reserved for superadmin", () => {
  assert.equal(userCanPublish({ role: "superadmin" }), true);
  assert.equal(userCanPublish({ role: "seo_manager" }), false);
  assert.equal(userCanPublish({ role: "business_owner" }), false);
});

test("unpublish role matrix is global for seo without granting maintenance publish", () => {
  const seoUser = { role: "seo_manager" };
  const owner = { role: "business_owner" };
  const superadmin = { role: "superadmin" };
  const unpublishableTypes = [
    ENTITY_TYPES.PAGE,
    ENTITY_TYPES.SERVICE,
    ENTITY_TYPES.EQUIPMENT,
    ENTITY_TYPES.CASE,
    ENTITY_TYPES.GALLERY,
    ENTITY_TYPES.MEDIA_ASSET
  ];

  for (const entityType of unpublishableTypes) {
    assert.equal(userCanUnpublish(seoUser, entityType), true, entityType);
    assert.equal(userCanUnpublish(superadmin, entityType), true, entityType);
    assert.equal(userCanUnpublish(owner, entityType), false, entityType);
  }

  assert.equal(userCanUnpublish(seoUser, ENTITY_TYPES.GLOBAL_SETTINGS), false);
  assert.equal(userCanPublish(seoUser), false);
  assert.equal(userCanRollback(seoUser), false);
  assert.equal(userCanRunMaintenancePurge(seoUser), false);
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

import test from "node:test";
import assert from "node:assert/strict";

import { AUDIT_EVENT_KEYS } from "../lib/content-core/content-types.js";
import { BootstrapSuperadminError, bootstrapSuperadminCredentials, renderBootstrapRevealHtml } from "../lib/auth/superadmin-bootstrap.js";

function makeConfig(overrides = {}) {
  return {
    bootstrapSuperadminConfigured: true,
    bootstrapSuperadminUsername: "superadmin",
    bootstrapSuperadminDisplayName: "Системный суперадмин",
    bootstrapSuperadminAccessToken: "bootstrap-token",
    ...overrides
  };
}

test("bootstrapSuperadminCredentials creates the reserved superadmin and redacts secret material from audit", async () => {
  const auditEvents = [];
  const createdUsers = [];

  const result = await bootstrapSuperadminCredentials(
    {
      bootstrapToken: "bootstrap-token",
      confirmationAccepted: true
    },
    {
      config: makeConfig(),
      findUserByUsername: async () => null,
      createUser: async (input) => {
        createdUsers.push(input);
        return {
          id: "user_1",
          username: input.username,
          displayName: input.displayName,
          role: input.role
        };
      },
      writeAuditEvent: async (input) => {
        auditEvents.push(input);
      },
      deleteUser: async () => {},
      passwordFactory: () => "generated-secret",
      traceIdFactory: () => "trace_1"
    }
  );

  assert.equal(result.targetLogin, "superadmin");
  assert.equal(result.generatedPassword, "generated-secret");
  assert.equal(result.traceId, "trace_1");
  assert.equal(createdUsers.length, 1);
  assert.equal(createdUsers[0].username, "superadmin");
  assert.equal(createdUsers[0].role, "superadmin");
  assert.ok(createdUsers[0].passwordHash);
  assert.notEqual(createdUsers[0].passwordHash, "generated-secret");

  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].eventKey, AUDIT_EVENT_KEYS.SUPERADMIN_CREDENTIAL_BOOTSTRAPPED);
  assert.equal(auditEvents[0].details.secretMaterialIncluded, false);
  assert.equal(auditEvents[0].details.targetLogin, "superadmin");
  assert.ok(!JSON.stringify(auditEvents).includes("generated-secret"));
});

test("bootstrapSuperadminCredentials rejects a missing confirmation and writes a blocked audit event", async () => {
  const auditEvents = [];

  await assert.rejects(
    () =>
      bootstrapSuperadminCredentials(
        {
          bootstrapToken: "bootstrap-token",
          confirmationAccepted: false
        },
        {
          config: makeConfig(),
          findUserByUsername: async () => null,
          createUser: async () => {
            throw new Error("should not be called");
          },
          writeAuditEvent: async (input) => {
            auditEvents.push(input);
          },
          deleteUser: async () => {},
          traceIdFactory: () => "trace_2"
        }
      ),
    (error) => error instanceof BootstrapSuperadminError && error.code === "CONFIRMATION_REQUIRED"
  );

  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].eventKey, AUDIT_EVENT_KEYS.SUPERADMIN_CREDENTIAL_BOOTSTRAP_BLOCKED);
  assert.equal(auditEvents[0].details.failureCode, "CONFIRMATION_REQUIRED");
  assert.equal(auditEvents[0].details.secretMaterialIncluded, false);
});

test("bootstrapSuperadminCredentials rejects a wrong authority token and stays secret-free", async () => {
  const auditEvents = [];

  await assert.rejects(
    () =>
      bootstrapSuperadminCredentials(
        {
          bootstrapToken: "wrong-token",
          confirmationAccepted: true
        },
        {
          config: makeConfig(),
          findUserByUsername: async () => null,
          createUser: async () => {
            throw new Error("should not be called");
          },
          writeAuditEvent: async (input) => {
            auditEvents.push(input);
          },
          deleteUser: async () => {},
          traceIdFactory: () => "trace_3"
        }
      ),
    (error) => error instanceof BootstrapSuperadminError && error.code === "AUTHORITY_FORBIDDEN"
  );

  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].details.failureCode, "AUTHORITY_FORBIDDEN");
  assert.ok(!JSON.stringify(auditEvents).includes("wrong-token"));
});

test("bootstrapSuperadminCredentials fails closed when the reserved target identity already exists", async () => {
  const auditEvents = [];
  let createCalled = false;

  await assert.rejects(
    () =>
      bootstrapSuperadminCredentials(
        {
          bootstrapToken: "bootstrap-token",
          confirmationAccepted: true
        },
        {
          config: makeConfig(),
          findUserByUsername: async () => ({
            id: "user_existing",
            username: "superadmin"
          }),
          createUser: async () => {
            createCalled = true;
            throw new Error("should not be called");
          },
          writeAuditEvent: async (input) => {
            auditEvents.push(input);
          },
          deleteUser: async () => {},
          traceIdFactory: () => "trace_4"
        }
      ),
    (error) => error instanceof BootstrapSuperadminError && error.code === "BOOTSTRAP_ALREADY_EXISTS"
  );

  assert.equal(createCalled, false);
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].details.failureCode, "BOOTSTRAP_ALREADY_EXISTS");
});

test("renderBootstrapRevealHtml includes the human-only reveal payload and no hidden caching instructions", () => {
  const html = renderBootstrapRevealHtml({
    targetLogin: "superadmin",
    generatedPassword: "generated-secret",
    traceId: "trace_5"
  });

  assert.ok(html.includes("generated-secret"));
  assert.ok(html.includes("superadmin"));
  assert.ok(html.includes("trace_5"));
  assert.ok(html.includes("noindex, nofollow"));
});

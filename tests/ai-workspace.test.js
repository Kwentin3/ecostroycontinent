import test from "node:test";
import assert from "node:assert/strict";

import { assemblePromptPacket } from "../lib/ai-workspace/prompt.js";
import {
  applyAcceptedMemoryDelta,
  readMemoryCardSlice
} from "../lib/ai-workspace/memory-card.js";

function makeSessionRow(overrides = {}) {
  return {
    id: "session_1",
    user_id: "user_1",
    expires_at: new Date("2026-04-06T13:00:00.000Z"),
    created_at: new Date("2026-04-06T12:00:00.000Z"),
    workspace_memory_card_updated_at: new Date("2026-04-06T12:05:00.000Z"),
    username: "seo_manager",
    display_name: "SEO Manager",
    role: "seo_manager",
    workspace_memory_card: {
      schemaVersion: "v1",
      sessionIdentity: {
        sessionId: "session_1",
        entityType: "service",
        entityId: "service_1",
        actor: {
          id: "user_1",
          username: "seo_manager",
          displayName: "SEO Manager",
          role: "seo_manager"
        },
        timestamps: {
          sessionCreatedAt: "2026-04-06T12:00:00.000Z",
          memoryCardUpdatedAt: "2026-04-06T12:05:00.000Z",
          expiresAt: "2026-04-07T12:00:00.000Z"
        },
        baseRevisionId: "rev_existing",
        routeLocked: true,
        entityLocked: true
      },
      editorialIntent: {
        changeIntent: "Refresh the service copy.",
        editorialGoal: "Maintain the service landing.",
        variantDirection: "hero-first"
      },
      proofSelection: {
        selectedMedia: ["media_1"],
        selectedCaseIds: ["case_1"],
        selectedGalleryIds: ["gallery_1"]
      },
      artifactState: {
        candidatePointer: {
          candidateId: "service_candidate_1",
          revisionId: "rev_2",
          routeFamily: "service"
        },
        specVersion: "v1",
        previewMode: "tablet",
        verificationSummary: "Ready for review.",
        reviewStatus: "review_requested",
        derivedArtifactSlice: {
          candidateId: "service_candidate_1",
          baseRevisionId: "rev_existing",
          revisionId: "rev_2",
          routeFamily: "service",
          specVersion: "v1",
          verificationSummary: "Ready for review.",
          reviewStatus: "review_requested"
        }
      },
      editorialDecisions: {
        acceptedDecisions: ["Keep the published slug"],
        rejectedDirections: ["Add FAQ blocks"],
        activeBlockers: [],
        warnings: ["Proof path should stay visible."]
      },
      traceState: {
        lastLlmTraceId: "trace_1",
        requestId: "request_1",
        generationTimestamp: "2026-04-06T12:06:00.000Z"
      },
      archivePointer: {
        pointer: "request:request_1",
        previousRunId: "request_0",
        previousCandidateId: "service_candidate_0",
        previousRevisionId: "rev_1"
      },
      recentTurn: {
        lastChange: "Refresh the service copy.",
        lastRejection: "",
        lastBlocker: "",
        generationOutcome: "ok"
      }
    },
    ...overrides
  };
}

test("assemblePromptPacket keeps one base packet shape with action-specific slices", () => {
  const requestScope = {
    workspace: "service_landing",
    action: "generate_candidate",
    routeFamily: "service"
  };
  const memoryContext = {
    sessionIdentity: {
      sessionId: "session_1"
    }
  };
  const canonicalContext = {
    entityId: "service_1",
    baseRevisionId: "rev_base"
  };
  const artifactContract = {
    artifactClass: "service_landing_candidate_payload",
    schemaId: "service_landing_candidate_payload.v1",
    schemaVersion: "v1"
  };
  const actionSlices = [
    {
      id: "service_landing_generation",
      title: "Service landing generation",
      content: ["Use only service truth."],
      prompt: "should not leak",
      requestScope: { workspace: "wrong" },
      artifactContract: { schemaId: "wrong" }
    }
  ];
  const requestScopeSnapshot = structuredClone(requestScope);
  const memoryContextSnapshot = structuredClone(memoryContext);
  const canonicalContextSnapshot = structuredClone(canonicalContext);
  const artifactContractSnapshot = structuredClone(artifactContract);
  const actionSlicesSnapshot = structuredClone(actionSlices);

  const packet = assemblePromptPacket({
    requestScope,
    memoryContext,
    canonicalContext,
    artifactContract,
    actionSlices
  });

  assert.deepEqual(requestScope, requestScopeSnapshot);
  assert.deepEqual(memoryContext, memoryContextSnapshot);
  assert.deepEqual(canonicalContext, canonicalContextSnapshot);
  assert.deepEqual(artifactContract, artifactContractSnapshot);
  assert.deepEqual(actionSlices, actionSlicesSnapshot);
  assert.deepEqual(Object.keys(packet).sort(), [
    "actionSlices",
    "artifactContract",
    "canonicalContext",
    "memoryContext",
    "prompt",
    "requestScope"
  ]);
  assert.equal(packet.requestScope.workspace, "service_landing");
  assert.equal(packet.requestScope.action, "generate_candidate");
  assert.deepEqual(packet.actionSlices[0], {
    id: "service_landing_generation",
    title: "Service landing generation",
    content: ["Use only service truth."]
  });
  assert.match(packet.prompt, /# Request scope/);
  assert.match(packet.prompt, /# Memory context/);
  assert.match(packet.prompt, /# Canonical context/);
  assert.match(packet.prompt, /Use only service truth\./);
});

test("readMemoryCardSlice normalizes stored session state and overlays the current workspace context", async () => {
  const queries = [];
  const storedCard = makeSessionRow().workspace_memory_card;
  const query = async (sql, params = []) => {
    queries.push({ sql, params });

    if (/SELECT s\.id/.test(sql)) {
      return {
        rows: [
          makeSessionRow({
            workspace_memory_card: {
              ...storedCard,
              chatHistory: ["provider raw chat must not leak"],
              providerPayload: {
                traceId: "provider_trace_1"
              }
            }
          })
        ]
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  };

  const slice = await readMemoryCardSlice(
    {
      entityType: "service",
      entityId: "service_1",
      baseRevisionId: "rev_base",
      routeLocked: true,
      entityLocked: true,
      changeIntent: "Generate a fresher candidate.",
      editorialGoal: "Maintain the service landing.",
      selectedCaseIds: ["case_2"],
      selectedGalleryIds: ["gallery_2"],
      selectedMedia: ["media_2"],
      previewMode: "desktop"
    },
    {
      sessionId: "session_1",
      query,
      actor: {
        id: "user_1",
        username: "seo_manager",
        displayName: "SEO Manager",
        role: "seo_manager"
      }
    }
  );

  assert.equal(queries.length, 1);
  assert.deepEqual(Object.keys(slice).sort(), [
    "archivePointer",
    "artifactState",
    "editorialDecisions",
    "editorialIntent",
    "proofSelection",
    "recentTurn",
    "schemaVersion",
    "sessionIdentity",
    "traceState"
  ]);
  assert.deepEqual(Object.keys(slice.artifactState).sort(), [
    "candidatePointer",
    "derivedArtifactSlice",
    "previewMode",
    "reviewStatus",
    "specVersion",
    "verificationSummary"
  ]);
  assert.deepEqual(Object.keys(slice.artifactState.derivedArtifactSlice).sort(), [
    "baseRevisionId",
    "candidateId",
    "reviewStatus",
    "revisionId",
    "routeFamily",
    "specVersion",
    "verificationSummary"
  ]);
  assert.equal(slice.sessionIdentity.sessionId, "session_1");
  assert.equal(slice.sessionIdentity.baseRevisionId, "rev_base");
  assert.equal(slice.sessionIdentity.routeLocked, true);
  assert.equal(slice.sessionIdentity.entityLocked, true);
  assert.equal(slice.editorialIntent.changeIntent, "Generate a fresher candidate.");
  assert.deepEqual(slice.proofSelection.selectedCaseIds, ["case_2"]);
  assert.deepEqual(slice.proofSelection.selectedGalleryIds, ["gallery_2"]);
  assert.deepEqual(slice.proofSelection.selectedMedia, ["media_2"]);
  assert.equal(slice.artifactState.reviewStatus, "review_requested");
  assert.equal(slice.traceState.requestId, "request_1");
  assert.equal(slice.recentTurn.generationOutcome, "ok");
});

test("applyAcceptedMemoryDelta persists an accepted workspace delta into the session row", async () => {
  const statements = [];
  let storedCard = makeSessionRow().workspace_memory_card;
  const query = async (sql, params = []) => {
    statements.push({ sql, params });

    if (/SELECT s\.id/.test(sql)) {
      return {
        rows: [
          makeSessionRow({
            workspace_memory_card: storedCard
          })
        ]
      };
    }

    if (/UPDATE app_sessions/.test(sql)) {
      storedCard = JSON.parse(params[1]);
      return {
        rows: []
      };
    }

    throw new Error(`Unexpected query: ${sql}`);
  };

  const next = await applyAcceptedMemoryDelta(
    {
      entityType: "service",
      entityId: "service_1",
      baseRevisionId: "rev_base",
      routeLocked: true,
      entityLocked: true,
      actor: {
        id: "user_1",
        username: "seo_manager",
        displayName: "SEO Manager",
        role: "seo_manager"
      },
      delta: {
        editorialIntent: {
          changeIntent: "Generate a candidate and submit it."
        },
        artifactState: {
          reviewStatus: "review_requested"
        },
        traceState: {
          lastLlmTraceId: "trace_2",
          requestId: "request_2",
          generationTimestamp: "2026-04-06T12:10:00.000Z"
        },
        recentTurn: {
          generationOutcome: "ok"
        }
      }
    },
    {
      sessionId: "session_1",
      query
    }
  );

  const reread = await readMemoryCardSlice(
    {
      entityType: "service",
      entityId: "service_1",
      baseRevisionId: "rev_base",
      routeLocked: true,
      entityLocked: true
    },
    {
      sessionId: "session_1",
      query,
      actor: {
        id: "user_1",
        username: "seo_manager",
        displayName: "SEO Manager",
        role: "seo_manager"
      }
    }
  );

  const updateStatement = statements.find((entry) => /UPDATE app_sessions/.test(entry.sql));
  const persistedPayload = JSON.parse(updateStatement.params[1]);

  assert.equal(next.sessionIdentity.baseRevisionId, "rev_base");
  assert.equal(next.artifactState.reviewStatus, "review_requested");
  assert.equal(next.traceState.requestId, "request_2");
  assert.equal(reread.sessionIdentity.baseRevisionId, "rev_base");
  assert.equal(reread.artifactState.reviewStatus, "review_requested");
  assert.equal(reread.artifactState.derivedArtifactSlice?.reviewStatus, "review_requested");
  assert.equal(reread.traceState.requestId, "request_2");
  assert.equal(statements.filter((entry) => /UPDATE app_sessions/.test(entry.sql)).length, 1);
  assert.equal(persistedPayload.sessionIdentity.timestamps.memoryCardUpdatedAt.length > 0, true);
  assert.equal(persistedPayload.artifactState.reviewStatus, "review_requested");
  assert.equal(persistedPayload.traceState.lastLlmTraceId, "trace_2");
});

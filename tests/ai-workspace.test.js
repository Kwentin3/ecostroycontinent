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
  const packet = assemblePromptPacket({
    requestScope: {
      workspace: "service_landing",
      action: "generate_candidate",
      routeFamily: "service"
    },
    memoryContext: {
      sessionIdentity: {
        sessionId: "session_1"
      }
    },
    canonicalContext: {
      entityId: "service_1",
      baseRevisionId: "rev_base"
    },
    artifactContract: {
      artifactClass: "service_landing_candidate_payload",
      schemaId: "service_landing_candidate_payload.v1",
      schemaVersion: "v1"
    },
    actionSlices: [
      {
        id: "service_landing_generation",
        title: "Service landing generation",
        content: ["Use only service truth."]
      }
    ]
  });

  assert.equal(packet.requestScope.workspace, "service_landing");
  assert.equal(packet.requestScope.action, "generate_candidate");
  assert.equal(packet.actionSlices.length, 1);
  assert.equal(packet.actionSlices[0].id, "service_landing_generation");
  assert.match(packet.prompt, /# Request scope/);
  assert.match(packet.prompt, /# Memory context/);
  assert.match(packet.prompt, /# Canonical context/);
  assert.match(packet.prompt, /Use only service truth\./);
});

test("readMemoryCardSlice normalizes stored session state and overlays the current workspace context", async () => {
  const queries = [];
  const query = async (sql, params = []) => {
    queries.push({ sql, params });

    if (/SELECT s\.id/.test(sql)) {
      return {
        rows: [makeSessionRow()]
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
  const query = async (sql, params = []) => {
    statements.push({ sql, params });

    if (/SELECT s\.id/.test(sql)) {
      return {
        rows: [makeSessionRow()]
      };
    }

    if (/UPDATE app_sessions/.test(sql)) {
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

  const updateStatement = statements.find((entry) => /UPDATE app_sessions/.test(entry.sql));
  const persistedPayload = JSON.parse(updateStatement.params[1]);

  assert.equal(next.sessionIdentity.baseRevisionId, "rev_base");
  assert.equal(next.artifactState.reviewStatus, "review_requested");
  assert.equal(next.traceState.requestId, "request_2");
  assert.equal(persistedPayload.sessionIdentity.timestamps.memoryCardUpdatedAt.length > 0, true);
  assert.equal(persistedPayload.artifactState.reviewStatus, "review_requested");
  assert.equal(persistedPayload.traceState.lastLlmTraceId, "trace_2");
});

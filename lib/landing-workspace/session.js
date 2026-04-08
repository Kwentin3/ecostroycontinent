import { readMemoryCardSlice, readWorkspaceSessionRecord, applyAcceptedMemoryDelta } from "../ai-workspace/memory-card.js";
import { ENTITY_TYPES } from "../content-core/content-types.js";
import { query as defaultQuery } from "../db/client.js";
import { getCurrentSessionId } from "../auth/session.js";
import { buildLandingWorkspaceWorkspaceMemoryDelta } from "./landing.js";

export const LANDING_WORKSPACE_SESSION_GUARD_CONFLICT = "blocked_by_active_page_session";

function hasAnchoredPage(record, pageId) {
  return record?.workspace_memory_card?.sessionIdentity?.entityId === pageId;
}

function normalizeAnchoredSlice(slice, pageId, extra = {}) {
  if (!slice || typeof slice !== "object") {
    return slice;
  }

  return {
    ...slice,
    ...extra,
    sessionIdentity: {
      ...(slice.sessionIdentity ?? {}),
      entityType: ENTITY_TYPES.PAGE,
      entityId: pageId,
      routeLocked: true,
      entityLocked: Boolean(pageId)
    }
  };
}

function mapConflictingSession(row, pageId) {
  if (!row) {
    return null;
  }

  return {
    status: LANDING_WORKSPACE_SESSION_GUARD_CONFLICT,
    pageId,
    activeSessionId: row.id,
    actorUserId: row.user_id ?? "",
    actorDisplayName: row.display_name ?? row.username ?? "",
    updatedAt: row.workspace_memory_card_updated_at
      ? new Date(row.workspace_memory_card_updated_at).toISOString()
      : row.created_at
        ? new Date(row.created_at).toISOString()
        : ""
  };
}

export async function findConflictingLandingWorkspaceSession(pageId, input = {}, deps = {}) {
  if (!pageId) {
    return null;
  }

  const sessionId = input.sessionId || deps.sessionId || await getCurrentSessionId();
  const query = deps.query ?? defaultQuery;
  const result = await query(
    `SELECT s.id,
            s.user_id,
            s.created_at,
            s.workspace_memory_card_updated_at,
            u.username,
            u.display_name
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.expires_at > NOW()
       AND u.active = TRUE
       AND s.id <> $2
       AND s.workspace_memory_card->'sessionIdentity'->>'entityType' = $3
       AND s.workspace_memory_card->'sessionIdentity'->>'entityId' = $1
     ORDER BY COALESCE(s.workspace_memory_card_updated_at, s.created_at) DESC
     LIMIT 1`,
    [pageId, sessionId ?? "", ENTITY_TYPES.PAGE]
  );

  return mapConflictingSession(result.rows[0] ?? null, pageId);
}

export async function readLandingWorkspaceSession(pageId, input = {}, deps = {}) {
  const sessionId = input.sessionId || deps.sessionId || await getCurrentSessionId();
  const actor = input.actor || deps.actor || null;
  const readSlice = deps.readMemoryCardSlice ?? readMemoryCardSlice;
  const readSessionRow = deps.readWorkspaceSessionRecord ?? readWorkspaceSessionRecord;
  const applyDelta = deps.applyAcceptedMemoryDelta ?? applyAcceptedMemoryDelta;
  const findConflict = deps.findConflictingLandingWorkspaceSession ?? findConflictingLandingWorkspaceSession;
  const memorySlice = await readSlice({
    entityType: ENTITY_TYPES.PAGE,
    entityId: pageId,
    baseRevisionId: input.baseRevisionId ?? "",
    routeLocked: true,
    entityLocked: Boolean(pageId),
    changeIntent: input.changeIntent ?? "",
    editorialGoal: input.editorialGoal ?? "",
    variantDirection: input.variantDirection ?? "",
    selectedMedia: input.selectedMedia ?? [],
    selectedCaseIds: input.selectedCaseIds ?? [],
    selectedGalleryIds: input.selectedGalleryIds ?? [],
    previewMode: input.previewMode ?? "desktop",
    actor
  }, {
    ...deps,
    sessionId,
    actor
  });

  if (!sessionId) {
    return memorySlice;
  }

  const sessionRow = deps.sessionRow ?? await readSessionRow(sessionId, deps);

  if (hasAnchoredPage(sessionRow, pageId)) {
    return normalizeAnchoredSlice(memorySlice, pageId, {
      sessionGuard: {
        status: "anchored",
        pageId
      }
    });
  }

  const sessionConflict = deps.sessionConflict ?? await findConflict(pageId, { sessionId }, deps);

  if (sessionConflict) {
    return {
      ...memorySlice,
      sessionGuard: sessionConflict
    };
  }

  const updatedSlice = await applyDelta({
    entityType: ENTITY_TYPES.PAGE,
    entityId: pageId,
    baseRevisionId: input.baseRevisionId ?? "",
    routeLocked: true,
    entityLocked: Boolean(pageId),
    actor,
    delta: buildLandingWorkspaceWorkspaceMemoryDelta({
      sessionIdentity: {
        entityType: ENTITY_TYPES.PAGE,
        entityId: pageId,
        baseRevisionId: input.baseRevisionId ?? "",
        routeLocked: true,
        entityLocked: Boolean(pageId),
        actor
      },
      editorialIntent: {
        changeIntent: input.changeIntent ?? "",
        editorialGoal: input.editorialGoal ?? "",
        variantDirection: input.variantDirection ?? ""
      },
      proofSelection: {
        selectedMedia: input.selectedMedia ?? [],
        selectedCaseIds: input.selectedCaseIds ?? [],
        selectedGalleryIds: input.selectedGalleryIds ?? []
      },
      artifactState: {
        previewMode: input.previewMode ?? "desktop"
      }
    })
  }, {
    ...deps,
    sessionId,
    actor
  });

  if (!updatedSlice || typeof updatedSlice !== "object") {
    return updatedSlice;
  }

  return normalizeAnchoredSlice(updatedSlice, pageId, {
    sessionGuard: {
      status: "anchored",
      pageId
    }
  });
}

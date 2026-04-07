import { ENTITY_TYPES } from "../content-core/content-types.js";
import { readMemoryCardSlice, readWorkspaceSessionRecord, applyAcceptedMemoryDelta } from "../ai-workspace/memory-card.js";
import { getCurrentSessionId } from "../auth/session.js";
import { buildLandingWorkspaceWorkspaceMemoryDelta } from "./landing.js";

function hasAnchoredPage(record, pageId) {
  return record?.workspace_memory_card?.sessionIdentity?.entityId === pageId;
}

function normalizeAnchoredSlice(slice, pageId) {
  if (!slice || typeof slice !== "object") {
    return slice;
  }

  return {
    ...slice,
    sessionIdentity: {
      ...(slice.sessionIdentity ?? {}),
      entityType: ENTITY_TYPES.PAGE,
      entityId: pageId,
      routeLocked: true,
      entityLocked: Boolean(pageId)
    }
  };
}

export async function readLandingWorkspaceSession(pageId, input = {}, deps = {}) {
  const sessionId = input.sessionId || deps.sessionId || await getCurrentSessionId();
  const actor = input.actor || deps.actor || null;
  const readSlice = deps.readMemoryCardSlice ?? readMemoryCardSlice;
  const readSessionRow = deps.readWorkspaceSessionRecord ?? readWorkspaceSessionRecord;
  const applyDelta = deps.applyAcceptedMemoryDelta ?? applyAcceptedMemoryDelta;
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
    return normalizeAnchoredSlice(memorySlice, pageId);
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

  return normalizeAnchoredSlice(updatedSlice, pageId);
}

import { getCurrentSessionId, getCurrentUser } from "../auth/session.js";
import { query as defaultQuery } from "../db/client.js";

export const MEMORY_CARD_SCHEMA_VERSION = "v1";

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value) {
  return Boolean(value);
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => asString(item)).filter(Boolean);
}

function normalizeActor(actor = null) {
  if (!actor || typeof actor !== "object") {
    return {
      id: "",
      username: "",
      displayName: "",
      role: ""
    };
  }

  return {
    id: asString(actor.id ?? actor.userId),
    username: asString(actor.username),
    displayName: asString(actor.displayName ?? actor.display_name),
    role: asString(actor.role)
  };
}

function normalizeCandidatePointer(pointer = null) {
  if (!pointer || typeof pointer !== "object") {
    return null;
  }

  const candidateId = asString(pointer.candidateId);
  const revisionId = asString(pointer.revisionId);
  const routeFamily = asString(pointer.routeFamily);

  if (!candidateId && !revisionId && !routeFamily) {
    return null;
  }

  return {
    candidateId,
    revisionId,
    routeFamily
  };
}

function normalizeDerivedArtifactSlice(slice = null) {
  if (!slice || typeof slice !== "object") {
    return null;
  }

  const candidateId = asString(slice.candidateId);
  const baseRevisionId = asString(slice.baseRevisionId);
  const revisionId = asString(slice.revisionId);
  const routeFamily = asString(slice.routeFamily);
  const specVersion = asString(slice.specVersion);
  const verificationSummary = asString(slice.verificationSummary);
  const reviewStatus = asString(slice.reviewStatus);

  if (!candidateId && !baseRevisionId && !revisionId && !routeFamily && !specVersion && !verificationSummary && !reviewStatus) {
    return null;
  }

  return {
    candidateId,
    baseRevisionId,
    revisionId,
    routeFamily,
    specVersion,
    verificationSummary,
    reviewStatus
  };
}

function normalizeVerificationSummary(summary = "") {
  return asString(summary);
}

function normalizeArchivePointer(pointer = null) {
  if (!pointer || typeof pointer !== "object") {
    return {
      pointer: "",
      previousRunId: "",
      previousCandidateId: "",
      previousRevisionId: ""
    };
  }

  return {
    pointer: asString(pointer.pointer),
    previousRunId: asString(pointer.previousRunId),
    previousCandidateId: asString(pointer.previousCandidateId),
    previousRevisionId: asString(pointer.previousRevisionId)
  };
}

function normalizeRecentTurn(turn = null) {
  if (!turn || typeof turn !== "object") {
    return {
      lastChange: "",
      lastRejection: "",
      lastBlocker: "",
      generationOutcome: ""
    };
  }

  return {
    lastChange: asString(turn.lastChange),
    lastRejection: asString(turn.lastRejection),
    lastBlocker: asString(turn.lastBlocker),
    generationOutcome: asString(turn.generationOutcome)
  };
}

function normalizeSessionIdentity(identity = {}, context = {}) {
  const timestamps = identity.timestamps && typeof identity.timestamps === "object"
    ? identity.timestamps
    : {};

  return {
    sessionId: asString(identity.sessionId ?? context.sessionId),
    entityType: asString(identity.entityType ?? context.entityType),
    entityId: asString(identity.entityId ?? context.entityId),
    actor: normalizeActor(identity.actor ?? context.actor),
    timestamps: {
      sessionCreatedAt: asString(timestamps.sessionCreatedAt ?? context.sessionCreatedAt),
      memoryCardUpdatedAt: asString(timestamps.memoryCardUpdatedAt ?? context.memoryCardUpdatedAt),
      expiresAt: asString(timestamps.expiresAt ?? context.expiresAt)
    },
    baseRevisionId: asString(identity.baseRevisionId ?? context.baseRevisionId),
    routeLocked: asBoolean(identity.routeLocked ?? context.routeLocked),
    entityLocked: asBoolean(identity.entityLocked ?? context.entityLocked)
  };
}

function normalizeEditorialIntent(intent = {}, context = {}) {
  return {
    changeIntent: asString(intent.changeIntent ?? context.changeIntent),
    editorialGoal: asString(intent.editorialGoal ?? context.editorialGoal),
    variantDirection: asString(intent.variantDirection ?? context.variantDirection)
  };
}

function normalizeProofSelection(selection = {}, context = {}) {
  return {
    selectedMedia: normalizeList(selection.selectedMedia ?? context.selectedMedia),
    selectedCaseIds: normalizeList(selection.selectedCaseIds ?? context.selectedCaseIds),
    selectedGalleryIds: normalizeList(selection.selectedGalleryIds ?? context.selectedGalleryIds)
  };
}

function normalizeArtifactState(state = {}, context = {}) {
  return {
    candidatePointer: normalizeCandidatePointer(state.candidatePointer ?? context.candidatePointer),
    specVersion: asString(state.specVersion ?? context.specVersion),
    previewMode: asString(state.previewMode ?? context.previewMode) || "desktop",
    verificationSummary: normalizeVerificationSummary(state.verificationSummary ?? context.verificationSummary),
    reviewStatus: asString(state.reviewStatus ?? context.reviewStatus),
    derivedArtifactSlice: normalizeDerivedArtifactSlice(state.derivedArtifactSlice ?? context.derivedArtifactSlice)
  };
}

function normalizeEditorialDecisions(decisions = {}, context = {}) {
  return {
    acceptedDecisions: normalizeList(decisions.acceptedDecisions ?? context.acceptedDecisions),
    rejectedDirections: normalizeList(decisions.rejectedDirections ?? context.rejectedDirections),
    activeBlockers: normalizeList(decisions.activeBlockers ?? context.activeBlockers),
    warnings: normalizeList(decisions.warnings ?? context.warnings)
  };
}

function normalizeTraceState(trace = {}, context = {}) {
  return {
    lastLlmTraceId: asString(trace.lastLlmTraceId ?? context.lastLlmTraceId),
    requestId: asString(trace.requestId ?? context.requestId),
    generationTimestamp: asString(trace.generationTimestamp ?? context.generationTimestamp)
  };
}

function normalizeMemoryCardState(value = {}, context = {}) {
  const current = value && typeof value === "object" ? value : {};

  return {
    schemaVersion: MEMORY_CARD_SCHEMA_VERSION,
    sessionIdentity: normalizeSessionIdentity(current.sessionIdentity, context.sessionIdentity ?? context),
    editorialIntent: normalizeEditorialIntent(current.editorialIntent, context.editorialIntent ?? context),
    proofSelection: normalizeProofSelection(current.proofSelection, context.proofSelection ?? context),
    artifactState: normalizeArtifactState(current.artifactState, context.artifactState ?? context),
    editorialDecisions: normalizeEditorialDecisions(current.editorialDecisions, context.editorialDecisions ?? context),
    traceState: normalizeTraceState(current.traceState, context.traceState ?? context),
    archivePointer: normalizeArchivePointer(current.archivePointer ?? context.archivePointer),
    recentTurn: normalizeRecentTurn(current.recentTurn ?? context.recentTurn)
  };
}

function hasOwn(input = {}, key) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function hasDefinedOwn(input = {}, key) {
  return hasOwn(input, key) && input[key] !== undefined;
}

function overlayWorkspaceContext(card = {}, input = {}, actor = null) {
  const next = normalizeMemoryCardState(card, {});
  const nextIdentity = {
    ...next.sessionIdentity
  };

  if (hasDefinedOwn(input, "sessionId")) {
    nextIdentity.sessionId = asString(input.sessionId);
  }

  if (hasDefinedOwn(input, "entityType")) {
    nextIdentity.entityType = asString(input.entityType);
  }

  if (hasDefinedOwn(input, "entityId")) {
    nextIdentity.entityId = asString(input.entityId);
  }

  if (hasDefinedOwn(input, "baseRevisionId")) {
    nextIdentity.baseRevisionId = asString(input.baseRevisionId);
  }

  if (hasDefinedOwn(input, "routeLocked")) {
    nextIdentity.routeLocked = asBoolean(input.routeLocked);
  }

  if (hasDefinedOwn(input, "entityLocked")) {
    nextIdentity.entityLocked = asBoolean(input.entityLocked);
  }

  if (actor) {
    nextIdentity.actor = normalizeActor(actor);
  } else if (hasOwn(input, "actor")) {
    nextIdentity.actor = normalizeActor(input.actor);
  }

  const nextEditorialIntent = {
    ...next.editorialIntent
  };

  if (hasDefinedOwn(input, "changeIntent")) {
    nextEditorialIntent.changeIntent = asString(input.changeIntent);
  }

  if (hasDefinedOwn(input, "editorialGoal")) {
    nextEditorialIntent.editorialGoal = asString(input.editorialGoal);
  }

  if (hasDefinedOwn(input, "variantDirection")) {
    nextEditorialIntent.variantDirection = asString(input.variantDirection);
  }

  const nextProofSelection = {
    ...next.proofSelection
  };

  if (hasDefinedOwn(input, "selectedMedia")) {
    nextProofSelection.selectedMedia = normalizeList(input.selectedMedia);
  }

  if (hasDefinedOwn(input, "selectedCaseIds")) {
    nextProofSelection.selectedCaseIds = normalizeList(input.selectedCaseIds);
  }

  if (hasDefinedOwn(input, "selectedGalleryIds")) {
    nextProofSelection.selectedGalleryIds = normalizeList(input.selectedGalleryIds);
  }

  const nextArtifactState = {
    ...next.artifactState
  };

  if (hasDefinedOwn(input, "previewMode")) {
    nextArtifactState.previewMode = asString(input.previewMode) || nextArtifactState.previewMode || "desktop";
  }

  if (hasDefinedOwn(input, "specVersion")) {
    nextArtifactState.specVersion = asString(input.specVersion);
  }

  if (hasDefinedOwn(input, "verificationSummary")) {
    nextArtifactState.verificationSummary = asString(input.verificationSummary);
  }

  if (hasDefinedOwn(input, "reviewStatus")) {
    nextArtifactState.reviewStatus = asString(input.reviewStatus);
  }

  if (hasDefinedOwn(input, "candidatePointer")) {
    nextArtifactState.candidatePointer = normalizeCandidatePointer(input.candidatePointer);
  }

  if (hasDefinedOwn(input, "derivedArtifactSlice")) {
    nextArtifactState.derivedArtifactSlice = normalizeDerivedArtifactSlice(input.derivedArtifactSlice);
  }

  const nextEditorialDecisions = {
    ...next.editorialDecisions
  };

  if (hasDefinedOwn(input, "acceptedDecisions")) {
    nextEditorialDecisions.acceptedDecisions = normalizeList(input.acceptedDecisions);
  }

  if (hasDefinedOwn(input, "rejectedDirections")) {
    nextEditorialDecisions.rejectedDirections = normalizeList(input.rejectedDirections);
  }

  if (hasDefinedOwn(input, "activeBlockers")) {
    nextEditorialDecisions.activeBlockers = normalizeList(input.activeBlockers);
  }

  if (hasDefinedOwn(input, "warnings")) {
    nextEditorialDecisions.warnings = normalizeList(input.warnings);
  }

  const nextTraceState = {
    ...next.traceState
  };

  if (hasDefinedOwn(input, "lastLlmTraceId")) {
    nextTraceState.lastLlmTraceId = asString(input.lastLlmTraceId);
  }

  if (hasDefinedOwn(input, "requestId")) {
    nextTraceState.requestId = asString(input.requestId);
  }

  if (hasDefinedOwn(input, "generationTimestamp")) {
    nextTraceState.generationTimestamp = asString(input.generationTimestamp);
  }

  const nextArchivePointer = {
    ...next.archivePointer
  };

  if (hasDefinedOwn(input, "archivePointer")) {
    const archivePointer = normalizeArchivePointer(input.archivePointer);
    nextArchivePointer.pointer = archivePointer.pointer;
    nextArchivePointer.previousRunId = archivePointer.previousRunId;
    nextArchivePointer.previousCandidateId = archivePointer.previousCandidateId;
    nextArchivePointer.previousRevisionId = archivePointer.previousRevisionId;
  }

  const nextRecentTurn = {
    ...next.recentTurn
  };

  if (hasDefinedOwn(input, "recentTurn")) {
    const recentTurn = normalizeRecentTurn(input.recentTurn);
    nextRecentTurn.lastChange = recentTurn.lastChange;
    nextRecentTurn.lastRejection = recentTurn.lastRejection;
    nextRecentTurn.lastBlocker = recentTurn.lastBlocker;
    nextRecentTurn.generationOutcome = recentTurn.generationOutcome;
  }

  return {
    schemaVersion: MEMORY_CARD_SCHEMA_VERSION,
    sessionIdentity: nextIdentity,
    editorialIntent: nextEditorialIntent,
    proofSelection: nextProofSelection,
    artifactState: nextArtifactState,
    editorialDecisions: nextEditorialDecisions,
    traceState: nextTraceState,
    archivePointer: nextArchivePointer,
    recentTurn: nextRecentTurn
  };
}

function buildMemoryCardContext(input = {}) {
  return {
    sessionId: asString(input.sessionId),
    entityType: asString(input.entityType),
    entityId: asString(input.entityId),
    baseRevisionId: asString(input.baseRevisionId),
    routeLocked: asBoolean(input.routeLocked),
    entityLocked: asBoolean(input.entityLocked),
    changeIntent: asString(input.changeIntent),
    editorialGoal: asString(input.editorialGoal),
    variantDirection: asString(input.variantDirection),
    selectedMedia: normalizeList(input.selectedMedia),
    selectedCaseIds: normalizeList(input.selectedCaseIds),
    selectedGalleryIds: normalizeList(input.selectedGalleryIds),
    candidatePointer: normalizeCandidatePointer(input.candidatePointer),
    specVersion: asString(input.specVersion),
    previewMode: asString(input.previewMode),
    verificationSummary: normalizeVerificationSummary(input.verificationSummary),
    reviewStatus: asString(input.reviewStatus),
    derivedArtifactSlice: normalizeDerivedArtifactSlice(input.derivedArtifactSlice),
    acceptedDecisions: normalizeList(input.acceptedDecisions),
    rejectedDirections: normalizeList(input.rejectedDirections),
    activeBlockers: normalizeList(input.activeBlockers),
    warnings: normalizeList(input.warnings),
    lastLlmTraceId: asString(input.lastLlmTraceId),
    requestId: asString(input.requestId),
    generationTimestamp: asString(input.generationTimestamp),
    archivePointer: normalizeArchivePointer(input.archivePointer),
    recentTurn: normalizeRecentTurn(input.recentTurn),
    actor: normalizeActor(input.actor)
  };
}

function buildDefaultMemoryCard(input = {}) {
  const context = buildMemoryCardContext(input);

  return normalizeMemoryCardState({}, {
    sessionIdentity: context,
    editorialIntent: context,
    proofSelection: context,
    artifactState: context,
    editorialDecisions: context,
    traceState: context,
    archivePointer: context.archivePointer,
    recentTurn: context.recentTurn
  });
}

function isMeaningfulValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => isMeaningfulValue(entry));
  }

  return asString(value).length > 0;
}

function mergeDelta(base, delta, context) {
  const next = normalizeMemoryCardState(base, context);
  const normalizedDelta = normalizeMemoryCardState(delta, context);

  return {
    schemaVersion: MEMORY_CARD_SCHEMA_VERSION,
    sessionIdentity: {
      ...next.sessionIdentity,
      ...normalizedDelta.sessionIdentity,
      actor: normalizedDelta.sessionIdentity.actor.id ? normalizedDelta.sessionIdentity.actor : next.sessionIdentity.actor,
      timestamps: {
        ...next.sessionIdentity.timestamps,
        ...normalizedDelta.sessionIdentity.timestamps
      }
    },
    editorialIntent: {
      ...next.editorialIntent,
      ...normalizedDelta.editorialIntent
    },
    proofSelection: {
      ...next.proofSelection,
      ...normalizedDelta.proofSelection
    },
    artifactState: {
      ...next.artifactState,
      ...normalizedDelta.artifactState,
      candidatePointer: normalizedDelta.artifactState.candidatePointer ?? next.artifactState.candidatePointer,
      derivedArtifactSlice: normalizedDelta.artifactState.derivedArtifactSlice ?? next.artifactState.derivedArtifactSlice
    },
    editorialDecisions: {
      ...next.editorialDecisions,
      ...normalizedDelta.editorialDecisions
    },
    traceState: {
      ...next.traceState,
      ...normalizedDelta.traceState
    },
    archivePointer: {
      ...next.archivePointer,
      ...normalizedDelta.archivePointer
    },
    recentTurn: {
      ...next.recentTurn,
      ...normalizedDelta.recentTurn
    }
  };
}

export async function readWorkspaceSessionRecord(sessionId, deps = {}) {
  const query = deps.query ?? defaultQuery;
  const result = await query(
    `SELECT s.id,
            s.user_id,
            s.expires_at,
            s.created_at,
            s.workspace_memory_card,
            s.workspace_memory_card_updated_at,
            u.username,
            u.display_name,
            u.role
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.id = $1
       AND s.expires_at > NOW()
       AND u.active = TRUE`,
    [sessionId]
  );

  return result.rows[0] ?? null;
}

function mapSessionRowToContext(row) {
  if (!row) {
    return {
      sessionId: "",
      actor: null,
      sessionCreatedAt: "",
      expiresAt: "",
      memoryCardUpdatedAt: ""
    };
  }

  return {
    sessionId: row.id,
    actor: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      role: row.role
    },
    sessionCreatedAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : "",
    memoryCardUpdatedAt: row.workspace_memory_card_updated_at ? new Date(row.workspace_memory_card_updated_at).toISOString() : ""
  };
}

export function createDefaultMemoryCardSlice(input = {}) {
  return buildDefaultMemoryCard(input);
}

export async function readMemoryCardSlice(input = {}, deps = {}) {
  const sessionId = asString(input.sessionId || deps.sessionId || await getCurrentSessionId());
  const actor = input.actor || deps.actor || await getCurrentUser();
  const context = buildMemoryCardContext({
    ...input,
    sessionId,
    actor
  });

  if (!sessionId) {
    return buildDefaultMemoryCard(context);
  }

  const row = deps.sessionRow ?? await readWorkspaceSessionRecord(sessionId, deps);

  if (!row) {
    return buildDefaultMemoryCard(context);
  }

  const rowContext = mapSessionRowToContext(row);
  const storedCard = normalizeMemoryCardState(row.workspace_memory_card ?? {}, {
    sessionIdentity: {
      ...context,
      ...rowContext
    },
    editorialIntent: context,
    proofSelection: context,
    artifactState: context,
    editorialDecisions: context,
    traceState: context,
    archivePointer: context.archivePointer,
    recentTurn: context.recentTurn
  });

  return overlayWorkspaceContext(storedCard, {
    ...input,
    sessionId,
    entityType: input.entityType ?? context.entityType ?? rowContext.actor?.entityType ?? "",
    entityId: input.entityId ?? context.entityId ?? "",
    baseRevisionId: input.baseRevisionId ?? context.baseRevisionId ?? "",
    routeLocked: input.routeLocked,
    entityLocked: input.entityLocked,
    changeIntent: input.changeIntent,
    editorialGoal: input.editorialGoal,
    variantDirection: input.variantDirection,
    selectedMedia: input.selectedMedia,
    selectedCaseIds: input.selectedCaseIds,
    selectedGalleryIds: input.selectedGalleryIds,
    previewMode: input.previewMode,
    specVersion: input.specVersion,
    verificationSummary: input.verificationSummary,
    reviewStatus: input.reviewStatus,
    candidatePointer: input.candidatePointer,
    derivedArtifactSlice: input.derivedArtifactSlice,
    acceptedDecisions: input.acceptedDecisions,
    rejectedDirections: input.rejectedDirections,
    activeBlockers: input.activeBlockers,
    warnings: input.warnings,
    lastLlmTraceId: input.lastLlmTraceId,
    requestId: input.requestId,
    generationTimestamp: input.generationTimestamp,
    archivePointer: input.archivePointer,
    recentTurn: input.recentTurn
  }, actor);
}

export async function applyAcceptedMemoryDelta(input = {}, deps = {}) {
  const sessionId = asString(input.sessionId || deps.sessionId || await getCurrentSessionId());
  const actor = input.actor || deps.actor || await getCurrentUser();
  const delta = input.delta ?? {};

  if (!sessionId) {
    throw new Error("AUTH_REQUIRED");
  }

  if (!isMeaningfulValue(delta)) {
    return readMemoryCardSlice({ ...input, sessionId, actor }, deps);
  }

  const current = await readMemoryCardSlice({ ...input, sessionId, actor }, deps);
  const next = mergeDelta(current, delta, {
    sessionIdentity: {
      sessionId,
      actor
    },
    entityType: input.entityType,
    entityId: input.entityId,
    baseRevisionId: input.baseRevisionId,
    routeLocked: input.routeLocked,
    entityLocked: input.entityLocked
  });
  const overlayedNext = overlayWorkspaceContext(next, {
    ...input,
    sessionId,
    baseRevisionId: input.baseRevisionId,
    routeLocked: input.routeLocked,
    entityLocked: input.entityLocked,
    actor
  }, actor);
  const memoryCardUpdatedAt = new Date().toISOString();
  overlayedNext.sessionIdentity.timestamps.memoryCardUpdatedAt = memoryCardUpdatedAt;
  const query = deps.query ?? defaultQuery;

  await query(
    `UPDATE app_sessions
     SET workspace_memory_card = $2::jsonb,
         workspace_memory_card_updated_at = NOW()
     WHERE id = $1`,
    [sessionId, JSON.stringify(overlayedNext)]
  );

  return overlayedNext;
}

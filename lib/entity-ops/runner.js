import fs from "node:fs/promises";
import path from "node:path";

import {
  ENTITY_OPS_KINDS,
  buildDisplayModeFormData,
  buildEntityDeleteFormData,
  buildEntitySaveFormData,
  buildFieldPreviewDiff,
  buildMergedEntitySaveFields,
  buildMediaCreateFormData,
  buildMediaUpdateFormData,
  buildPageWorkspaceRequestBody,
  buildRemovalActionFormData,
  buildRemovalPurgeFormData,
  buildWorkflowOwnerActionFormData,
  buildWorkflowPublishFormData,
  buildWorkflowSubmitFormData
} from "./input.js";

function getCurrentPayload(lookupResult) {
  return lookupResult?.latestRevision?.payload
    || lookupResult?.activePublishedRevision?.payload
    || {};
}

function buildMediaPreviewDiff(currentPayload, operation) {
  const previewDiff = buildFieldPreviewDiff(currentPayload, operation.fields);

  if (operation.filePath) {
    previewDiff.binary = {
      before: currentPayload.storageKey || "<existing binary>",
      after: path.basename(operation.filePath)
    };
  }

  if (operation.sourceUrl) {
    previewDiff.binary = {
      before: currentPayload.storageKey || "<existing binary>",
      after: operation.sourceUrl
    };
  }

  if (operation.collectionsTouched || operation.collectionIds.length > 0) {
    previewDiff.collectionIds = {
      before: "<runtime membership lookup unavailable>",
      after: operation.collectionIds
    };
  }

  return previewDiff;
}

function buildDisplayModePreviewDiff(currentSnapshot, operation) {
  const diff = {};
  const currentMode = String(currentSnapshot?.mode || "");

  if (currentMode !== operation.displayMode) {
    diff.mode = {
      before: currentMode,
      after: operation.displayMode
    };

    if (operation.reason) {
      diff.reason = {
        before: "",
        after: operation.reason
      };
    }
  }

  return diff;
}

function buildPageWorkspacePreviewDiff(currentPayload, operation) {
  if (operation.mode === "save_composition") {
    return buildFieldPreviewDiff(currentPayload, operation.composition);
  }

  if (operation.mode === "save_metadata") {
    return buildFieldPreviewDiff({
      slug: currentPayload.slug || "",
      pageType: currentPayload.pageType || "",
      pageThemeKey: currentPayload.pageThemeKey || "",
      seo: currentPayload.seo || {}
    }, operation.metadata);
  }

  return {
    review: {
      before: "<draft>",
      after: "<submitted>"
    }
  };
}

function buildWorkflowPreviewDiff(operation, lookupResult = null) {
  const revision = operation.revisionId
    ? null
    : lookupResult?.latestRevision ?? null;
  const beforeState = revision?.state || (operation.revisionId ? "<revision>" : "");

  if (operation.mode === "submit_to_review") {
    return {
      state: {
        before: beforeState || "<draft>",
        after: "review"
      }
    };
  }

  if (operation.mode === "approve_owner") {
    return {
      ownerApprovalStatus: {
        before: revision?.ownerApprovalStatus || "<pending>",
        after: "approved"
      }
    };
  }

  return {
    state: {
      before: beforeState || "<review>",
      after: "published"
    }
  };
}

function buildRelationPreviewDiff(currentPayload, field, nextIds) {
  return {
    [field]: {
      before: Array.isArray(currentPayload?.[field]) ? currentPayload[field] : [],
      after: nextIds
    }
  };
}

function serializeRevisionSummary(revision) {
  if (!revision) {
    return null;
  }

  return {
    id: revision.id,
    revisionNumber: revision.revisionNumber,
    state: revision.state,
    ownerReviewRequired: Boolean(revision.ownerReviewRequired),
    ownerApprovalStatus: revision.ownerApprovalStatus ?? null,
    previewStatus: revision.previewStatus ?? null,
    updatedAt: revision.updatedAt ?? null,
    publishedAt: revision.publishedAt ?? null,
    payload: revision.payload ?? null
  };
}

function buildRemovalPreviewDiff(markedForRemoval, operation) {
  if (operation.mode === "mark") {
    return markedForRemoval
      ? {}
      : {
          markedForRemovalAt: {
            before: "",
            after: "<set by runtime>"
          }
        };
  }

  if (operation.mode === "unmark") {
    return markedForRemoval
      ? {
          markedForRemovalAt: {
            before: "<marked>",
            after: ""
          }
        }
      : {};
  }

  return {
    purge: {
      before: "<marked graph>",
      after: "<deleted>"
    }
  };
}

export function planEntityOperation(operation, lookupResult = null) {
  const matched = Boolean(lookupResult?.matched && lookupResult?.entity?.id);
  const currentPayload = getCurrentPayload(lookupResult);
  const previewDiff = buildFieldPreviewDiff(currentPayload, operation.fields);
  const hasFieldChanges = Object.keys(previewDiff).length > 0;

  if (operation.mode === "delete") {
    if (!matched) {
      return {
        ok: false,
        action: "blocked",
        reason: "Entity was not found for delete mode.",
        matched: false,
        entityId: null,
        previewDiff: {}
      };
    }

    return {
      ok: true,
      action: "delete",
      matched: true,
      entityId: lookupResult.entity.id,
      previewDiff: {}
    };
  }

  if (operation.mode === "create") {
    if (matched) {
      return {
        ok: false,
        action: "blocked",
        reason: "Entity already exists; create mode refuses to overwrite it.",
        matched,
        entityId: lookupResult.entity.id,
        previewDiff
      };
    }

    return {
      ok: true,
      action: "create",
      matched: false,
      entityId: null,
      previewDiff
    };
  }

  if (operation.mode === "update") {
    if (!matched) {
      return {
        ok: false,
        action: "blocked",
        reason: "Entity was not found for update mode.",
        matched: false,
        entityId: null,
        previewDiff
      };
    }

    if (!hasFieldChanges) {
      return {
        ok: true,
        action: "skip",
        matched: true,
        entityId: lookupResult.entity.id,
        previewDiff
      };
    }

    return {
      ok: true,
      action: "update",
      matched: true,
      entityId: lookupResult.entity.id,
      previewDiff
    };
  }

  if (matched) {
    if (!hasFieldChanges) {
      return {
        ok: true,
        action: "skip",
        matched: true,
        entityId: lookupResult.entity.id,
        previewDiff
      };
    }

    return {
      ok: true,
      action: "update",
      matched: true,
      entityId: lookupResult.entity.id,
      previewDiff
    };
  }

  return {
    ok: true,
    action: "create",
    matched: false,
    entityId: null,
    previewDiff
  };
}

function planMediaOperation(operation, lookupResult = null) {
  const matched = Boolean(lookupResult?.matched && lookupResult?.entity?.id);
  const currentPayload = getCurrentPayload(lookupResult);
  const previewDiff = buildMediaPreviewDiff(currentPayload, operation);
  const hasChanges = Object.keys(previewDiff).length > 0;

  if (operation.mode === "create") {
    if (matched) {
      return {
        ok: false,
        action: "blocked",
        reason: "Media asset already exists; create mode refuses to overwrite it.",
        matched,
        entityId: lookupResult.entity.id,
        previewDiff
      };
    }

    if (!operation.filePath && !operation.sourceUrl) {
      return {
        ok: false,
        action: "blocked",
        reason: "Media create mode requires filePath or sourceUrl.",
        matched: false,
        entityId: null,
        previewDiff
      };
    }

    return {
      ok: true,
      action: "create",
      matched: false,
      entityId: null,
      previewDiff
    };
  }

  if (!matched) {
    if (operation.mode === "upsert" && (operation.filePath || operation.sourceUrl)) {
      return {
        ok: true,
        action: "create",
        matched: false,
        entityId: null,
        previewDiff
      };
    }

    return {
      ok: false,
      action: "blocked",
      reason: operation.mode === "upsert"
        ? "Media upsert needs filePath when the target asset does not exist."
        : "Media asset was not found for update mode.",
      matched: false,
      entityId: null,
      previewDiff
    };
  }

  if (!hasChanges) {
    return {
      ok: true,
      action: "skip",
      matched: true,
      entityId: lookupResult.entity.id,
      previewDiff
    };
  }

  return {
    ok: true,
    action: "update",
    matched: true,
    entityId: lookupResult.entity.id,
    previewDiff
  };
}

function planDisplayModeOperation(operation, currentSnapshot = {}) {
  if (!operation.reason) {
    return {
      ok: false,
      action: "blocked",
      reason: "Display mode switch requires a non-empty reason.",
      previewDiff: {}
    };
  }

  if (operation.displayMode === "published_only" && !operation.confirmPublishedOnly) {
    return {
      ok: false,
      action: "blocked",
      reason: "published_only requires confirmPublishedOnly=true.",
      previewDiff: {}
    };
  }

  const previewDiff = buildDisplayModePreviewDiff(currentSnapshot, operation);

  if (Object.keys(previewDiff).length === 0) {
    return {
      ok: true,
      action: "skip",
      entityId: null,
      previewDiff
    };
  }

  return {
    ok: true,
    action: "set_display_mode",
    entityId: null,
    previewDiff
  };
}

function planPageWorkspaceOperation(operation, lookupResult = null) {
  const matched = Boolean(lookupResult?.matched && lookupResult?.entity?.id);

  if (!matched) {
    return {
      ok: false,
      action: "blocked",
      reason: "Page was not found for page workspace operation.",
      matched: false,
      entityId: null,
      previewDiff: {}
    };
  }

  const currentPayload = getCurrentPayload(lookupResult);
  const previewDiff = buildPageWorkspacePreviewDiff(currentPayload, operation);

  if (
    (operation.mode === "save_composition" || operation.mode === "save_metadata")
    && Object.keys(previewDiff).length === 0
  ) {
    return {
      ok: true,
      action: "skip",
      matched: true,
      entityId: lookupResult.entity.id,
      previewDiff
    };
  }

  return {
    ok: true,
    action: operation.mode,
    matched: true,
    entityId: lookupResult.entity.id,
    previewDiff
  };
}

function planRemovalOperation(operation, lookupResult = null) {
  const matched = Boolean(lookupResult?.matched && lookupResult?.entity?.id);

  if (!matched) {
    return {
      ok: false,
      action: "blocked",
      reason: `Entity was not found for removal ${operation.mode}.`,
      matched: false,
      entityId: null,
      previewDiff: {}
    };
  }

  const entityId = lookupResult.entity.id;
  const markedForRemoval = Boolean(lookupResult.entity.markedForRemovalAt);
  const previewDiff = buildRemovalPreviewDiff(markedForRemoval, operation);

  if (operation.mode === "mark") {
    if (markedForRemoval) {
      return {
        ok: true,
        action: "skip",
        matched: true,
        entityId,
        previewDiff
      };
    }

    return {
      ok: true,
      action: "mark",
      matched: true,
      entityId,
      previewDiff
    };
  }

  if (operation.mode === "unmark") {
    if (!markedForRemoval) {
      return {
        ok: true,
        action: "skip",
        matched: true,
        entityId,
        previewDiff
      };
    }

    return {
      ok: true,
      action: "unmark",
      matched: true,
      entityId,
      previewDiff
    };
  }

  if (!markedForRemoval) {
    return {
      ok: false,
      action: "blocked",
      reason: "Removal purge requires the root entity to be marked for removal first.",
      matched: true,
      entityId,
      previewDiff
    };
  }

  return {
    ok: true,
    action: "purge",
    matched: true,
    entityId,
    previewDiff
  };
}

function planWorkflowOperation(operation, lookupResult = null) {
  const matched = operation.revisionId
    ? Boolean(operation.revisionId)
    : Boolean(lookupResult?.matched && lookupResult?.entity?.id);

  if (!matched) {
    return {
      ok: false,
      action: "blocked",
      reason: "Entity or revision was not found for workflow operation.",
      matched: false,
      entityId: null,
      revisionId: operation.revisionId || "",
      previewDiff: {}
    };
  }

  const revision = operation.revisionId
    ? null
    : lookupResult?.latestRevision ?? null;
  const revisionId = operation.revisionId || revision?.id || "";
  const state = revision?.state || "";
  const ownerApprovalStatus = revision?.ownerApprovalStatus || "";
  const ownerReviewRequired = Boolean(revision?.ownerReviewRequired);

  if (!revisionId) {
    return {
      ok: false,
      action: "blocked",
      reason: "Workflow operation could not resolve a revision id.",
      matched,
      entityId: lookupResult?.entity?.id ?? null,
      revisionId: "",
      previewDiff: {}
    };
  }

  if (operation.mode === "submit_to_review") {
    if (state && state !== "draft") {
      return {
        ok: state === "review",
        action: state === "review" ? "skip" : "blocked",
        reason: state === "review" ? "" : "Only draft revisions can be submitted to review.",
        matched,
        entityId: lookupResult?.entity?.id ?? null,
        revisionId,
        previewDiff: {}
      };
    }

    return {
      ok: true,
      action: "submit_to_review",
      matched,
      entityId: lookupResult?.entity?.id ?? null,
      revisionId,
      previewDiff: buildWorkflowPreviewDiff(operation, lookupResult)
    };
  }

  if (operation.mode === "approve_owner") {
    if (!operation.confirmOwnerApproval) {
      return {
        ok: false,
        action: "blocked",
        reason: "approve_owner requires confirmOwnerApproval=true.",
        matched,
        entityId: lookupResult?.entity?.id ?? null,
        revisionId,
        previewDiff: {}
      };
    }

    if (ownerApprovalStatus === "approved" || ownerApprovalStatus === "not_required") {
      return {
        ok: true,
        action: "skip",
        matched,
        entityId: lookupResult?.entity?.id ?? null,
        revisionId,
        previewDiff: {}
      };
    }

    if (state && state !== "review") {
      return {
        ok: false,
        action: "blocked",
        reason: "Only review revisions can receive owner approval.",
        matched,
        entityId: lookupResult?.entity?.id ?? null,
        revisionId,
        previewDiff: {}
      };
    }

    return {
      ok: true,
      action: "approve_owner",
      matched,
      entityId: lookupResult?.entity?.id ?? null,
      revisionId,
      previewDiff: buildWorkflowPreviewDiff(operation, lookupResult)
    };
  }

  if (!operation.confirmPublish) {
    return {
      ok: false,
      action: "blocked",
      reason: "publish requires confirmPublish=true.",
      matched,
      entityId: lookupResult?.entity?.id ?? null,
      revisionId,
      previewDiff: {}
    };
  }

  if (state === "published") {
    return {
      ok: true,
      action: "skip",
      matched,
      entityId: lookupResult?.entity?.id ?? null,
      revisionId,
      previewDiff: {}
    };
  }

  if (state && state !== "review") {
    return {
      ok: false,
      action: "blocked",
      reason: "Only review revisions can be published.",
      matched,
      entityId: lookupResult?.entity?.id ?? null,
      revisionId,
      previewDiff: {}
    };
  }

  if (ownerReviewRequired && ownerApprovalStatus !== "approved") {
    return {
      ok: false,
      action: "blocked",
      reason: "Owner-required revisions must be approved before publish.",
      matched,
      entityId: lookupResult?.entity?.id ?? null,
      revisionId,
      previewDiff: {}
    };
  }

  return {
    ok: true,
    action: "publish",
    matched,
    entityId: lookupResult?.entity?.id ?? null,
    revisionId,
    previewDiff: buildWorkflowPreviewDiff(operation, lookupResult)
  };
}

async function resolveRelationIds(client, operation) {
  const ids = [...operation.ids];

  for (const ref of operation.refs) {
    const lookup = await client.lookupEntity(ref.entityType, ref.match);

    if (!lookup?.matched || !lookup?.entity?.id) {
      return {
        ok: false,
        reason: `Relation ref was not found: ${ref.entityType} ${JSON.stringify(ref.match)}.`
      };
    }

    ids.push(lookup.entity.id);
  }

  return {
    ok: true,
    ids: [...new Set(ids)]
  };
}

function planRelationOperation(operation, lookupResult = null, resolvedRefs = null) {
  const matched = Boolean(lookupResult?.matched && lookupResult?.entity?.id);

  if (!matched) {
    return {
      ok: false,
      action: "blocked",
      reason: "Entity was not found for relation operation.",
      matched: false,
      entityId: null,
      previewDiff: {}
    };
  }

  if (!resolvedRefs?.ok) {
    return {
      ok: false,
      action: "blocked",
      reason: resolvedRefs?.reason || "Relation references could not be resolved.",
      matched: true,
      entityId: lookupResult.entity.id,
      previewDiff: {}
    };
  }

  const currentPayload = getCurrentPayload(lookupResult);
  const currentIds = Array.isArray(currentPayload[operation.field]) ? currentPayload[operation.field] : [];
  const refIds = resolvedRefs.ids ?? [];
  const nextIds = operation.mode === "append"
    ? [...new Set([...currentIds, ...refIds])]
    : operation.mode === "remove"
      ? currentIds.filter((id) => !refIds.includes(id))
      : [...new Set(refIds)];
  const previewDiff = buildRelationPreviewDiff(currentPayload, operation.field, nextIds);

  if (JSON.stringify(currentIds) === JSON.stringify(nextIds)) {
    return {
      ok: true,
      action: "skip",
      matched: true,
      entityId: lookupResult.entity.id,
      resolvedIds: refIds,
      previewDiff: {}
    };
  }

  return {
    ok: true,
    action: `relation_${operation.mode}`,
    matched: true,
    entityId: lookupResult.entity.id,
    resolvedIds: refIds,
    previewDiff,
    // The admin save route validates full entity drafts, so relation ops merge
    // the current payload instead of sending a partial relation-only form.
    saveFields: buildMergedEntitySaveFields(operation.entityType, currentPayload, {
      [operation.field]: nextIds
    })
  };
}

function planResolveOperation(operation, lookupResult = null) {
  const matched = Boolean(lookupResult?.matched && lookupResult?.entity?.id);

  if (!matched) {
    return {
      ok: false,
      action: "blocked",
      reason: "Entity was not found for resolve operation.",
      matched: false,
      entityId: null,
      previewDiff: {}
    };
  }

  return {
    ok: true,
    action: "resolve",
    matched: true,
    readOnly: true,
    entityId: lookupResult.entity.id,
    previewDiff: {}
  };
}

function incrementCounter(summary, key) {
  summary[key] = (summary[key] || 0) + 1;
}

function getOperationScope(operation) {
  if (operation.kind === ENTITY_OPS_KINDS.DISPLAY_MODE) {
    return ENTITY_OPS_KINDS.DISPLAY_MODE;
  }

  return operation.entityType;
}

function getReportItemBase(operation, plan = {}) {
  return {
    kind: operation.kind,
    entityType: operation.entityType || "",
    mode: operation.mode,
    label: operation.label,
    matched: plan.matched ?? false,
    entityId: plan.entityId ?? null,
    revisionId: plan.revisionId ?? operation.revisionId ?? "",
    previewDiff: plan.previewDiff ?? {}
  };
}

function getMimeTypeFromExtension(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    default:
      return "";
  }
}

async function buildFileUpload(filePath) {
  const resolvedPath = path.resolve(filePath);
  const bytes = await fs.readFile(resolvedPath);
  const mimeType = getMimeTypeFromExtension(resolvedPath);

  if (!mimeType.startsWith("image/")) {
    throw new Error(`Unsupported media file extension for entity-ops: ${path.extname(resolvedPath) || "<none>"}.`);
  }

  const filename = path.basename(resolvedPath);

  return {
    resolvedPath,
    filename,
    mimeType,
    file: new File([bytes], filename, { type: mimeType })
  };
}

function extensionForMimeType(mimeType) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    case "image/avif":
      return ".avif";
    default:
      return "";
  }
}

function inferFilenameFromUrl(sourceUrl, mimeType, requestedFilename = "") {
  const explicit = String(requestedFilename || "").trim();

  if (explicit) {
    return explicit;
  }

  try {
    const parsed = new URL(sourceUrl);
    const basename = path.basename(parsed.pathname);

    if (basename && basename !== "/" && path.extname(basename)) {
      return basename;
    }
  } catch {
    // Fall through to a deterministic fallback below.
  }

  return `downloaded-media${extensionForMimeType(mimeType) || ".jpg"}`;
}

async function buildUrlUpload(sourceUrl, requestedFilename = "") {
  const response = await fetch(sourceUrl, {
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Media sourceUrl failed with status ${response.status}: ${sourceUrl}`);
  }

  const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const mimeType = contentType.startsWith("image/")
    ? contentType
    : getMimeTypeFromExtension(new URL(sourceUrl).pathname);

  if (!mimeType.startsWith("image/")) {
    throw new Error(`Unsupported media sourceUrl content type: ${contentType || "<empty>"}.`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const filename = inferFilenameFromUrl(sourceUrl, mimeType, requestedFilename);

  return {
    resolvedPath: sourceUrl,
    filename,
    mimeType,
    file: new File([bytes], filename, { type: mimeType })
  };
}

async function buildMediaUpload(operation) {
  if (operation.sourceUrl) {
    return buildUrlUpload(operation.sourceUrl, operation.filename);
  }

  return buildFileUpload(operation.filePath);
}

async function prepareLookupForOperation(client, operation) {
  if (operation.kind === ENTITY_OPS_KINDS.DISPLAY_MODE) {
    return null;
  }

  if (
    operation.kind === ENTITY_OPS_KINDS.ENTITY
    || operation.kind === ENTITY_OPS_KINDS.PAGE_WORKSPACE
    || operation.kind === ENTITY_OPS_KINDS.WORKFLOW
    || operation.kind === ENTITY_OPS_KINDS.RELATION
    || operation.kind === ENTITY_OPS_KINDS.RESOLVE
    || operation.kind === ENTITY_OPS_KINDS.REMOVAL
  ) {
    return Object.keys(operation.match).length > 0
      ? client.lookupEntity(operation.entityType, operation.match)
      : Promise.resolve({ ok: true, matched: false });
  }

  if (operation.kind === ENTITY_OPS_KINDS.MEDIA) {
    return operation.match.entityId
      ? client.lookupEntity(operation.entityType, operation.match)
      : Promise.resolve({ ok: true, matched: false });
  }

  return null;
}

function planOperation(operation, lookupResult) {
  if (operation.kind === ENTITY_OPS_KINDS.ENTITY) {
    return planEntityOperation(operation, lookupResult);
  }

  if (operation.kind === ENTITY_OPS_KINDS.MEDIA) {
    return planMediaOperation(operation, lookupResult);
  }

  if (operation.kind === ENTITY_OPS_KINDS.DISPLAY_MODE) {
    return planDisplayModeOperation(operation, lookupResult);
  }

  if (operation.kind === ENTITY_OPS_KINDS.PAGE_WORKSPACE) {
    return planPageWorkspaceOperation(operation, lookupResult);
  }

  if (operation.kind === ENTITY_OPS_KINDS.WORKFLOW) {
    return planWorkflowOperation(operation, lookupResult);
  }

  if (operation.kind === ENTITY_OPS_KINDS.RESOLVE) {
    return planResolveOperation(operation, lookupResult);
  }

  if (operation.kind === ENTITY_OPS_KINDS.REMOVAL) {
    return planRemovalOperation(operation, lookupResult);
  }

  return {
    ok: false,
    action: "blocked",
    reason: `Unsupported operation kind: ${operation.kind}.`,
    previewDiff: {}
  };
}

export async function runEntityOperations(client, operations, options = {}) {
  const execute = Boolean(options.execute);
  const report = {
    startedAt: new Date().toISOString(),
    execute,
    total: operations.length,
    summary: {},
    items: []
  };

  await client.probeHealth();
  await client.login();

  for (const operation of operations) {
    try {
      const lookupResult = operation.kind === ENTITY_OPS_KINDS.DISPLAY_MODE
        ? await client.getDisplayMode()
        : await prepareLookupForOperation(client, operation);
      const resolvedRelationRefs = operation.kind === ENTITY_OPS_KINDS.RELATION
        ? await resolveRelationIds(client, operation)
        : null;
      const plan = operation.kind === ENTITY_OPS_KINDS.RELATION
        ? planRelationOperation(operation, lookupResult, resolvedRelationRefs)
        : planOperation(operation, lookupResult);

      if (!plan.ok) {
        incrementCounter(report.summary, "blocked");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: plan.action,
          ok: false,
          reason: plan.reason
        });
        continue;
      }

      if (!execute) {
        if (plan.readOnly) {
          incrementCounter(report.summary, "resolved");
          report.items.push({
            ...getReportItemBase(operation, plan),
            action: plan.action,
            ok: true,
            entity: lookupResult.entity ?? null,
            latestRevision: serializeRevisionSummary(lookupResult.latestRevision),
            activePublishedRevision: serializeRevisionSummary(lookupResult.activePublishedRevision),
            payload: operation.includePayload ? getCurrentPayload(lookupResult) : null
          });
          continue;
        }

        incrementCounter(report.summary, "dryRun");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: plan.action,
          ok: true
        });
        continue;
      }

      if (plan.action === "skip") {
        incrementCounter(report.summary, "skipped");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: "skip",
          ok: true
        });
        continue;
      }

      if (operation.kind === ENTITY_OPS_KINDS.ENTITY) {
        if (plan.action === "delete") {
          const formData = buildEntityDeleteFormData({
            ...operation,
            match: {
              entityId: plan.entityId
            }
          });
          const deleted = await client.deleteEntity(operation.entityType, formData);

          incrementCounter(report.summary, "deleted");
          report.items.push({
            ...getReportItemBase(operation, plan),
            action: "delete",
            ok: true,
            deletedCount: deleted.deletedCount ?? 0,
            deletedIds: deleted.deletedIds ?? [],
            message: deleted.message ?? ""
          });
          continue;
        }

        const formData = buildEntitySaveFormData(operation, {
          entityId: plan.entityId
        });
        const saved = await client.saveEntity(operation.entityType, formData);

        incrementCounter(report.summary, plan.action === "create" ? "created" : "updated");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: plan.action,
          ok: true,
          entityId: saved.entity?.id ?? plan.entityId,
          changedFields: saved.changedFields ?? [],
          redirectTo: saved.redirectTo ?? "",
          message: saved.message ?? ""
        });
        continue;
      }

      if (operation.kind === ENTITY_OPS_KINDS.MEDIA) {
        if (plan.action === "create") {
          const upload = await buildMediaUpload(operation);
          const formData = buildMediaCreateFormData(operation, {
            file: upload.file
          });
          const created = await client.createMediaAsset(formData);

          incrementCounter(report.summary, "created");
          report.items.push({
            ...getReportItemBase(operation, plan),
            action: "create",
            ok: true,
            entityId: created.item?.id ?? null,
            changedFields: Object.keys(plan.previewDiff),
            message: created.message ?? "",
            filePath: upload.resolvedPath
          });
          continue;
        }

        const upload = operation.filePath || operation.sourceUrl ? await buildMediaUpload(operation) : null;
        const formData = buildMediaUpdateFormData(operation, {
          binaryFile: upload?.file ?? null
        });
        const saved = await client.updateMediaAsset(plan.entityId, formData);

        incrementCounter(report.summary, "updated");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: "update",
          ok: true,
          entityId: saved.item?.id ?? plan.entityId,
          changedFields: Object.keys(plan.previewDiff),
          message: saved.message ?? "",
          filePath: upload?.resolvedPath ?? ""
        });
        continue;
      }

      if (operation.kind === ENTITY_OPS_KINDS.WORKFLOW) {
        if (plan.action === "submit_to_review") {
          const result = await client.submitRevisionForReview(
            plan.revisionId,
            buildWorkflowSubmitFormData(operation)
          );

          incrementCounter(report.summary, "submitted");
          report.items.push({
            ...getReportItemBase(operation, plan),
            action: "submit_to_review",
            ok: true,
            location: result.location ?? "",
            message: result.message ?? ""
          });
          continue;
        }

        if (plan.action === "approve_owner") {
          const result = await client.approveOwnerAction(
            plan.revisionId,
            buildWorkflowOwnerActionFormData(operation)
          );

          incrementCounter(report.summary, "ownerApproved");
          report.items.push({
            ...getReportItemBase(operation, plan),
            action: "approve_owner",
            ok: true,
            location: result.location ?? "",
            message: result.message ?? ""
          });
          continue;
        }

        const result = await client.publishRevision(
          plan.revisionId,
          buildWorkflowPublishFormData(operation)
        );

        incrementCounter(report.summary, "published");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: "publish",
          ok: true,
          location: result.location ?? "",
          message: result.message ?? ""
        });
        continue;
      }

      if (operation.kind === ENTITY_OPS_KINDS.RELATION) {
        const formData = buildEntitySaveFormData({
          ...operation,
          fields: plan.saveFields
        }, {
          entityId: plan.entityId
        });
        const saved = await client.saveEntity(operation.entityType, formData);

        incrementCounter(report.summary, "relationsChanged");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: plan.action,
          ok: true,
          entityId: saved.entity?.id ?? plan.entityId,
          relationField: operation.field,
          resolvedIds: plan.resolvedIds ?? [],
          changedFields: saved.changedFields ?? [operation.field],
          redirectTo: saved.redirectTo ?? "",
          message: saved.message ?? ""
        });
        continue;
      }

      if (operation.kind === ENTITY_OPS_KINDS.RESOLVE) {
        incrementCounter(report.summary, "resolved");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: "resolve",
          ok: true,
          entity: lookupResult.entity ?? null,
          latestRevision: serializeRevisionSummary(lookupResult.latestRevision),
          activePublishedRevision: serializeRevisionSummary(lookupResult.activePublishedRevision),
          payload: operation.includePayload ? getCurrentPayload(lookupResult) : null
        });
        continue;
      }

      if (operation.kind === ENTITY_OPS_KINDS.PAGE_WORKSPACE) {
        const result = await client.runPageWorkspaceAction(
          plan.entityId,
          buildPageWorkspaceRequestBody(operation)
        );

        incrementCounter(report.summary, plan.action === "send_to_review" ? "submitted" : "workspaceSaved");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: plan.action,
          ok: true,
          entityId: plan.entityId,
          changedFields: Object.keys(plan.previewDiff),
          revision: result.revision ?? null,
          reviewHref: result.reviewHref ?? "",
          message: result.message ?? ""
        });
        continue;
      }

      if (operation.kind === ENTITY_OPS_KINDS.DISPLAY_MODE) {
        const result = await client.setDisplayMode(buildDisplayModeFormData(operation));
        const snapshot = await client.getDisplayMode();

        incrementCounter(report.summary, "displayModeChanged");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: "set_display_mode",
          ok: true,
          scope: getOperationScope(operation),
          currentMode: snapshot.mode,
          message: result.message || ""
        });
        continue;
      }

      if (operation.kind === ENTITY_OPS_KINDS.REMOVAL) {
        if (plan.action === "mark") {
          const result = await client.markRemoval(
            operation.entityType,
            plan.entityId,
            buildRemovalActionFormData(operation)
          );

          incrementCounter(report.summary, "marked");
          report.items.push({
            ...getReportItemBase(operation, plan),
            action: "mark",
            ok: true,
            message: result.message || ""
          });
          continue;
        }

        if (plan.action === "unmark") {
          const result = await client.unmarkRemoval(
            operation.entityType,
            plan.entityId,
            buildRemovalActionFormData(operation)
          );

          incrementCounter(report.summary, "unmarked");
          report.items.push({
            ...getReportItemBase(operation, plan),
            action: "unmark",
            ok: true,
            message: result.message || ""
          });
          continue;
        }

        const purged = await client.purgeRemovalSweep(
          buildRemovalPurgeFormData({
            ...operation,
            match: {
              entityId: plan.entityId
            }
          })
        );

        incrementCounter(report.summary, "purged");
        report.items.push({
          ...getReportItemBase(operation, plan),
          action: "purge",
          ok: true,
          deletedCount: Array.isArray(purged.deleted) ? purged.deleted.length : 0,
          deletedIds: Array.isArray(purged.deleted) ? purged.deleted.map((item) => item.entityId).filter(Boolean) : [],
          message: purged.message ?? ""
        });
      }
    } catch (error) {
      incrementCounter(report.summary, "failed");
      report.items.push({
        kind: operation.kind,
        entityType: operation.entityType || "",
        mode: operation.mode,
        label: operation.label,
        action: "error",
        ok: false,
        reason: error?.message || String(error)
      });
    }
  }

  report.finishedAt = new Date().toISOString();
  report.ok = (report.summary.failed || 0) === 0 && (report.summary.blocked || 0) === 0;

  return report;
}

import fs from "node:fs/promises";
import path from "node:path";

import {
  ENTITY_OPS_KINDS,
  buildDisplayModeFormData,
  buildEntityDeleteFormData,
  buildEntitySaveFormData,
  buildFieldPreviewDiff,
  buildMediaCreateFormData,
  buildMediaUpdateFormData,
  buildRemovalActionFormData,
  buildRemovalPurgeFormData
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

    if (!operation.filePath) {
      return {
        ok: false,
        action: "blocked",
        reason: "Media create mode requires filePath.",
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
    if (operation.mode === "upsert" && operation.filePath) {
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

async function prepareLookupForOperation(client, operation) {
  if (operation.kind === ENTITY_OPS_KINDS.DISPLAY_MODE) {
    return null;
  }

  if (operation.kind === ENTITY_OPS_KINDS.ENTITY || operation.kind === ENTITY_OPS_KINDS.REMOVAL) {
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
      const plan = planOperation(operation, lookupResult);

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
          const upload = await buildFileUpload(operation.filePath);
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

        const upload = operation.filePath ? await buildFileUpload(operation.filePath) : null;
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

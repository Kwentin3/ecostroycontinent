import { buildEntitySaveFormData, buildFieldPreviewDiff } from "./input.js";

function getCurrentPayload(lookupResult) {
  return lookupResult?.latestRevision?.payload
    || lookupResult?.activePublishedRevision?.payload
    || {};
}

export function planEntityOperation(operation, lookupResult = null) {
  const matched = Boolean(lookupResult?.matched && lookupResult?.entity?.id);
  const currentPayload = getCurrentPayload(lookupResult);
  const previewDiff = buildFieldPreviewDiff(currentPayload, operation.fields);
  const hasFieldChanges = Object.keys(previewDiff).length > 0;

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

function incrementCounter(summary, key) {
  summary[key] = (summary[key] || 0) + 1;
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
      const lookup = Object.keys(operation.match).length > 0
        ? await client.lookupEntity(operation.entityType, operation.match)
        : { ok: true, matched: false };
      const plan = planEntityOperation(operation, lookup);

      if (!plan.ok) {
        incrementCounter(report.summary, "blocked");
        report.items.push({
          label: operation.label,
          entityType: operation.entityType,
          mode: operation.mode,
          action: plan.action,
          ok: false,
          reason: plan.reason,
          matched: plan.matched,
          entityId: plan.entityId,
          previewDiff: plan.previewDiff
        });
        continue;
      }

      if (!execute) {
        incrementCounter(report.summary, "dryRun");
        report.items.push({
          label: operation.label,
          entityType: operation.entityType,
          mode: operation.mode,
          action: plan.action,
          ok: true,
          matched: plan.matched,
          entityId: plan.entityId,
          previewDiff: plan.previewDiff
        });
        continue;
      }

      if (plan.action === "skip") {
        incrementCounter(report.summary, "skipped");
        report.items.push({
          label: operation.label,
          entityType: operation.entityType,
          mode: operation.mode,
          action: "skip",
          ok: true,
          matched: plan.matched,
          entityId: plan.entityId,
          previewDiff: plan.previewDiff
        });
        continue;
      }

      const formData = buildEntitySaveFormData(operation, {
        entityId: plan.entityId
      });
      const saved = await client.saveEntity(operation.entityType, formData);

      incrementCounter(report.summary, plan.action === "create" ? "created" : "updated");
      report.items.push({
        label: operation.label,
        entityType: operation.entityType,
        mode: operation.mode,
        action: plan.action,
        ok: true,
        matched: plan.matched,
        entityId: saved.entity?.id ?? plan.entityId,
        changedFields: saved.changedFields ?? [],
        redirectTo: saved.redirectTo ?? "",
        message: saved.message ?? "",
        previewDiff: plan.previewDiff
      });
    } catch (error) {
      incrementCounter(report.summary, "failed");
      report.items.push({
        label: operation.label,
        entityType: operation.entityType,
        mode: operation.mode,
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

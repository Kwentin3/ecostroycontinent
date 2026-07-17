import {
  evaluateRemovalSweepComponent,
  executeRemovalSweep
} from "./removal-sweep-analysis.js";
import {
  encodeRemovalSweepRootKey,
  isRemovalQuarantineEntityTypeSupported
} from "./removal-quarantine.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

export function normalizeRemovalSweepBatchRoots(roots = []) {
  const result = [];
  const seen = new Set();

  for (const root of roots) {
    const entityType = normalizeString(root?.entityType);
    const entityId = normalizeString(root?.entityId);
    const key = encodeRemovalSweepRootKey({ entityType, entityId });

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({ entityType, entityId });
  }

  return result;
}

export function getRemovalSweepComponentKey(component = {}) {
  const memberKeys = (component.members ?? [])
    .map((member) => encodeRemovalSweepRootKey(member))
    .filter(Boolean)
    .sort();

  if (memberKeys.length > 0) {
    return memberKeys.join("|");
  }

  return encodeRemovalSweepRootKey(component.root);
}

function buildBlockedComponent(root, evaluation) {
  return {
    componentKey: getRemovalSweepComponentKey(evaluation) || encodeRemovalSweepRootKey(root),
    root: evaluation?.root ?? {
      entityType: root.entityType,
      entityId: root.entityId,
      label: root.entityId,
      href: ""
    },
    memberCount: evaluation?.memberCount ?? evaluation?.members?.length ?? 0,
    members: evaluation?.members ?? [],
    summary: evaluation?.summary || "Эта группа пока не готова к удалению.",
    publishedIncomingRefs: evaluation?.publishedIncomingRefs ?? [],
    draftIncomingRefs: evaluation?.draftIncomingRefs ?? [],
    stateBlockers: evaluation?.stateBlockers ?? []
  };
}

function buildReadyComponent(evaluation) {
  return {
    componentKey: getRemovalSweepComponentKey(evaluation),
    root: evaluation.root,
    memberCount: evaluation.memberCount ?? evaluation.members?.length ?? 0,
    members: evaluation.members ?? [],
    purgePlan: evaluation.purgePlan ?? [],
    summary: evaluation.summary
  };
}

export async function previewRemovalSweepBatch(input, deps = {}) {
  const roots = normalizeRemovalSweepBatchRoots(input?.roots);
  const readyComponents = [];
  const blockedComponents = [];
  const seenComponentKeys = new Set();

  for (const root of roots) {
    if (!isRemovalQuarantineEntityTypeSupported(root.entityType)) {
      const blocked = buildBlockedComponent(root, {
        exists: false,
        summary: "Этот тип объекта пока не поддерживает безопасное удаление."
      });

      if (!seenComponentKeys.has(blocked.componentKey)) {
        seenComponentKeys.add(blocked.componentKey);
        blockedComponents.push(blocked);
      }
      continue;
    }

    const evaluation = await evaluateRemovalSweepComponent(root, deps);
    const componentKey = getRemovalSweepComponentKey(evaluation) || encodeRemovalSweepRootKey(root);

    if (seenComponentKeys.has(componentKey)) {
      continue;
    }

    seenComponentKeys.add(componentKey);

    if (!evaluation.exists || evaluation.verdict !== "ready") {
      blockedComponents.push(buildBlockedComponent(root, evaluation));
      continue;
    }

    readyComponents.push(buildReadyComponent(evaluation));
  }

  return {
    selectedRootCount: roots.length,
    componentCount: readyComponents.length + blockedComponents.length,
    readyComponentCount: readyComponents.length,
    readyObjectCount: readyComponents.reduce((sum, component) => sum + component.memberCount, 0),
    blockedComponentCount: blockedComponents.length,
    blockedObjectCount: blockedComponents.reduce((sum, component) => sum + component.memberCount, 0),
    readyComponents,
    blockedComponents
  };
}

export async function executeRemovalSweepBatch(input, deps = {}) {
  const preview = await previewRemovalSweepBatch(input, deps);
  const deletedComponents = [];
  const failedComponents = preview.blockedComponents.map((component) => ({
    componentKey: component.componentKey,
    root: component.root,
    error: component.summary,
    blockers: [
      ...component.publishedIncomingRefs,
      ...component.draftIncomingRefs,
      ...component.stateBlockers
    ]
  }));

  for (const component of preview.readyComponents) {
    try {
      const result = await executeRemovalSweep({
        entityType: component.root.entityType,
        entityId: component.root.entityId,
        actorUserId: input?.actorUserId
      }, deps);

      deletedComponents.push({
        componentKey: component.componentKey,
        root: component.root,
        deleted: result.deleted ?? [],
        deletedCount: result.deleted?.length ?? 0
      });
    } catch (error) {
      failedComponents.push({
        componentKey: component.componentKey,
        root: component.root,
        error: error?.message || "Группа больше не готова к безопасному удалению.",
        blockers: []
      });
    }
  }

  return {
    selectedRootCount: preview.selectedRootCount,
    deletedComponentCount: deletedComponents.length,
    deletedObjectCount: deletedComponents.reduce((sum, component) => sum + component.deletedCount, 0),
    failedComponentCount: failedComponents.length,
    deletedComponents,
    failedComponents
  };
}

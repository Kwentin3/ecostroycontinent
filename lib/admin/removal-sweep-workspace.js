import { encodeRemovalSweepRootKey } from "./removal-quarantine.js";

export const REMOVAL_SWEEP_WORKSPACE_TABS = Object.freeze({
  READY: "ready",
  BLOCKED: "blocked",
  HISTORY: "history"
});

export function getRemovalSweepWorkspaceCardKey(component = {}) {
  return encodeRemovalSweepRootKey(component.root);
}

export function getRemovalSweepBlockers(component = {}) {
  return [
    ...(component.publishedIncomingRefs ?? []),
    ...(component.draftIncomingRefs ?? []),
    ...(component.stateBlockers ?? [])
  ];
}

export function getPrimaryRemovalSweepBlocker(component = {}) {
  return getRemovalSweepBlockers(component)[0] ?? null;
}

export function filterRemovalSweepWorkspaceItems(items = [], query = "") {
  const normalizedQuery = String(query ?? "").trim().toLocaleLowerCase("ru");

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((component) => {
    const searchableValues = [
      component.root?.label,
      component.summary,
      ...(component.members ?? []).flatMap((member) => [member.label, member.entityType]),
      ...getRemovalSweepBlockers(component).flatMap((blocker) => [blocker.label, blocker.reason])
    ];

    return searchableValues.some((value) => String(value ?? "").toLocaleLowerCase("ru").includes(normalizedQuery));
  });
}

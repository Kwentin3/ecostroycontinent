import { ENTITY_TYPE_LABELS } from "./content-types.js";
import { collectEntityReferenceRecords, buildReferenceIdentity } from "./entity-references.js";
import { findEntityById } from "./repository.js";

function buildMarkedReferenceLabel(entity) {
  return `${ENTITY_TYPE_LABELS[entity?.entityType] || "Сущность"} ${entity?.id || ""}`.trim();
}

export async function listMarkedReferenceConflicts(entityType, payload, deps = {}) {
  const resolvedDeps = {
    findEntityById,
    ...deps
  };
  const refs = collectEntityReferenceRecords(entityType, payload);
  const uniqueIds = [...new Set(refs.map((ref) => ref.targetId))];
  const entities = await Promise.all(uniqueIds.map((targetId) => resolvedDeps.findEntityById(targetId, deps.db ?? null)));
  const entityMap = new Map(uniqueIds.map((targetId, index) => [targetId, entities[index]]));

  return refs
    .map((ref) => {
      const entity = entityMap.get(ref.targetId);

      if (!entity?.markedForRemovalAt) {
        return null;
      }

      return {
        ...ref,
        targetEntityType: ref.targetEntityType ?? entity.entityType ?? null,
        targetEntity: entity,
        label: buildMarkedReferenceLabel(entity)
      };
    })
    .filter(Boolean);
}

export async function assertNoNewRefsToMarkedEntities({ entityType, nextPayload, previousPayload = null }, deps = {}) {
  const nextConflicts = await listMarkedReferenceConflicts(entityType, nextPayload, deps);

  if (nextConflicts.length === 0) {
    return [];
  }

  const previousRefs = previousPayload ? collectEntityReferenceRecords(entityType, previousPayload) : [];
  const previousKeys = new Set(previousRefs.map(buildReferenceIdentity));
  const introduced = nextConflicts.filter((conflict) => !previousKeys.has(buildReferenceIdentity(conflict)));

  if (introduced.length === 0) {
    return [];
  }

  const [firstConflict] = introduced;
  throw new Error(`Нельзя создать новую ссылку на объект, помеченный на удаление: ${firstConflict.label}.`);
}

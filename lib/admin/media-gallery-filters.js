export const COLLECTION_FILTER_ALL = "";
export const COLLECTION_FILTER_ORPHAN = "__orphan__";

export function matchesCollectionFilter(item, collectionFilterId) {
  if (!collectionFilterId) {
    return true;
  }

  const entries = item.collectionEntries ?? [];

  if (collectionFilterId === COLLECTION_FILTER_ORPHAN) {
    return entries.length === 0;
  }

  return entries.some((entry) => entry.id === collectionFilterId);
}

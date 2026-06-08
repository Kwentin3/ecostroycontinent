export const MEDIA_LIBRARY_FILTERS = Object.freeze([
  { key: "all", label: "Все" },
  { key: "recent", label: "Недавние" },
  { key: "missing-alt", label: "Нет альтернативного текста" },
  { key: "orphan", label: "Сироты" },
  { key: "used", label: "Используется" },
  { key: "unused", label: "Не используется" },
  { key: "draft", label: "Черновики" },
  { key: "review", label: "На проверке" },
  { key: "published", label: "Опубликовано" },
  { key: "archived", label: "В архиве" },
  { key: "returned", label: "Требуются доработки" }
]);

export function mediaAssetRequiresRevisionWork(item = {}) {
  return Boolean(item?.statusKey === "draft" && item?.ownerApprovalStatus === "rejected");
}

export function matchesMediaLibraryFilter(item = {}, filterKey = "all") {
  switch (filterKey) {
    case "recent":
      return item.recent;
    case "missing-alt":
      return item.missingAlt;
    case "orphan":
      return item.orphaned;
    case "used":
      return item.usageCount > 0;
    case "unused":
      return item.usageCount === 0;
    case "draft":
    case "review":
    case "published":
      return item.statusKey === filterKey;
    case "archived":
      return item.archived;
    case "returned":
      return mediaAssetRequiresRevisionWork(item);
    default:
      return true;
  }
}

export function buildMediaLibrarySummaryItems(items = []) {
  return [
    { label: "Всего", value: items.length },
    { label: "Нет альтернативного текста", value: items.filter((item) => item.missingAlt).length },
    { label: "Сироты", value: items.filter((item) => item.orphaned).length },
    { label: "На проверке", value: items.filter((item) => item.statusKey === "review").length },
    { label: "Требуются доработки", value: items.filter(mediaAssetRequiresRevisionWork).length }
  ];
}

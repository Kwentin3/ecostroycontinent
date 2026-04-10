function normalizeSeoState(seo = {}) {
  return {
    metaTitle: "",
    metaDescription: "",
    canonicalIntent: "",
    indexationFlag: "index",
    openGraphTitle: "",
    openGraphDescription: "",
    openGraphImageAssetId: "",
    ...(seo && typeof seo === "object" ? seo : {})
  };
}

export function normalizePageRegistryRecord(record = {}) {
  const pageType = record?.metadata?.pageType === "contacts" ? "contacts" : "about";
  const slug = typeof record?.slug === "string" && record.slug.length > 0
    ? record.slug
    : (typeof record?.metadata?.slug === "string" && record.metadata.slug.length > 0
        ? record.metadata.slug
        : (pageType === "contacts" ? "contacts" : "about"));

  return {
    ...record,
    slug,
    metadata: {
      slug,
      pageType,
      pageThemeKey: record?.metadata?.pageThemeKey || "earth_sand",
      seo: normalizeSeoState(record?.metadata?.seo)
    }
  };
}

export function normalizePageRegistryRecords(records = []) {
  return Array.isArray(records) ? records.map((record) => normalizePageRegistryRecord(record)) : [];
}

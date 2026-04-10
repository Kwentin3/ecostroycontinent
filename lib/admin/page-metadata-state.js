export function normalizePageMetadata(metadata = {}) {
  const safeMetadata = metadata && typeof metadata === "object" ? metadata : {};

  return {
    slug: safeMetadata.slug || "",
    pageType: safeMetadata.pageType || "about",
    pageThemeKey: safeMetadata.pageThemeKey || "earth_sand",
    seo: {
      metaTitle: safeMetadata.seo?.metaTitle || "",
      metaDescription: safeMetadata.seo?.metaDescription || "",
      canonicalIntent: safeMetadata.seo?.canonicalIntent || "",
      indexationFlag: safeMetadata.seo?.indexationFlag || "index",
      openGraphTitle: safeMetadata.seo?.openGraphTitle || "",
      openGraphDescription: safeMetadata.seo?.openGraphDescription || "",
      openGraphImageAssetId: safeMetadata.seo?.openGraphImageAssetId || ""
    }
  };
}

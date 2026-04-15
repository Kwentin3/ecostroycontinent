export const PAGE_MEDIA_HERO_LAYOUTS = ["stacked", "split", "cinematic"];
export const PAGE_MEDIA_GALLERY_LAYOUTS = ["grid", "featured", "strip"];
export const PAGE_MEDIA_GALLERY_ASPECT_RATIOS = ["landscape", "square", "portrait"];
export const PAGE_MEDIA_GALLERY_GROUPINGS = ["flat", "by_collection"];

export const DEFAULT_PAGE_MEDIA_SETTINGS = Object.freeze({
  heroLayout: "stacked",
  galleryLayout: "grid",
  galleryAspectRatio: "landscape",
  galleryGrouping: "flat",
  showGalleryCaptions: true
});

export const PAGE_MEDIA_HERO_LAYOUT_LABELS = Object.freeze({
  stacked: "Под героем, на ширину контента",
  split: "Рядом с текстом, в split-компоновке",
  cinematic: "Крупный акцентный кадр"
});

export const PAGE_MEDIA_GALLERY_LAYOUT_LABELS = Object.freeze({
  grid: "Ровная сетка",
  featured: "Один крупный кадр + сетка",
  strip: "Горизонтальная лента"
});

export const PAGE_MEDIA_GALLERY_ASPECT_RATIO_LABELS = Object.freeze({
  landscape: "Горизонтальные карточки",
  square: "Квадратные карточки",
  portrait: "Вертикальные карточки"
});

export const PAGE_MEDIA_GALLERY_GROUPING_LABELS = Object.freeze({
  flat: "Одна общая подборка",
  by_collection: "Группировать по коллекциям"
});

function pickBoundedValue(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

export function normalizePageMediaSettings(value = {}) {
  const source = value && typeof value === "object" ? value : {};

  return {
    heroLayout: pickBoundedValue(source.heroLayout, PAGE_MEDIA_HERO_LAYOUTS, DEFAULT_PAGE_MEDIA_SETTINGS.heroLayout),
    galleryLayout: pickBoundedValue(source.galleryLayout, PAGE_MEDIA_GALLERY_LAYOUTS, DEFAULT_PAGE_MEDIA_SETTINGS.galleryLayout),
    galleryAspectRatio: pickBoundedValue(
      source.galleryAspectRatio,
      PAGE_MEDIA_GALLERY_ASPECT_RATIOS,
      DEFAULT_PAGE_MEDIA_SETTINGS.galleryAspectRatio
    ),
    galleryGrouping: pickBoundedValue(
      source.galleryGrouping,
      PAGE_MEDIA_GALLERY_GROUPINGS,
      DEFAULT_PAGE_MEDIA_SETTINGS.galleryGrouping
    ),
    showGalleryCaptions: source.showGalleryCaptions !== false
  };
}

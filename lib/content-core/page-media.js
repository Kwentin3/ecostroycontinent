import { PAGE_TYPES } from "./content-types.js";

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

export const PAGE_MEDIA_SETTINGS_PRESETS = Object.freeze({
  [PAGE_TYPES.ABOUT]: Object.freeze({
    heroLayout: "split",
    galleryLayout: "featured",
    galleryAspectRatio: "square",
    galleryGrouping: "by_collection",
    showGalleryCaptions: true
  }),
  [PAGE_TYPES.CONTACTS]: Object.freeze({
    heroLayout: "stacked",
    galleryLayout: "strip",
    galleryAspectRatio: "landscape",
    galleryGrouping: "flat",
    showGalleryCaptions: false
  }),
  [PAGE_TYPES.SERVICE_LANDING]: Object.freeze({
    heroLayout: "split",
    galleryLayout: "grid",
    galleryAspectRatio: "landscape",
    galleryGrouping: "by_collection",
    showGalleryCaptions: true
  }),
  [PAGE_TYPES.EQUIPMENT_LANDING]: Object.freeze({
    heroLayout: "cinematic",
    galleryLayout: "featured",
    galleryAspectRatio: "landscape",
    galleryGrouping: "by_collection",
    showGalleryCaptions: true
  })
});

export const PAGE_MEDIA_HERO_LAYOUT_LABELS = Object.freeze({
  stacked: "Под героем, на ширину контента",
  split: "Рядом с текстом, в раздельной компоновке",
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

function normalizeMediaDefaults(source = DEFAULT_PAGE_MEDIA_SETTINGS) {
  const candidate = source && typeof source === "object" ? source : {};

  return {
    heroLayout: pickBoundedValue(candidate.heroLayout, PAGE_MEDIA_HERO_LAYOUTS, DEFAULT_PAGE_MEDIA_SETTINGS.heroLayout),
    galleryLayout: pickBoundedValue(candidate.galleryLayout, PAGE_MEDIA_GALLERY_LAYOUTS, DEFAULT_PAGE_MEDIA_SETTINGS.galleryLayout),
    galleryAspectRatio: pickBoundedValue(
      candidate.galleryAspectRatio,
      PAGE_MEDIA_GALLERY_ASPECT_RATIOS,
      DEFAULT_PAGE_MEDIA_SETTINGS.galleryAspectRatio
    ),
    galleryGrouping: pickBoundedValue(
      candidate.galleryGrouping,
      PAGE_MEDIA_GALLERY_GROUPINGS,
      DEFAULT_PAGE_MEDIA_SETTINGS.galleryGrouping
    ),
    showGalleryCaptions: candidate.showGalleryCaptions !== false
  };
}

export function getDefaultPageMediaSettings(pageType = PAGE_TYPES.ABOUT) {
  return normalizeMediaDefaults(PAGE_MEDIA_SETTINGS_PRESETS[pageType] || DEFAULT_PAGE_MEDIA_SETTINGS);
}

export function arePageMediaSettingsEqual(left = {}, right = {}) {
  const normalizedLeft = normalizePageMediaSettings(left);
  const normalizedRight = normalizePageMediaSettings(right);

  return (
    normalizedLeft.heroLayout === normalizedRight.heroLayout
    && normalizedLeft.galleryLayout === normalizedRight.galleryLayout
    && normalizedLeft.galleryAspectRatio === normalizedRight.galleryAspectRatio
    && normalizedLeft.galleryGrouping === normalizedRight.galleryGrouping
    && normalizedLeft.showGalleryCaptions === normalizedRight.showGalleryCaptions
  );
}

export function normalizePageMediaSettings(value = {}, pageType = PAGE_TYPES.ABOUT) {
  const source = value && typeof value === "object" ? value : {};
  const defaults = typeof pageType === "string"
    ? getDefaultPageMediaSettings(pageType)
    : normalizeMediaDefaults(pageType);

  return {
    heroLayout: pickBoundedValue(source.heroLayout, PAGE_MEDIA_HERO_LAYOUTS, defaults.heroLayout),
    galleryLayout: pickBoundedValue(source.galleryLayout, PAGE_MEDIA_GALLERY_LAYOUTS, defaults.galleryLayout),
    galleryAspectRatio: pickBoundedValue(
      source.galleryAspectRatio,
      PAGE_MEDIA_GALLERY_ASPECT_RATIOS,
      defaults.galleryAspectRatio
    ),
    galleryGrouping: pickBoundedValue(
      source.galleryGrouping,
      PAGE_MEDIA_GALLERY_GROUPINGS,
      defaults.galleryGrouping
    ),
    showGalleryCaptions: typeof source.showGalleryCaptions === "boolean"
      ? source.showGalleryCaptions
      : defaults.showGalleryCaptions
  };
}

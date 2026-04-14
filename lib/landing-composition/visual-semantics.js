export const LANDING_TEXT_EMPHASIS_PRESETS = Object.freeze([
  "quiet",
  "standard",
  "strong"
]);

export const DEFAULT_LANDING_TEXT_EMPHASIS_PRESET = "standard";

export const LANDING_SURFACE_TONES = Object.freeze([
  "plain",
  "tinted",
  "emphasis"
]);

export const DEFAULT_LANDING_SURFACE_TONE = "plain";

export const DEFAULT_LANDING_PAGE_THEME_KEY = "earth_sand";

function buildSurfaceMap(emphasisStatus = "pass") {
  return Object.freeze({
    plain: Object.freeze({
      sectionClassName: "tone-plain",
      contrastStatus: "pass"
    }),
    tinted: Object.freeze({
      sectionClassName: "tone-tinted",
      contrastStatus: "pass"
    }),
    emphasis: Object.freeze({
      sectionClassName: "tone-emphasis",
      contrastStatus: emphasisStatus
    })
  });
}

// The registry intentionally stays bounded and operator-facing.
// Each theme points to a stable page class while keeping future room for
// preset-driven typography or palette extensions without opening raw styling.
export const LANDING_PAGE_THEME_REGISTRY = Object.freeze({
  earth_sand: Object.freeze({
    label: "Песочный тон",
    pageClassName: "theme-earth-sand",
    typographyPreset: "editorial_serif",
    appearanceFamily: "warm_editorial",
    allowsFuturePaletteOverride: true,
    surfaces: buildSurfaceMap("pass")
  }),
  forest_contrast: Object.freeze({
    label: "Лесной контраст",
    pageClassName: "theme-forest-contrast",
    typographyPreset: "neutral_sans",
    appearanceFamily: "organic_contrast",
    allowsFuturePaletteOverride: true,
    surfaces: buildSurfaceMap("pass")
  }),
  slate_editorial: Object.freeze({
    label: "Сланцевый тон",
    pageClassName: "theme-slate-editorial",
    typographyPreset: "editorial_serif",
    appearanceFamily: "cool_editorial",
    allowsFuturePaletteOverride: true,
    surfaces: buildSurfaceMap("warning")
  }),
  graphite_industrial: Object.freeze({
    label: "Графитовая индустрия",
    pageClassName: "theme-graphite-industrial",
    typographyPreset: "industrial_condensed",
    appearanceFamily: "dark_industrial",
    allowsFuturePaletteOverride: true,
    surfaces: buildSurfaceMap("pass")
  }),
  night_signal: Object.freeze({
    label: "Ночной сигнал",
    pageClassName: "theme-night-signal",
    typographyPreset: "industrial_condensed",
    appearanceFamily: "dark_signal",
    allowsFuturePaletteOverride: true,
    surfaces: buildSurfaceMap("pass")
  }),
  concrete_blueprint: Object.freeze({
    label: "Бетонный чертеж",
    pageClassName: "theme-concrete-blueprint",
    typographyPreset: "neutral_sans",
    appearanceFamily: "cool_blueprint",
    allowsFuturePaletteOverride: true,
    surfaces: buildSurfaceMap("pass")
  })
});

export const LANDING_PAGE_THEME_KEYS = Object.freeze(
  Object.keys(LANDING_PAGE_THEME_REGISTRY)
);

export const LANDING_STAGE_A_TEXT_BEARING_BLOCKS = Object.freeze([
  "landing_hero",
  "content_band",
  "cta_band"
]);

export const LANDING_STAGE_A_PROOF_ORDER_BLOCKS = Object.freeze([
  "media_strip",
  "service_cards",
  "case_cards"
]);

export function resolveLandingPageTheme(themeKey) {
  return LANDING_PAGE_THEME_REGISTRY[themeKey] ?? LANDING_PAGE_THEME_REGISTRY[DEFAULT_LANDING_PAGE_THEME_KEY];
}

export function resolveLandingSurfaceSemantics(themeKey, surfaceTone) {
  const theme = resolveLandingPageTheme(themeKey);
  return theme.surfaces[surfaceTone] ?? theme.surfaces[DEFAULT_LANDING_SURFACE_TONE];
}

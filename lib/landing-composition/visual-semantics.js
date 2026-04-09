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

// Stage A keeps page atmosphere token-backed, but this registry is intentionally
// shaped so a future bounded page-palette override can extend it without
// rewriting the composition field model.
export const LANDING_PAGE_THEME_REGISTRY = Object.freeze({
  earth_sand: Object.freeze({
    label: "Earth Sand",
    pageClassName: "theme-earth-sand",
    allowsFuturePaletteOverride: true,
    surfaces: Object.freeze({
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
        contrastStatus: "pass"
      })
    })
  }),
  forest_contrast: Object.freeze({
    label: "Forest Contrast",
    pageClassName: "theme-forest-contrast",
    allowsFuturePaletteOverride: true,
    surfaces: Object.freeze({
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
        contrastStatus: "pass"
      })
    })
  }),
  slate_editorial: Object.freeze({
    label: "Slate Editorial",
    pageClassName: "theme-slate-editorial",
    allowsFuturePaletteOverride: true,
    surfaces: Object.freeze({
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
        contrastStatus: "warning"
      })
    })
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

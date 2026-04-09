import {
  DEFAULT_LANDING_PAGE_THEME_KEY,
  DEFAULT_LANDING_SURFACE_TONE,
  DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
  LANDING_PAGE_THEME_KEYS,
  LANDING_STAGE_A_TEXT_BEARING_BLOCKS,
  LANDING_SURFACE_TONES,
  LANDING_TEXT_EMPHASIS_PRESETS
} from "../landing-composition/visual-semantics.js";

const PROOF_FAMILY_CONFIG = Object.freeze({
  media: {
    arrayField: "mediaAssetIds",
    blockId: "media_strip"
  },
  service: {
    arrayField: "serviceCardIds",
    blockId: "service_cards"
  },
  case: {
    arrayField: "caseCardIds",
    blockId: "case_cards"
  }
});

export const LANDING_STAGE_A_BLOCK_IDS = Object.freeze([...LANDING_STAGE_A_TEXT_BEARING_BLOCKS]);
export const LANDING_WORKSPACE_THEME_OPTIONS = Object.freeze([...LANDING_PAGE_THEME_KEYS]);
export const LANDING_WORKSPACE_TEXT_EMPHASIS_OPTIONS = Object.freeze([...LANDING_TEXT_EMPHASIS_PRESETS]);
export const LANDING_WORKSPACE_SURFACE_TONE_OPTIONS = Object.freeze([...LANDING_SURFACE_TONES]);

function cloneDraft(draft = {}) {
  return JSON.parse(JSON.stringify(draft ?? {}));
}

function toList(items) {
  return Array.isArray(items) ? [...items] : [];
}

function moveListItem(items = [], id = "", direction = "down") {
  const list = toList(items);
  const index = list.indexOf(id);

  if (index === -1) {
    return list;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= list.length) {
    return list;
  }

  const [entry] = list.splice(index, 1);
  list.splice(targetIndex, 0, entry);
  return list;
}

function getProofFamilyConfig(family = "") {
  return PROOF_FAMILY_CONFIG[family] ?? null;
}

export function isStageATextBlock(blockId = "") {
  return LANDING_STAGE_A_BLOCK_IDS.includes(blockId);
}

export function createWorkspaceDraftState(input = {}) {
  const draft = cloneDraft(input);

  return {
    ...draft,
    pageThemeKey: draft.pageThemeKey || DEFAULT_LANDING_PAGE_THEME_KEY,
    mediaAssetIds: toList(draft.mediaAssetIds),
    serviceCardIds: toList(draft.serviceCardIds),
    caseCardIds: toList(draft.caseCardIds),
    hero: {
      headline: draft.hero?.headline || "",
      body: draft.hero?.body || "",
      mediaAssetId: draft.hero?.mediaAssetId || "",
      textEmphasisPreset: draft.hero?.textEmphasisPreset || DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
      surfaceTone: draft.hero?.surfaceTone || DEFAULT_LANDING_SURFACE_TONE
    },
    contentBand: {
      body: draft.contentBand?.body || "",
      subtitle: draft.contentBand?.subtitle || "",
      textEmphasisPreset: draft.contentBand?.textEmphasisPreset || DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
      surfaceTone: draft.contentBand?.surfaceTone || DEFAULT_LANDING_SURFACE_TONE
    },
    ctaBand: {
      title: draft.ctaBand?.title || "",
      body: draft.ctaBand?.body || "",
      note: draft.ctaBand?.note || "",
      textEmphasisPreset: draft.ctaBand?.textEmphasisPreset || DEFAULT_LANDING_TEXT_EMPHASIS_PRESET,
      surfaceTone: draft.ctaBand?.surfaceTone || DEFAULT_LANDING_SURFACE_TONE
    }
  };
}

export function getMaterialUsageState(draftInput = {}, family = "", id = "") {
  const draft = createWorkspaceDraftState(draftInput);

  if (!id) {
    return {
      status: "available",
      isUsed: false,
      isPrimary: false,
      inProofList: false
    };
  }

  if (family === "media") {
    const inProofList = draft.mediaAssetIds.includes(id);
    const isPrimary = draft.hero.mediaAssetId === id;

    if (isPrimary) {
      return {
        status: inProofList ? "primary_and_added" : "primary",
        isUsed: true,
        isPrimary: true,
        inProofList
      };
    }

    if (inProofList) {
      return {
        status: "added",
        isUsed: true,
        isPrimary: false,
        inProofList: true
      };
    }
  }

  const config = getProofFamilyConfig(family);

  if (!config) {
    return {
      status: "available",
      isUsed: false,
      isPrimary: false,
      inProofList: false
    };
  }

  const inProofList = toList(draft[config.arrayField]).includes(id);

  return {
    status: inProofList ? "added" : "available",
    isUsed: inProofList,
    isPrimary: false,
    inProofList
  };
}

export function toggleProofMaterial(draftInput = {}, family = "", id = "") {
  const config = getProofFamilyConfig(family);
  const draft = createWorkspaceDraftState(draftInput);

  if (!config || !id) {
    return draft;
  }

  const nextItems = toList(draft[config.arrayField]);
  const existingIndex = nextItems.indexOf(id);

  if (existingIndex >= 0) {
    nextItems.splice(existingIndex, 1);
  } else {
    nextItems.push(id);
  }

  return {
    ...draft,
    [config.arrayField]: nextItems
  };
}

export function removeMaterialFromPage(draftInput = {}, family = "", id = "") {
  const draft = createWorkspaceDraftState(draftInput);

  if (!id) {
    return draft;
  }

  if (family === "media") {
    return {
      ...draft,
      mediaAssetIds: draft.mediaAssetIds.filter((itemId) => itemId !== id),
      hero: {
        ...draft.hero,
        mediaAssetId: draft.hero.mediaAssetId === id ? "" : draft.hero.mediaAssetId
      }
    };
  }

  return toggleProofMaterial(draft, family, id);
}

export function assignHeroMedia(draftInput = {}, mediaAssetId = "") {
  const draft = createWorkspaceDraftState(draftInput);

  return {
    ...draft,
    mediaAssetIds: draft.mediaAssetIds.filter((itemId) => itemId !== mediaAssetId),
    hero: {
      ...draft.hero,
      mediaAssetId: mediaAssetId || ""
    }
  };
}

export function moveProofMaterial(draftInput = {}, family = "", id = "", direction = "down") {
  const config = getProofFamilyConfig(family);
  const draft = createWorkspaceDraftState(draftInput);

  if (!config || !id) {
    return draft;
  }

  return {
    ...draft,
    [config.arrayField]: moveListItem(draft[config.arrayField], id, direction)
  };
}

export function updatePageThemeKey(draftInput = {}, pageThemeKey = DEFAULT_LANDING_PAGE_THEME_KEY) {
  const draft = createWorkspaceDraftState(draftInput);

  return {
    ...draft,
    pageThemeKey: LANDING_WORKSPACE_THEME_OPTIONS.includes(pageThemeKey)
      ? pageThemeKey
      : DEFAULT_LANDING_PAGE_THEME_KEY
  };
}

export function updateStageABlockField(draftInput = {}, blockId = "", field = "", value = "") {
  const draft = createWorkspaceDraftState(draftInput);

  if (!isStageATextBlock(blockId)) {
    return draft;
  }

  const mapping = {
    landing_hero: "hero",
    content_band: "contentBand",
    cta_band: "ctaBand"
  };
  const targetField = mapping[blockId];

  if (!targetField) {
    return draft;
  }

  if (field === "textEmphasisPreset") {
    return {
      ...draft,
      [targetField]: {
        ...draft[targetField],
        textEmphasisPreset: LANDING_WORKSPACE_TEXT_EMPHASIS_OPTIONS.includes(value)
          ? value
          : DEFAULT_LANDING_TEXT_EMPHASIS_PRESET
      }
    };
  }

  if (field === "surfaceTone") {
    return {
      ...draft,
      [targetField]: {
        ...draft[targetField],
        surfaceTone: LANDING_WORKSPACE_SURFACE_TONE_OPTIONS.includes(value)
          ? value
          : DEFAULT_LANDING_SURFACE_TONE
      }
    };
  }

  return draft;
}

export function updateBlockCopy(draftInput = {}, blockId = "", patch = {}) {
  const draft = createWorkspaceDraftState(draftInput);

  switch (blockId) {
    case "landing_hero":
      return {
        ...draft,
        title: patch.title ?? draft.title,
        hero: {
          ...draft.hero,
          headline: patch.headline ?? draft.hero.headline,
          body: patch.body ?? draft.hero.body
        }
      };
    case "content_band":
      return {
        ...draft,
        contentBand: {
          ...draft.contentBand,
          subtitle: patch.subtitle ?? draft.contentBand.subtitle,
          body: patch.body ?? draft.contentBand.body
        }
      };
    case "cta_band":
      return {
        ...draft,
        ctaVariant: patch.ctaVariant ?? draft.ctaVariant,
        ctaBand: {
          ...draft.ctaBand,
          title: patch.title ?? draft.ctaBand.title,
          body: patch.body ?? draft.ctaBand.body,
          note: patch.note ?? draft.ctaBand.note
        }
      };
    default:
      return draft;
  }
}

export function buildMaterialFamilySummary(draftInput = {}, family = "", items = []) {
  const draft = createWorkspaceDraftState(draftInput);
  const list = Array.isArray(items) ? items : [];

  return list.map((item) => {
    const usage = getMaterialUsageState(draft, family, item.id);

    return {
      ...item,
      usage
    };
  });
}

export function buildStageABlockCapabilities(blockId = "") {
  return {
    allowsStageAControls: isStageATextBlock(blockId),
    allowsTextEmphasisPreset: isStageATextBlock(blockId),
    allowsSurfaceTone: isStageATextBlock(blockId)
  };
}

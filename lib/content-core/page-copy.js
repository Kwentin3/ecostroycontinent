export const KNOWN_LEGACY_PAGE_COPY_ENTRIES = Object.freeze([
  ["Р РЋР Р†РЎРЏР В·Р В°Р Р…Р Р…РЎвЂ№Р Вµ РЎС“РЎРѓР В»РЎС“Р С–Р С‘", "Связанные услуги"],
  ["Р РЋР Р†РЎРЏР В·Р В°Р Р…Р Р…РЎвЂ№Р Вµ Р С”Р ВµР в„–РЎРѓРЎвЂ№", "Связанные кейсы"],
  ["Р вЂњР В°Р В»Р ВµРЎР‚Р ВµРЎРЏ", "Галерея"],
  ["Р С™Р С•Р Р…РЎвЂљР В°Р С”РЎвЂљРЎвЂ№", "Контакты"],
  ["Р РЋР Р†РЎРЏР В¶Р С‘РЎвЂљР ВµРЎРѓРЎРЉ РЎРѓ Р Р…Р В°Р СР С‘", "Свяжитесь с нами"],
  ["Р РЋР Р†РЎРЏР В·Р В°РЎвЂљРЎРЉРЎРѓРЎРЏ РЎРѓ Р Р…Р В°Р СР С‘", "Связаться с нами"]
]);

const LEGACY_PAGE_COPY_MAP = new Map(KNOWN_LEGACY_PAGE_COPY_ENTRIES);

export function normalizeLegacyPageCopy(value) {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  return LEGACY_PAGE_COPY_MAP.get(value) ?? value;
}

export function normalizeLegacyPageBlocks(blocks = []) {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .filter((block) => block && typeof block === "object")
    .map((block) => ({
      ...block,
      title: normalizeLegacyPageCopy(block.title),
      ctaLabel: normalizeLegacyPageCopy(block.ctaLabel)
    }));
}

export function normalizeLegacyPagePayload(payload = {}) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  return {
    ...payload,
    blocks: normalizeLegacyPageBlocks(payload.blocks)
  };
}

export function collectKnownLegacyPageCopyMatches(payload = {}) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.blocks)) {
    return [];
  }

  const matches = [];

  payload.blocks.forEach((block, index) => {
    if (!block || typeof block !== "object") {
      return;
    }

    for (const field of ["title", "ctaLabel"]) {
      const value = block[field];

      if (typeof value !== "string" || !LEGACY_PAGE_COPY_MAP.has(value)) {
        continue;
      }

      matches.push({
        blockIndex: index,
        blockType: block.type || "unknown",
        field,
        legacyValue: value,
        normalizedValue: LEGACY_PAGE_COPY_MAP.get(value)
      });
    }
  });

  return matches;
}

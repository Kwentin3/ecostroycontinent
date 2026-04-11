const LEGACY_PAGE_COPY_MAP = new Map([
  ["РЎРІСЏР·Р°РЅРЅС‹Рµ СѓСЃР»СѓРіРё", "Связанные услуги"],
  ["РЎРІСЏР·Р°РЅРЅС‹Рµ РєРµР№СЃС‹", "Связанные кейсы"],
  ["Р“Р°Р»РµСЂРµСЏ", "Галерея"],
  ["РљРѕРЅС‚Р°РєС‚С‹", "Контакты"],
  ["РЎРІСЏР¶РёС‚РµСЃСЊ СЃ РЅР°РјРё", "Свяжитесь с нами"],
  ["РЎРІСЏР·Р°С‚СЊСЃСЏ СЃ РЅР°РјРё", "Связаться с нами"]
]);

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

function asText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function normalizeGeoText(value) {
  return asText(value);
}

export function resolveGlobalDefaultServiceArea(globalSettings = null) {
  return (
    asText(globalSettings?.defaultServiceArea)
    || asText(globalSettings?.serviceArea)
    || asText(globalSettings?.primaryRegion)
  );
}

export function resolveEffectiveServiceArea({ service = null, globalSettings = null } = {}) {
  const serviceArea = asText(service?.serviceArea);
  const globalDefaultServiceArea = resolveGlobalDefaultServiceArea(globalSettings);
  const effectiveServiceArea = serviceArea || globalDefaultServiceArea;

  return {
    effectiveServiceArea,
    serviceArea: effectiveServiceArea,
    serviceAreaNote: asText(service?.serviceAreaNote),
    explicitServiceArea: serviceArea,
    globalDefaultServiceArea,
    source: serviceArea ? "service" : (globalDefaultServiceArea ? "global" : ""),
    inheritedFromGlobal: !serviceArea && Boolean(globalDefaultServiceArea),
    hasEffectiveServiceArea: Boolean(effectiveServiceArea)
  };
}

export function buildServiceAreaReadinessResults({ service = null, globalSettings = null } = {}) {
  const model = resolveEffectiveServiceArea({ service, globalSettings });

  if (!model.hasEffectiveServiceArea) {
    return [{
      severity: "blocking",
      code: "missing_effective_service_area",
      message: "Для публикации услуги нужна зона оказания: заполните зону услуги или общую зону в Global Settings.",
      field: "serviceArea"
    }];
  }

  if (model.inheritedFromGlobal) {
    return [{
      severity: "info",
      code: "inherits_global_service_area",
      message: `Зона оказания услуги наследуется из Global Settings: ${model.effectiveServiceArea}.`,
      field: "serviceArea"
    }];
  }

  return [];
}

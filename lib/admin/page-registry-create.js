import { normalizeLegacyCopy } from "../ui-copy.js";

export function buildRegistryCreateState(query = {}) {
  const open = query?.create === "1";
  const createMode = typeof query?.createMode === "string" ? query.createMode : "standalone";
  const createPageType = typeof query?.createPageType === "string" ? query.createPageType : "about";

  return {
    open,
    mode: createMode,
    pageType: createPageType,
    primaryServiceId: typeof query?.primaryServiceId === "string" ? query.primaryServiceId : "",
    primaryEquipmentId: typeof query?.primaryEquipmentId === "string" ? query.primaryEquipmentId : "",
    cloneFromPageId: typeof query?.cloneFromPageId === "string" ? query.cloneFromPageId : "",
    title: typeof query?.createTitle === "string" ? normalizeLegacyCopy(query.createTitle) : "",
    error: open && query?.error ? normalizeLegacyCopy(query.error) : ""
  };
}

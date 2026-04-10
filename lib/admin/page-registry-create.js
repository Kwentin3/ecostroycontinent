import { normalizeLegacyCopy } from "../ui-copy.js";

export function buildRegistryCreateState(query = {}) {
  const open = query?.create === "1";

  return {
    open,
    pageType: query?.createPageType === "contacts" ? "contacts" : "about",
    title: typeof query?.createTitle === "string" ? normalizeLegacyCopy(query.createTitle) : "",
    error: open && query?.error ? normalizeLegacyCopy(query.error) : ""
  };
}

import { getAppConfig } from "../config.js";
import { normalizeMetricaPublicConfig } from "./metrica-goals.js";

function isAdminPath(pathname = "") {
  return String(pathname || "").startsWith("/admin");
}

export function getMetricaPublicConfig({
  currentPath = "/",
  trackingAllowed = true
} = {}) {
  const config = getAppConfig();

  return normalizeMetricaPublicConfig({
    enabled: config.yandexMetricaPublicEnabled,
    counterId: config.yandexMetricaPublicCounterId,
    trackingAllowed: Boolean(trackingAllowed) && !isAdminPath(currentPath),
    initOptions: {
      clickmap: false,
      webvisor: false,
      ecommerce: false,
      trackLinks: false,
      accurateTrackBounce: false
    }
  });
}

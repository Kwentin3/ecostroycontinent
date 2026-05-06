import { getAppConfig } from "../lib/config.js";
import { buildPublicDisplayModeSnapshot } from "../lib/public-launch/display-mode.js";
import { getDisplayModeState } from "../lib/public-launch/display-mode-store.js";
import { buildPublicRobotsSpec } from "../lib/public-launch/seo-runtime.js";

export const dynamic = "force-dynamic";

export default async function robots() {
  const { appBaseUrl } = getAppConfig();
  const displayModeState = await getDisplayModeState();
  const runtimeSnapshot = buildPublicDisplayModeSnapshot({
    mode: displayModeState?.mode
  });

  return buildPublicRobotsSpec({
    baseUrl: appBaseUrl,
    blockPublicIndexation: runtimeSnapshot.indexingSuppressed
  });
}

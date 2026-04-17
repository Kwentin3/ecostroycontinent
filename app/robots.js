import { getAppConfig } from "../lib/config.js";
import { buildPublicRobotsSpec } from "../lib/public-launch/seo-runtime.js";

export const dynamic = "force-dynamic";

export default async function robots() {
  const { appBaseUrl } = getAppConfig();
  return buildPublicRobotsSpec({ baseUrl: appBaseUrl });
}

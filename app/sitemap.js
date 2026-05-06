import { getAppConfig } from "../lib/config.js";
import { buildPublicDisplayModeSnapshot } from "../lib/public-launch/display-mode.js";
import { getDisplayModeState } from "../lib/public-launch/display-mode-store.js";
import { buildPublishedSitemapEntries } from "../lib/public-launch/seo-runtime.js";
import {
  getPublishedAboutPage,
  getPublishedCases,
  getPublishedContactsPage,
  getPublishedServices
} from "../lib/read-side/public-content.js";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const { appBaseUrl } = getAppConfig();
  const displayModeState = await getDisplayModeState();
  const runtimeSnapshot = buildPublicDisplayModeSnapshot({
    mode: displayModeState?.mode
  });

  if (runtimeSnapshot.indexingSuppressed) {
    return [];
  }

  const [services, cases, aboutPage, contactsPage] = await Promise.all([
    getPublishedServices(),
    getPublishedCases(),
    getPublishedAboutPage(),
    getPublishedContactsPage()
  ]);

  // Sitemap must not publish routes that resolve to 404 because published
  // Content Core pages are missing. See SEO handoff and server acceptance report.
  return buildPublishedSitemapEntries({
    baseUrl: appBaseUrl,
    services,
    cases,
    aboutPage,
    contactsPage
  });
}

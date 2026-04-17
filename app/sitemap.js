import { getAppConfig } from "../lib/config.js";
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
  const [services, cases, aboutPage, contactsPage] = await Promise.all([
    getPublishedServices(),
    getPublishedCases(),
    getPublishedAboutPage(),
    getPublishedContactsPage()
  ]);

  return buildPublishedSitemapEntries({
    baseUrl: appBaseUrl,
    services,
    cases,
    aboutPage,
    contactsPage
  });
}

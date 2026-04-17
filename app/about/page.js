import { notFound } from "next/navigation";

import { StandalonePage } from "../../components/public/PublicRenderers";
import {
  buildPublishedLookups,
  getPublishedAboutPage,
  getPublishedGlobalSettings
} from "../../lib/read-side/public-content";
import {
  getPlaceholderAboutPage,
  getPlaceholderGlobalSettings,
  getPlaceholderServices
} from "../../lib/public-launch/placeholder-fixtures";
import { resolvePlaceholderMode } from "../../lib/public-launch/placeholder-mode";
import { buildPublicRouteMetadata } from "../../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  return buildPublicRouteMetadata({
    pathname: "/about",
    placeholderMode,
    title: "О компании — Экостройконтинент",
    description: "О компании, подходе и зоне работ в рамках launch-core."
  });
}

export default async function AboutPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);

  const [publishedPage, globalSettings, lookups] = await Promise.all([
    getPublishedAboutPage(),
    getPublishedGlobalSettings(),
    buildPublishedLookups()
  ]);

  const placeholderPage = placeholderMode ? getPlaceholderAboutPage() : null;
  const page = publishedPage || placeholderPage;

  if (!page) {
    notFound();
  }

  const usingPlaceholder = !publishedPage && Boolean(placeholderPage);
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const resolvedServiceLinks = lookups.services.length > 0
    ? lookups.services
    : (placeholderMode ? getPlaceholderServices() : []);

  return (
    <StandalonePage
      page={page}
      globalSettings={resolvedGlobalSettings}
      services={(id) => lookups.serviceMap.get(id) || null}
      cases={(id) => lookups.caseMap.get(id) || null}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      serviceLinks={resolvedServiceLinks}
      placeholderMarker={usingPlaceholder}
    />
  );
}

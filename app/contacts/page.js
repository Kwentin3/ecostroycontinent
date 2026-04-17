import { notFound } from "next/navigation";

import { StandalonePage } from "../../components/public/PublicRenderers";
import {
  buildPublishedLookups,
  getPublishedContactsPage,
  getPublishedGlobalSettings
} from "../../lib/read-side/public-content";
import {
  getPlaceholderContactsPage,
  getPlaceholderGlobalSettings,
  getPlaceholderServices
} from "../../lib/public-launch/placeholder-fixtures";
import { resolvePlaceholderMode } from "../../lib/public-launch/placeholder-mode";
import { buildPublicRouteMetadata } from "../../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  const [publishedPage, globalSettings] = await Promise.all([
    getPublishedContactsPage(),
    getPublishedGlobalSettings()
  ]);
  const placeholderPage = placeholderMode ? getPlaceholderContactsPage() : null;
  const page = publishedPage || placeholderPage;
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";
  return buildPublicRouteMetadata({
    pathname: "/contacts",
    placeholderMode,
    title: page?.seo?.metaTitle || page?.h1 || page?.title || "Контакты",
    description: page?.seo?.metaDescription || page?.intro || "Контактная поверхность для следующего шага после услуги или кейса.",
    seo: page?.seo,
    siteName
  });
}

export default async function ContactsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);

  const [publishedPage, globalSettings, lookups] = await Promise.all([
    getPublishedContactsPage(),
    getPublishedGlobalSettings(),
    buildPublishedLookups()
  ]);

  const placeholderPage = placeholderMode ? getPlaceholderContactsPage() : null;
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
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
    />
  );
}

import { PublicListPage } from "../../components/public/PublicRenderers";
import {
  getPublishedGlobalSettings,
  getPublishedServices
} from "../../lib/read-side/public-content";
import { getPlaceholderGlobalSettings, getPlaceholderServices } from "../../lib/public-launch/placeholder-fixtures";
import { buildPlaceholderRobotsMetadata, resolvePlaceholderMode } from "../../lib/public-launch/placeholder-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  return buildPlaceholderRobotsMetadata(placeholderMode);
}

export default async function ServicesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);
  const [services, globalSettings] = await Promise.all([
    getPublishedServices(),
    getPublishedGlobalSettings()
  ]);

  const usingPlaceholder = placeholderMode && services.length === 0;
  const resolvedServices = usingPlaceholder ? getPlaceholderServices() : services;
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);

  return (
    <PublicListPage
      eyebrow="Публичный раздел"
      title="Услуги"
      intro="Здесь показываются только опубликованные версии услуг."
      items={resolvedServices}
      itemHrefPrefix="/services"
      globalSettings={resolvedGlobalSettings}
      currentPath="/services"
      serviceLinks={resolvedServices}
      placeholderMarker={usingPlaceholder}
    />
  );
}

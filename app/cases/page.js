import { PublicListPage } from "../../components/public/PublicRenderers";
import {
  getPublishedCases,
  getPublishedGlobalSettings,
  getPublishedServices
} from "../../lib/read-side/public-content";
import {
  getPlaceholderCases,
  getPlaceholderGlobalSettings,
  getPlaceholderServices
} from "../../lib/public-launch/placeholder-fixtures";
import { buildPlaceholderRobotsMetadata, resolvePlaceholderMode } from "../../lib/public-launch/placeholder-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  return buildPlaceholderRobotsMetadata(placeholderMode);
}

export default async function CasesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);
  const [cases, globalSettings, services] = await Promise.all([
    getPublishedCases(),
    getPublishedGlobalSettings(),
    getPublishedServices()
  ]);

  const usingPlaceholder = placeholderMode && cases.length === 0;
  const resolvedCases = usingPlaceholder ? getPlaceholderCases() : cases;
  const resolvedServices = services.length > 0 ? services : (placeholderMode ? getPlaceholderServices() : []);
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);

  return (
    <PublicListPage
      eyebrow="Публичный раздел"
      title="Кейсы"
      intro="Здесь показываются только опубликованные версии кейсов."
      items={resolvedCases}
      itemHrefPrefix="/cases"
      globalSettings={resolvedGlobalSettings}
      currentPath="/cases"
      serviceLinks={resolvedServices}
      placeholderMarker={usingPlaceholder}
    />
  );
}

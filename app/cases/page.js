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
import { resolvePublicRuntimeDisplayMode } from "../../lib/public-launch/runtime-display-mode";
import { buildPublicRouteMetadata } from "../../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(await searchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled;
  const globalSettings = await getPublishedGlobalSettings();
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";
  return buildPublicRouteMetadata({
    pathname: "/cases",
    placeholderMode,
    title: "Кейсы",
    description: "Подтверждённые кейсы как proof-layer для сервисных страниц.",
    siteName
  });
}

export default async function CasesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(resolvedSearchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled;
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
      eyebrow="Proof layer"
      title="Кейсы"
      intro="Раздел показывает подтверждённые кейсы и ведёт к detail-страницам с task, work scope и result."
      items={resolvedCases}
      itemHrefPrefix="/cases"
      globalSettings={resolvedGlobalSettings}
      currentPath="/cases"
      serviceLinks={resolvedServices}
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
      emptyTitle="Кейсы пока не опубликованы"
      emptyDescription="Пока нет proof-ready кейсов в текущем режиме публикации."
      emptyActionHref="/services"
      emptyActionLabel="Открыть каталог услуг"
      nextStepTitle="Следующий шаг"
      nextStepDescription="После просмотра кейса переходите к релевантной услуге или сразу к контактному действию."
      nextStepPrimaryHref="/services"
      nextStepPrimaryLabel="Перейти к услугам"
      nextStepSecondaryHref="/contacts"
      nextStepSecondaryLabel="Открыть контакты"
      nextStepTone="tinted"
    />
  );
}

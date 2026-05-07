import Link from "next/link";

import { EquipmentCardsSection, PublicHoldingPage, PublicPageShell } from "../components/public/PublicRenderers";
import styles from "../components/public/public-ui.module.css";
import { ENTITY_TYPES } from "../lib/content-core/content-types";
import { resolveEquipmentRecordsForEntity } from "../lib/content-core/equipment-relations.js";
import {
  buildPublishedLookups,
  getPublishedGlobalSettings,
  getPublishedServiceBySlug,
  getPublishedServices
} from "../lib/read-side/public-content";
import { buildEquipmentCardsSectionModel } from "../lib/public-launch/equipment-card-model.js";
import {
  getPlaceholderGlobalSettings,
  getPlaceholderServiceBySlug,
  getPlaceholderServices
} from "../lib/public-launch/placeholder-fixtures";
import { buildPublicContactProjection } from "../lib/public-launch/contact-projection";
import { resolvePublicRuntimeDisplayMode } from "../lib/public-launch/runtime-display-mode";
import { buildPublicRouteMetadata } from "../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

const PRIMARY_SERVICE_SLUG = "arenda-tehniki";

function isInternalHref(href) {
  return typeof href === "string" && (href.startsWith("/") || href.startsWith("#"));
}

function contactTelemetryEvent(href = "") {
  if (href.startsWith("tel:")) {
    return "phone_clicked";
  }

  if (href.startsWith("mailto:")) {
    return "email_clicked";
  }

  if (/t\.me|telegram|wa\.me|whatsapp/i.test(href)) {
    return "messenger_clicked";
  }

  return "cta_clicked";
}

function contactTelemetryChannel(href = "") {
  if (href.startsWith("tel:")) {
    return "phone";
  }

  if (href.startsWith("mailto:")) {
    return "email";
  }

  if (/t\.me|telegram/i.test(href)) {
    return "telegram";
  }

  if (/wa\.me|whatsapp/i.test(href)) {
    return "whatsapp";
  }

  return "";
}

function telemetryProps({
  id,
  event,
  section,
  targetType = "",
  targetId = "",
  ctaKind = "",
  destinationKind = "",
  contactChannel = "",
  cardAction = ""
}) {
  return {
    "data-analytics-id": id,
    "data-analytics-event": event,
    "data-analytics-section": section,
    "data-analytics-target-type": targetType,
    "data-analytics-target-id": targetId,
    "data-analytics-cta-kind": ctaKind || undefined,
    "data-analytics-destination-kind": destinationKind || undefined,
    "data-analytics-contact-channel": contactChannel || undefined,
    "data-analytics-card-action": cardAction || undefined
  };
}

function ActionLink({ action, className, fallbackLabel }) {
  if (!action?.href) {
    return null;
  }

  const label = action.label || fallbackLabel;
  const channel = contactTelemetryChannel(action.href);
  const props = telemetryProps({
    id: action.key ? `home_contact_${action.key}` : "home_contact_action",
    event: contactTelemetryEvent(action.href),
    section: "home-contact-action",
    targetType: isInternalHref(action.href) ? "page" : "contact_channel",
    targetId: isInternalHref(action.href) ? action.href : contactTelemetryEvent(action.href),
    ctaKind: "contact",
    destinationKind: channel || (isInternalHref(action.href) ? "page" : "messenger"),
    contactChannel: channel
  });

  if (isInternalHref(action.href)) {
    return <Link className={className} href={action.href} {...props}>{label}</Link>;
  }

  return <a className={className} href={action.href} {...props}>{label}</a>;
}

function pickPrimaryService({ publishedRentalService, services, placeholderMode }) {
  if (publishedRentalService) {
    return publishedRentalService;
  }

  const firstPublishedService = Array.isArray(services)
    ? services.find((service) => service?.slug && service?.title)
    : null;

  if (firstPublishedService) {
    return firstPublishedService;
  }

  return placeholderMode ? getPlaceholderServiceBySlug(PRIMARY_SERVICE_SLUG) : null;
}

function getRenderableItems(items) {
  return Array.isArray(items)
    ? items.filter((item) => item?.slug && item?.title)
    : [];
}

function rotateItemsByDay(items, now = new Date()) {
  const renderableItems = getRenderableItems(items);

  if (renderableItems.length < 2) {
    return renderableItems;
  }

  const daySeed = Math.floor(now.getTime() / 86400000);
  const offset = daySeed % renderableItems.length;

  return [
    ...renderableItems.slice(offset),
    ...renderableItems.slice(0, offset)
  ];
}

export async function generateMetadata({ searchParams }) {
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(await searchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled || runtimeDisplayMode.underConstruction;
  const [globalSettings, publishedRentalService, services] = await Promise.all([
    getPublishedGlobalSettings(),
    runtimeDisplayMode.underConstruction ? Promise.resolve(null) : getPublishedServiceBySlug(PRIMARY_SERVICE_SLUG),
    runtimeDisplayMode.underConstruction ? Promise.resolve([]) : getPublishedServices()
  ]);
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";
  const metadataService = runtimeDisplayMode.underConstruction
    ? null
    : pickPrimaryService({
        publishedRentalService,
        services,
        placeholderMode: false
      });

  return buildPublicRouteMetadata({
    pathname: "/",
    placeholderMode,
    title: runtimeDisplayMode.underConstruction
      ? `${siteName} — сайт в режиме подготовки`
      : metadataService?.seo?.metaTitle || "Аренда спецтехники с оператором | Экостройконтинент",
    description: runtimeDisplayMode.underConstruction
      ? "Публичный контур временно переведён в режим подготовки."
      : metadataService?.seo?.metaDescription || "Аренда спецтехники для земляных, погрузочных и планировочных работ. С оператором и без, договор, НДС, безналичный расчёт.",
    siteName
  });
}

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(resolvedSearchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled;

  if (runtimeDisplayMode.underConstruction) {
    const [globalSettings, services] = await Promise.all([
      getPublishedGlobalSettings(),
      getPublishedServices()
    ]);

    return (
      <PublicHoldingPage
        globalSettings={globalSettings || getPlaceholderGlobalSettings()}
        currentPath="/"
        serviceLinks={services}
        title="Сайт в режиме подготовки"
        description="Главная временно работает как поверхность режима подготовки до следующего переключения."
      />
    );
  }

  const [globalSettings, services, lookups, publishedRentalService] = await Promise.all([
    getPublishedGlobalSettings(),
    getPublishedServices(),
    buildPublishedLookups(),
    getPublishedServiceBySlug(PRIMARY_SERVICE_SLUG)
  ]);

  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const resolvedServices = getRenderableItems(services).length > 0
    ? getRenderableItems(services)
    : (placeholderMode ? getPlaceholderServices() : []);
  const primaryService = pickPrimaryService({
    publishedRentalService,
    services: resolvedServices,
    placeholderMode
  });
  const secondaryServices = primaryService
    ? resolvedServices.filter((item) => item.entityId !== primaryService.entityId && item.slug !== primaryService.slug)
    : [];
  const rotatingServices = rotateItemsByDay(secondaryServices).slice(0, 3);
  const hasMoreServices = rotatingServices.length > 0;
  const publishedCases = rotateItemsByDay(lookups.cases).slice(0, 3);
  const hasPublishedCases = publishedCases.length > 0;
  const contactProjection = buildPublicContactProjection(resolvedGlobalSettings, { currentPath: "/" });
  const relatedEquipment = primaryService
    ? resolveEquipmentRecordsForEntity({
        payload: primaryService,
        equipmentRecords: lookups.equipment,
        entityType: ENTITY_TYPES.SERVICE,
        entityId: primaryService.entityId
      })
    : [];
  const equipmentCardsModel = buildEquipmentCardsSectionModel({
    equipmentRecords: relatedEquipment,
    resolveMedia: (id) => lookups.mediaMap.get(id) || null,
    resolveGallery: (id) => lookups.galleryMap.get(id) || null,
    ctaAction: contactProjection.primaryAction,
    ctaLabel: primaryService?.ctaVariant || contactProjection.defaultCtaLabel
  });

  if (!primaryService) {
    return (
      <PublicPageShell
        globalSettings={resolvedGlobalSettings}
        themeClassName={styles.themeGraphiteIndustrial}
        currentPath="/"
        serviceLinks={resolvedServices}
        allowStructuredData={!placeholderMode}
        placeholderMarker={placeholderMode}
        showCasesNav={hasPublishedCases}
      >
        <main className={styles.page}>
          <section
            id="preview-home-empty"
            data-preview-section="home-empty"
            className={`${styles.hero} ${styles.previewSection} ${styles.sectionToneTinted} ${styles.textEmphasisStrong}`}
          >
            <p className={styles.eyebrow}>Экостройконтинент</p>
            <h1>Услуги готовятся к публикации</h1>
            <p>Главная витрина появится после публикации первой услуги и связанных материалов.</p>
            <div className={styles.linkRow}>
              <Link
                className={styles.actionLink}
                href="/contacts"
                {...telemetryProps({
                  id: "home_empty_contacts",
                  event: "cta_clicked",
                  section: "home-empty",
                  targetType: "page",
                  targetId: "/contacts",
                  ctaKind: "contact_page",
                  destinationKind: "contact_page"
                })}
              >
                Открыть контакты
              </Link>
            </div>
          </section>
        </main>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell
      globalSettings={resolvedGlobalSettings}
      themeClassName={styles.themeGraphiteIndustrial}
      currentPath="/"
      serviceLinks={resolvedServices}
      allowStructuredData={!placeholderMode}
      placeholderMarker={placeholderMode && !primaryService}
      showCasesNav={hasPublishedCases}
    >
      <main className={styles.page}>
        <section
          id="preview-home-hero"
          data-preview-section="hero"
          className={`${styles.hero} ${styles.previewSection} ${styles.sectionToneTinted} ${styles.textEmphasisStrong}`}
        >
          <p className={styles.eyebrow}>Экостройконтинент</p>
          <h1>{primaryService?.h1 || "Аренда спецтехники с оператором и без"}</h1>
          <p>{primaryService?.summary || "Подбираем технику под земляные, погрузочные и планировочные работы."}</p>
          <div className={styles.grid}>
            <article className={styles.card}>
              <h3>От 100 моточасов</h3>
              <p>Минимальный срок аренды помогает планировать выезд техники под реальные строительные задачи.</p>
            </article>
            <article className={styles.card}>
              <h3>С оператором и без</h3>
              <p>Предоставляем собственную технику под задачи объекта и условия площадки.</p>
            </article>
            <article className={styles.card}>
              <h3>Договор и НДС</h3>
              <p>Работаем по договору, принимаем безналичный расчёт и даём закрывающие документы.</p>
            </article>
          </div>
          <div className={styles.linkRow}>
            <ActionLink
              action={contactProjection.primaryAction}
              className={styles.actionLink}
              fallbackLabel="Оставить заявку"
            />
            <Link
              className={styles.actionLinkSecondary}
              href="#preview-home-equipment"
              {...telemetryProps({
                id: "home_choose_equipment",
                event: "cta_clicked",
                section: "hero",
                targetType: "page",
                targetId: "#preview-home-equipment",
                ctaKind: "section_navigation",
                destinationKind: "page"
              })}
            >
              Выбрать технику
            </Link>
          </div>
        </section>

        <section
          id="preview-home-service"
          data-preview-section="home-service"
          className={`${styles.grid} ${styles.previewSection}`}
        >
          <article className={styles.card}>
            <p className={styles.eyebrow}>Что входит</p>
            <h2>Подача, ГСМ и доставка на объект</h2>
            <p>{primaryService?.serviceScope}</p>
          </article>
          <article className={styles.card}>
            <p className={styles.eyebrow}>Работы</p>
            <h2>Котлованы, траншеи, грунт и планировка</h2>
            <p>{primaryService?.problemsSolved}</p>
          </article>
        </section>

        <section
          id="preview-home-workflow"
          data-preview-section="home-workflow"
          className={`${styles.card} ${styles.previewSection} ${styles.sectionTonePlain}`}
        >
          <p className={styles.eyebrow}>Как работаем</p>
          <h2>От заявки до выезда техники</h2>
          <p>{primaryService?.methods}</p>
        </section>

        <section
          id="preview-home-equipment"
          data-preview-section="home-equipment"
          className={styles.previewSection}
        >
          <EquipmentCardsSection
            model={equipmentCardsModel}
            heading="Техника для аренды"
          />
        </section>

        {hasMoreServices ? (
          <section
            id="preview-home-services"
            data-preview-section="home-services"
            className={styles.previewSection}
          >
            <p className={styles.eyebrow}>Другие услуги</p>
            <h2>Дополнительные направления работ</h2>
            <div className={styles.grid}>
              {rotatingServices.map((item) => (
                <article key={item.entityId || item.slug} className={styles.card}>
                  <h3>{item.title}</h3>
                  <p>{item.summary || item.serviceScope || item.problemsSolved}</p>
                  <Link
                    className={styles.actionLink}
                    href={`/services/${item.slug}`}
                    {...telemetryProps({
                      id: `home_service_${item.entityId || item.slug}`,
                      event: "service_card_opened",
                      section: "home-services",
                      targetType: "service",
                      targetId: item.entityId || item.slug,
                      cardAction: "open"
                    })}
                  >
                    Открыть услугу
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {hasPublishedCases ? (
          <section
            id="preview-home-cases"
            data-preview-section="home-cases"
            className={styles.previewSection}
          >
            <p className={styles.eyebrow}>Опыт работ</p>
            <h2>Кейсы по спецтехнике</h2>
            <div className={styles.grid}>
              {publishedCases.slice(0, 3).map((item) => (
                <article key={item.entityId || item.slug} className={styles.card}>
                  <h3>{item.title}</h3>
                  {item.location ? <p className={styles.note}>{item.location}</p> : null}
                  <p>{item.summary || item.result || item.task}</p>
                  <Link
                    className={styles.actionLink}
                    href={`/cases/${item.slug}`}
                    {...telemetryProps({
                      id: `home_case_${item.entityId || item.slug}`,
                      event: "case_card_opened",
                      section: "home-cases",
                      targetType: "case",
                      targetId: item.entityId || item.slug,
                      cardAction: "open"
                    })}
                  >
                    Смотреть кейс
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section
          id="preview-home-geography"
          data-preview-section="home-geography"
          className={`${styles.card} ${styles.previewSection} ${styles.sectionToneTinted}`}
        >
          <p className={styles.eyebrow}>География</p>
          <h2>Работаем по городам и регионам РФ</h2>
          <p>{primaryService?.serviceArea || resolvedGlobalSettings?.serviceArea}</p>
          {primaryService?.serviceAreaNote ? <p className={styles.note}>{primaryService.serviceAreaNote}</p> : null}
        </section>

        <section
          id="preview-home-next-step"
          data-preview-section="home-next-step"
          className={`${styles.card} ${styles.previewSection} ${styles.sectionToneEmphasis}`}
        >
          <h2>Оставить заявку на аренду спецтехники</h2>
          <p className={styles.ctaCopy}>{contactProjection.defaultCtaDescription}</p>
          <div className={styles.linkRow}>
            <ActionLink
              action={contactProjection.primaryAction}
              className={styles.actionLink}
              fallbackLabel="Уточнить стоимость"
            />
            <Link
              className={styles.actionLinkSecondary}
              href={`/services/${primaryService?.slug || PRIMARY_SERVICE_SLUG}`}
              {...telemetryProps({
                id: `home_bottom_service_${primaryService?.entityId || primaryService?.slug || PRIMARY_SERVICE_SLUG}`,
                event: "service_card_opened",
                section: "home-next-step",
                targetType: "service",
                targetId: primaryService?.entityId || primaryService?.slug || PRIMARY_SERVICE_SLUG,
                cardAction: "open"
              })}
            >
              Открыть услугу
            </Link>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}

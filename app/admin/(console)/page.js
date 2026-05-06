import Link from "next/link";

import { AdminShell } from "../../../components/admin/AdminShell";
import { EvidenceRegisterPanel } from "../../../components/admin/EvidenceRegisterPanel";
import { ContentOpsCockpitPanel } from "../../../components/admin/ContentOpsCockpitPanel";
import { PublicDisplayModeControlPanel } from "../../../components/admin/PublicDisplayModeControlPanel";
import styles from "../../../components/admin/admin-ui.module.css";
import { requireAdminUser } from "../../../lib/admin/page-helpers";
import { ENTITY_TYPES } from "../../../lib/content-core/content-types.js";
import {
  findEntityByTypeSingleton,
  findRevisionById,
  listPublishObligations,
  listUsers
} from "../../../lib/content-core/repository.js";
import { listEntityCards } from "../../../lib/content-core/service";
import { evaluateReadiness } from "../../../lib/content-ops/readiness.js";
import { buildContentOpsCockpitProjection } from "../../../lib/admin/content-ops-cockpit.js";
import { getDisplayModeState, listDisplayModeAuditTrail } from "../../../lib/public-launch/display-mode-store.js";
import {
  getEntityTypeLabel,
  getOwnerApprovalStatusLabel,
  getRevisionStateLabel,
  normalizeLegacyCopy
} from "../../../lib/ui-copy.js";
import { getReviewQueue } from "../../../lib/content-ops/workflow";
import { userIsSuperadmin } from "../../../lib/auth/roles.js";

function getCardLabel(card) {
  return (
    card.latestRevision?.payload?.title ||
    card.latestRevision?.payload?.h1 ||
    card.latestRevision?.payload?.publicBrandName ||
    card.latestRevision?.payload?.slug ||
    card.entity.id
  );
}

function getCardTypeLabel(card) {
  return getEntityTypeLabel(card.entity.entityType);
}

function pickRequiresYourAction(items, user) {
  if (user.role === "business_owner") {
    return items.filter((item) => item.revision.ownerReviewRequired && item.revision.ownerApprovalStatus === "pending");
  }

  return items.filter((item) => item.revision.state === "review");
}

function buildReadyNext(cards) {
  return cards.filter((item) => item.latestRevision?.state === "draft");
}

async function buildCockpitSnapshot(card, globalSettingsRevision) {
  const revision = card.latestRevision ?? null;
  const readiness = revision
    ? await evaluateReadiness({
        entity: card.entity,
        revision,
        globalSettingsRevision
      })
    : null;
  const obligations = await listPublishObligations(card.entity.id);

  return {
    entityType: card.entity.entityType,
    entityId: card.entity.id,
    label: getCardLabel(card),
    readiness,
    obligations,
    hasDraftRevision: Boolean(revision && revision.state === "draft"),
    hasPublishedRevision: Boolean(card.entity.activePublishedRevisionId),
    isSingleton: card.entity.entityType === ENTITY_TYPES.GLOBAL_SETTINGS
  };
}

export default async function AdminDashboardPage({ searchParams }) {
  const user = await requireAdminUser();
  const query = await searchParams;
  const superadmin = userIsSuperadmin(user);

  const [
    reviewQueue,
    globalSettingsCards,
    serviceCards,
    caseCards,
    pageCards,
    mediaAssetCards,
    galleryCards,
    globalSettingsEntity,
    displayModeState,
    displayModeAuditTrail,
    users
  ] = await Promise.all([
    getReviewQueue(),
    listEntityCards(ENTITY_TYPES.GLOBAL_SETTINGS),
    listEntityCards(ENTITY_TYPES.SERVICE),
    listEntityCards(ENTITY_TYPES.CASE),
    listEntityCards(ENTITY_TYPES.PAGE),
    listEntityCards(ENTITY_TYPES.MEDIA_ASSET),
    listEntityCards(ENTITY_TYPES.GALLERY),
    findEntityByTypeSingleton(ENTITY_TYPES.GLOBAL_SETTINGS),
    superadmin ? getDisplayModeState() : Promise.resolve(null),
    superadmin ? listDisplayModeAuditTrail({ limit: 12 }) : Promise.resolve([]),
    superadmin ? listUsers() : Promise.resolve([])
  ]);

  const globalSettingsRevision = globalSettingsEntity?.activePublishedRevisionId
    ? await findRevisionById(globalSettingsEntity.activePublishedRevisionId)
    : null;

  const cockpitCards = [
    ...globalSettingsCards,
    ...serviceCards,
    ...caseCards,
    ...pageCards,
    ...mediaAssetCards,
    ...galleryCards
  ];

  const cockpitSnapshots = await Promise.all(
    cockpitCards.map((card) => buildCockpitSnapshot(card, globalSettingsRevision))
  );
  const cockpit = buildContentOpsCockpitProjection({ entities: cockpitSnapshots });
  const requiresAction = pickRequiresYourAction(reviewQueue, user);
  const requiresActionIds = new Set(requiresAction.map((item) => item.revision.id));
  const waitingOnOthers = reviewQueue.filter((item) => !requiresActionIds.has(item.revision.id));
  const readyNext = buildReadyNext([...serviceCards, ...caseCards]);
  const actorMap = Object.fromEntries(
    (users || []).map((item) => [
      item.id,
      {
        username: item.username,
        displayName: item.display_name,
        role: item.role
      }
    ])
  );

  return (
    <AdminShell user={user} title="Рабочая панель" breadcrumbs={[{ label: "Админка", href: "/admin" }]} activeHref="/admin">
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}

        {superadmin ? (
          <PublicDisplayModeControlPanel
            currentState={displayModeState}
            history={displayModeAuditTrail}
            actorMap={actorMap}
          />
        ) : null}

        <ContentOpsCockpitPanel cockpit={cockpit} />

        <EvidenceRegisterPanel cockpit={cockpit} />

        <section className={styles.panel}>
          <p className={styles.eyebrow}>Нужно ваше действие</p>
          {requiresAction.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.mutedText}>Сейчас ничего не требует вашего действия.</p>
              <p className={styles.mutedText}>Начните с услуг, кейсов или очереди проверки, чтобы продвинуть стартовый набор вперёд.</p>
              <Link href="/admin/entities/service/new" className={styles.primaryButton}>Создать услугу</Link>
            </div>
          ) : (
            <div className={styles.timeline}>
              {requiresAction.map((item) => (
                <article key={item.revision.id} className={styles.timelineItem}>
                  <h4>{item.revision.payload.title || item.revision.payload.h1 || getEntityTypeLabel(item.entityType)}</h4>
                  <p className={styles.mutedText}>
                    {getEntityTypeLabel(item.entityType)} | версия №{item.revision.revisionNumber} | {getRevisionStateLabel(item.revision.state)}
                  </p>
                  <Link href={`/admin/review/${item.revision.id}`}>Открыть проверку</Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.gridTwo}>
          <div className={styles.panel}>
            <h3>Ждёт других</h3>
            {waitingOnOthers.length === 0 ? (
              <p className={styles.mutedText}>Сейчас ничего не ждёт другую роль.</p>
            ) : (
              <ul>
                {waitingOnOthers.map((item) => (
                  <li key={item.revision.id}>
                    {item.revision.payload.title || getEntityTypeLabel(item.entityType)} |{" "}
                    {item.revision.ownerReviewRequired
                      ? getOwnerApprovalStatusLabel(item.revision.ownerApprovalStatus)
                      : "Редакционная проверка"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.panel}>
            <h3>Готово к следующему шагу</h3>
            {readyNext.length === 0 ? (
              <p className={styles.mutedText}>Черновиков, готовых к следующему шагу, пока нет.</p>
            ) : (
              <ul>
                {readyNext.map((item) => (
                  <li key={item.entity.id}>
                    <Link href={`/admin/entities/${item.entity.entityType}/${item.entity.id}`}>
                      {item.latestRevision.payload.title || item.latestRevision.payload.h1 || getCardTypeLabel(item)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

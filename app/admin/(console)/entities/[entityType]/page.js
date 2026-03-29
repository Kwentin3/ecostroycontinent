import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { MediaGalleryWorkspace } from "../../../../../components/admin/MediaGalleryWorkspace";
import { SurfacePacket } from "../../../../../components/admin/SurfacePacket";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { buildListRowProjection, buildListSurfaceViewModel } from "../../../../../lib/admin/list-visibility.js";
import { listCollectionLibraryCards, listMediaLibraryCards } from "../../../../../lib/admin/media-gallery.js";
import { normalizeAdminReturnTo } from "../../../../../lib/admin/relation-navigation.js";
import { requireEditorUser } from "../../../../../lib/admin/page-helpers";
import { getEntityListLegend } from "../../../../../lib/admin/screen-copy.js";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../../../../../lib/content-core/content-types.js";
import { assertEntityType, listEntityCards } from "../../../../../lib/content-core/service";
import { evaluateReadiness } from "../../../../../lib/content-ops/readiness.js";
import { findEntityByTypeSingleton, findRevisionById, listPublishObligations } from "../../../../../lib/content-core/repository.js";
import { normalizeLegacyCopy } from "../../../../../lib/ui-copy.js";

export default async function EntityListPage({ params, searchParams }) {
  const { entityType } = await params;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);
  const query = await searchParams;

  if (!ENTITY_TYPE_LABELS[normalizedType]) {
    notFound();
  }

  if (normalizedType === ENTITY_TYPES.GALLERY) {
    const target = new URLSearchParams();
    target.set("compose", "collections");

    if (query?.collection) {
      target.set("collection", query.collection);
    }

    if (query?.message) {
      target.set("message", query.message);
    }

    if (query?.error) {
      target.set("error", query.error);
    }

    const returnTo = normalizeAdminReturnTo(query?.returnTo);

    if (returnTo) {
      target.set("returnTo", returnTo);
    }

    redirect(`/admin/entities/media_asset?${target.toString()}`);
  }

  if (normalizedType === ENTITY_TYPES.GLOBAL_SETTINGS) {
    const cards = await listEntityCards(normalizedType);

    if (cards[0]?.entity?.id) {
      redirect(`/admin/entities/${normalizedType}/${cards[0].entity.id}`);
    }

    redirect(`/admin/entities/${normalizedType}/new`);
  }

  if (normalizedType === ENTITY_TYPES.MEDIA_ASSET) {
    const [mediaItems, collectionItems] = await Promise.all([
      listMediaLibraryCards(),
      listCollectionLibraryCards()
    ]);
    const selectedAssetId = query?.asset || query?.entityId || mediaItems[0]?.id || "";
    const initialCompose = query?.compose || "";
    const initialCollectionId = query?.collection || "";
    const workspaceReturnTo = normalizeAdminReturnTo(query?.returnTo);
    const workspaceQuery = new URLSearchParams();

    if (selectedAssetId) {
      workspaceQuery.set("asset", selectedAssetId);
    }

    if (initialCompose) {
      workspaceQuery.set("compose", initialCompose);
    }

    if (initialCollectionId) {
      workspaceQuery.set("collection", initialCollectionId);
    }

    if (query?.message) {
      workspaceQuery.set("message", query.message);
    }

    if (query?.error) {
      workspaceQuery.set("error", query.error);
    }

    if (workspaceReturnTo) {
      workspaceQuery.set("returnTo", workspaceReturnTo);
    }

    const workspaceContextHref = `/admin/entities/media_asset${workspaceQuery.toString() ? `?${workspaceQuery.toString()}` : ""}`;

    return (
      <AdminShell
        user={user}
        title="Медиа"
        breadcrumbs={[
          { label: "Админка", href: "/admin" },
          { label: "Медиа" }
        ]}
        activeHref="/admin/entities/media_asset"
        actions={workspaceReturnTo ? <Link href={workspaceReturnTo} className={styles.secondaryButton}>Вернуться к источнику</Link> : null}
      >
        <div className={styles.stack}>
          <MediaGalleryWorkspace
            initialItems={mediaItems}
            initialCollections={collectionItems}
            initialSelectedId={selectedAssetId}
            initialCollectionId={initialCollectionId}
            initialCompose={initialCompose}
            currentUsername={user.username}
            initialMessage={query?.message ? normalizeLegacyCopy(query.message) : ""}
            initialError={query?.error ? normalizeLegacyCopy(query.error) : ""}
            workspaceContextHref={workspaceContextHref}
          />
        </div>
      </AdminShell>
    );
  }

  const globalSettingsEntity = await findEntityByTypeSingleton(ENTITY_TYPES.GLOBAL_SETTINGS);
  const globalSettingsRevision = globalSettingsEntity?.activePublishedRevisionId
    ? await findRevisionById(globalSettingsEntity.activePublishedRevisionId)
    : null;
  const cards = await listEntityCards(normalizedType);
  const listHrefParams = new URLSearchParams();

  if (query?.message) {
    listHrefParams.set("message", query.message);
  }

  if (query?.error) {
    listHrefParams.set("error", query.error);
  }

  const listHref = `/admin/entities/${normalizedType}${listHrefParams.toString() ? `?${listHrefParams.toString()}` : ""}`;
  const rowModels = await Promise.all(
    cards.map(async (card) => {
      if (!card.latestRevision) {
        return buildListRowProjection({
          card,
          entityType: normalizedType,
          listHref
        });
      }

      let readiness = null;
      let obligations = [];

      try {
        readiness = await evaluateReadiness({
          entity: card.entity,
          revision: card.latestRevision,
          globalSettingsRevision
        });
      } catch {
        readiness = null;
      }

      try {
        obligations = await listPublishObligations(card.entity.id);
      } catch {
        obligations = [];
      }

      return buildListRowProjection({
        card,
        entityType: normalizedType,
        readiness,
        obligations,
        listHref
      });
    })
  );
  const viewModel = buildListSurfaceViewModel(rowModels.filter(Boolean));

  return (
    <AdminShell
      user={user}
      title={ENTITY_TYPE_LABELS[normalizedType]}
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType] }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={<Link href={`/admin/entities/${normalizedType}/new`} className={styles.primaryButton}>РќРѕРІС‹Р№</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        <SurfacePacket
          eyebrow="Список"
          title={ENTITY_TYPE_LABELS[normalizedType]}
          summary={viewModel.summaryNote}
          legend={getEntityListLegend(normalizedType)}
          bullets={viewModel.bullets}
        />
        <section className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Сущность</th>
                <th>Последняя версия</th>
                <th>Сигнал</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {viewModel.rows.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyState}>
                      <p className={styles.mutedText}>Сущностей этого типа пока нет.</p>
                      <Link href={`/admin/entities/${normalizedType}/new`}>Создать первую</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                viewModel.rows.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <div className={styles.cockpitCoverageSummary}>
                        <strong>{row.entityLabel}</strong>
                        <span className={styles.mutedText}>{row.entityTypeLabel}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cockpitCoverageSummary}>
                        <strong>{row.versionLabel}</strong>
                        <span className={styles.mutedText}>{row.versionStateLabel}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cockpitCoverageSummary}>
                        <span
                          className={`${styles.cockpitStatusPill} ${
                            row.signalTone === "danger"
                              ? styles.cockpitToneDanger
                              : row.signalTone === "warning"
                                ? styles.cockpitToneWarning
                                : row.signalTone === "healthy"
                                  ? styles.cockpitToneHealthy
                                  : styles.cockpitToneUnknown
                          }`}
                        >
                          {row.signalLabel}
                        </span>
                        <span className={styles.mutedText}>{row.signalReason}</span>
                      </div>
                    </td>
                    <td>
                      <Link href={row.actionHref} className={styles.secondaryButton}>
                        {row.actionLabel}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AdminShell>
  );
}


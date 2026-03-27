import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { MediaGalleryWorkspace } from "../../../../../components/admin/MediaGalleryWorkspace";
import { SurfacePacket } from "../../../../../components/admin/SurfacePacket";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { summarizeMediaLibrary, listMediaLibraryCards } from "../../../../../lib/admin/media-gallery.js";
import { requireEditorUser } from "../../../../../lib/admin/page-helpers";
import { getEntityListLegend } from "../../../../../lib/admin/screen-copy.js";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../../../../../lib/content-core/content-types.js";
import { assertEntityType, listEntityCards } from "../../../../../lib/content-core/service";
import { getRevisionStateLabel, normalizeLegacyCopy } from "../../../../../lib/ui-copy.js";

export default async function EntityListPage({ params, searchParams }) {
  const { entityType } = await params;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);
  const query = await searchParams;

  if (!ENTITY_TYPE_LABELS[normalizedType]) {
    notFound();
  }

  if (normalizedType === ENTITY_TYPES.GLOBAL_SETTINGS) {
    if (cards[0]?.entity?.id) {
      redirect(`/admin/entities/${normalizedType}/${cards[0].entity.id}`);
    }

    redirect(`/admin/entities/${normalizedType}/new`);
  }

  if (normalizedType === ENTITY_TYPES.MEDIA_ASSET) {
    const mediaItems = await listMediaLibraryCards();
    const summary = summarizeMediaLibrary(mediaItems, user);
    const selectedAssetId = query?.asset || query?.entityId || mediaItems[0]?.id || "";
    const initialCompose = query?.compose || "";

    return (
      <AdminShell
        user={user}
        title="Медиа"
        breadcrumbs={[
          { label: "Админка", href: "/admin" },
          { label: "Медиа" }
        ]}
        activeHref="/admin/entities/media_asset"
      >
        <div className={styles.stack}>
          <SurfacePacket
            eyebrow="Рабочее место"
            title="Медиагалерея"
            summary="Библиотека превью теперь остаётся главным рабочим местом: здесь ищут, выбирают, загружают и доводят изображения до рабочего состояния без прыжка в generic entity form."
            legend={getEntityListLegend(normalizedType)}
            bullets={[
              `Всего карточек: ${summary.total}`,
              `Без alt: ${summary.missingAltCount}`,
              `Используется: ${summary.usedCount}`,
              `Broken сигналов: ${summary.brokenCount}`
            ]}
          />
          <MediaGalleryWorkspace
            initialItems={mediaItems}
            initialSelectedId={selectedAssetId}
            initialCompose={initialCompose}
            currentUsername={user.username}
            initialMessage={query?.message ? normalizeLegacyCopy(query.message) : ""}
            initialError={query?.error ? normalizeLegacyCopy(query.error) : ""}
          />
        </div>
      </AdminShell>
    );
  }

  const cards = await listEntityCards(normalizedType);
  const draftCount = cards.filter((card) => card.latestRevision?.state === "draft").length;
  const reviewCount = cards.filter((card) => card.latestRevision?.state === "review").length;
  const publishedCount = cards.filter((card) => card.latestRevision?.state === "published").length;

  return (
    <AdminShell
      user={user}
      title={ENTITY_TYPE_LABELS[normalizedType]}
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType] }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={<Link href={`/admin/entities/${normalizedType}/new`} className={styles.primaryButton}>Новый</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        <SurfacePacket
          eyebrow="Список"
          title={ENTITY_TYPE_LABELS[normalizedType]}
          summary="Открывайте карточку для редактирования или создайте новую запись через кнопку справа."
          legend={getEntityListLegend(normalizedType)}
          bullets={[
            `Всего записей: ${cards.length}`,
            `Черновиков: ${draftCount}`,
            `На проверке: ${reviewCount}`,
            `Опубликовано: ${publishedCount}`
          ]}
        />
        <section className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Сущность</th>
                <th>Последняя версия</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyState}>
                      <p className={styles.mutedText}>Сущностей этого типа пока нет.</p>
                      <Link href={`/admin/entities/${normalizedType}/new`}>Создать первую</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.entity.id}>
                    <td>{card.latestRevision?.payload?.title || card.latestRevision?.payload?.h1 || card.latestRevision?.payload?.publicBrandName || card.entity.id}</td>
                    <td>{card.latestRevision ? `#${card.latestRevision.revisionNumber}` : "-"}</td>
                    <td>{card.latestRevision ? getRevisionStateLabel(card.latestRevision.state) : "Версий пока нет"}</td>
                    <td>
                      <Link href={`/admin/entities/${normalizedType}/${card.entity.id}`}>Открыть</Link>
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

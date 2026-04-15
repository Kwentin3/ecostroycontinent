import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES, PREVIEW_STATUS } from "../../lib/content-core/content-types.js";
import {
  buildOwnerReviewGalleryCards,
  buildOwnerReviewModalModel,
  filterOwnerReviewGalleryCards,
  getOwnerReviewStatusModel,
  summarizeOwnerReviewGallery
} from "../../lib/admin/owner-review.js";

function buildQueueItem({
  entityId,
  entityType,
  payload,
  ownerReviewRequired = true,
  ownerApprovalStatus = "pending",
  submittedAt = "2026-04-15T09:00:00.000Z",
  previewStatus = PREVIEW_STATUS.RENDERABLE
}) {
  return {
    entityId,
    entityType,
    revision: {
      id: `rev_${entityId}`,
      entityId,
      revisionNumber: 3,
      state: "review",
      payload,
      ownerReviewRequired,
      ownerApprovalStatus,
      previewStatus,
      submittedAt,
      updatedAt: submittedAt
    }
  };
}

test("owner review status model prioritizes materials that still need owner decision", () => {
  assert.equal(getOwnerReviewStatusModel({ ownerReviewRequired: true, ownerApprovalStatus: "pending" }).key, "needs_owner");
  assert.equal(getOwnerReviewStatusModel({ ownerReviewRequired: true, ownerApprovalStatus: "rejected" }).key, "returned");
  assert.equal(getOwnerReviewStatusModel({ ownerReviewRequired: true, ownerApprovalStatus: "approved" }).key, "approved");
  assert.equal(getOwnerReviewStatusModel({ ownerReviewRequired: false, ownerApprovalStatus: "not_required" }).key, "in_review");
});

test("owner review gallery cards sort attention-first and project compact service/case/media/page summaries", () => {
  const cards = buildOwnerReviewGalleryCards([
    buildQueueItem({
      entityId: "page_1",
      entityType: ENTITY_TYPES.PAGE,
      ownerReviewRequired: false,
      ownerApprovalStatus: "not_required",
      payload: {
        title: "Контакты",
        h1: "Контакты",
        intro: "Свяжитесь с нами удобным способом.",
        pageType: "contacts",
        sections: [{ type: "contact_details", body: "Телефон и почта" }]
      }
    }),
    buildQueueItem({
      entityId: "media_1",
      entityType: ENTITY_TYPES.MEDIA_ASSET,
      ownerReviewRequired: true,
      ownerApprovalStatus: "rejected",
      payload: {
        title: "Экскаватор на объекте",
        caption: "Съемка с реального объекта.",
        storageKey: "media/excavator.jpg"
      }
    }),
    buildQueueItem({
      entityId: "service_1",
      entityType: ENTITY_TYPES.SERVICE,
      ownerReviewRequired: true,
      ownerApprovalStatus: "pending",
      payload: {
        title: "Устройство фундаментов",
        summary: "Подготовка основания и заливка фундаментных конструкций.",
        serviceScope: "Подготовка, армирование, бетонирование.",
        problemsSolved: "Берем на себя весь цикл работ.",
        primaryMediaAssetId: "media_service"
      }
    }),
    buildQueueItem({
      entityId: "case_1",
      entityType: ENTITY_TYPES.CASE,
      ownerReviewRequired: true,
      ownerApprovalStatus: "approved",
      payload: {
        title: "Кейс по фундаменту",
        result: "Объект сдан в срок и без переделок.",
        location: "Армавир",
        task: "Сделать фундамент под коммерческое здание."
      }
    })
  ]);

  assert.equal(cards[0].status.key, "needs_owner");
  assert.equal(cards[0].title, "Устройство фундаментов");
  assert.equal(cards[0].mediaUrl, "/api/admin/media/media_service/preview");
  assert.equal(cards[1].status.key, "returned");
  assert.equal(cards[1].mediaUrl, "/api/admin/media/media_1/preview");
  assert.equal(cards[2].status.key, "approved");
  assert.equal(cards[3].status.key, "in_review");
  assert.match(cards[2].summary, /Объект сдан в срок/);
  assert.match(cards[3].summary, /Свяжитесь с нами/);
});

test("owner review gallery filters by status, type, and compact text content", () => {
  const cards = buildOwnerReviewGalleryCards([
    buildQueueItem({
      entityId: "service_1",
      entityType: ENTITY_TYPES.SERVICE,
      payload: {
        title: "Устройство фундаментов",
        summary: "Монолитные работы для коммерческих объектов."
      }
    }),
    buildQueueItem({
      entityId: "case_1",
      entityType: ENTITY_TYPES.CASE,
      ownerApprovalStatus: "approved",
      payload: {
        title: "Кейс по складу",
        result: "Складской фундамент под ключ."
      }
    })
  ]);

  assert.equal(filterOwnerReviewGalleryCards(cards, { status: "needs_owner" }).length, 1);
  assert.equal(filterOwnerReviewGalleryCards(cards, { type: ENTITY_TYPES.CASE }).length, 1);
  assert.equal(filterOwnerReviewGalleryCards(cards, { query: "монолитные" }).length, 1);
  assert.equal(filterOwnerReviewGalleryCards(cards, { query: "склад" }).length, 1);
  assert.equal(filterOwnerReviewGalleryCards(cards, { query: "не существует" }).length, 0);
});

test("owner review gallery summary exposes compact counts for filters", () => {
  const cards = buildOwnerReviewGalleryCards([
    buildQueueItem({
      entityId: "service_1",
      entityType: ENTITY_TYPES.SERVICE,
      payload: { title: "Услуга" }
    }),
    buildQueueItem({
      entityId: "case_1",
      entityType: ENTITY_TYPES.CASE,
      ownerApprovalStatus: "approved",
      payload: { title: "Кейс" }
    })
  ]);

  const summary = summarizeOwnerReviewGallery(cards);

  assert.equal(summary.total, 2);
  assert.equal(summary.byStatus.needs_owner, 1);
  assert.equal(summary.byStatus.approved, 1);
  assert.equal(summary.byType[ENTITY_TYPES.SERVICE], 1);
  assert.equal(summary.byType[ENTITY_TYPES.CASE], 1);
});

test("owner review modal model keeps owner-facing essence without seo noise", () => {
  const serviceModel = buildOwnerReviewModalModel(buildQueueItem({
    entityId: "service_essence",
    entityType: ENTITY_TYPES.SERVICE,
    payload: {
      title: "Устройство фундаментов",
      summary: "Подготовка основания и устройство монолитного фундамента.",
      serviceScope: "Разметка, армирование, опалубка, бетонирование.",
      problemsSolved: "Берем на себя полный цикл работ.",
      methods: "Работаем поэтапно с контролем каждой заливки.",
      primaryMediaAssetId: "media_service"
    }
  }));

  assert.equal(serviceModel.title, "Устройство фундаментов");
  assert.equal(serviceModel.mediaUrl, "/api/admin/media/media_service/preview");
  assert.equal(serviceModel.sections[0].label, "Что входит");
  assert.match(serviceModel.sections[0].value, /Разметка/);
  assert.match(serviceModel.commentPlaceholder, /услуга/i);

  const pageModel = buildOwnerReviewModalModel(buildQueueItem({
    entityId: "page_essence",
    entityType: ENTITY_TYPES.PAGE,
    payload: {
      title: "Страница услуги foundation",
      h1: "Страница услуги foundation",
      intro: "Рассказываем, как выполняем устройство фундаментов под коммерческие объекты.",
      pageType: "service_landing",
      sections: [{ type: "service_scope", body: "Подготовка основания и бетонирование." }]
    }
  }));

  assert.equal(pageModel.pageValue.pageType, "service_landing");
  assert.equal(pageModel.sections[0].label, "Тип страницы");
  assert.match(pageModel.sections[1].value, /Рассказываем/);
});

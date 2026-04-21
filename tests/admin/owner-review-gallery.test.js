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
  assert.equal(getOwnerReviewStatusModel({ ownerReviewRequired: true, ownerApprovalStatus: "approved" }).key, "in_review");
  assert.match(getOwnerReviewStatusModel({ ownerReviewRequired: true, ownerApprovalStatus: "approved" }).label, /Готово к публикации/);
  assert.equal(getOwnerReviewStatusModel({ ownerReviewRequired: false, ownerApprovalStatus: "not_required" }).key, "in_review");
});

test("owner review gallery cards sort attention-first and keep page-specific preview fields", () => {
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
        pageThemeKey: "forest_contrast",
        mediaSettings: { heroLayout: "split" },
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
    }),
    buildQueueItem({
      entityId: "equipment_1",
      entityType: ENTITY_TYPES.EQUIPMENT,
      ownerReviewRequired: true,
      ownerApprovalStatus: "pending",
      payload: {
        slug: "cat-320",
        locale: "ru-RU",
        status: "draft",
        title: "Экскаватор CAT 320",
        equipmentType: "Гусеничный экскаватор",
        shortSummary: "Техника для разработки котлованов и планировки участка.",
        capabilitySummary: "Работает на плотном и влажном грунте, подходит для тяжелых земляных работ.",
        keySpecs: ["Масса 21 т", "Глубина копания 6,7 м"],
        usageScenarios: ["Котлованы", "Планировка участка"],
        operatorMode: "С экипажем",
        primaryMediaAssetId: "media_equipment"
      }
    })
  ]);

  assert.equal(cards[0].status.key, "needs_owner");
  assert.equal(cards[1].status.key, "needs_owner");
  assert.equal(cards[2].status.key, "returned");
  assert.equal(cards[2].mediaUrl, "/api/admin/media/media_1/preview");
  const caseCard = cards.find((card) => card.entityType === ENTITY_TYPES.CASE);
  const pageCard = cards.find((card) => card.entityType === ENTITY_TYPES.PAGE);

  assert.ok(caseCard);
  assert.ok(pageCard);
  assert.equal(caseCard.status.key, "in_review");
  assert.match(caseCard.status.label, /Готово к публикации/);
  assert.match(caseCard.summary, /Объект сдан в срок/);
  assert.equal(pageCard.status.key, "in_review");
  assert.match(pageCard.summary, /Свяжитесь с нами/);
  assert.equal(pageCard.previewTitle, "Контакты");
  assert.equal(pageCard.previewThemeKey, "forest_contrast");
  assert.equal(pageCard.previewHeroLayout, "split");
  assert.equal(pageCard.pageType, "contacts");

  const equipmentCard = cards.find((card) => card.entityType === ENTITY_TYPES.EQUIPMENT);
  const serviceCard = cards.find((card) => card.entityType === ENTITY_TYPES.SERVICE);

  assert.ok(equipmentCard);
  assert.ok(serviceCard);
  assert.equal(equipmentCard.status.key, "needs_owner");
  assert.equal(equipmentCard.title, "Экскаватор CAT 320");
  assert.equal(equipmentCard.mediaUrl, "/api/admin/media/media_equipment/preview");
  assert.match(equipmentCard.summary, /котлованов/i);
  assert.equal(serviceCard.status.key, "needs_owner");
  assert.equal(serviceCard.title, "Устройство фундаментов");
  assert.equal(serviceCard.mediaUrl, "/api/admin/media/media_service/preview");
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
  assert.equal(filterOwnerReviewGalleryCards(cards, { status: "approved" }).length, 1);
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
  assert.equal(summary.byStatus.in_review, 1);
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

  const equipmentModel = buildOwnerReviewModalModel(buildQueueItem({
    entityId: "equipment_essence",
    entityType: ENTITY_TYPES.EQUIPMENT,
    payload: {
      slug: "cat-320",
      locale: "ru-RU",
      status: "draft",
      title: "Экскаватор CAT 320",
      equipmentType: "Гусеничный экскаватор",
      shortSummary: "Техника для котлованов и тяжелых земляных работ.",
      capabilitySummary: "Подходит для плотного и влажного грунта.",
      keySpecs: ["Масса 21 т", "Глубина копания 6,7 м"],
      usageScenarios: ["Котлованы", "Планировка участка"],
      operatorMode: "С экипажем",
      primaryMediaAssetId: "media_equipment"
    }
  }));

  assert.equal(equipmentModel.title, "Экскаватор CAT 320");
  assert.equal(equipmentModel.mediaUrl, "/api/admin/media/media_equipment/preview");
  assert.equal(equipmentModel.sections[0].label, "Тип техники");
  assert.match(equipmentModel.sections[1].value, /плотного и влажного грунта/i);
  assert.match(equipmentModel.commentPlaceholder, /техника/i);

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

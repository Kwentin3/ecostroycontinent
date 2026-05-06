import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildEquipmentCardModel,
  buildEquipmentCardsSectionModel
} from "../lib/public-launch/equipment-card-model.js";

function visibleStrings(card) {
  return [
    card?.title,
    card?.equipmentType,
    card?.summary,
    card?.operatorMode,
    card?.primaryMedia?.alt,
    card?.primaryMedia?.caption,
    card?.action?.label,
    ...(card?.keySpecs || []),
    ...(card?.usageScenarios || [])
  ].filter(Boolean);
}

function assertNoNullishScreenText(card) {
  const text = visibleStrings(card).join(" ");

  assert.equal(text.includes("undefined"), false);
  assert.equal(text.includes("null"), false);
  assert.equal(text.includes("NaN"), false);
}

test("equipment card model exposes full public rental data when every field is present", () => {
  const card = buildEquipmentCardModel({
    equipment: {
      entityId: "equipment_1",
      slug: "zauberg-e370-c",
      title: "Гусеничный экскаватор ZAUBERG E370-C",
      equipmentType: "Гусеничный экскаватор",
      shortSummary: "Техника для земляных работ.",
      capabilitySummary: "Подходит для разработки грунта и подготовки площадки.",
      keySpecs: ["Масса: 37 т", "Ковш: 1.6 м3"],
      usageScenarios: ["Котлованы", "Планировка участка"],
      operatorMode: "С экипажем",
      primaryMediaAssetId: "media_1",
      galleryIds: ["gallery_1"]
    },
    resolveMedia: (id) => ({
      entityId: id,
      previewUrl: `/api/media/${id}`,
      alt: "Экскаватор на объекте",
      caption: "ZAUBERG E370-C"
    }),
    resolveGallery: (id) => ({
      entityId: id,
      assets: [
        { entityId: "gallery_media_1", previewUrl: "/api/media/gallery_media_1", alt: "Экскаватор сбоку" }
      ]
    }),
    ctaAction: { href: "/contacts#contact-request", label: "Связаться" },
    ctaLabel: "Уточнить наличие техники"
  });

  assert.equal(card.title, "Гусеничный экскаватор ZAUBERG E370-C");
  assert.equal(card.equipmentType, "Гусеничный экскаватор");
  assert.equal(card.summary, "Подходит для разработки грунта и подготовки площадки.");
  assert.equal(card.operatorMode, "С экипажем");
  assert.deepEqual(card.keySpecs, ["Масса: 37 т", "Ковш: 1.6 м3"]);
  assert.deepEqual(card.usageScenarios, ["Котлованы", "Планировка участка"]);
  assert.equal(card.primaryMedia.previewUrl, "/api/media/media_1");
  assert.equal(card.primaryMedia.alt, "Экскаватор на объекте");
  assert.equal(card.galleryAssets.length, 1);
  assert.equal(card.action.href, "/contacts#contact-request");
  assert.equal(card.action.label, "Уточнить наличие техники");
  assertNoNullishScreenText(card);
});

test("equipment card model omits image, scenarios and operator blocks for partial data", () => {
  const card = buildEquipmentCardModel({
    equipment: {
      entityId: "equipment_2",
      title: "Фронтальный погрузчик",
      shortSummary: "Для погрузки и перемещения материалов.",
      keySpecs: ["Грузоподъёмность: 2.8 т"],
      usageScenarios: [],
      operatorMode: ""
    },
    resolveMedia: () => null,
    ctaAction: { href: "/contacts#contact-request", label: "Обсудить задачу" }
  });

  assert.equal(card.primaryMedia, null);
  assert.equal(card.summary, "Для погрузки и перемещения материалов.");
  assert.deepEqual(card.keySpecs, ["Грузоподъёмность: 2.8 т"]);
  assert.deepEqual(card.usageScenarios, []);
  assert.equal(card.operatorMode, "");
  assert.equal(card.action.label, "Обсудить задачу");
  assertNoNullishScreenText(card);
});

test("equipment card model stays tidy for minimal title and type without CTA", () => {
  const card = buildEquipmentCardModel({
    equipment: {
      entityId: "equipment_3",
      title: "Мини-погрузчик",
      equipmentType: "Мини-погрузчик"
    }
  });

  assert.equal(card.title, "Мини-погрузчик");
  assert.equal(card.equipmentType, "Мини-погрузчик");
  assert.equal(card.summary, "Мини-погрузчик");
  assert.equal(card.primaryMedia, null);
  assert.deepEqual(card.keySpecs, []);
  assert.deepEqual(card.usageScenarios, []);
  assert.equal(card.operatorMode, "");
  assert.equal(card.action, null);
  assertNoNullishScreenText(card);
});

test("equipment card model drops empty arrays and whitespace-only values", () => {
  const card = buildEquipmentCardModel({
    equipment: {
      entityId: "equipment_4",
      title: "Экскаватор",
      equipmentType: "  ",
      capabilitySummary: "",
      shortSummary: null,
      keySpecs: [" ", ""],
      usageScenarios: [],
      operatorMode: "   ",
      primaryMediaAssetId: "   "
    },
    ctaAction: { href: "   ", label: "   " }
  });

  assert.equal(card.summary, "");
  assert.equal(card.primaryMedia, null);
  assert.deepEqual(card.keySpecs, []);
  assert.deepEqual(card.usageScenarios, []);
  assert.equal(card.operatorMode, "");
  assert.equal(card.action, null);
  assert.equal(card.hasDetails, false);
  assertNoNullishScreenText(card);
});

test("equipment section model renders only when service has usable equipment cards", () => {
  const withEquipment = buildEquipmentCardsSectionModel({
    equipmentRecords: [
      { entityId: "equipment_1", title: "Экскаватор", equipmentType: "Экскаватор" },
      { entityId: "empty_equipment", title: "", equipmentType: "" }
    ]
  });
  const withoutEquipment = buildEquipmentCardsSectionModel({ equipmentRecords: [] });

  assert.equal(withEquipment.cards.length, 1);
  assert.equal(withEquipment.cards[0].title, "Экскаватор");
  assert.equal(withoutEquipment, null);
});

test("renderer implementation stays inside service page and does not create public equipment routes", () => {
  const source = fs.readFileSync(path.resolve("components/public/PublicRenderers.js"), "utf8");

  assert.match(source, /buildEquipmentCardsSectionModel/);
  assert.match(source, /preview-service-related-equipment/);
  assert.match(source, /primaryMedia/);
  assert.match(source, /keySpecs/);
  assert.match(source, /usageScenarios/);
  assert.match(source, /operatorMode/);
  assert.equal(fs.existsSync(path.resolve("app/equipment")), false);
});

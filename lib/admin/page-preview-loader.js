import { ENTITY_TYPES } from "../content-core/content-types.js";
import { listEntityCards } from "../content-core/service.js";
import { buildPublishedLookups, getPublishedGlobalSettings } from "../read-side/public-content.js";
import { listMediaPickerOptions } from "./media-gallery.js";
import { serializePagePreviewLookupRecords } from "./page-preview.js";

export async function loadAdminPagePreviewPayload() {
  const [
    publishedLookupRecords,
    globalSettings,
    serviceCards,
    equipmentCards,
    caseCards,
    galleryCards,
    mediaOptions
  ] = await Promise.all([
    buildPublishedLookups(),
    getPublishedGlobalSettings(),
    listEntityCards(ENTITY_TYPES.SERVICE),
    listEntityCards(ENTITY_TYPES.EQUIPMENT),
    listEntityCards(ENTITY_TYPES.CASE),
    listEntityCards(ENTITY_TYPES.GALLERY),
    listMediaPickerOptions()
  ]);

  return {
    globalSettings,
    previewLookupRecords: serializePagePreviewLookupRecords({
      publishedLookupRecords,
      services: serviceCards,
      equipment: equipmentCards,
      cases: caseCards,
      galleries: galleryCards,
      media: mediaOptions
    })
  };
}

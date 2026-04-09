export const ENTITY_TYPES = {
  GLOBAL_SETTINGS: "global_settings",
  MEDIA_ASSET: "media_asset",
  GALLERY: "gallery",
  SERVICE: "service",
  CASE: "case",
  PAGE: "page"
};

export const ENTITY_TYPE_LABELS = {
  [ENTITY_TYPES.GLOBAL_SETTINGS]: "Глобальные настройки",
  [ENTITY_TYPES.MEDIA_ASSET]: "Медиафайл",
  [ENTITY_TYPES.GALLERY]: "Коллекция",
  [ENTITY_TYPES.SERVICE]: "Услуга",
  [ENTITY_TYPES.CASE]: "Кейс",
  [ENTITY_TYPES.PAGE]: "Страница"
};

export const PAGE_TYPES = {
  ABOUT: "about",
  CONTACTS: "contacts"
};

export const BLOCK_TYPES = {
  HERO: "hero",
  RICH_TEXT: "rich_text",
  SERVICE_LIST: "service_list",
  CASE_LIST: "case_list",
  GALLERY: "gallery",
  CTA: "cta",
  CONTACT: "contact"
};

export const CHANGE_CLASSES = {
  MINOR_EDITORIAL: "class_a_minor_editorial_change",
  SEO_ONLY: "class_b_seo_only_operational_change",
  COMMERCIAL: "class_c_commercial_presentation_change",
  ROUTE: "class_d_route_affecting_change",
  GLOBAL: "class_e_global_truth_change",
  NEW_LAUNCH_CRITICAL: "class_f_new_launch_critical_entity_publish"
};

export const AUDIT_EVENT_KEYS = {
  REVISION_CREATED: "revision_created",
  REVISION_UPDATED: "revision_updated",
  REVIEW_REQUESTED: "review_requested",
  PREVIEW_RENDER_FAILED: "preview_render_failed",
  OWNER_REVIEW_REQUESTED: "owner_review_requested",
  OWNER_APPROVED: "owner_approved",
  OWNER_REJECTED: "owner_rejected",
  SENT_BACK_WITH_COMMENT: "sent_back_with_comment",
  PUBLISH_BLOCKED: "publish_blocked",
  PUBLISHED: "published",
  LIVE_DEACTIVATED: "live_deactivated",
  LEGACY_TEST_FIXTURE_NORMALIZED: "legacy_test_fixture_normalized",
  ROLLBACK_EXECUTED: "rollback_executed",
  SLUG_CHANGE_OBLIGATION_CREATED: "slug_change_obligation_created",
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_STATUS_CHANGED: "user_status_changed",
  USER_DELETED: "user_deleted",
  SUPERADMIN_CREDENTIAL_BOOTSTRAPPED: "superadmin_credential_bootstrapped",
  SUPERADMIN_CREDENTIAL_BOOTSTRAP_BLOCKED: "superadmin_credential_bootstrap_blocked"
};

export const PREVIEW_STATUS = {
  RENDERABLE: "preview_renderable",
  UNAVAILABLE: "preview_unavailable"
};

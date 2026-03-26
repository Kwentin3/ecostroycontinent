import { AUDIT_EVENT_KEYS, CHANGE_CLASSES, ENTITY_TYPE_LABELS as CORE_ENTITY_TYPE_LABELS, PAGE_TYPES, PREVIEW_STATUS } from "./content-core/content-types.js";

export const ENTITY_TYPE_LABELS = CORE_ENTITY_TYPE_LABELS;

export const ROLE_LABELS = {
  superadmin: "Суперадмин",
  seo_manager: "SEO-менеджер",
  business_owner: "Владелец бизнеса"
};

export const REVISION_STATE_LABELS = {
  draft: "Черновик",
  review: "На проверке",
  published: "Опубликовано"
};

export const OWNER_APPROVAL_STATUS_LABELS = {
  pending: "Ожидает согласования",
  approved: "Согласовано",
  rejected: "Отклонено",
  not_required: "Не требуется"
};

export const PREVIEW_STATUS_LABELS = {
  [PREVIEW_STATUS.RENDERABLE]: "Предпросмотр доступен",
  [PREVIEW_STATUS.UNAVAILABLE]: "Предпросмотр недоступен"
};

export const CHANGE_CLASS_LABELS = {
  [CHANGE_CLASSES.MINOR_EDITORIAL]: "Редакционная правка",
  [CHANGE_CLASSES.SEO_ONLY]: "SEO/техническая правка",
  [CHANGE_CLASSES.COMMERCIAL]: "Коммерческая подача",
  [CHANGE_CLASSES.ROUTE]: "Изменение адреса",
  [CHANGE_CLASSES.GLOBAL]: "Общие данные",
  [CHANGE_CLASSES.NEW_LAUNCH_CRITICAL]: "Запуск новой сущности"
};

export const AUDIT_EVENT_LABELS = {
  [AUDIT_EVENT_KEYS.REVISION_CREATED]: "Черновик создан",
  [AUDIT_EVENT_KEYS.REVISION_UPDATED]: "Черновик обновлён",
  [AUDIT_EVENT_KEYS.REVIEW_REQUESTED]: "Отправлено на проверку",
  [AUDIT_EVENT_KEYS.PREVIEW_RENDER_FAILED]: "Предпросмотр недоступен",
  [AUDIT_EVENT_KEYS.OWNER_REVIEW_REQUESTED]: "Запрошено согласование владельца",
  [AUDIT_EVENT_KEYS.OWNER_APPROVED]: "Владелец согласовал",
  [AUDIT_EVENT_KEYS.OWNER_REJECTED]: "Владелец отклонил",
  [AUDIT_EVENT_KEYS.SENT_BACK_WITH_COMMENT]: "Возвращено с комментарием",
  [AUDIT_EVENT_KEYS.PUBLISH_BLOCKED]: "Публикация заблокирована",
  [AUDIT_EVENT_KEYS.PUBLISHED]: "Опубликовано",
  [AUDIT_EVENT_KEYS.ROLLBACK_EXECUTED]: "Выполнен откат",
  [AUDIT_EVENT_KEYS.SLUG_CHANGE_OBLIGATION_CREATED]: "Созданы обязательства после смены адреса",
  [AUDIT_EVENT_KEYS.USER_CREATED]: "Пользователь создан",
  [AUDIT_EVENT_KEYS.USER_UPDATED]: "Пользователь обновлён",
  [AUDIT_EVENT_KEYS.USER_STATUS_CHANGED]: "Статус пользователя изменён",
  [AUDIT_EVENT_KEYS.USER_DELETED]: "Пользователь удалён",
  [AUDIT_EVENT_KEYS.SUPERADMIN_CREDENTIAL_BOOTSTRAPPED]: "Суперадмин инициализирован",
  [AUDIT_EVENT_KEYS.SUPERADMIN_CREDENTIAL_BOOTSTRAP_BLOCKED]: "Инициализация суперадмина заблокирована"
};

export const BLOCK_TYPE_LABELS = {
  hero: "Главный блок",
  rich_text: "Текстовый блок",
  service_list: "Список услуг",
  case_list: "Список кейсов",
  gallery: "Галерея",
  cta: "Блок с кнопкой",
  contact: "Контакты"
};

export const FIELD_LABELS = {
  publicBrandName: "Публичное название",
  legalName: "Юридическое название",
  primaryPhone: "Основной телефон",
  activeMessengers: "Активные мессенджеры",
  publicEmail: "Публичная почта",
  serviceArea: "Зона обслуживания",
  primaryRegion: "Основной регион",
  defaultCtaLabel: "Текст кнопки по умолчанию",
  defaultCtaDescription: "Пояснение к кнопке по умолчанию",
  contactTruthConfirmed: "Контактные данные подтверждены",
  title: "Название",
  alt: "Описание изображения",
  caption: "Подпись",
  ownershipNote: "Примечание о правах",
  sourceNote: "Примечание об источнике",
  storageKey: "Ключ хранилища",
  mimeType: "Тип файла",
  originalFilename: "Исходное имя файла",
  status: "Статус",
  primaryAssetId: "Основной файл",
  assetIds: "Файлы",
  relatedEntityIds: "Связанные сущности",
  slug: "Короткий адрес",
  h1: "Основной заголовок (H1)",
  summary: "Краткое описание",
  serviceScope: "Что входит в услугу",
  problemsSolved: "Какие задачи решаем",
  methods: "Как работаем",
  ctaVariant: "Текст кнопки",
  relatedCaseIds: "Связанные кейсы",
  galleryIds: "Галереи",
  primaryMediaAssetId: "Основное медиа",
  location: "Локация",
  projectType: "Тип проекта",
  task: "Задача",
  workScope: "Объём работ",
  result: "Результат",
  serviceIds: "Связанные услуги",
  pageType: "Тип страницы",
  intro: "Вступление",
  body: "Текст",
  blocks: "Блоки страницы",
  metaTitle: "SEO-заголовок",
  metaDescription: "SEO-описание",
  canonicalIntent: "Канонический адрес",
  indexationFlag: "Индексация",
  openGraphTitle: "Заголовок для соцсетей",
  openGraphDescription: "Описание для соцсетей",
  openGraphImageAssetId: "Изображение для соцсетей",
  contactNote: "Примечание по контактам",
  ctaTitle: "Заголовок CTA",
  ctaBody: "Текст CTA",
  defaultBlockCtaLabel: "Текст кнопки по умолчанию",
  organizationCity: "Город организации",
  organizationCountry: "Страна организации"
};

export const PUBLIC_COPY = {
  listEyebrow: "Публичный раздел",
  listFallbackItem: "Опубликованная запись",
  listOpen: "Открыть",
  serviceEyebrow: "Услуга",
  caseEyebrow: "Кейс",
  pageEyebrow: "Страница",
  mediaLabel: "Основное изображение",
  mediaFallback: "Медиаматериал",
  imageFallback: "Изображение",
  serviceScopeHeading: "Что входит в услугу",
  taskHeading: "Задача",
  workScopeHeading: "Объём работ",
  resultHeading: "Результат",
  galleryHeading: "Галерея",
  projectGalleryHeading: "Галерея проекта",
  ctaPrefix: "Кнопка",
  ctaFallback: "Связаться с нами",
  openService: "Открыть услугу",
  openCase: "Открыть кейс",
  contactInfoFallback: "Контактные данные ещё не подтверждены.",
  serviceAreaFallback: "Зона обслуживания появится после подтверждения.",
  publishedListIntro: "Здесь показываются только опубликованные версии.",
  publishedEntityFallback: "Опубликованная запись"
};

export const ADMIN_COPY = {
  adminEyebrow: "Инструмент контента",
  panelTitle: "Рабочая панель",
  search: "Поиск",
  filterByTitle: "Фильтр по названию",
  filterByMedia: "Фильтр по названию, описанию или имени файла",
  noMatchingItems: "Ничего не найдено.",
  noMatchingMedia: "Подходящих медиафайлов не найдено.",
  noPreview: "Нет предпросмотра",
  untitledAsset: "Без названия",
  whereUsed: "Где используется",
  notUsedYet: "пока не используется",
  readinessTitle: "Проверка готовности",
  readinessBlocking: "Блокирующие",
  readinessWarnings: "Предупреждения",
  readinessInfo: "Подсказки",
  diffTitle: "Понятные изменения",
  diffBefore: "До",
  diffAfter: "После",
  diffEmpty: "Изменений верхнего уровня нет.",
  timelineEmpty: "Лента пока пуста.",
  reviewQueueTitle: "Очередь проверки",
  reviewQueueEmpty: "Очередь проверки пуста.",
  publishReadinessTitle: "Проверка перед публикацией",
  publishedRevision: "Опубликованная версия",
  noPublishedRevision: "Сущность ещё не опубликована.",
  open: "Открыть",
  openReview: "Открыть проверку",
  openHistory: "История",
  newItem: "Новый",
  saveDraft: "Сохранить черновик",
  sendForReview: "Отправить на проверку",
  readinessInFlow: "Проверка готовности в потоке",
  auditTimeline: "Лента аудита",
  fastMediaUploadTitle: "Быстрая загрузка медиа",
  fastMediaUploadHint: "Загрузите только файл. Имя карточки создастся автоматически, а метаданные можно уточнить ниже.",
  uploadMedia: "Загрузить медиафайл",
  fieldValueNone: "не задано",
  fieldValueNotUsedYet: "пока не используется"
};

export const FEEDBACK_COPY = {
  loginRequired: "Требуется вход в систему.",
  invalidCredentials: "Неверный логин или пароль.",
  loggedOut: "Вы вышли из системы.",
  draftSaved: "Черновик сохранён.",
  reviewSubmitted: "Отправлено на проверку.",
  ownerActionSaved: "Решение владельца сохранено.",
  published: "Опубликовано.",
  rollbackExecuted: "Откат выполнен.",
  obligationCompleted: "Обязательство отмечено выполненным.",
  userCreated: "Пользователь создан.",
  userUpdated: "Пользователь обновлён.",
  userDeleted: "Пользователь удалён.",
  chooseFile: "Выберите файл.",
  mediaUploaded: "Медиафайл загружен.",
  superadminBootstrapFailed: "Инициализация суперадмина не удалась."
};

const LEGACY_COPY_MAP = new Map([
  ["Draft saved from editor.", "Черновик сохранён из редактора."],
  ["Uploaded media asset.", "Загружен медиафайл."],
  ["Revision submitted for review.", "Черновик отправлен на проверку."],
  ["Preview for candidate state was unavailable.", "Предпросмотр версии оказался недоступен."],
  ["Revision entered owner review lane.", "Версия отправлена на согласование владельцу."],
  ["Business Owner approved the revision.", "Владелец согласовал версию."],
  ["Business Owner rejected the revision.", "Владелец отклонил версию."],
  ["Revision was sent back with comment.", "Версия возвращена с комментарием."],
  ["Publish was blocked by readiness checks.", "Публикация заблокирована проверкой готовности."],
  ["Revision was published.", "Версия опубликована."],
  ["Rollback restored a previous published revision.", "Откат вернул предыдущую опубликованную версию."],
  ["Draft revision created.", "Черновик создан."],
  ["Draft revision updated.", "Черновик обновлён."],
  ["User created", "Пользователь создан"],
  ["User updated", "Пользователь обновлён"],
  ["Logged out", "Вы вышли из системы"],
  ["Submitted for review", "Отправлено на проверку"],
  ["Owner action saved", "Решение владельца сохранено"],
  ["Published", "Опубликовано"],
  ["Rollback executed", "Откат выполнен"],
  ["Obligation completed", "Обязательство отмечено выполненным"],
  ["Choose a file", "Выберите файл"],
  ["Media uploaded", "Медиафайл загружен"]
]);

export function getLabel(map, value, fallback = "—") {
  return value in map ? map[value] : fallback;
}

export function normalizeLegacyCopy(value) {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  return LEGACY_COPY_MAP.get(value) ?? value;
}

export function getEntityTypeLabel(entityType) {
  return getLabel(ENTITY_TYPE_LABELS, entityType);
}

export function getRoleLabel(role) {
  return getLabel(ROLE_LABELS, role);
}

export function getRevisionStateLabel(state) {
  return getLabel(REVISION_STATE_LABELS, state);
}

export function getOwnerApprovalStatusLabel(status) {
  return getLabel(OWNER_APPROVAL_STATUS_LABELS, status);
}

export function getPreviewStatusLabel(status) {
  return getLabel(PREVIEW_STATUS_LABELS, status);
}

export function getChangeClassLabel(changeClass) {
  return getLabel(CHANGE_CLASS_LABELS, changeClass);
}

export function getAuditEventLabel(eventKey) {
  return getLabel(AUDIT_EVENT_LABELS, eventKey);
}

export function getBlockTypeLabel(type) {
  return getLabel(BLOCK_TYPE_LABELS, type);
}

export function getFieldLabel(field) {
  return getLabel(FIELD_LABELS, field);
}

export function getPageTypeLabel(pageType) {
  return pageType === PAGE_TYPES.ABOUT ? "О нас" : pageType === PAGE_TYPES.CONTACTS ? "Контакты" : "Страница";
}

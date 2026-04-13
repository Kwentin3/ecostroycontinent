import { ENTITY_TYPES, PAGE_CREATE_MODES } from "../content-core/content-types.js";

const ENTITY_QUESTION_HINTS = {
  [ENTITY_TYPES.MEDIA_ASSET]: "Отвечает на вопрос: как это выглядит?",
  [ENTITY_TYPES.GALLERY]: "Отвечает на вопрос: что можно показать рядом?",
  [ENTITY_TYPES.SERVICE]: "Отвечает на вопрос: что мы предлагаем?",
  [ENTITY_TYPES.EQUIPMENT]: "Отвечает на вопрос: чем и с какими свойствами мы это делаем?",
  [ENTITY_TYPES.CASE]: "Отвечает на вопрос: где это уже сработало?",
  [ENTITY_TYPES.PAGE]: "Отвечает на вопрос: как собрать это в одну публикацию?"
};

const PAGE_CREATE_MODE_HINTS = {
  [PAGE_CREATE_MODES.STANDALONE]: "Отвечает на вопрос: начинаем с пустой страницы или от готового источника?",
  [PAGE_CREATE_MODES.FROM_SERVICE]: "Отвечает на вопрос: какую услугу берём за основу страницы?",
  [PAGE_CREATE_MODES.FROM_EQUIPMENT]: "Отвечает на вопрос: какую технику берём за основу страницы?",
  [PAGE_CREATE_MODES.CLONE_ADAPT]: "Отвечает на вопрос: что проще взять за основу и адаптировать?"
};

const WORKSPACE_HINTS = {
  sources: "Отвечают на вопрос: откуда страница берёт факты, медиа и доказательства?",
  readiness: "Отвечает на вопрос: что ещё мешает выпуску?",
  preview: "Отвечает на вопрос: как страница выглядит перед выпуском?"
};

const MANAGEMENT_HINTS = {
  metadata: "Отвечают на вопрос: как страница называется и публикуется вне рабочего полотна?",
  review: "Отвечает на вопрос: можно ли выпускать эту версию дальше?",
  ai: "Помогает ответить на вопрос: как сформулировать это лучше?"
};

export function getEntityQuestionHint(entityType) {
  return ENTITY_QUESTION_HINTS[entityType] || "";
}

export function getPageCreateModeQuestionHint(mode) {
  return PAGE_CREATE_MODE_HINTS[mode] || "";
}

export function getWorkspaceQuestionHint(key) {
  return WORKSPACE_HINTS[key] || "";
}

export function getManagementQuestionHint(key) {
  return MANAGEMENT_HINTS[key] || "";
}

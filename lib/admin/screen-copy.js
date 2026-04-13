import { ENTITY_TYPES } from "../content-core/content-types.js";
import {
  getEntityQuestionHint,
  getManagementQuestionHint
} from "./question-model.js";

export const CHANGE_INTENT_LABEL = "Что хотим изменить";

export const FIELD_HINTS = {
  changeIntent: "Поле не обязательно, но помогает потом понять, зачем появилась новая версия. Его видно в проверке и истории.",
  canonicalIntent: "Основной адрес страницы, который используют ссылки и поиск.",
  projectType: "Если нужный тип уже встречался в других кейсах, выберите его из подсказок ниже.",
  galleryAssets: "Это состав коллекции: сюда попадают уже загруженные медиа.",
  galleryPrimaryAsset: "Это главный кадр коллекции. Он показывается первым в карточке и в предпросмотре.",
  primaryMedia: "Это основное изображение: оно появляется в шапке карточки и в предпросмотре."
};

const ENTITY_LIST_LEGENDS = {
  [ENTITY_TYPES.MEDIA_ASSET]: `${getEntityQuestionHint(ENTITY_TYPES.MEDIA_ASSET)} Здесь лежат исходные файлы, которые потом используют в других карточках.`,
  [ENTITY_TYPES.GALLERY]: `${getEntityQuestionHint(ENTITY_TYPES.GALLERY)} Здесь собирают подборки из уже загруженных медиа.`,
  [ENTITY_TYPES.SERVICE]: `${getEntityQuestionHint(ENTITY_TYPES.SERVICE)} Здесь редактируют карточки предложений и их связи.`,
  [ENTITY_TYPES.EQUIPMENT]: `${getEntityQuestionHint(ENTITY_TYPES.EQUIPMENT)} Здесь хранят характеристики, сценарии применения и медиа техники.`,
  [ENTITY_TYPES.CASE]: `${getEntityQuestionHint(ENTITY_TYPES.CASE)} Здесь собирают подтверждающие истории, результаты и связи.`,
  [ENTITY_TYPES.PAGE]: `${getEntityQuestionHint(ENTITY_TYPES.PAGE)} Здесь находят, создают и открывают страницы разных типов в одном редакторе.`
};

const ENTITY_EDITOR_LEGENDS = {
  [ENTITY_TYPES.GLOBAL_SETTINGS]: "Отвечает на вопрос: что на всём сайте должно быть общим? Здесь меняют публичное имя, контакты и другие сквозные параметры.",
  [ENTITY_TYPES.MEDIA_ASSET]: `${getEntityQuestionHint(ENTITY_TYPES.MEDIA_ASSET)} Здесь загружают файл и уточняют его карточку.`,
  [ENTITY_TYPES.GALLERY]: `${getEntityQuestionHint(ENTITY_TYPES.GALLERY)} Здесь собирают подборку и задают главный кадр.`,
  [ENTITY_TYPES.SERVICE]: `${getEntityQuestionHint(ENTITY_TYPES.SERVICE)} Здесь уточняют коммерческое предложение, связи и медиа.`,
  [ENTITY_TYPES.EQUIPMENT]: `${getEntityQuestionHint(ENTITY_TYPES.EQUIPMENT)} Здесь задают факты о технике, её свойства и связи.`,
  [ENTITY_TYPES.CASE]: `${getEntityQuestionHint(ENTITY_TYPES.CASE)} Здесь описывают объект, результат и подтверждающие материалы.`,
  [ENTITY_TYPES.PAGE]: `${getEntityQuestionHint(ENTITY_TYPES.PAGE)} Тип страницы меняет состав секций и источников, но не открывает второй редактор.`
};

const SCREEN_LEGENDS = {
  dashboard: "Отвечает на вопрос: что сейчас требует внимания и куда идти дальше?",
  reviewQueue: "Отвечает на вопрос: что сейчас нужно проверить?",
  reviewDetail: getManagementQuestionHint("review"),
  publishReadiness: getManagementQuestionHint("review"),
  usersList: "Отвечает на вопрос: кто работает в системе и с какими правами?",
  usersDetail: "Отвечает на вопрос: что можно менять в доступе и профиле этого пользователя?",
  history: "Отвечает на вопрос: что меняли раньше и почему?"
};

export function getEntityListLegend(entityType) {
  return ENTITY_LIST_LEGENDS[entityType] || "";
}

export function getEntityEditorLegend(entityType) {
  return ENTITY_EDITOR_LEGENDS[entityType] || "";
}

export function getScreenLegend(screenKey) {
  return SCREEN_LEGENDS[screenKey] || "";
}

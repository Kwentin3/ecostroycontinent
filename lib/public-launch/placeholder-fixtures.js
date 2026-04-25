import { PAGE_SECTION_TYPES, PAGE_TYPES } from "../content-core/content-types.js";

const PLACEHOLDER_SERVICES = Object.freeze([
  {
    entityId: "placeholder_service_drainage",
    revisionId: "placeholder_rev_service_drainage",
    slug: "placeholder-drainage",
    title: "Дренаж и водоотведение",
    h1: "Дренаж и водоотведение участка",
    summary: "Временная техническая карточка для проверки маршрутов, навигации и сценариев призыва к действию.",
    serviceScope: "Проектирование и устройство систем дренажа с выводом воды в безопасную точку.",
    problemsSolved: "Снимаем риск подтопления и переувлажнения участка.",
    methods: "Обследование, план трасс, монтаж, проверка после запуска.",
    ctaVariant: "Получить расчёт",
    relatedCaseIds: ["placeholder_case_pit"],
    galleryIds: []
  },
  {
    entityId: "placeholder_service_foundation",
    revisionId: "placeholder_rev_service_foundation",
    slug: "placeholder-foundation",
    title: "Подготовка основания",
    h1: "Подготовка основания под строительные работы",
    summary: "Временная карточка для проверки межмаршрутной связности в сервисном контуре.",
    serviceScope: "Планировка, уплотнение, выравнивание и подготовка площадки.",
    problemsSolved: "Снижаем риск просадок и несоответствия проектным отметкам.",
    methods: "Инженерный осмотр, этапная подготовка, контроль по чек-листу.",
    ctaVariant: "Запросить выезд",
    relatedCaseIds: ["placeholder_case_site"],
    galleryIds: []
  },
  {
    entityId: "placeholder_service_cleanup",
    revisionId: "placeholder_rev_service_cleanup",
    slug: "placeholder-cleanup",
    title: "Расчистка и демонтаж",
    h1: "Расчистка участка и демонтаж старых конструкций",
    summary: "Техническая заглушка для проверки переходов между услугами, кейсами и контактным действием.",
    serviceScope: "Демонтаж, сортировка, вывоз и подготовка участка к следующему этапу.",
    problemsSolved: "Освобождаем площадку без хаотичных остатков и логистических сбоев.",
    methods: "План работ, безопасный демонтаж, контроль вывоза.",
    ctaVariant: "Связаться по задаче",
    relatedCaseIds: ["placeholder_case_cleanup"],
    galleryIds: []
  }
]);

const PLACEHOLDER_CASES = Object.freeze([
  {
    entityId: "placeholder_case_pit",
    revisionId: "placeholder_rev_case_pit",
    slug: "placeholder-case-drainage-pit",
    title: "Кейс: дренаж проблемного участка",
    location: "Московская область",
    task: "Стабилизировать участок после сезонного подтопления.",
    workScope: "Схема водоотведения, прокладка дренажной линии, контрольный пролив.",
    result: "Подтопления устранены, поверхность участка стабилизирована.",
    serviceIds: ["placeholder_service_drainage"],
    galleryIds: []
  },
  {
    entityId: "placeholder_case_site",
    revisionId: "placeholder_rev_case_site",
    slug: "placeholder-case-foundation-site",
    title: "Кейс: подготовка основания под стройку",
    location: "Москва",
    task: "Подготовить площадку под следующие строительные этапы.",
    workScope: "Планировка, уплотнение, контроль по проектным отметкам.",
    result: "Основание передано на следующий этап без замечаний.",
    serviceIds: ["placeholder_service_foundation"],
    galleryIds: []
  },
  {
    entityId: "placeholder_case_cleanup",
    revisionId: "placeholder_rev_case_cleanup",
    slug: "placeholder-case-cleanup",
    title: "Кейс: расчистка и демонтаж перед новым циклом",
    location: "Московская область",
    task: "Освободить участок от старых конструкций и мусора.",
    workScope: "Демонтаж, сортировка, вывоз и финальная подготовка площадки.",
    result: "Участок очищен и готов к следующему этапу работ.",
    serviceIds: ["placeholder_service_cleanup"],
    galleryIds: []
  }
]);

const PLACEHOLDER_GLOBAL_SETTINGS = Object.freeze({
  publicBrandName: "Экостройконтинент",
  primaryPhone: "+7 (999) 000-00-00",
  publicEmail: "launch-placeholder@ecostroycontinent.local",
  serviceArea: "Москва и Московская область",
  defaultCtaLabel: "Оставить заявку",
  defaultCtaDescription: "Техническая заглушка для проверки навигации и пути конверсии."
});

const PLACEHOLDER_ABOUT_PAGE = Object.freeze({
  entityId: "placeholder_page_about",
  revisionId: "placeholder_rev_page_about",
  pageType: PAGE_TYPES.ABOUT,
  title: "О компании (заглушка)",
  h1: "О компании Экостройконтинент",
  intro: "Временная страница для проверки структуры маршрутов до готовности реального контента запуска.",
  pageThemeKey: "earth_sand",
  mediaSettings: {},
  sections: [
    {
      type: PAGE_SECTION_TYPES.RICH_TEXT,
      order: 0,
      title: "Зачем эта страница",
      body: "Эта публикация служит только для проверки связности навигации и не является контентом запуска."
    },
    {
      type: PAGE_SECTION_TYPES.CTA,
      order: 1,
      title: "Следующий шаг",
      body: "Перейдите к услугам или оставьте контакт для запроса.",
      ctaLabel: "Открыть контакты"
    }
  ],
  sourceRefs: {},
  targeting: {}
});

const PLACEHOLDER_CONTACTS_PAGE = Object.freeze({
  entityId: "placeholder_page_contacts",
  revisionId: "placeholder_rev_page_contacts",
  pageType: PAGE_TYPES.CONTACTS,
  title: "Контакты (заглушка)",
  h1: "Контакты Экостройконтинент",
  intro: "Временная страница контактов для проверки пути к действию до появления подтверждённого опубликованного набора.",
  pageThemeKey: "earth_sand",
  mediaSettings: {},
  sections: [
    {
      type: PAGE_SECTION_TYPES.CONTACT_DETAILS,
      order: 0,
      title: "Как связаться",
      body: "Техническая заглушка: проверьте, что переходы и призывы к действию отрабатывают корректно."
    },
    {
      type: PAGE_SECTION_TYPES.CTA,
      order: 1,
      title: "Отправить запрос",
      body: "Проверьте связность конверсионного пути и корректность навигации."
    }
  ],
  sourceRefs: {},
  targeting: {}
});

function clone(item) {
  return JSON.parse(JSON.stringify(item));
}

export function getPlaceholderServices() {
  return PLACEHOLDER_SERVICES.map((service) => clone(service));
}

export function getPlaceholderServiceBySlug(slug) {
  const match = PLACEHOLDER_SERVICES.find((service) => service.slug === slug);
  return match ? clone(match) : null;
}

export function getPlaceholderCases() {
  return PLACEHOLDER_CASES.map((item) => clone(item));
}

export function getPlaceholderCaseBySlug(slug) {
  const match = PLACEHOLDER_CASES.find((item) => item.slug === slug);
  return match ? clone(match) : null;
}

export function getPlaceholderGlobalSettings() {
  return clone(PLACEHOLDER_GLOBAL_SETTINGS);
}

export function getPlaceholderAboutPage() {
  return clone(PLACEHOLDER_ABOUT_PAGE);
}

export function getPlaceholderContactsPage() {
  return clone(PLACEHOLDER_CONTACTS_PAGE);
}

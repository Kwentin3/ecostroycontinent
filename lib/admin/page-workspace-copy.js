export function getPageWorkspaceVisualSettingsHint() {
  return "Внешний вид страницы настраивается в «Метаданных» → «Основное».";
}

export function getPageThemeFieldHint() {
  return "Тема меняет общий тон страницы и отражается в предпросмотре.";
}

export function getPrimarySourceEmptyState(kind = "") {
  switch (kind) {
    case "service":
      return {
        text: "Пока нет доступных услуг. Сначала подготовьте и опубликуйте услугу, чтобы взять её за основу страницы.",
        href: "/admin/entities/service",
        linkLabel: "Открыть реестр услуг"
      };
    case "equipment":
      return {
        text: "Пока нет доступной техники. Сначала подготовьте и опубликуйте карточку техники, чтобы взять её за основу страницы.",
        href: "/admin/entities/equipment",
        linkLabel: "Открыть реестр техники"
      };
    case "media":
      return {
        text: "Пока нет доступного медиа. Добавьте изображение, чтобы выбрать главный визуальный акцент страницы.",
        href: "/admin/entities/media_asset",
        linkLabel: "Открыть реестр медиа"
      };
    default:
      return {
        text: "Пока нет доступных записей.",
        href: "",
        linkLabel: ""
      };
  }
}

export function getSourceChecklistEmptyState(kind = "") {
  switch (kind) {
    case "cases":
      return {
        text: "Пока нет доступных кейсов. Добавьте и опубликуйте кейс, чтобы показать доказательства и реальные сценарии работы.",
        href: "/admin/entities/case",
        linkLabel: "Открыть реестр кейсов"
      };
    case "galleries":
      return {
        text: "Пока нет доступных галерей. Подготовьте галерею, если хотите показать несколько изображений рядом.",
        href: "/admin/entities/gallery",
        linkLabel: "Открыть реестр галерей"
      };
    default:
      return {
        text: "Пока нет доступных записей.",
        href: "",
        linkLabel: ""
      };
  }
}

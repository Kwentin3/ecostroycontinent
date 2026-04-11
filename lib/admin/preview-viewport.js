export const PREVIEW_VIEWPORT_OPTIONS = Object.freeze([
  {
    value: "desktop",
    label: "Компьютер",
    width: 1120,
    widthClassName: "previewViewportDesktop",
    frameToneClassName: "previewViewportFrameDesktop",
    hint: "Проверяйте широкую компоновку, длинные строки и ряды карточек."
  },
  {
    value: "tablet",
    label: "Планшет",
    width: 834,
    widthClassName: "previewViewportTablet",
    frameToneClassName: "previewViewportFrameTablet",
    hint: "Смотрите на переносы текста, перестройку CTA и плотность между секциями."
  },
  {
    value: "mobile",
    label: "Телефон",
    width: 390,
    widthClassName: "previewViewportMobile",
    frameToneClassName: "previewViewportFrameMobile",
    hint: "Проверяйте вертикальный ритм, стек блоков и читаемость первого экрана."
  }
]);

export function getPreviewViewportOption(device = "desktop") {
  return PREVIEW_VIEWPORT_OPTIONS.find((option) => option.value === device) ?? PREVIEW_VIEWPORT_OPTIONS[0];
}

export function formatPreviewViewportWidth(width) {
  return `${width} px`;
}

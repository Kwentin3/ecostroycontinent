import {
  userCanEditContent,
  userCanReview,
  userCanViewRemovalSweep,
  userIsSuperadmin
} from "../auth/roles.js";

export const ADMIN_NAV_ITEMS = Object.freeze([
  { href: "/admin", label: "Главная", visible: () => true },
  { href: "/admin/review", label: "Проверка", visible: userCanReview },
  { href: "/admin/visibility", label: "Видимость", visible: userCanReview },
  { href: "/admin/removal-sweep", label: "Очистка", visible: userCanViewRemovalSweep },
  { href: "/admin/entities/global_settings", label: "Настройки", visible: userCanEditContent },
  { href: "/admin/entities/media_asset", label: "Медиа", visible: userCanEditContent },
  { href: "/admin/entities/service", label: "Услуги", visible: userCanEditContent },
  { href: "/admin/entities/equipment", label: "Техника", visible: userCanEditContent },
  { href: "/admin/entities/case", label: "Кейсы", visible: userCanEditContent },
  { href: "/admin/entities/page", label: "Страницы", visible: userCanEditContent },
  { href: "/admin/users", label: "Пользователи", visible: userIsSuperadmin }
]);

export function getNavItems(user) {
  const navItems = ADMIN_NAV_ITEMS
    .filter((item) => item.visible(user))
    .map(({ href, label }) => ({ href, label }));

  if (userIsSuperadmin(user)) {
    navItems.push({ href: "/admin/diagnostics/llm", label: "LLM диагностика" });
  }

  return navItems;
}

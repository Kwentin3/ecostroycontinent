import { userCanReview, userIsSuperadmin } from "../auth/roles.js";

export const ADMIN_NAV_ITEMS = Object.freeze([
  { href: "/admin", label: "Главная" },
  { href: "/admin/review", label: "Проверка" },
  { href: "/admin/workspace/landing", label: "Лендинги" },
  { href: "/admin/entities/global_settings", label: "Настройки" },
  { href: "/admin/entities/media_asset", label: "Медиа" },
  { href: "/admin/entities/service", label: "Услуги" },
  { href: "/admin/entities/case", label: "Кейсы" },
  { href: "/admin/entities/page", label: "Страницы" },
  { href: "/admin/users", label: "Пользователи" }
]);

export function getNavItems(user) {
  const navItems = [...ADMIN_NAV_ITEMS];

  if (!userCanReview(user)) {
    return navItems.filter((item) => item.href !== "/admin/workspace/landing");
  }

  if (userIsSuperadmin(user)) {
    navItems.push({ href: "/admin/diagnostics/llm", label: "LLM диагностика" });
  }

  return navItems;
}

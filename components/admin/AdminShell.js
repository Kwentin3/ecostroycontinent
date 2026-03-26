import Link from "next/link";

import { ADMIN_COPY } from "../../lib/ui-copy.js";
import { getRoleLabel } from "../../lib/auth/session.js";
import styles from "./admin-ui.module.css";

const navItems = [
  { href: "/admin", label: "Главная" },
  { href: "/admin/review", label: "Проверка" },
  { href: "/admin/entities/global_settings", label: "Настройки" },
  { href: "/admin/entities/media_asset", label: "Медиа" },
  { href: "/admin/entities/gallery", label: "Галереи" },
  { href: "/admin/entities/service", label: "Услуги" },
  { href: "/admin/entities/case", label: "Кейсы" },
  { href: "/admin/entities/page", label: "Страницы" },
  { href: "/admin/users", label: "Пользователи" }
];

function renderBreadcrumbs(breadcrumbs) {
  return breadcrumbs.map((crumb, index) => {
    const isLast = index === breadcrumbs.length - 1;
    const content = isLast || !crumb.href ? (
      <span className={styles.depthCurrent}>{crumb.label}</span>
    ) : (
      <Link href={crumb.href} className={styles.depthCrumbLink}>
        {crumb.label}
      </Link>
    );

    return (
      <span key={`${crumb.label}-${index}`} className={styles.depthCrumb}>
        {index > 0 ? <span className={styles.depthSeparator}>/</span> : null}
        {content}
      </span>
    );
  });
}

export function AdminShell({ user, title, children, actions = null, breadcrumbs = [], activeHref = null }) {
  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.eyebrow}>Экостройконтинент</p>
          <h1 className={styles.sidebarTitle}>Админка</h1>
          <p className={styles.sidebarUser}>
            {user.display_name} | {getRoleLabel(user.role)}
          </p>
        </div>
        <nav className={styles.nav} aria-label="Основная навигация">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${activeHref === item.href ? styles.navLinkActive : ""}`}
              aria-current={activeHref === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className={`${styles.secondaryButton} ${styles.stretchButton}`}>Выйти</button>
        </form>
      </aside>
      <main className={styles.main}>
        {breadcrumbs.length ? (
          <nav className={styles.depthBar} aria-label="Навигация по уровням">
            {renderBreadcrumbs(breadcrumbs)}
          </nav>
        ) : null}
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>{ADMIN_COPY.adminEyebrow}</p>
            <h2 className={styles.pageTitle}>{title}</h2>
          </div>
          {actions ? <div className={styles.pageActions}>{actions}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}

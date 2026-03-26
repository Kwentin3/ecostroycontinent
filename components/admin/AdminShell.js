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

export function AdminShell({ user, title, children, actions = null }) {
  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.eyebrow}>Ekostroykontinent</p>
          <h1 className={styles.sidebarTitle}>Админка</h1>
          <p className={styles.sidebarUser}>
            {user.display_name} | {getRoleLabel(user.role)}
          </p>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className={styles.secondaryButton}>Выйти</button>
        </form>
      </aside>
      <main className={styles.main}>
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

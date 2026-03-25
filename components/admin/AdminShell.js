import Link from "next/link";

import styles from "./admin-ui.module.css";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/review", label: "Review" },
  { href: "/admin/entities/global_settings", label: "Global Settings" },
  { href: "/admin/entities/media_asset", label: "Media" },
  { href: "/admin/entities/gallery", label: "Galleries" },
  { href: "/admin/entities/service", label: "Services" },
  { href: "/admin/entities/case", label: "Cases" },
  { href: "/admin/entities/page", label: "Pages" },
  { href: "/admin/users", label: "Users" }
];

export function AdminShell({ user, title, children, actions = null }) {
  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.eyebrow}>Ekostroykontinent</p>
          <h1 className={styles.sidebarTitle}>Admin Console</h1>
          <p className={styles.sidebarUser}>
            {user.display_name} | {user.role}
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
          <button type="submit" className={styles.secondaryButton}>Logout</button>
        </form>
      </aside>
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Write-side tool</p>
            <h2 className={styles.pageTitle}>{title}</h2>
          </div>
          {actions ? <div className={styles.pageActions}>{actions}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}

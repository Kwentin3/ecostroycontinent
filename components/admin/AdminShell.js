import Link from "next/link";

import { getInfraHealthSnapshot } from "../../lib/admin/infra-health.js";
import { getRoleLabel } from "../../lib/auth/session.js";
import { userIsSuperadmin } from "../../lib/auth/roles.js";
import { ADMIN_COPY } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

const baseNavItems = [
  { href: "/admin", label: "Р“Р»Р°РІРЅР°СЏ" },
  { href: "/admin/review", label: "РџСЂРѕРІРµСЂРєР°" },
  { href: "/admin/removal-sweep", label: "Очистка" },
  { href: "/admin/entities/global_settings", label: "РќР°СЃС‚СЂРѕР№РєРё" },
  { href: "/admin/entities/media_asset", label: "РњРµРґРёР°" },
  { href: "/admin/entities/service", label: "РЈСЃР»СѓРіРё" },
  { href: "/admin/entities/equipment", label: "РўРµС…РЅРёРєР°" },
  { href: "/admin/entities/case", label: "РљРµР№СЃС‹" },
  { href: "/admin/entities/page", label: "РЎС‚СЂР°РЅРёС†С‹" },
  { href: "/admin/users", label: "РџРѕР»СЊР·РѕРІР°С‚РµР»Рё" }
];

export function getNavItems(user) {
  const navItems = [...baseNavItems];

  if (userIsSuperadmin(user)) {
    navItems.push({ href: "/admin/diagnostics/llm", label: "LLM РґРёР°РіРЅРѕСЃС‚РёРєР°" });
  }

  return navItems;
}

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

function renderInfraHealth(items) {
  return (
    <section className={styles.infraStatus} aria-label="РЎРѕСЃС‚РѕСЏРЅРёРµ РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂС‹">
      <p className={styles.infraStatusTitle}>РРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР°</p>
      <div className={styles.infraStatusList}>
        {items.map((item) => (
          <div key={item.key} className={styles.infraStatusRow}>
            <div className={styles.infraStatusHead}>
              <span className={styles.infraStatusLabel}>{item.label}</span>
              <span className={`${styles.infraStatusPill} ${styles[`infraTone${item.tone}`]}`}>{item.status}</span>
            </div>
            <div className={styles.infraStatusMeta}>
              {item.lines.map((line) => (
                <span key={`${item.key}-${line}`}>{line}</span>
              ))}
              {item.note ? <span>{item.note}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function AdminShell({ user, title, children, actions = null, breadcrumbs = [], activeHref = null }) {
  const infraHealth = await getInfraHealthSnapshot();
  const navItems = getNavItems(user);

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <p className={styles.eyebrow}>Р­РєРѕСЃС‚СЂРѕР№РєРѕРЅС‚РёРЅРµРЅС‚</p>
          <h1 className={styles.sidebarTitle}>РђРґРјРёРЅРєР°</h1>
          <p className={styles.sidebarUser}>
            {user.display_name} | {getRoleLabel(user.role)}
          </p>
        </div>
        <nav className={styles.nav} aria-label="РћСЃРЅРѕРІРЅР°СЏ РЅР°РІРёРіР°С†РёСЏ">
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
        <div className={styles.sidebarFooter}>
          {renderInfraHealth(infraHealth.items)}
          <form action="/api/admin/logout" method="post">
            <button type="submit" className={`${styles.secondaryButton} ${styles.stretchButton}`}>Р’С‹Р№С‚Рё</button>
          </form>
        </div>
      </aside>
      <main className={styles.main}>
        {breadcrumbs.length ? (
          <nav className={styles.depthBar} aria-label="РќР°РІРёРіР°С†РёСЏ РїРѕ СѓСЂРѕРІРЅСЏРј">
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


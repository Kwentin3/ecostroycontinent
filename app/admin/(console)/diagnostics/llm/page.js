import { AdminShell } from "../../../../../components/admin/AdminShell.js";
import { SurfacePacket } from "../../../../../components/admin/SurfacePacket.js";
import { LlmDiagnosticsPanel } from "../../../../../components/admin/LlmDiagnosticsPanel.js";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { requireSuperadminUser } from "../../../../../lib/admin/page-helpers.js";

export const metadata = {
  title: "LLM диагностика"
};

export default async function LlmDiagnosticsPage() {
  const user = await requireSuperadminUser();

  return (
    <AdminShell
      user={user}
      title="LLM диагностика"
      breadcrumbs={[{ label: "Админка", href: "/admin" }, { label: "LLM диагностика" }]}
      activeHref="/admin/diagnostics/llm"
    >
      <div className={styles.stack}>
        <SurfacePacket
          eyebrow="Внутренний инструмент"
          title="Базовая диагностика LLM-инфраструктуры"
          summary="Эта страница только проверяет связность и конфигурацию. Она не меняет контент, не публикует и не открывает публичный AI-экран."
          bullets={[
            "Доступна только superadmin.",
            "Проверяет LLM baseline через внутренний structured-output probe.",
            "Проверяет SOCKS5 transport path тем же внутренним фасадом.",
            "Показывает, на каком слое произошёл сбой."
          ]}
        />
        <LlmDiagnosticsPanel />
      </div>
    </AdminShell>
  );
}

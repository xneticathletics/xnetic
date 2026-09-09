import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import { listAuditLog, type AuditLogRow } from "../lib/api/auditLog";

// Hassas/yönetimsel işlemleri (rol değişikliği, kulüp silme, abonelik
// onayı, şifre sıfırlama, aktif/pasif etme) kim-ne zaman-hangi IP ile
// yaptığını gösterir. RLS zaten süper admin için tüm kayıtları, club_admin
// için sadece kendi kulübünün kayıtlarını döndürüyor (bkz. migration
// 20260909120000_audit_log.sql) — bu sayfada ayrıca bir rol kontrolü
// gerekmiyor, gösterilen veri role göre otomatik daralıyor.
const ACTION_LABELS: Record<string, string> = {
  club_deleted: "Kulüp Silindi",
  content_promoted_to_global: "İçerik Globale Yükseltildi",
  password_reset_by_admin: "Şifre Sıfırlandı",
  super_admin_bootstrap: "Süper Admin Oluşturuldu",
  role_escalated_to_super_admin: "Süper Admin Yetkisi Verildi",
  subscription_updated: "Abonelik Güncellendi",
  user_deactivated: "Kullanıcı Pasife Alındı",
  user_reactivated: "Kullanıcı Aktife Alındı",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR");
}

function formatTarget(row: AuditLogRow) {
  if (!row.target_type) return "—";
  const type = row.target_type === "user" ? "Kullanıcı" : row.target_type === "club" ? "Kulüp" : row.target_type;
  return row.target_id ? `${type} (${row.target_id.slice(0, 8)})` : type;
}

export default function AuditLogPage() {
  const { role } = useAuth();
  const isSuperAdmin = role === "super_admin";

  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    listAuditLog()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const actionOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);
  const filteredRows = useMemo(
    () => (actionFilter ? rows.filter((r) => r.action === actionFilter) : rows),
    [rows, actionFilter]
  );

  const columns: Column<AuditLogRow>[] = [
    { key: "created_at", label: "Tarih", render: (r) => formatDate(r.created_at) },
    {
      key: "actor",
      label: "Kullanıcı",
      render: (r) => (
        <div>
          <div className="font-semibold text-ink">{r.actor_email ?? "Sistem"}</div>
          {r.actor_role && <div className="text-xs text-muted">{r.actor_role}</div>}
        </div>
      ),
    },
    { key: "action", label: "İşlem", render: (r) => ACTION_LABELS[r.action] ?? r.action },
    { key: "target", label: "Hedef", render: formatTarget },
    ...(isSuperAdmin
      ? [{ key: "club", label: "Kulüp", render: (r: AuditLogRow) => r.clubs?.name ?? "Platform" }]
      : []),
    { key: "ip", label: "IP", render: (r) => r.ip_address ?? "—" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Denetim Kaydı</h1>
      <p className="mb-6 text-sm text-muted">
        {isSuperAdmin
          ? "Platformdaki hassas işlemlerin kim, ne zaman, hangi IP'den yaptığı kaydı."
          : "Kulübündeki hassas işlemlerin (aktif/pasif etme, şifre sıfırlama vb.) kaydı."}
      </p>

      {actionOptions.length > 0 && (
        <div className="mb-4">
          <select
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">Tüm işlemler</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a] ?? a}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={filteredRows} rowKey={(r) => r.id} loading={loading} emptyText="Henüz kayıt yok." />
    </div>
  );
}

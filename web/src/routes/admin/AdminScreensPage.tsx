import { Link } from "react-router-dom";

// Mobildeki SuperAdminScreensScreen.tsx'in web karşılığı — Süper Admin'in
// gerçek kulüp verisine dokunmadan her rolün Ana Sayfa kutucuk düzenini
// önizlemesi için.
const ROLES: { key: string; label: string; icon: string; accent: string }[] = [
  { key: "club_admin", label: "Kulüp Admini", icon: "🏢", accent: "#FFC845" },
  { key: "coordinator", label: "Branş Koordinatörü", icon: "🎖️", accent: "#9b7bff" },
  { key: "coach", label: "Antrenör", icon: "🧑‍🏫", accent: "#3fd6c6" },
  { key: "parent", label: "Veli", icon: "👨‍👩‍👧", accent: "#9b7bff" },
  { key: "athlete", label: "Sporcu", icon: "🏃", accent: "#ff6b5d" },
];

export default function AdminScreensPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">Ekranlar</h1>
      <p className="mb-6 text-sm text-muted">Gerçek veriyle çalışmaz — sadece her rolün Ana Sayfa düzenini önizler.</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ROLES.map((r) => (
          <Link
            key={r.key}
            to={`/admin/screens/${r.key}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-5 text-center transition-colors hover:border-yellow"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: `${r.accent}22` }}
            >
              {r.icon}
            </div>
            <span className="text-sm font-bold text-ink">{r.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

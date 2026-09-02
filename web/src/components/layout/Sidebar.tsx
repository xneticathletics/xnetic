import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Kulüp Özeti", icon: "📊", end: true },
  { to: "/announcements", label: "Duyurular", icon: "📣" },
  { to: "/athletes", label: "Sporcular", icon: "👥" },
  { to: "/coaches", label: "Antrenörler", icon: "🧑‍🏫" },
  { to: "/groups", label: "Gruplar", icon: "🏷️" },
  { to: "/branches", label: "Branşlar", icon: "🏅" },
  { to: "/venues", label: "Salonlar", icon: "🏟️" },
  { to: "/calendar", label: "Antrenman ve Müsabaka", icon: "📅" },
  { to: "/finance/overview", label: "Finans", icon: "💰" },
  { to: "/performance", label: "Performans Ölçümleri", icon: "⏱️" },
  { to: "/fitness", label: "Fitness", icon: "💪" },
  { to: "/nutrition", label: "Beslenme", icon: "🥗" },
  { to: "/shop/products", label: "Mağaza", icon: "🛍️" },
  { to: "/users", label: "Kullanıcılar", icon: "👥" },
  { to: "/settings", label: "Kulüp Ayarları", icon: "⚙️" },
];

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-5 py-5">
        <div className="text-base font-extrabold text-ink">X-NETIC</div>
        <div className="text-xs font-semibold text-muted">Yönetim Paneli</div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive ? "bg-yellow text-bg" : "text-muted hover:bg-bg hover:text-ink"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-line p-3">
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive ? "bg-yellow text-bg" : "text-muted hover:bg-bg hover:text-ink"
            }`
          }
        >
          <span>👤</span>
          Hesabım
        </NavLink>
        <button
          onClick={() => signOut()}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-coral hover:bg-bg"
        >
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}

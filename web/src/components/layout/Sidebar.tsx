import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useClubSettings } from "../../context/ClubSettingsContext";

// Her nav öğesinin, Kulüp Ayarları → Ana Sayfa Özellikleri'ndeki hangi
// anahtara bağlı olduğunu belirtir — mobildeki TILES_BY_ROLE.club_admin
// anahtarlarıyla aynı (bkz. src/screens/HomeScreen.tsx). "tileKey" olmayan
// öğeler (Kulüp Özeti, Duyurular, Kullanıcılar, Kulüp Ayarları, Hesabım)
// hiçbir zaman kapatılamaz — çekirdek/idari sayfalar.
const NAV_ITEMS: { to: string; label: string; icon: string; end?: boolean; tileKey?: string }[] = [
  { to: "/", label: "Kulüp Özeti", icon: "📊", end: true },
  { to: "/announcements", label: "Duyurular", icon: "📣" },
  { to: "/athletes", label: "Sporcular", icon: "👥", tileKey: "sporcu" },
  { to: "/coaches", label: "Antrenörler", icon: "🧑‍🏫", tileKey: "antrenorler" },
  { to: "/groups", label: "Gruplar", icon: "🏷️", tileKey: "sporcu" },
  { to: "/branches", label: "Branşlar", icon: "🏅", tileKey: "kulup_yapisi" },
  { to: "/venues", label: "Salonlar", icon: "🏟️", tileKey: "kulup_yapisi" },
  { to: "/calendar", label: "Antrenman ve Müsabaka", icon: "📅", tileKey: "antrenman" },
  { to: "/finance/overview", label: "Finans", icon: "💰", tileKey: "aidat" },
  { to: "/performance", label: "Performans Ölçümleri", icon: "⏱️", tileKey: "performans" },
  { to: "/fitness", label: "Fitness", icon: "💪", tileKey: "fitness" },
  { to: "/nutrition", label: "Beslenme", icon: "🥗", tileKey: "beslenme" },
  { to: "/shop/products", label: "Mağaza", icon: "🛍️", tileKey: "magaza" },
  { to: "/users", label: "Kullanıcılar", icon: "👥" },
  { to: "/settings", label: "Kulüp Ayarları", icon: "⚙️" },
  { to: "/account", label: "Hesabım", icon: "👤" },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const { settings } = useClubSettings();
  const visibleItems = NAV_ITEMS.filter((item) => !item.tileKey || !settings.disabled_home_tiles.includes(item.tileKey));

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <img src="/xnetic-logo.png" alt="X-NETIC" className="h-9 w-9 rounded-lg object-contain" />
        <div>
          <div className="text-base font-extrabold text-ink">X-NETIC</div>
          <div className="text-xs font-semibold text-muted">Yönetim Paneli</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => (
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

      <div className="border-t border-line p-3">
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

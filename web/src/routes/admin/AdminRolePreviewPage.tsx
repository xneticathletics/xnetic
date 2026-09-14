import { Link, useParams } from "react-router-dom";

type Tile = { label: string; sub: string; icon: string };

// src/screens/HomeScreen.tsx'teki TILES_BY_ROLE + COORDINATOR_TILES ile
// birebir aynı veri (kasıtlı kopya — React Native dosyası web'e import
// edilemiyor). Biri değişirse diğeri de güncellenmeli.
const TILES_BY_ROLE_KEY: Record<string, Tile[]> = {
  club_admin: [
    { label: "Sporcu Yönetimi", sub: "Sporcular, gruplar", icon: "👥" },
    { label: "Antrenörler", sub: "Kadro ve atamalar", icon: "🧑‍🏫" },
    { label: "Takvim", sub: "Antrenman ve Müsabakalar", icon: "📅" },
    { label: "Kulüp Yapısı", sub: "Grup, branş, salon", icon: "🏛️" },
    { label: "Finans", sub: "Aidat ve giderler", icon: "💰" },
    { label: "Performans Ölçümleri", sub: "Hız, sıçrama, kuvvet ve dayanıklılık testleri", icon: "⏱️" },
    { label: "Beslenme", sub: "Besinler ve Rehber", icon: "🥗" },
    { label: "Fitness", sub: "Check-in ve çalışma takibi", icon: "💪" },
    { label: "Mağaza", sub: "Ürünler ve siparişler", icon: "🛍️" },
  ],
  coordinator: [
    { label: "Sporcu Yönetimi", sub: "Branşının sporcuları", icon: "👥" },
    { label: "Antrenman-Maç Takvimi", sub: "", icon: "📅" },
    { label: "Yoklama Al", sub: "Grubunu seç", icon: "📋" },
    { label: "Finans", sub: "Branşının aidatları", icon: "💰" },
    { label: "Performans Ölçümleri", sub: "Hız, sıçrama, kuvvet ve dayanıklılık testleri", icon: "⏱️" },
    { label: "Beslenme", sub: "Besinler ve Rehber", icon: "🥗" },
    { label: "Fitness", sub: "Check-in ve çalışma takibi", icon: "💪" },
    { label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
  ],
  coach: [
    { label: "Sporcularım", sub: "", icon: "👥" },
    { label: "Yoklama Al", sub: "Grubunu seç", icon: "📋" },
    { label: "Antrenman Planla", sub: "Bugün", icon: "📅" },
    { label: "Beslenme", sub: "Besinler ve Rehber", icon: "🥗" },
    { label: "Fitness", sub: "Check-in ve çalışma takibi", icon: "💪" },
    { label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
  ],
  parent: [
    { label: "Sporcum", sub: "Profilini görüntüle", icon: "🧒" },
    { label: "Yoklama Durumu", sub: "", icon: "📋" },
    { label: "Antrenman ve Müsabaka Takvimi", sub: "", icon: "📅" },
    { label: "Aidat Öde", sub: "", icon: "💰" },
    { label: "Beslenme", sub: "Besinler ve tarifler", icon: "🥗" },
    { label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
  ],
  athlete: [
    { label: "Takvim", sub: "Antrenmanlar ve Müsabaka", icon: "📅" },
    { label: "Antrenman Katılım Durumu", sub: "", icon: "📋" },
    { label: "Günlük Check-in", sub: "Uyku, enerji ve ruh hâlini kaydet", icon: "🌡️" },
    { label: "Performansım", sub: "Ölçümlerini ve gelişimini gör", icon: "📊" },
    { label: "Beslenme", sub: "Besinler ve tarifler", icon: "🥗" },
    { label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  club_admin: "Kulüp Admini",
  coordinator: "Branş Koordinatörü",
  coach: "Antrenör",
  parent: "Veli",
  athlete: "Sporcu",
};

const ROLE_ORDER = ["club_admin", "coordinator", "coach", "parent", "athlete"];

// Ana Sayfa'daki kutucuk kartları sırayla bu 3 renk arasında döner —
// mobildeki theme/tokens.ts accentRotation ile birebir aynı.
const ACCENT_ROTATION = ["#FFC845", "#3FD6C6", "#FF6B5D"];

// Alt sekme çubuğundaki ikinci sağ sekme — mobildeki RoleTabs.tsx ile aynı
// mantık: Kulüp Admini'nde Kulüp Ayarları, diğer 4 rolde Duyurular.
function getSecondTab(roleKey: string) {
  return roleKey === "club_admin" ? { icon: "⚙️", label: "Kulüp Ayarları" } : { icon: "📣", label: "Duyurular" };
}

function TabIcon({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1">
      <span className={`text-sm ${active ? "" : "opacity-60"}`}>{icon}</span>
      <span className={`text-[8px] font-semibold ${active ? "text-yellow" : "text-muted"}`}>{label}</span>
    </div>
  );
}

export default function AdminRolePreviewPage() {
  const { roleKey } = useParams<{ roleKey: string }>();
  const activeKey = roleKey && TILES_BY_ROLE_KEY[roleKey] ? roleKey : "club_admin";
  const tiles: Tile[] = TILES_BY_ROLE_KEY[activeKey] ?? [];
  const label = ROLE_LABELS[activeKey] ?? "Rol";
  const secondTab = getSecondTab(activeKey);

  return (
    <div>
      <Link to="/admin/screens" className="mb-4 inline-block text-sm font-semibold text-teal hover:underline">
        ‹ Ekranlar
      </Link>
      <h1 className="mb-1 text-xl font-bold text-ink">{label} — Ana Sayfa Önizlemesi</h1>
      <p className="mb-6 rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
        Bu bir önizleme — gerçek veriyle çalışmaz, sadece bu rolün mobil uygulamada göreceği Ana Sayfa kutucuk
        düzenini gösterir.
      </p>

      {/* Rol seçici — bir role tıklayınca aşağıdaki telefon içeriği o
          role göre güncellenir. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ROLE_ORDER.map((key) => (
          <Link
            key={key}
            to={`/admin/screens/${key}`}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              key === activeKey
                ? "border-yellow bg-yellow text-bg"
                : "border-line text-muted hover:border-teal hover:text-ink"
            }`}
          >
            {ROLE_LABELS[key]}
          </Link>
        ))}
      </div>

      {/* Gerçekçi telefon çerçevesi — website'deki "Uygulamayı Dene" telefon
          demosuyla (website/src/components/PhoneDemo.tsx) aynı çerçeve
          stili, içeriği sadece bu rolün Ana Sayfa kutucukları. */}
      <div className="mx-auto w-[300px] select-none">
        <div className="relative rounded-[2.5rem] border-[6px] border-line bg-[#0a0b1c] p-2 shadow-2xl shadow-black/40">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#0a0b1c]" />
          <div className="flex flex-col overflow-hidden rounded-[2rem] bg-bg">
            <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[11px] font-bold text-ink">
              <span>08:41</span>
              <span className="flex items-center gap-1 text-[10px]">
                <span>📶</span>
                <span>🔋</span>
              </span>
            </div>

            <div className="h-[452px] overflow-y-auto px-4 pb-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                {tiles.map((t, i) => {
                  const accent = ACCENT_ROTATION[i % ACCENT_ROTATION.length];
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-2xl border bg-surface p-3"
                      style={{ borderColor: accent }}
                    >
                      <div
                        className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                        style={{ backgroundColor: `${accent}22` }}
                      >
                        {t.icon}
                      </div>
                      <div className="text-xs font-bold leading-tight text-ink">{t.label}</div>
                      {!!t.sub && <div className="mt-1 text-[10px] leading-tight text-muted">{t.sub}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-end justify-around border-t border-line bg-bg px-2 pb-2 pt-1.5">
              <TabIcon icon="🏠" label="Ana Menü" active />
              <TabIcon icon="💬" label="Mesajlar" />
              <div className="-mt-3 flex flex-col items-center gap-0.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow text-base shadow-lg">
                  🤖
                </div>
                <span className="text-[8px] font-semibold text-muted">Asistan</span>
              </div>
              <TabIcon icon={secondTab.icon} label={secondTab.label} />
              <TabIcon icon="👤" label="Profil" />
            </div>
          </div>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-line" />
        </div>
      </div>
    </div>
  );
}

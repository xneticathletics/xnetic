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
    { label: "Yoklama Durumu", sub: "", icon: "📋" },
    { label: "Antrenman Saatleri", sub: "", icon: "📅" },
    { label: "Aidat Öde", sub: "", icon: "💰" },
    { label: "Sporcu Takibi", sub: "Çocuğunun gelişimini takip et", icon: "📊" },
    { label: "Beslenme", sub: "Besinler ve tarifler", icon: "🥗" },
    { label: "Kayıt Dondurma", sub: "", icon: "🧊" },
    { label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
  ],
  athlete: [
    { label: "Antrenman Programı", sub: "", icon: "📅" },
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

export default function AdminRolePreviewPage() {
  const { roleKey } = useParams<{ roleKey: string }>();
  const tiles = (roleKey && TILES_BY_ROLE_KEY[roleKey]) ?? [];
  const label = (roleKey && ROLE_LABELS[roleKey]) ?? "Rol";

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tiles.map((t, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-2 text-2xl">{t.icon}</div>
            <div className="text-sm font-bold text-ink">{t.label}</div>
            {!!t.sub && <div className="mt-1 text-xs text-muted">{t.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

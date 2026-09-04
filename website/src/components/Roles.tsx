type Role = { icon: string; title: string; surface: string; points: string[]; color: string };

const ROLES: Role[] = [
  {
    icon: "🏢", title: "Kulüp Admini", surface: "Web Paneli", color: "text-yellow",
    points: ["Sporcu, grup, şube ve tesis yönetimi", "Finans, aidat ve antrenör ödemeleri", "Antrenör/veli/sporcu davet etme"],
  },
  {
    icon: "🎯", title: "Antrenör", surface: "Mobil Uygulama", color: "text-teal",
    points: ["Yoklama alma, antrenman planlama", "Fitness programı ve performans testi girişi", "Sporcularıyla doğrudan iletişim"],
  },
  {
    icon: "👨‍👩‍👧", title: "Veli", surface: "Mobil Uygulama", color: "text-violet",
    points: ["Çocuğunun gelişimini ve yoklamasını takip", "Aidat ve ödeme geçmişini görme", "Kulüp duyurularından anında haberdar olma"],
  },
  {
    icon: "🏃", title: "Sporcu", surface: "Mobil Uygulama", color: "text-coral",
    points: ["Kendi antrenman programını görme", "Performans testi sonuçlarını takip etme", "Beslenme önerilerine erişim"],
  },
];

export default function Roles() {
  return (
    <section className="border-y border-line bg-surface/40 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal">Kimler İçin</span>
          <h2 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">Herkesin kendine göre bir ekranı var</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-2xl border border-line bg-bg p-6">
              <div className="mb-3 text-3xl">{r.icon}</div>
              <h3 className="text-base font-extrabold text-ink">{r.title}</h3>
              <span className={`text-xs font-bold ${r.color}`}>{r.surface}</span>
              <ul className="mt-3 space-y-2">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2 text-xs leading-relaxed text-muted">
                    <span className={r.color}>›</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

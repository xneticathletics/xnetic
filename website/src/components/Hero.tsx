const APP_URL = import.meta.env.VITE_APP_URL as string;

const MOCK_ROWS = [
  { label: "Bugünkü Antrenman", value: "18:00 — U15 Yıldızlar", color: "text-teal" },
  { label: "Bu Hafta Yoklama", value: "%94 katılım", color: "text-yellow" },
  { label: "Performans Testi", value: "20m Sprint — 3 yeni kayıt", color: "text-violet" },
  { label: "Bekleyen Ödeme", value: "2 veli — hatırlatma gönderildi", color: "text-coral" },
];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--color-yellow), transparent)" }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 md:grid-cols-2 md:pb-28 md:pt-24">
        <div>
          <span className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-teal">
            Spor kulüpleri için tek platform
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-ink md:text-5xl">
            Kulübünü yönetmenin<br />en kolay yolu.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Sporcu takibi, antrenman ve performans testleri, beslenme, yoklama,
            finans ve veli iletişimi — hepsi tek bir yönetim paneli ve mobil
            uygulamada. Antrenörlerin sahada, sen ofiste, veliler cebinde takip etsin.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`${APP_URL}/kulup-olustur`}
              className="rounded-lg bg-yellow px-6 py-3 text-sm font-bold text-bg transition hover:brightness-95"
            >
              Kulübünü Oluştur
            </a>
            <a
              href="#ozellikler"
              className="rounded-lg border border-line px-6 py-3 text-sm font-bold text-ink transition hover:border-muted"
            >
              Özellikleri Keşfet
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">Kredi kartı gerekmez — planını seç, kulübünü dakikalar içinde kur.</p>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="" className="h-7 w-7 rounded-md" />
                <span className="text-sm font-bold text-ink">Yıldız Spor Kulübü</span>
              </div>
              <span className="rounded-full bg-teal/15 px-2 py-1 text-[10px] font-bold text-teal">ÖRNEK GÖRÜNÜM</span>
            </div>
            <div className="space-y-3">
              {MOCK_ROWS.map((row) => (
                <div key={row.label} className="rounded-xl border border-line bg-bg px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{row.label}</div>
                  <div className={`mt-1 text-sm font-bold ${row.color}`}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 hidden rounded-2xl border border-line bg-surface p-4 shadow-xl shadow-black/20 sm:block">
            <div className="text-[11px] font-semibold text-muted">Mobil + Web</div>
            <div className="mt-1 text-sm font-bold text-ink">Antrenör · Veli · Sporcu</div>
          </div>
        </div>
      </div>
    </section>
  );
}

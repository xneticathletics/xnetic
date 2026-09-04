import { useEffect, useState } from "react";

const APP_URL = import.meta.env.VITE_APP_URL as string;

const VIEWS = [
  {
    title: "Yıldız Spor Kulübü",
    badge: "GENEL BAKIŞ",
    rows: [
      { label: "Bugünkü Antrenman", value: "18:00 — U15 Yıldızlar", color: "text-teal" },
      { label: "Bu Hafta Yoklama", value: "%94 katılım", color: "text-yellow" },
      { label: "Performans Testi", value: "20m Sprint — 3 yeni kayıt", color: "text-violet" },
      { label: "Bekleyen Ödeme", value: "2 veli — hatırlatma gönderildi", color: "text-coral" },
    ],
  },
  {
    title: "Zeynep Kaya — U15",
    badge: "SPORCU PROFİLİ",
    rows: [
      { label: "Branş / Kategori", value: "Yüzme — U15", color: "text-teal" },
      { label: "Kişisel Rekor", value: "50m Serbest — 28.4sn", color: "text-yellow" },
      { label: "Bu Ay Katılım", value: "%100 devam", color: "text-violet" },
      { label: "Antrenör Notu", value: "\"Teknik gelişim çok iyi, devam.\"", color: "text-coral" },
    ],
  },
  {
    title: "Performans Gelişimi",
    badge: "SPORCU TAKİBİ",
    rows: [
      { label: "20m Sprint", value: "3.42s → 3.21s (6 ayda)", color: "text-teal" },
      { label: "Dikey Sıçrama", value: "38cm → 44cm", color: "text-yellow" },
      { label: "Dayanıklılık (Yo-Yo)", value: "Seviye 14 → 16", color: "text-violet" },
      { label: "Antrenör Notu", value: "\"Sprint çıkışında belirgin gelişim\"", color: "text-coral" },
    ],
  },
  {
    title: "Mehmet Demir",
    badge: "ANTRENÖR EKRANI",
    rows: [
      { label: "Bugünkü Grup", value: "U15 Yıldızlar — 18:00", color: "text-teal" },
      { label: "Yoklama", value: "22/24 sporcu işaretlendi", color: "text-yellow" },
      { label: "Bugünkü Program", value: "Kuvvet + Sprint Antrenmanı", color: "text-violet" },
      { label: "Veli Bildirimi", value: "3 veliye mesaj gönderildi", color: "text-coral" },
    ],
  },
];

const ROTATE_MS = 4000;

export default function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % VIEWS.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const view = VIEWS[active];

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

        <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo-mark.png" alt="" className="h-8 w-8" />
                <span className="text-sm font-bold text-ink">{view.title}</span>
              </div>
              <span className="rounded-full bg-teal/15 px-2 py-1 text-[10px] font-bold text-teal">{view.badge}</span>
            </div>
            <div key={active} className="space-y-3 animate-[fadein_0.4s_ease]">
              {view.rows.map((row) => (
                <div key={row.label} className="rounded-xl border border-line bg-bg px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{row.label}</div>
                  <div className={`mt-1 text-sm font-bold ${row.color}`}>{row.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-1.5">
              {VIEWS.map((v, i) => (
                <button
                  key={v.title}
                  type="button"
                  aria-label={`${v.title} görünümünü göster`}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-yellow" : "w-1.5 bg-line"}`}
                />
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 hidden rounded-2xl border border-line bg-surface p-4 shadow-xl shadow-black/20 sm:block">
            <div className="text-[11px] font-semibold text-muted">Mobil + Web</div>
            <div className="mt-1 text-sm font-bold text-ink">Antrenör · Veli · Sporcu</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

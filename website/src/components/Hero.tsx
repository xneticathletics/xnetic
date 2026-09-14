import PhoneDemo from "./PhoneDemo";

const APP_URL = import.meta.env.VITE_APP_URL as string;

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
              href="/demo"
              className="rounded-lg border border-teal px-6 py-3 text-sm font-bold text-teal transition hover:bg-teal/10"
            >
              Uygulamayı Dene
            </a>
            <a
              href="#ozellikler"
              className="rounded-lg border border-line px-6 py-3 text-sm font-bold text-ink transition hover:border-muted"
            >
              Özellikleri Keşfet
            </a>
          </div>
        </div>

        <div className="relative flex justify-center">
          <PhoneDemo />
          <div className="absolute -bottom-6 -right-2 hidden rounded-2xl border border-line bg-surface p-4 shadow-xl shadow-black/20 sm:block">
            <div className="text-[11px] font-semibold text-muted">Mobil + Web</div>
            <div className="mt-1 text-sm font-bold text-ink">Antrenör · Veli · Sporcu</div>
          </div>
        </div>
      </div>
    </section>
  );
}

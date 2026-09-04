import type { PlatformSettings } from "../lib/platformSettings";

const APP_URL = import.meta.env.VITE_APP_URL as string;

function formatTry(amount: number): string {
  return amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

export default function Pricing({ settings, loading }: { settings: PlatformSettings | null; loading: boolean }) {
  return (
    <section id="fiyatlandirma" className="border-y border-line bg-surface/40 py-20">
      <div className="mx-auto max-w-4xl px-5">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-teal">Fiyatlandırma</span>
          <h2 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">Tek plan, sınırsız kullanıcı</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Kulüp büyüklüğü fark etmeksizin sabit fiyat — sporcu, antrenör ya da veli
            sayısına göre ek ücret yok.
          </p>
        </div>

        {loading && <p className="text-center text-sm text-muted">Fiyatlar yükleniyor…</p>}

        {!loading && settings && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-bg p-8">
              <div className="text-sm font-bold text-muted">Aylık</div>
              <div className="mt-2 text-4xl font-extrabold text-ink">
                {formatTry(settings.monthlyPriceTry)} ₺<span className="text-base font-semibold text-muted"> / ay</span>
              </div>
              <p className="mt-2 text-xs text-muted">Her ay otomatik yenilenir, istediğin zaman iptal et.</p>
              <a
                href={`${APP_URL}/kulup-olustur`}
                className="mt-6 block rounded-lg border border-line py-2.5 text-center text-sm font-bold text-ink transition hover:border-muted"
              >
                Aylık Planla Başla
              </a>
            </div>

            <div className="relative rounded-2xl border-2 border-yellow bg-bg p-8">
              <span className="absolute -top-3 right-6 rounded-full bg-yellow px-3 py-1 text-[10px] font-extrabold text-bg">
                EN AVANTAJLI
              </span>
              <div className="text-sm font-bold text-muted">Yıllık</div>
              <div className="mt-2 text-4xl font-extrabold text-ink">
                {formatTry(settings.yearlyPriceTry)} ₺<span className="text-base font-semibold text-muted"> / yıl</span>
              </div>
              <p className="mt-2 text-xs text-muted">2 ay ücretsiz — yıllık ödemede.</p>
              <a
                href={`${APP_URL}/kulup-olustur`}
                className="mt-6 block rounded-lg bg-yellow py-2.5 text-center text-sm font-bold text-bg transition hover:brightness-95"
              >
                Yıllık Planla Başla
              </a>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs italic text-muted">Fiyatlara KDV dahildir.</p>
      </div>
    </section>
  );
}

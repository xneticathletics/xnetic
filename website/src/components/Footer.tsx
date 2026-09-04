import type { PlatformSettings } from "../lib/platformSettings";

const APP_URL = import.meta.env.VITE_APP_URL as string;

export default function Footer({ settings }: { settings: PlatformSettings | null }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="X-NETIC" className="h-10 w-10 rounded-xl shadow-md shadow-black/20" />
              <span className="text-base font-extrabold text-ink">X-NETIC</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Spor kulüpleri için sporcu takibi, antrenman, performans ve kulüp yönetimini
              tek platformda birleştiren yazılım.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 text-sm">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Ürün</div>
              <ul className="space-y-2 text-muted">
                <li><a href="#ozellikler" className="hover:text-ink">Özellikler</a></li>
                <li><a href="#fiyatlandirma" className="hover:text-ink">Fiyatlandırma</a></li>
                <li><a href="#sss" className="hover:text-ink">SSS</a></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Hesap</div>
              <ul className="space-y-2 text-muted">
                <li><a href={`${APP_URL}/login`} className="hover:text-ink">Giriş Yap</a></li>
                <li><a href={`${APP_URL}/kulup-olustur`} className="hover:text-ink">Kulüp Oluştur</a></li>
              </ul>
            </div>
            {(settings?.supportEmail || settings?.supportPhone) && (
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">İletişim</div>
                <ul className="space-y-2 text-muted">
                  {settings.supportEmail && (
                    <li><a href={`mailto:${settings.supportEmail}`} className="hover:text-ink">{settings.supportEmail}</a></li>
                  )}
                  {settings.supportPhone && (
                    <li><a href={`tel:${settings.supportPhone}`} className="hover:text-ink">{settings.supportPhone}</a></li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-xs text-muted">
          © {new Date().getFullYear()} X-NETIC. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}

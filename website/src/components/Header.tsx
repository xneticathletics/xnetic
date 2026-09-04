const APP_URL = import.meta.env.VITE_APP_URL as string;

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="X-NETIC" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-extrabold tracking-tight text-ink">X-NETIC</span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted md:flex">
          <a href="#ozellikler" className="hover:text-ink">Özellikler</a>
          <a href="#nasil-calisir" className="hover:text-ink">Nasıl Çalışır</a>
          <a href="#fiyatlandirma" className="hover:text-ink">Fiyatlandırma</a>
          <a href="#sss" className="hover:text-ink">SSS</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`${APP_URL}/login`}
            className="hidden text-sm font-semibold text-muted hover:text-ink sm:inline"
          >
            Giriş Yap
          </a>
          <a
            href={`${APP_URL}/kulup-olustur`}
            className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg transition hover:brightness-95"
          >
            Kulüp Oluştur
          </a>
        </div>
      </div>
    </header>
  );
}

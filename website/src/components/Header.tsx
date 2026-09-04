import { useState } from "react";

const APP_URL = import.meta.env.VITE_APP_URL as string;

const NAV_LINKS = [
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "#fiyatlandirma", label: "Fiyatlandırma" },
  { href: "#sss", label: "SSS" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
          <img src="/logo-mark.png" alt="X-NETIC" className="h-16 w-16 drop-shadow-lg" />
          <span className="text-lg font-extrabold tracking-tight text-ink">X-NETIC Spor Sistemleri</span>
        </a>

        <nav className="hidden items-center gap-7 text-base font-semibold text-muted md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-ink">{l.label}</a>
          ))}
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
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menü"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink md:hidden"
          >
            <span className="text-lg leading-none">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-line bg-bg px-5 py-4 md:hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-2 py-2.5 text-base font-semibold text-muted hover:bg-surface hover:text-ink"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="mt-2 border-t border-line pt-2">
              <a
                href={`${APP_URL}/login`}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-2 py-2.5 text-base font-semibold text-muted hover:bg-surface hover:text-ink"
              >
                Giriş Yap
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

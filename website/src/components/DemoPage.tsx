import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import PhoneDemo from "./PhoneDemo";
import type { PlatformSettings } from "../lib/platformSettings";

const APP_URL = import.meta.env.VITE_APP_URL as string;
const SITE_URL = "https://xnetic.net";

const SEO_TITLE = "Uygulamayı Dene | X-NETIC";
const SEO_DESCRIPTION =
  "X-NETIC'i kaydolmadan dene — örnek verilerle sporcu yönetimi, antrenör, finans, fitness ve performans ölçümleri ekranlarında dolaş.";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function useDemoMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = SEO_TITLE;
    setMeta("description", SEO_DESCRIPTION);
    setMeta("og:title", SEO_TITLE, "property");
    setMeta("og:description", SEO_DESCRIPTION, "property");
    setMeta("og:url", `${SITE_URL}/demo`, "property");
    setMeta("twitter:title", SEO_TITLE);
    setMeta("twitter:description", SEO_DESCRIPTION);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute("href");
    canonical.setAttribute("href", `${SITE_URL}/demo`);

    return () => {
      document.title = prevTitle;
      if (prevCanonical) canonical!.setAttribute("href", prevCanonical);
    };
  }, []);
}

export default function DemoPage({ settings }: { settings: PlatformSettings | null }) {
  useDemoMeta();

  return (
    <div>
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--color-yellow), transparent)" }}
          />
          <div className="relative mx-auto grid max-w-6xl items-start gap-14 px-5 pb-24 pt-16 md:grid-cols-2 md:pt-20">
            <div>
              <span className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-teal">
                Kaydolmadan dene
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-ink md:text-5xl">
                Anlatmaktansa<br />göstermeyi tercih ettik.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
                Sağdaki telefonda gerçek X-NETIC arayüzünü, örnek bir kulübün verileriyle dolaşabilirsin.
                Sporcu profiline gir, bir antrenörün branşına bak, aidat durumunu ve performans geçmişini incele —
                hiçbir yere kaydolman gerekmiyor.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-muted">
                <li className="flex gap-2"><span className="text-teal">›</span> Sporcu Yönetimi — profil, sağlık notu, hızlı aksiyonlar</li>
                <li className="flex gap-2"><span className="text-teal">›</span> Antrenörler — branş, kademe, sorumlu gruplar</li>
                <li className="flex gap-2"><span className="text-teal">›</span> Finans — aidat tahsilatı ve gecikme takibi</li>
                <li className="flex gap-2"><span className="text-teal">›</span> Fitness ve Performans Ölçümleri</li>
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`${APP_URL}/kulup-olustur`}
                  className="rounded-lg bg-yellow px-6 py-3 text-sm font-bold text-bg transition hover:brightness-95"
                >
                  Kulübünü Oluştur
                </a>
                <a
                  href="/#ozellikler"
                  className="rounded-lg border border-line px-6 py-3 text-sm font-bold text-ink transition hover:border-muted"
                >
                  Tüm Özellikler
                </a>
              </div>
              <p className="mt-4 text-xs text-muted">
                Bu bir simülasyon — gösterilen isimler ve veriler örnektir, gerçek bir kulübe ait değildir.
              </p>
            </div>

            <PhoneDemo />
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}

import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CtaBanner from "./CtaBanner";
import { SERVICES, type ServiceDetail } from "../lib/services";
import type { PlatformSettings } from "../lib/platformSettings";

const APP_URL = import.meta.env.VITE_APP_URL as string;
const SITE_URL = "https://xnetic.net";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function useServiceMeta(service: ServiceDetail) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = service.seoTitle;
    setMeta("description", service.seoDescription);
    setMeta("og:title", service.seoTitle, "property");
    setMeta("og:description", service.seoDescription, "property");
    setMeta("og:url", `${SITE_URL}/hizmet/${service.slug}`, "property");
    setMeta("twitter:title", service.seoTitle);
    setMeta("twitter:description", service.seoDescription);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute("href");
    canonical.setAttribute("href", `${SITE_URL}/hizmet/${service.slug}`);

    return () => {
      document.title = prevTitle;
      if (prevCanonical) canonical!.setAttribute("href", prevCanonical);
    };
  }, [service]);
}

function FeatureVisual({ service }: { service: ServiceDetail }) {
  if (service.video) {
    return (
      <video
        src={service.video}
        controls
        preload="none"
        className="aspect-[4/3] w-full rounded-2xl border border-line bg-surface object-cover"
      />
    );
  }
  if (service.image) {
    return (
      <img
        src={service.image}
        alt={service.title}
        className="aspect-[4/3] w-full rounded-2xl border border-line bg-surface object-cover"
      />
    );
  }
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-line bg-surface">
      <span className="text-8xl opacity-40">{service.icon}</span>
    </div>
  );
}

export default function ServicePage({
  service,
  settings,
}: {
  service: ServiceDetail;
  settings: PlatformSettings | null;
}) {
  useServiceMeta(service);

  const related = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <div>
      <Header />
      <main>
        <nav aria-label="Yol haritası" className="mx-auto max-w-6xl px-5 pt-6 text-xs text-muted">
          <a href="/" className="hover:text-ink">Ana Sayfa</a>
          <span className="mx-1.5">/</span>
          <a href="/#ozellikler" className="hover:text-ink">Özellikler</a>
          <span className="mx-1.5">/</span>
          <span className="text-ink">{service.title}</span>
        </nav>

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-2 md:py-16">
          <div>
            <div className="mb-3 text-4xl">{service.icon}</div>
            <span className={`text-xs font-bold uppercase tracking-widest ${service.color}`}>{service.eyebrow}</span>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-ink md:text-4xl">{service.title}</h1>
            <p className="mt-5 text-base leading-relaxed text-muted">{service.intro}</p>
            <a
              href={`${APP_URL}/kulup-olustur`}
              className="mt-7 inline-block rounded-lg bg-yellow px-6 py-3 text-sm font-bold text-bg transition hover:brightness-95"
            >
              Kulübünü Oluştur
            </a>
          </div>
          <FeatureVisual service={service} />
        </section>

        <section className="mx-auto max-w-6xl px-5 py-8">
          <h2 className="text-xl font-extrabold text-ink">Bu modül neler sunuyor?</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {service.points.map((p) => (
              <li
                key={p}
                className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted"
              >
                <span className={`mt-0.5 shrink-0 font-bold ${service.color}`}>✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-xl font-extrabold text-ink">Diğer özellikleri incele</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <a
                key={r.slug}
                href={`/hizmet/${r.slug}`}
                className="rounded-xl border border-line bg-surface p-5 transition hover:border-muted"
              >
                <div className="text-2xl">{r.icon}</div>
                <div className="mt-2 text-sm font-bold text-ink">{r.title}</div>
                <span className={`mt-1 inline-block text-xs font-semibold ${r.color}`}>Detaylı bilgi →</span>
              </a>
            ))}
          </div>
        </section>

        <CtaBanner />
      </main>
      <Footer settings={settings} />
    </div>
  );
}

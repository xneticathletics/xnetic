import { SERVICES, type ServiceDetail } from "../lib/services";

function FeatureVisual({ feature }: { feature: ServiceDetail }) {
  if (feature.video) {
    return (
      <video
        src={feature.video}
        controls
        preload="none"
        className="aspect-[4/3] w-full rounded-2xl border border-line bg-surface object-cover"
      />
    );
  }
  if (feature.image) {
    return (
      <img
        src={feature.image}
        alt={feature.title}
        className="aspect-[4/3] w-full rounded-2xl border border-line bg-surface object-cover"
        loading="lazy"
      />
    );
  }
  // Görsel henüz eklenmediyse ikon temelli bir yer tutucu — sayfa boş
  // görünmesin, ama gerçek görsel geldiğinde yukarıdaki dallardan biri
  // devreye girip burayı otomatik değiştirecek.
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-line bg-surface">
      <span className="text-6xl opacity-40">{feature.icon}</span>
    </div>
  );
}

export default function Features() {
  return (
    <section id="ozellikler" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-teal">Özellikler</span>
        <h2 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">
          Kulübünü yönetmek için gereken her şey
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Ayrı ayrı tablolar, WhatsApp grupları ve kağıt yoklama listeleri yerine —
          tek bir sistemde, herkes için doğru görünüm.
        </p>
      </div>

      <div className="space-y-20">
        {SERVICES.map((f, i) => (
          <div
            key={f.slug}
            className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            <div>
              <div className="mb-3 text-3xl">{f.icon}</div>
              <span className={`text-xs font-bold uppercase tracking-widest ${f.color}`}>{f.eyebrow}</span>
              <h3 className="mt-2 text-2xl font-extrabold text-ink">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.desc}</p>
              <ul className="mt-5 space-y-2.5">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm leading-relaxed text-muted">
                    <span className={`mt-0.5 shrink-0 ${f.color}`}>›</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`/hizmet/${f.slug}`}
                className={`mt-5 inline-flex items-center gap-1.5 text-sm font-bold ${f.color} hover:underline`}
              >
                Detaylı bilgi <span aria-hidden="true">→</span>
              </a>
            </div>
            <FeatureVisual feature={f} />
          </div>
        ))}
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";

// Mobildeki FitnessScreen.tsx'in (3 kutucuk: Wellness / Çalışma / Program)
// web paneline uyarlanmış hub sayfası — tek bir "Fitness" sidebar girişinin
// altında üç alt bölüme geçiş sağlar.
const TILES = [
  { to: "/fitness/exercises", icon: "🏋️", title: "Egzersiz Kütüphanesi", sub: "Göğüs, sırt, bacak, kol, omuz — hareket ekle/düzenle" },
  { to: "/fitness/groups", icon: "🎯", title: "Fitness Grupları", sub: "Branştaki müsabık sporculardan özel gruplar oluştur" },
  { to: "/fitness/programs", icon: "📋", title: "Programlar", sub: "Gruplara ya da fitness gruplarına özel çalışma programları oluştur" },
  { to: "/fitness/wellness", icon: "🌡️", title: "Wellness Check-in", sub: "Sporcuların uyku, enerji ve ruh hâli takibi (salt okunur)" },
];

export default function FitnessHubPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink">Fitness</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-yellow"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow/10 text-xl">
              {t.icon}
            </div>
            <p className="mb-1 text-sm font-bold text-ink">{t.title}</p>
            <p className="text-xs leading-relaxed text-muted">{t.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

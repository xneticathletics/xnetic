import { Link } from "react-router-dom";

const TILES = [
  { to: "/nutrition/foods", icon: "🍎", label: "Besinler", desc: "Kategoriye göre örnek besinler ve besin değerleri" },
  { to: "/nutrition/recipes", icon: "🍳", label: "Sporcu Tarifleri", desc: "Kategoriye göre pratik ve besleyici tarifler" },
  { to: "/nutrition/articles", icon: "📖", label: "Beslenme Rehberi", desc: "Müsabaka, antrenman ve normal gün beslenme yazıları" },
];

export default function NutritionHomePage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink">Beslenme</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TILES.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-yellow"
          >
            <div className="mb-2 text-3xl">{t.icon}</div>
            <div className="mb-1 text-base font-bold text-ink">{t.label}</div>
            <div className="text-xs text-muted">{t.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

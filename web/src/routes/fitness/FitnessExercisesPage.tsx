import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FITNESS_CATEGORIES, CATEGORY_COLOR_CLASSES } from "../../lib/fitnessExercises";
import { listAllCustomExercises, type CustomFitnessExercise } from "../../lib/api/fitnessExercises";

// Mobildeki FitnessTrainingScreen.tsx'in web karşılığı — vücut bölgesi
// kategorilerini kart olarak listeler, her kart sabit katalog + kulübün
// eklediği özel egzersiz sayısını gösterir.
export default function FitnessExercisesPage() {
  const [customExercises, setCustomExercises] = useState<CustomFitnessExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAllCustomExercises()
      .then(setCustomExercises)
      .finally(() => setLoading(false));
  }, []);

  const customCountByCategory = customExercises.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Egzersiz Kütüphanesi</h1>
      </div>
      <p className="mb-6 text-sm text-muted">Bir bölge seç — sabit kataloğu görüntüle, kulübe özel hareket ekle/düzenle/sil.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FITNESS_CATEGORIES.map((cat) => {
          const cls = CATEGORY_COLOR_CLASSES[cat.color];
          const customCount = customCountByCategory[cat.key] ?? 0;
          return (
            <Link
              key={cat.key}
              to={`/fitness/exercises/${cat.key}`}
              className={`rounded-2xl border-2 bg-surface p-5 transition-transform hover:-translate-y-0.5 ${cls.border}`}
            >
              <div className="mb-2 text-3xl">{cat.icon}</div>
              <p className={`mb-1 text-base font-extrabold ${cls.text}`}>{cat.label}</p>
              <p className="text-xs text-muted">
                {cat.exercises.length} sabit egzersiz{!loading && customCount > 0 ? ` · ${customCount} özel` : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

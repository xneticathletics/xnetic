import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getFitnessCategory } from "../../lib/fitnessExercises";
import { listCustomExercisesByCategory, type CustomFitnessExercise } from "../../lib/api/fitnessExercises";
import { listHiddenExerciseIds, hideExercise, showExercise } from "../../lib/api/fitnessExerciseVisibility";

// Kulübün, GLOBAL hareketlerden kulübüyle ilgisiz olanları kendi
// görünümünden gizleyebildiği ayrı bir sayfa — bkz. mobildeki
// FitnessExerciseVisibilityScreen.tsx ile aynı mantık. Global harekete hiç
// dokunulmuyor, sadece bu kulüp için görünürlüğü kapatılıp açılıyor.
export default function FitnessExerciseVisibilityPage() {
  const { category } = useParams<{ category: string }>();
  const meta = category ? getFitnessCategory(category) : undefined;

  const [globalExercises, setGlobalExercises] = useState<CustomFitnessExercise[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    Promise.all([listCustomExercisesByCategory(category), listHiddenExerciseIds()])
      .then(([all, hidden]) => {
        setGlobalExercises(all.filter((e) => e.club_id === null));
        setHiddenIds(hidden);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category]);

  const handleToggle = async (exerciseId: string, nextVisible: boolean) => {
    setSavingId(exerciseId);
    const prev = new Set(hiddenIds);
    const next = new Set(hiddenIds);
    if (nextVisible) next.delete(exerciseId);
    else next.add(exerciseId);
    setHiddenIds(next);
    try {
      if (nextVisible) await showExercise(exerciseId);
      else await hideExercise(exerciseId);
    } catch (e: any) {
      setHiddenIds(prev);
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setSavingId(null);
    }
  };

  if (!meta) {
    return (
      <div>
        <Link to="/fitness/exercises" className="text-sm font-semibold text-teal hover:underline">
          ‹ Egzersiz Kütüphanesi
        </Link>
        <p className="mt-4 text-sm font-semibold text-coral">Kategori bulunamadı.</p>
      </div>
    );
  }

  return (
    <div>
      <Link to={`/fitness/exercises/${category}`} className="mb-4 inline-block text-sm font-semibold text-teal hover:underline">
        ‹ {meta.label}
      </Link>

      <h1 className="mb-2 text-xl font-bold text-ink">{meta.label} — Hareketleri Yönet</h1>
      <p className="mb-6 text-sm text-muted">
        Genel hareketlerden kulübünle ilgisiz olanları kapatabilirsin — sadece senin kulübünde
        görünmez olur, global listeden ya da diğer kulüplerden hiçbir şey silinmez. İstediğin an
        tekrar açabilirsin.
      </p>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : globalExercises.length === 0 ? (
        <p className="text-sm text-muted">Bu kategoride genel hareket yok.</p>
      ) : (
        <div className="space-y-2">
          {globalExercises.map((e) => {
            const visible = !hiddenIds.has(e.id);
            return (
              <label
                key={e.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-surface px-4 py-3"
              >
                <span className={`text-sm font-semibold ${visible ? "text-ink" : "text-muted line-through"}`}>{e.name}</span>
                {savingId === e.id ? (
                  <span className="text-xs text-muted">Kaydediliyor…</span>
                ) : (
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(ev) => handleToggle(e.id, ev.target.checked)}
                    className="h-4 w-4 shrink-0"
                  />
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

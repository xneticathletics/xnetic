import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField, { inputClass } from "../../components/FormField";
import { FITNESS_CATEGORIES, getFitnessCategory } from "../../lib/fitnessExercises";
import { listCustomExercisesByCategory } from "../../lib/api/fitnessExercises";
import { listGroups, type Group } from "../../lib/api/groups";
import { publishFitnessProgram, type FitnessProgramItemInput } from "../../lib/api/fitnessPrograms";
import { getCurrentAppUserId } from "../../lib/api/currentUser";

type ExerciseOption = { key: string; name: string };

// Mobildeki FitnessProgramBuilderScreen.tsx'in web karşılığı — sadeleştirilmiş
// tek sayfalık akış: hareket ekle → program adı/grup seç → yayınla.
export default function FitnessProgramBuilderPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<FitnessProgramItemInput[]>([]);

  const [category, setCategory] = useState<string | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [exerciseKey, setExerciseKey] = useState<string | null>(null);
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  const [name, setName] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGroups().then(setGroups).catch(() => {});
  }, []);

  useEffect(() => {
    if (!category) {
      setExerciseOptions([]);
      return;
    }
    const meta = getFitnessCategory(category);
    const staticOptions: ExerciseOption[] = meta ? meta.exercises.map((e) => ({ key: e.key, name: e.name })) : [];
    listCustomExercisesByCategory(category)
      .then((custom) => {
        setExerciseOptions([...staticOptions, ...custom.map((c) => ({ key: `custom:${c.id}`, name: c.name }))]);
      })
      .catch(() => setExerciseOptions(staticOptions));
  }, [category]);

  const selectedExerciseName = exerciseOptions.find((e) => e.key === exerciseKey)?.name ?? null;

  const handleAddItem = () => {
    if (!category || !exerciseKey || !selectedExerciseName) return setError("Bölge ve hareket seçmelisin.");
    const setsNum = Number(sets);
    const repsNum = Number(reps);
    if (!setsNum || setsNum <= 0) return setError("Geçerli bir set sayısı gir.");
    if (!repsNum || repsNum <= 0) return setError("Geçerli bir tekrar sayısı gir.");

    setError(null);
    setItems((prev) => [...prev, { category, exercise_key: exerciseKey, exercise_name: selectedExerciseName, sets: setsNum, reps: repsNum }]);
    setExerciseKey(null);
    setSets("");
    setReps("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!name.trim()) return setError("Program adı girmelisin.");
    if (!groupId) return setError("Bir grup seçmelisin.");
    if (items.length === 0) return setError("En az bir hareket eklemelisin.");

    setSaving(true);
    setError(null);
    try {
      const myUserId = await getCurrentAppUserId();
      const program = await publishFitnessProgram({ name: name.trim(), group_id: groupId, created_by: myUserId, items });
      navigate(`/fitness/programs/${program.id}`);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link to="/fitness/programs" className="mb-4 inline-block text-sm font-semibold text-teal hover:underline">
        ‹ Programlar
      </Link>
      <h1 className="mb-6 text-xl font-bold text-ink">Yeni Program</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-bold text-ink">Hareket Ekle</h2>

          <FormField label="Bölge">
            <div className="flex flex-wrap gap-2">
              {FITNESS_CATEGORIES.map((cat) => {
                const active = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setCategory(cat.key);
                      setExerciseKey(null);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active ? "border-violet bg-violet text-bg" : "border-line text-ink"
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                );
              })}
            </div>
          </FormField>

          {category && (
            <FormField label="Hareket">
              <select className={inputClass} value={exerciseKey ?? ""} onChange={(e) => setExerciseKey(e.target.value || null)}>
                <option value="">Bir hareket seç</option>
                {exerciseOptions.map((ex) => (
                  <option key={ex.key} value={ex.key}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {exerciseKey && (
            <div className="flex gap-3">
              <FormField label="Set Sayısı *">
                <input className={inputClass} value={sets} onChange={(e) => setSets(e.target.value)} inputMode="numeric" placeholder="Örn. 3" />
              </FormField>
              <FormField label="Tekrar Sayısı *">
                <input className={inputClass} value={reps} onChange={(e) => setReps(e.target.value)} inputMode="numeric" placeholder="Örn. 12" />
              </FormField>
            </div>
          )}

          {exerciseKey && (
            <button
              onClick={handleAddItem}
              className="w-full rounded-lg border border-violet py-2.5 text-sm font-bold text-violet hover:bg-violet/10"
            >
              + Programa Ekle
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-bold text-ink">Eklenen Hareketler ({items.length})</h2>
          {items.length === 0 && <p className="text-sm text-muted">Henüz hareket eklenmedi.</p>}
          <div className="mb-6 space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-line bg-bg p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.exercise_name}</p>
                  <p className="text-xs text-muted">{item.sets} set × {item.reps} tekrar</p>
                </div>
                <button onClick={() => handleRemoveItem(index)} className="text-xs font-bold text-coral hover:underline">
                  Kaldır
                </button>
              </div>
            ))}
          </div>

          <FormField label="Program Adı *">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Haftalık Kuvvet Programı" />
          </FormField>

          <FormField label="Hangi Gruba Sergilenecek? *">
            <select className={inputClass} value={groupId ?? ""} onChange={(e) => setGroupId(e.target.value || null)}>
              <option value="">Bir grup seç</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.branch}
                </option>
              ))}
            </select>
          </FormField>

          {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

          <button
            onClick={handlePublish}
            disabled={saving}
            className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Gönderiliyor…" : "Gönder ve Sergile"}
          </button>
        </div>
      </div>
    </div>
  );
}

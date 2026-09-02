import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  createCustomExercise,
  updateCustomExercise,
  type CustomFitnessExercise,
} from "../../lib/api/fitnessExercises";

// Bir kulübe özel egzersizi ekleme/düzenleme modali — kategori, sayfa
// bağlamından sabit geldiği için burada değiştirilemez (mobildeki
// FitnessExerciseFormScreen'de kategori seçilebiliyordu çünkü tek genel
// ekleme ekranıydı; burada zaten kategori sayfasından açılıyor).
export default function ExerciseModal({
  category,
  exercise,
  onClose,
  onSaved,
}: {
  category: string;
  exercise: CustomFitnessExercise | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [bodyweight, setBodyweight] = useState(exercise?.bodyweight ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return setError("Hareketin adını girmelisin.");
    setSaving(true);
    setError(null);
    try {
      if (exercise) {
        await updateCustomExercise(exercise.id, { category, name: name.trim(), bodyweight });
      } else {
        await createCustomExercise({ category, name: name.trim(), bodyweight });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={exercise ? "Hareketi Düzenle" : "Yeni Hareket Ekle"} onClose={onClose}>
      <FormField label="Hareketin Adı *">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. Cable Crossover"
          autoFocus
        />
      </FormField>

      <FormField label="Vücut Ağırlığı">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={bodyweight} onChange={(e) => setBodyweight(e.target.checked)} />
          Vücut ağırlığıyla yapılır — ağırlık alanı isteğe bağlı olsun
        </label>
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </Modal>
  );
}

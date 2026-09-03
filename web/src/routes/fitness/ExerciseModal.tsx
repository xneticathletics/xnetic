import { useRef, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import {
  createCustomExercise,
  updateCustomExercise,
  uploadExerciseVideo,
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
  const { clubId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(exercise?.name ?? "");
  const [bodyweight, setBodyweight] = useState(exercise?.bodyweight ?? false);
  const [description, setDescription] = useState(exercise?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file || !clubId) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadExerciseVideo(file, clubId);
      setVideoUrl(url);
    } catch (e: any) {
      setError(e.message ?? "Video yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return setError("Hareketin adını girmelisin.");
    setSaving(true);
    setError(null);
    try {
      const input = {
        category,
        name: name.trim(),
        bodyweight,
        video_url: videoUrl.trim() || null,
        description: description.trim() || null,
      };
      if (exercise) {
        await updateCustomExercise(exercise.id, input);
      } else {
        await createCustomExercise(input);
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

      <FormField label="Açıklama">
        <textarea
          className={`${inputClass} min-h-20`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Hareketin nasıl yapıldığına dair kısa bir açıklama…"
        />
      </FormField>

      <FormField label="Video">
        <input
          className={inputClass}
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Video linki yapıştır (YouTube, Vimeo, vb.)"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink disabled:opacity-60"
          >
            {uploading ? "Yükleniyor…" : "📁 Dosya Seç ve Yükle"}
          </button>
          {videoUrl && (
            <button
              type="button"
              onClick={() => setVideoUrl("")}
              className="text-xs font-bold text-coral hover:underline"
            >
              Kaldır
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
        </div>
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
        disabled={saving || uploading || !name.trim()}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </Modal>
  );
}

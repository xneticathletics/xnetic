import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormField, { inputClass } from "../../components/FormField";
import { PERFORMANCE_CATEGORIES } from "../../lib/performanceTests";
import {
  createCustomTest,
  updateCustomTest,
  getCustomTest,
  uploadTestVideo,
  isLowerBetterUnit,
} from "../../lib/api/customPerformanceTests";
import { useAuth } from "../../context/AuthContext";

// Mobildeki PerformanceTestFormScreen'in web karşılığı: yeni test tanımı
// ekleme / mevcut testi düzenleme. Alanlar birebir aynı (kategori, ad,
// birim, ekipman, nasıl yapılır, video, "iyi yön").
export default function PerformanceTestFormPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { clubId } = useAuth();

  const [category, setCategory] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [equipment, setEquipment] = useState("");
  const [instructions, setInstructions] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  // true = düşük değer iyi (süre vb.), false = yüksek değer iyi. Kullanıcı
  // elle seçmediyse birimden tahmin ediliyor.
  const [lowerIsBetter, setLowerIsBetter] = useState(false);
  const directionTouchedRef = useRef(false);

  const [loading, setLoading] = useState(!!testId);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    getCustomTest(testId)
      .then((t) => {
        if (cancelled || !t) return;
        setCategory(t.category);
        setName(t.name);
        setUnit(t.unit);
        setEquipment(t.equipment ?? "");
        setInstructions(t.instructions);
        setVideoUrl(t.video_url ?? "");
        directionTouchedRef.current = t.lower_is_better !== null;
        setLowerIsBetter(t.lower_is_better ?? isLowerBetterUnit(t.unit));
      })
      .catch((e) => { if (!cancelled) setError(e.message ?? "Test yüklenemedi"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [testId]);

  const handleUnitChange = (value: string) => {
    setUnit(value);
    if (!directionTouchedRef.current) setLowerIsBetter(isLowerBetterUnit(value));
  };

  const handleVideoFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setVideoUrl(await uploadTestVideo(file, clubId));
    } catch (e: any) {
      setError(e.message ?? "Video yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!category) return setError("Bir kategori seçmelisin.");
    if (!name.trim()) return setError("Testin adını girmelisin.");
    if (!unit.trim()) return setError("Birim girmelisin (ör. sn, cm, kg).");
    if (!instructions.trim()) return setError("Nasıl yapıldığını açıklamalısın.");

    setSaving(true);
    setError(null);
    try {
      const input = {
        category,
        name: name.trim(),
        unit: unit.trim(),
        equipment: equipment.trim() || null,
        instructions: instructions.trim(),
        video_url: videoUrl.trim() || null,
        lower_is_better: lowerIsBetter,
      };
      if (testId) await updateCustomTest(testId, input);
      else await createCustomTest(input);
      navigate(`/performance/${category}`);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/performance" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Performans Ölçümleri
      </Link>
      <h1 className="mb-6 text-xl font-bold text-ink">{testId ? "Testi Düzenle" : "Yeni Test Ekle"}</h1>

      <FormField label="Kategori *">
        <div className="flex flex-wrap gap-2">
          {PERFORMANCE_CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                category === cat.key ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Testin Adı *">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. 20m Sürat" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Birim *">
          <input className={inputClass} value={unit} onChange={(e) => handleUnitChange(e.target.value)} placeholder="Örn. sn, cm, kg" />
        </FormField>
        <FormField label="Ekipman (isteğe bağlı)">
          <input className={inputClass} value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Örn. kronometre" />
        </FormField>
      </div>

      <FormField label="İyi Yön">
        <div className="flex flex-wrap gap-2">
          {[
            { value: false, label: "⬆️ Yüksek değer daha iyi" },
            { value: true, label: "⬇️ Düşük değer daha iyi" },
          ].map((opt) => (
            <button
              type="button"
              key={String(opt.value)}
              onClick={() => { directionTouchedRef.current = true; setLowerIsBetter(opt.value); }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                lowerIsBetter === opt.value ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">
          Ölçüm geçmişinde artış/azalışın "gelişme" mi yoksa "gerileme" mi sayılacağını belirler.
        </p>
      </FormField>

      <FormField label="Nasıl Yapılır? *">
        <textarea
          className={`${inputClass} min-h-28`}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Testin uygulanışını adım adım yaz."
        />
      </FormField>

      <FormField label="Video (isteğe bağlı)">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => handleVideoFile(e.target.files?.[0])}
          className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-bg file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
        />
        {uploading && <p className="mt-1 text-xs text-muted">Video yükleniyor…</p>}
        {!!videoUrl && !uploading && (
          <p className="mt-1 text-xs text-teal">
            ✓ Video eklendi.{" "}
            <button type="button" onClick={() => setVideoUrl("")} className="font-bold text-coral hover:underline">
              Kaldır
            </button>
          </p>
        )}
      </FormField>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="rounded-lg bg-yellow px-5 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : testId ? "Güncelle" : "Testi Ekle"}
      </button>
    </div>
  );
}

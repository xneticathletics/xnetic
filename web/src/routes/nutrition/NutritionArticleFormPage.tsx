import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import FormField, { inputClass } from "../../components/FormField";
import {
  getNutritionArticle,
  createNutritionArticle,
  updateNutritionArticle,
  uploadNutritionArticlePdf,
  type NutritionArticleInput,
} from "../../lib/api/nutritionArticles";
import { ARTICLE_CATEGORIES, type ArticleCategoryKey } from "../../lib/nutritionCategories";
import { useAuth } from "../../context/AuthContext";

export default function NutritionArticleFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clubId } = useAuth();
  const isNew = !id;

  const initialCategory = (searchParams.get("category") as ArticleCategoryKey) || ARTICLE_CATEGORIES[0].key;

  const [category, setCategory] = useState<ArticleCategoryKey>(initialCategory);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getNutritionArticle(id)
      .then((a) => {
        setCategory(a.category);
        setTitle(a.title);
        setBody(a.body ?? "");
        setSource(a.source ?? "");
        setPdfUrl(a.pdf_url);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePickPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
  };

  const handleRemovePdf = () => {
    setPdfUrl(null);
    setPdfFile(null);
  };

  const hasPdf = !!(pdfUrl || pdfFile);

  const handleSave = async () => {
    if (!title.trim()) return setError("Başlık zorunludur.");
    if (!body.trim() && !hasPdf) return setError("İçerik metni gir ya da bir PDF yükle.");
    if (!clubId) return setError("Kulüp bilgisi bulunamadı.");
    setSaving(true);
    setError(null);
    try {
      let finalPdfUrl = pdfUrl;
      if (pdfFile) {
        finalPdfUrl = await uploadNutritionArticlePdf(pdfFile, clubId);
      }
      const input: NutritionArticleInput = {
        category,
        title: title.trim(),
        body: body.trim() || null,
        pdf_url: finalPdfUrl,
        source: source.trim() || null,
      };
      if (id) await updateNutritionArticle(id, input);
      else await createNutritionArticle(input);
      navigate("/nutrition/articles");
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">Yükleniyor…</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">{isNew ? "Yeni Yazı" : "Yazıyı Düzenle"}</h1>
        <button onClick={() => navigate("/nutrition/articles")} className="text-sm font-semibold text-muted hover:text-ink">
          ← Listeye Dön
        </button>
      </div>

      <FormField label="Kategori *">
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ArticleCategoryKey)}>
          {ARTICLE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Başlık *">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Antrenman Öncesi Beslenme" autoFocus />
      </FormField>

      <FormField label="PDF (isteğe bağlı)">
        {hasPdf ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-line bg-bg px-3 py-2">
              <span className="truncate text-sm text-ink">📄 {pdfFile?.name ?? pdfUrl?.split("/").pop()}</span>
              <button onClick={handleRemovePdf} className="text-xs font-bold text-coral hover:underline">
                Kaldır
              </button>
            </div>
            {pdfUrl && !pdfFile && (
              <iframe src={pdfUrl} title="PDF önizleme" className="h-96 w-full rounded-lg border border-line" />
            )}
          </div>
        ) : (
          <input type="file" accept="application/pdf" onChange={handlePickPdf} className="text-xs text-muted" />
        )}
      </FormField>

      <FormField label="İçerik (PDF yoksa zorunlu)">
        <textarea className={`${inputClass} h-72`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Yazının tam metni" />
      </FormField>

      <FormField label="Kaynakça">
        <textarea
          className={`${inputClass} h-16`}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Örn. World Health Organization, 2022"
        />
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || !title.trim() || (!body.trim() && !hasPdf)}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}

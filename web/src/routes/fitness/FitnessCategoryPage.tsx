import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { getFitnessCategory, CATEGORY_COLOR_CLASSES } from "../../lib/fitnessExercises";
import {
  listCustomExercisesByCategory,
  deleteCustomExercise,
  type CustomFitnessExercise,
} from "../../lib/api/fitnessExercises";
import ExerciseModal from "./ExerciseModal";

type Row =
  | { kind: "static"; key: string; name: string; bodyweight: boolean; instructions: string }
  | { kind: "custom"; key: string; name: string; bodyweight: boolean; exercise: CustomFitnessExercise };

// Mobildeki FitnessCategoryScreen.tsx'in web karşılığı — sabit katalog
// (salt okunur) + kulübün eklediği özel egzersizleri (tam CRUD) tek
// listede gösterir.
export default function FitnessCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const meta = category ? getFitnessCategory(category) : undefined;

  const [customExercises, setCustomExercises] = useState<CustomFitnessExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<"new" | CustomFitnessExercise | null>(null);

  const load = () => {
    if (!category) return;
    setLoading(true);
    listCustomExercisesByCategory(category)
      .then(setCustomExercises)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [category]);

  const handleDelete = async (ex: CustomFitnessExercise) => {
    if (!confirm(`"${ex.name}" hareketini silmek istediğine emin misin?`)) return;
    try {
      await deleteCustomExercise(ex.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
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

  const cls = CATEGORY_COLOR_CLASSES[meta.color];
  const rows: Row[] = [
    ...meta.exercises.map((e) => ({ kind: "static" as const, key: e.key, name: e.name, bodyweight: !!e.bodyweight, instructions: e.instructions })),
    ...customExercises.map((e) => ({ kind: "custom" as const, key: `custom:${e.id}`, name: e.name, bodyweight: e.bodyweight, exercise: e })),
  ];

  const columns: Column<Row>[] = [
    { key: "name", label: "Hareket", render: (r) => <span className="font-semibold">{r.name}</span> },
    {
      key: "instructions",
      label: "Açıklama",
      render: (r) => (
        <span className="line-clamp-2 text-xs text-muted">
          {r.kind === "static"
            ? r.instructions
            : r.exercise.description || "Kulübün eklediği özel bir hareket — açıklama girilmedi."}
        </span>
      ),
    },
    {
      key: "video",
      label: "Video",
      render: (r) =>
        r.kind === "custom" && r.exercise.video_url ? (
          <a
            href={r.exercise.video_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-teal hover:underline"
          >
            🎥 İzle
          </a>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    { key: "bodyweight", label: "Vücut Ağırlığı", render: (r) => (r.bodyweight ? "Evet" : "—") },
    {
      key: "source",
      label: "Kaynak",
      render: (r) =>
        r.kind === "static" ? (
          <span className="text-muted">Sabit katalog</span>
        ) : (
          <span className="text-violet">Kulübe özel</span>
        ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (r) =>
        r.kind === "custom" ? (
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalState(r.exercise)} className="text-xs font-bold text-teal hover:underline">
              Düzenle
            </button>
            <button onClick={() => handleDelete(r.exercise)} className="text-xs font-bold text-coral hover:underline">
              Sil
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
  ];

  return (
    <div>
      <Link to="/fitness/exercises" className="mb-4 inline-block text-sm font-semibold text-teal hover:underline">
        ‹ Egzersiz Kütüphanesi
      </Link>

      <div className={`mb-6 rounded-2xl border-2 p-5 ${cls.border} ${cls.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 text-3xl">{meta.icon}</div>
            <h1 className={`text-lg font-extrabold ${cls.text}`}>{meta.label}</h1>
          </div>
          <button onClick={() => setModalState("new")} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
            + Hareket Ekle
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.key} loading={loading} emptyText="Bu bölgede hareket yok." />

      {modalState && (
        <ExerciseModal
          category={meta.key}
          exercise={modalState === "new" ? null : modalState}
          onClose={() => setModalState(null)}
          onSaved={() => {
            setModalState(null);
            load();
          }}
        />
      )}
    </div>
  );
}

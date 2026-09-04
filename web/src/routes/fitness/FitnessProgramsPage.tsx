import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { listPrograms, type FitnessProgram } from "../../lib/api/fitnessPrograms";

// Mobildeki FitnessProgramScreen.tsx'in web karşılığı.
export default function FitnessProgramsPage() {
  const [programs, setPrograms] = useState<FitnessProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPrograms()
      .then(setPrograms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<FitnessProgram>[] = [
    {
      key: "name",
      label: "Program",
      render: (p) => (
        <Link to={`/fitness/programs/${p.id}`} className="font-semibold text-ink hover:text-yellow">
          {p.name}
        </Link>
      ),
    },
    {
      key: "group",
      label: "Grup",
      render: (p) =>
        p.groups
          ? `${p.groups.name} · ${p.groups.branch}`
          : p.fitness_groups
          ? `🎯 ${p.fitness_groups.name} · ${p.fitness_groups.branch}`
          : "—",
    },
    { key: "date", label: "Oluşturulma", render: (p) => new Date(p.created_at).toLocaleDateString("tr-TR") },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (p) => (
        <Link to={`/fitness/programs/${p.id}`} className="text-xs font-bold text-teal hover:underline">
          Görüntüle
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Fitness Programları</h1>
        <Link to="/fitness/programs/new" className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Program Ekle
        </Link>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={programs}
        rowKey={(p) => p.id}
        loading={loading}
        emptyText='Henüz program yok. "+ Program Ekle" ile bir gruba özel çalışma programı oluşturup yayınlayabilirsin.'
      />
    </div>
  );
}

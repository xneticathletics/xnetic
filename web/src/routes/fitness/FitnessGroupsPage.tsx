import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { listFitnessGroups, deleteFitnessGroup, type FitnessGroupSummary } from "../../lib/api/fitnessGroups";

// Normal antrenman/yoklama gruplarından (Gruplar) tamamen bağımsız — bir
// branştaki tüm müsabık sporculardan serbestçe seçilmiş, sadece fitness
// programı ataması için kullanılan özel kümeler.
export default function FitnessGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<FitnessGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listFitnessGroups()
      .then(setGroups)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (g: FitnessGroupSummary) => {
    if (!confirm(`"${g.name}" fitness grubunu silmek istediğine emin misin?`)) return;
    try {
      await deleteFitnessGroup(g.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<FitnessGroupSummary>[] = [
    {
      key: "name",
      label: "Fitness Grubu",
      render: (g) => (
        <Link to={`/fitness/groups/${g.id}`} className="font-semibold text-ink hover:text-yellow">
          🎯 {g.name}
        </Link>
      ),
    },
    { key: "branch", label: "Branş", render: (g) => g.branch },
    { key: "count", label: "Sporcu Sayısı", render: (g) => g.member_count },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (g) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => navigate(`/fitness/groups/${g.id}`)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          <button onClick={() => handleDelete(g)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Link to="/fitness" className="mb-4 inline-block text-sm font-semibold text-teal hover:underline">
        ‹ Fitness
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Fitness Grupları</h1>
        <Link to="/fitness/groups/new" className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Fitness Grubu Ekle
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Bir branştaki tüm müsabık sporculardan istediklerini seçip özel bir fitness grubu oluşturabilirsin — normal
        antrenman gruplarından bağımsızdır, sadece fitness programı atamak için kullanılır.
      </p>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={groups}
        rowKey={(g) => g.id}
        loading={loading}
        emptyText='Henüz fitness grubu yok. "+ Fitness Grubu Ekle" ile bir tane oluşturabilirsin.'
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { listCoaches, getAllCoachBranches, deactivateCoach, type Coach, type CoachBranchInfo } from "../../lib/api/coaches";
import { listBranches, type Branch } from "../../lib/api/branches";
import CoachEditModal from "./CoachEditModal";

export default function CoachesListPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesByCoach, setBranchesByCoach] = useState<Record<string, CoachBranchInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Coach | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([listCoaches(), listBranches(), getAllCoachBranches()])
      .then(([c, b, cb]) => {
        setCoaches(c);
        setBranches(b);
        setBranchesByCoach(cb);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDeactivate = async (c: Coach) => {
    if (!confirm(`"${c.name}" adlı antrenörü pasifleştirmek istediğine emin misin? Hesap silinmez, listeden kalkar.`)) return;
    try {
      await deactivateCoach(c.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Pasifleştirilemedi");
    }
  };

  const columns: Column<Coach>[] = [
    { key: "name", label: "Antrenör", render: (c) => <span className="font-semibold">{c.name}</span> },
    { key: "email", label: "E-posta", render: (c) => c.email ?? "—" },
    { key: "phone", label: "Telefon", render: (c) => c.phone ?? "—" },
    {
      key: "branches",
      label: "Branşlar",
      render: (c) => {
        const list = branchesByCoach[c.id] ?? [];
        if (list.length === 0) return <span className="text-muted">—</span>;
        return <span className="text-teal">{list.map((b) => `${b.branch_name} (${b.level})`).join(", ")}</span>;
      },
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(c)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          <button onClick={() => handleDeactivate(c)} className="text-xs font-bold text-coral hover:underline">
            Pasifleştir
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Antrenörler</h1>
        <div className="flex gap-2">
          <Link to="/coaches/assignments" className="rounded-lg border border-teal px-4 py-2 text-sm font-bold text-teal">
            Grup Atamaları
          </Link>
          <Link to="/invite" className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
            + Kullanıcı Davet Et
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable columns={columns} rows={coaches} rowKey={(c) => c.id} loading={loading} emptyText="Henüz antrenör yok." />

      {editing && (
        <CoachEditModal
          coach={editing}
          branches={branches}
          currentBranches={branchesByCoach[editing.id] ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

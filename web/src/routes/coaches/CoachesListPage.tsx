import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import {
  listCoaches,
  getAllCoachBranches,
  deactivateCoach,
  reactivateCoach,
  deleteCoachPermanently,
  type Coach,
  type CoachBranchInfo,
} from "../../lib/api/coaches";
import { listBranches, type Branch } from "../../lib/api/branches";
import { getUserIdsForRoleBucket } from "../../lib/api/notificationRolePrefs";
import CoachEditModal from "./CoachEditModal";
import CoachAddModal from "./CoachAddModal";

export default function CoachesListPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesByCoach, setBranchesByCoach] = useState<Record<string, CoachBranchInfo[]>>({});
  const [coordinatorIds, setCoordinatorIds] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Coach | null>(null);
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      listCoaches({ includeInactive: showInactive }),
      listBranches(),
      getAllCoachBranches(),
      getUserIdsForRoleBucket("coordinator"),
    ])
      .then(([c, b, cb, coordinators]) => {
        setCoaches(c);
        setBranches(b);
        setBranchesByCoach(cb);
        setCoordinatorIds(new Set(coordinators));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [showInactive]);

  const handleDeactivate = async (c: Coach) => {
    if (!confirm(`"${c.name}" adlı antrenörü pasifleştirmek istediğine emin misin? Hesap silinmez, aktif listeden kalkar.`)) return;
    try {
      await deactivateCoach(c.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Pasifleştirilemedi");
    }
  };

  const handleReactivate = async (c: Coach) => {
    try {
      await reactivateCoach(c.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Aktifleştirilemedi");
    }
  };

  const handleDeletePermanently = async (c: Coach) => {
    if (
      !confirm(
        `"${c.name}" adlı antrenörü KALICI olarak silmek istediğine emin misin? Bu işlem geri alınamaz — branş/grup atamaları da kaldırılır.`
      )
    )
      return;
    try {
      await deleteCoachPermanently(c.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi — bu antrenöre bağlı kayıtlar (ör. geçmiş antrenmanlar) olabilir.");
    }
  };

  const columns: Column<Coach>[] = [
    {
      key: "name",
      label: "Antrenör",
      render: (c) => (
        <span className="inline-flex items-center gap-1.5">
          <Link to={`/coaches/${c.id}`} className="font-semibold text-ink hover:text-yellow hover:underline">
            {c.name}
          </Link>
          {coordinatorIds.has(c.id) && (
            <span className="rounded-full bg-violet/20 px-2 py-0.5 text-[10px] font-bold text-violet">🏷️ Koordinatör</span>
          )}
        </span>
      ),
    },
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
      key: "status",
      label: "Durum",
      render: (c) => (
        <span className={c.is_active ? "text-teal" : "text-muted"}>{c.is_active ? "Aktif" : "Pasif"}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Link to={`/coaches/${c.id}`} className="text-xs font-bold text-teal hover:underline">
            Detay
          </Link>
          <button onClick={() => setEditing(c)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          {c.is_active ? (
            <button onClick={() => handleDeactivate(c)} className="text-xs font-bold text-coral hover:underline">
              Pasifleştir
            </button>
          ) : (
            <button onClick={() => handleReactivate(c)} className="text-xs font-bold text-teal hover:underline">
              Aktifleştir
            </button>
          )}
          <button onClick={() => handleDeletePermanently(c)} className="text-xs font-bold text-coral hover:underline">
            Komple Sil
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
          <button onClick={() => setAdding(true)} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
            + Antrenör Ekle
          </button>
        </div>
      </div>

      <label className="mb-4 flex w-fit items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        Pasif antrenörleri de göster
      </label>

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

      {adding && (
        <CoachAddModal
          onClose={() => setAdding(false)}
          onCreated={() => {
            load();
          }}
        />
      )}
    </div>
  );
}

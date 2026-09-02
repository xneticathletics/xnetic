import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { inputClass } from "../../components/FormField";
import { listAllAthletes, deleteAthlete, type Athlete, type AthleteType } from "../../lib/api/athletes";
import { listBranches, type Branch } from "../../lib/api/branches";
import AthleteEditModal from "./AthleteEditModal";

export default function AthletesListPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<AthleteType | "">("");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([listAllAthletes(), listBranches()])
      .then(([a, b]) => {
        setAthletes(a);
        setBranches(b);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = athletes;
    if (q) list = list.filter((a) => a.full_name.toLowerCase().includes(q));
    if (branchFilter) list = list.filter((a) => a.groups?.branch === branchFilter);
    if (typeFilter) list = list.filter((a) => a.athlete_type === typeFilter);
    return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
  }, [athletes, query, branchFilter, typeFilter]);

  const handleDelete = async (a: Athlete) => {
    if (!confirm(`"${a.full_name}" silinsin mi? Bağlı tüm yoklama/aidat/sakatlık kayıtları da silinir.`)) return;
    try {
      await deleteAthlete(a.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<Athlete>[] = [
    {
      key: "name",
      label: "Sporcu",
      render: (a) => (
        <Link to={`/athletes/${a.id}`} className="flex items-center gap-3 hover:underline">
          {a.photo_url ? (
            <img src={a.photo_url} className="h-8 w-8 rounded-full object-cover" alt="" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-xs font-bold">
              {a.full_name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-ink">{a.full_name}</span>
        </Link>
      ),
    },
    { key: "group", label: "Grup", render: (a) => a.groups?.name ?? "Grup atanmadı" },
    {
      key: "type",
      label: "Tip",
      render: (a) => (a.athlete_type === "musabik" ? "🏆 Müsabık" : "Spor Okulu"),
    },
    {
      key: "status",
      label: "Durum",
      render: (a) => (
        <span className={a.status === "active" ? "text-teal" : "text-muted"}>
          {a.status === "active" ? "Aktif" : "Pasif"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (a) => (
        <div className="flex justify-end gap-2">
          <Link to={`/athletes/${a.id}`} className="text-xs font-bold text-teal hover:underline">
            Profil
          </Link>
          <button onClick={() => setEditingId(a.id)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          <button onClick={() => handleDelete(a)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Sporcular</h1>
          <p className="text-sm text-muted">{filtered.length} sporcu</p>
        </div>
        <button onClick={() => setEditingId("new")} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Sporcu Ekle
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={`${inputClass} max-w-sm`}
          placeholder="Sporcu ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className={`${inputClass} max-w-48`} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">Tüm Branşlar</option>
          {branches.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          className={`${inputClass} max-w-40`}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AthleteType | "")}
        >
          <option value="">Tüm Tipler</option>
          <option value="spor_okulu">Spor Okulu</option>
          <option value="musabik">🏆 Müsabık</option>
        </select>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(a) => a.id}
        loading={loading}
        emptyText="Eşleşen sporcu bulunamadı."
      />

      {editingId && (
        <AthleteEditModal
          athleteId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            load();
          }}
        />
      )}
    </div>
  );
}

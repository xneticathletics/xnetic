import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  type Branch,
} from "../../lib/api/branches";

export default function BranchesListPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Branch | "new" | null>(null);
  const [name, setName] = useState("");
  const [isIndividual, setIsIndividual] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listBranches()
      .then(setBranches)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setName("");
    setIsIndividual(false);
    setEditing("new");
  };
  const openEdit = (b: Branch) => {
    setName(b.name);
    setIsIndividual(b.is_individual);
    setEditing(b);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing === "new") await createBranch(name.trim(), isIndividual);
      else if (editing) await updateBranch(editing.id, name.trim(), isIndividual);
      setEditing(null);
      load();
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: Branch) => {
    if (!confirm(`"${b.name}" branşını silmek istediğine emin misin?`)) return;
    try {
      await deleteBranch(b.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<Branch>[] = [
    {
      key: "name",
      label: "Branş",
      render: (b) => (
        <span className="font-semibold">
          {b.name}
          {b.is_individual && <span className="ml-2 text-xs font-semibold text-teal">Bireysel</span>}
        </span>
      ),
    },
    { key: "coordinator", label: "Koordinatör", render: (b) => b.coordinator?.name ?? "—" },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (b) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEdit(b)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          <button onClick={() => handleDelete(b)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Branşlar</h1>
        <button onClick={openNew} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Branş Ekle
        </button>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={branches}
        rowKey={(b) => b.id}
        loading={loading}
        emptyText="Henüz branş eklenmemiş."
      />

      {editing && (
        <Modal title={editing === "new" ? "Yeni Branş" : "Branşı Düzenle"} onClose={() => setEditing(null)}>
          <FormField label="Branş Adı">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Basketbol"
              autoFocus
            />
          </FormField>
          <label className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted">
            <input
              type="checkbox"
              checked={isIndividual}
              onChange={(e) => setIsIndividual(e.target.checked)}
            />
            Bireysel branş (Yüzme, Atletizm vb. — skor yerine sonuç açıklaması girilir)
          </label>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="mt-2 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </Modal>
      )}
    </div>
  );
}

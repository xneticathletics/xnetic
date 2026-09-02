import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  type Group,
  type GroupInput,
} from "../../lib/api/groups";
import { listBranches, type Branch } from "../../lib/api/branches";
import { listVenues, type Venue } from "../../lib/api/venues";

const emptyForm: GroupInput = { name: "", branch: "", venue_id: null };

export default function GroupsListPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<GroupInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([listGroups(), listBranches(), listVenues()])
      .then(([g, b, v]) => {
        setGroups(g);
        setBranches(b);
        setVenues(v);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId("new");
  };
  const openEdit = (g: Group) => {
    setForm({ name: g.name, branch: g.branch, venue_id: g.venue_id });
    setEditingId(g.id);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.branch.trim()) return;
    setSaving(true);
    try {
      if (editingId === "new") await createGroup(form);
      else if (editingId) await updateGroup(editingId, form);
      setEditingId(null);
      load();
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (g: Group) => {
    if (!confirm(`"${g.name}" grubunu silersen bağlı TÜM antrenman kayıtları da silinir. Devam edilsin mi?`)) return;
    try {
      await deleteGroup(g.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<Group>[] = [
    { key: "name", label: "Grup", render: (g) => <span className="font-semibold">{g.name}</span> },
    { key: "branch", label: "Branş", render: (g) => g.branch },
    { key: "venue", label: "Ana Salon", render: (g) => g.venues?.name ?? "—" },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (g) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEdit(g)} className="text-xs font-bold text-teal hover:underline">
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Gruplar</h1>
        <button onClick={openNew} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Grup Ekle
        </button>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={groups}
        rowKey={(g) => g.id}
        loading={loading}
        emptyText="Henüz grup eklenmemiş."
      />

      {editingId && (
        <Modal title={editingId === "new" ? "Yeni Grup" : "Grubu Düzenle"} onClose={() => setEditingId(null)}>
          <FormField label="Grup Adı *">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Örn. U14 Kız Grubu"
              autoFocus
            />
          </FormField>
          <FormField label="Branş *">
            <select
              className={inputClass}
              value={form.branch}
              onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
            >
              <option value="">Branş seç</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Ana Salon (isteğe bağlı)">
            <select
              className={inputClass}
              value={form.venue_id ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, venue_id: e.target.value || null }))}
            >
              <option value="">Salon seç</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </FormField>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.branch.trim()}
            className="mt-2 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </Modal>
      )}
    </div>
  );
}

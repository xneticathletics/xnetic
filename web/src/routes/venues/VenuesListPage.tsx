import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  listVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  type Venue,
  type VenueInput,
} from "../../lib/api/venues";
import { listBranches, type Branch } from "../../lib/api/branches";

const emptyForm: VenueInput = { name: "", address: null, capacity: null, branch_ids: [] };

export default function VenuesListPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<VenueInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([listVenues(), listBranches()])
      .then(([v, b]) => {
        setVenues(v);
        setBranches(b);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const branchNameById = Object.fromEntries(branches.map((b) => [b.id, b.name]));

  const openNew = () => {
    setForm(emptyForm);
    setEditingId("new");
  };
  const openEdit = (v: Venue) => {
    setForm({ name: v.name, address: v.address, capacity: v.capacity, branch_ids: v.branch_ids });
    setEditingId(v.id);
  };

  const toggleBranch = (id: string) => {
    setForm((f) => ({
      ...f,
      branch_ids: f.branch_ids.includes(id)
        ? f.branch_ids.filter((x) => x !== id)
        : [...f.branch_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId === "new") await createVenue(form);
      else if (editingId) await updateVenue(editingId, form);
      setEditingId(null);
      load();
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Venue) => {
    if (!confirm(`"${v.name}" salonunu silmek istediğine emin misin?`)) return;
    try {
      await deleteVenue(v.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const columns: Column<Venue>[] = [
    { key: "name", label: "Salon", render: (v) => <span className="font-semibold">{v.name}</span> },
    { key: "address", label: "Adres", render: (v) => v.address ?? "—" },
    { key: "capacity", label: "Kapasite", render: (v) => (v.capacity ? `${v.capacity} kişilik` : "—") },
    {
      key: "branches",
      label: "Branşlar",
      render: (v) =>
        v.branch_ids.length > 0 ? (
          <span className="text-teal">{v.branch_ids.map((id) => branchNameById[id]).filter(Boolean).join(", ")}</span>
        ) : (
          <span className="text-muted">Branş atanmadı</span>
        ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (v) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEdit(v)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          <button onClick={() => handleDelete(v)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Salonlar</h1>
        <button onClick={openNew} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Salon Ekle
        </button>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={venues}
        rowKey={(v) => v.id}
        loading={loading}
        emptyText="Henüz salon eklenmemiş."
      />

      {editingId && (
        <Modal title={editingId === "new" ? "Yeni Salon" : "Salonu Düzenle"} onClose={() => setEditingId(null)}>
          <FormField label="Salon Adı *">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Örn. Ana Salon"
              autoFocus
            />
          </FormField>
          <FormField label="Adres">
            <input
              className={inputClass}
              value={form.address ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value || null }))}
            />
          </FormField>
          <FormField label="Kapasite">
            <input
              type="number"
              className={inputClass}
              value={form.capacity ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value ? Number(e.target.value) : null }))}
            />
          </FormField>
          <FormField label="Branşlar">
            {branches.length === 0 ? (
              <p className="text-xs text-muted">Henüz branş eklenmemiş.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {branches.map((b) => {
                  const active = form.branch_ids.includes(b.id);
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => toggleBranch(b.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        active ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            )}
          </FormField>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="mt-2 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </Modal>
      )}
    </div>
  );
}

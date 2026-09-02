import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  listAllAthletes,
  createAthlete,
  updateAthlete,
  deleteAthlete,
  uploadAthletePhoto,
  type Athlete,
  type AthleteInput,
} from "../../lib/api/athletes";
import { listGroups, type Group } from "../../lib/api/groups";

const emptyForm: AthleteInput = {
  full_name: "",
  birth_date: null,
  group_id: null,
  blood_type: null,
  height_cm: null,
  weight_kg: null,
  license_no: null,
  school: null,
  jersey_size: null,
  status: "active",
  athlete_type: "spor_okulu",
  photo_url: null,
  parent_name: null,
  parent_phone: null,
};

export default function AthletesListPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AthleteInput>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([listAllAthletes(), listGroups()])
      .then(([a, g]) => {
        setAthletes(a);
        setGroups(g);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? athletes.filter((a) => a.full_name.toLowerCase().includes(q)) : athletes;
    return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
  }, [athletes, query]);

  const openNew = () => {
    setForm(emptyForm);
    setPhotoFile(null);
    setEditingId("new");
  };
  const openEdit = (a: Athlete) => {
    setForm({
      full_name: a.full_name,
      birth_date: a.birth_date,
      group_id: a.group_id,
      blood_type: a.blood_type,
      height_cm: a.height_cm,
      weight_kg: a.weight_kg,
      license_no: a.license_no,
      school: a.school,
      jersey_size: a.jersey_size,
      status: a.status,
      athlete_type: a.athlete_type,
      photo_url: a.photo_url,
      parent_name: a.parent_name,
      parent_phone: a.parent_phone,
    });
    setPhotoFile(null);
    setEditingId(a.id);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      let saved;
      if (editingId === "new") saved = await createAthlete(form);
      else if (editingId) saved = await updateAthlete(editingId, form);

      const athleteId = editingId === "new" ? saved?.id : editingId;
      if (photoFile && athleteId) {
        const url = await uploadAthletePhoto(athleteId, photoFile);
        await updateAthlete(athleteId, { photo_url: url });
      }

      setEditingId(null);
      load();
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex items-center gap-3">
          {a.photo_url ? (
            <img src={a.photo_url} className="h-8 w-8 rounded-full object-cover" alt="" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-xs font-bold">
              {a.full_name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="font-semibold">{a.full_name}</span>
        </div>
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
          <button onClick={() => openEdit(a)} className="text-xs font-bold text-teal hover:underline">
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
        <button onClick={openNew} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          + Sporcu Ekle
        </button>
      </div>

      <input
        className={`${inputClass} mb-4 max-w-sm`}
        placeholder="Sporcu ara…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(a) => a.id}
        loading={loading}
        emptyText="Eşleşen sporcu bulunamadı."
      />

      {editingId && (
        <Modal title={editingId === "new" ? "Yeni Sporcu" : "Sporcuyu Düzenle"} onClose={() => setEditingId(null)}>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <FormField label="Ad Soyad *">
              <input
                className={inputClass}
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                autoFocus
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Doğum Tarihi">
                <input
                  type="date"
                  className={inputClass}
                  value={form.birth_date ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value || null }))}
                />
              </FormField>
              <FormField label="Grup">
                <select
                  className={inputClass}
                  value={form.group_id ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, group_id: e.target.value || null }))}
                >
                  <option value="">Grup atanmadı</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sporcu Tipi">
                <select
                  className={inputClass}
                  value={form.athlete_type}
                  onChange={(e) => setForm((f) => ({ ...f, athlete_type: e.target.value as AthleteInput["athlete_type"] }))}
                >
                  <option value="spor_okulu">Spor Okulu</option>
                  <option value="musabik">🏆 Müsabık</option>
                </select>
              </FormField>
              <FormField label="Durum">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AthleteInput["status"] }))}
                >
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Boy (cm)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.height_cm ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value ? Number(e.target.value) : null }))}
                />
              </FormField>
              <FormField label="Kilo (kg)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.weight_kg ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value ? Number(e.target.value) : null }))}
                />
              </FormField>
              <FormField label="Kan Grubu">
                <input
                  className={inputClass}
                  value={form.blood_type ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, blood_type: e.target.value || null }))}
                  placeholder="Örn. A Rh+"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Lisans No">
                <input
                  className={inputClass}
                  value={form.license_no ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, license_no: e.target.value || null }))}
                />
              </FormField>
              <FormField label="Forma Bedeni">
                <input
                  className={inputClass}
                  value={form.jersey_size ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, jersey_size: e.target.value || null }))}
                />
              </FormField>
            </div>

            <FormField label="Okul">
              <input
                className={inputClass}
                value={form.school ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, school: e.target.value || null }))}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Veli Adı">
                <input
                  className={inputClass}
                  value={form.parent_name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value || null }))}
                />
              </FormField>
              <FormField label="Veli Telefonu">
                <input
                  className={inputClass}
                  value={form.parent_phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value || null }))}
                />
              </FormField>
            </div>

            <FormField label="Fotoğraf">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-muted"
              />
            </FormField>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.full_name.trim()}
            className="mt-3 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </Modal>
      )}
    </div>
  );
}

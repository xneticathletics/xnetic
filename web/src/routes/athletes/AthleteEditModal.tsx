import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  getAthlete,
  createAthlete,
  updateAthlete,
  uploadAthletePhoto,
  getLinkedUser,
  getLinkedParentUser,
  listUnlinkedAthleteUsers,
  listParentUsers,
  linkAthleteAccount,
  linkParentAccount,
  getAthleteExtraGroups,
  setAthleteExtraGroups,
  type AthleteInput,
  type LinkedUser,
  type AthleteGroupInfo,
} from "../../lib/api/athletes";
import { listGroups, type Group } from "../../lib/api/groups";
import MembershipFreezeSection from "./MembershipFreezeSection";

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
  jersey_number: null,
  status: "active",
  athlete_type: "spor_okulu",
  photo_url: null,
  parent_name: null,
  parent_phone: null,
  health_info: null,
  allergies: null,
  medications: null,
};

// Sporcular listesinde "+ Sporcu Ekle"/"Düzenle" ve Sporcu Profili
// sayfasındaki "Düzenle" butonu tarafından ortak kullanılır — athleteId
// verilince kendi verisini kendisi yükler (mobildeki AthleteFormScreen'in
// web karşılığı).
export default function AthleteEditModal({
  athleteId,
  onClose,
  onSaved,
}: {
  athleteId: string | "new";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState<AthleteInput>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [athleteLinkedUser, setAthleteLinkedUser] = useState<LinkedUser | null>(null);
  const [parentLinkedUser, setParentLinkedUser] = useState<LinkedUser | null>(null);
  const [unlinkedAthleteUsers, setUnlinkedAthleteUsers] = useState<LinkedUser[]>([]);
  const [parentUsers, setParentUsers] = useState<LinkedUser[]>([]);
  const [extraGroups, setExtraGroups] = useState<AthleteGroupInfo[]>([]);
  const [extraGroupSaving, setExtraGroupSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    const isNew = athleteId === "new";
    Promise.all([
      listGroups(),
      isNew ? Promise.resolve(null) : getAthlete(athleteId),
      listUnlinkedAthleteUsers(),
      listParentUsers(),
      isNew ? Promise.resolve(null) : getLinkedUser(athleteId),
      isNew ? Promise.resolve(null) : getLinkedParentUser(athleteId),
      isNew ? Promise.resolve([]) : getAthleteExtraGroups(athleteId),
    ])
      .then(([g, a, au, pu, linkedAthlete, linkedParent, extra]) => {
        setGroups(g);
        setUnlinkedAthleteUsers(au);
        setParentUsers(pu);
        setAthleteLinkedUser(linkedAthlete);
        setParentLinkedUser(linkedParent);
        setExtraGroups(extra);
        if (a) {
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
            jersey_number: a.jersey_number,
            status: a.status,
            athlete_type: a.athlete_type,
            photo_url: a.photo_url,
            parent_name: a.parent_name,
            parent_phone: a.parent_phone,
            health_info: a.health_info,
            allergies: a.allergies,
            medications: a.medications,
          });
        } else {
          setForm(emptyForm);
        }
        setPhotoFile(null);
      })
      .finally(() => setLoading(false));
  }, [athleteId]);

  const toggleExtraGroup = async (g: Group) => {
    if (athleteId === "new") return;
    const exists = extraGroups.some((eg) => eg.group_id === g.id);
    const next = exists
      ? extraGroups.filter((eg) => eg.group_id !== g.id)
      : [...extraGroups, { group_id: g.id, group_name: g.name, branch: g.branch }];
    setExtraGroupSaving(true);
    try {
      await setAthleteExtraGroups(athleteId, next.map((eg) => eg.group_id));
      setExtraGroups(next);
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setExtraGroupSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) return;
    if (!form.group_id) {
      alert("Bir grup seçmelisin.");
      return;
    }
    if (!form.parent_name?.trim()) {
      alert("Veli Adı Soyadı zorunludur.");
      return;
    }
    if (!form.parent_phone?.trim()) {
      alert("Veli Telefon zorunludur.");
      return;
    }
    setSaving(true);
    try {
      let saved;
      if (athleteId === "new") saved = await createAthlete(form);
      else saved = await updateAthlete(athleteId, form);

      const savedId = athleteId === "new" ? saved?.id : athleteId;
      if (photoFile && savedId) {
        const url = await uploadAthletePhoto(savedId, photoFile);
        await updateAthlete(savedId, { photo_url: url });
      }
      if (savedId) {
        await linkAthleteAccount(savedId, athleteLinkedUser?.id ?? null);
        await linkParentAccount(savedId, parentLinkedUser?.id ?? null);
      }

      onSaved();
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={athleteId === "new" ? "Yeni Sporcu" : "Sporcuyu Düzenle"} onClose={onClose}>
      {loading ? (
        <p className="py-6 text-center text-sm text-muted">Yükleniyor…</p>
      ) : (
        <>
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

            <div className="grid grid-cols-3 gap-3">
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
                  placeholder="Örn. S, M, L"
                />
              </FormField>
              <FormField label="Forma Numarası">
                <input
                  className={inputClass}
                  value={form.jersey_number ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, jersey_number: e.target.value || null }))}
                  placeholder="Örn. 10"
                />
              </FormField>
            </div>

            <FormField label="Alerjiler">
              <textarea
                className={inputClass}
                value={form.allergies ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value || null }))}
                placeholder="Örn. Fıstık, polen — yoksa boş bırak"
                rows={2}
              />
            </FormField>

            <FormField label="Kullandığı İlaçlar">
              <textarea
                className={inputClass}
                value={form.medications ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, medications: e.target.value || null }))}
                placeholder="Düzenli kullandığı bir ilaç varsa yaz"
                rows={2}
              />
            </FormField>

            <FormField label="Sağlık Notu">
              <textarea
                className={inputClass}
                value={form.health_info ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, health_info: e.target.value || null }))}
                placeholder="Kronik rahatsızlık, geçmiş ameliyat vb. antrenörün bilmesi gereken bilgi"
                rows={2}
              />
            </FormField>

            <FormField label="Okul">
              <input
                className={inputClass}
                value={form.school ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, school: e.target.value || null }))}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Veli Adı Soyadı *">
                <input
                  className={inputClass}
                  value={form.parent_name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value || null }))}
                />
              </FormField>
              <FormField label="Veli Telefonu *">
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

            <div className="mt-2 border-t border-line pt-3">
              <p className="mb-2 text-xs font-bold text-ink">Sporcu Giriş Hesabı</p>
              {athleteLinkedUser ? (
                <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2">
                  <span className="text-sm font-semibold text-teal">{athleteLinkedUser.name}</span>
                  <button type="button" onClick={() => setAthleteLinkedUser(null)} className="text-xs font-bold text-coral">
                    Kaldır
                  </button>
                </div>
              ) : (
                <select
                  className={inputClass}
                  value=""
                  onChange={(e) => {
                    const u = unlinkedAthleteUsers.find((x) => x.id === e.target.value);
                    if (u) setAthleteLinkedUser(u);
                  }}
                >
                  <option value="">Bağlı hesap yok — seç</option>
                  {unlinkedAthleteUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-2 text-xs font-bold text-ink">Veli Giriş Hesabı</p>
              {parentLinkedUser ? (
                <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2">
                  <span className="text-sm font-semibold text-teal">{parentLinkedUser.name}</span>
                  <button type="button" onClick={() => setParentLinkedUser(null)} className="text-xs font-bold text-coral">
                    Kaldır
                  </button>
                </div>
              ) : (
                <select
                  className={inputClass}
                  value=""
                  onChange={(e) => {
                    const u = parentUsers.find((x) => x.id === e.target.value);
                    if (u) setParentLinkedUser(u);
                  }}
                >
                  <option value="">Bağlı hesap yok — seç</option>
                  {parentUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {athleteId !== "new" && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="mb-1 text-xs font-bold text-ink">Ek Branşlar / Gruplar</p>
                <p className="mb-2 text-xs text-muted">
                  Yukarıdaki "Grup" ana (birincil) kaydı — bu sporcu ayrıca başka branş/gruplara da kayıtlı olabilir.
                </p>
                <div className="flex flex-wrap gap-2">
                  {groups
                    .filter((g) => g.id !== form.group_id)
                    .map((g) => {
                      const active = extraGroups.some((eg) => eg.group_id === g.id);
                      return (
                        <button
                          type="button"
                          key={g.id}
                          disabled={extraGroupSaving}
                          onClick={() => toggleExtraGroup(g)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                            active ? "border-teal bg-teal text-bg" : "border-line text-muted"
                          }`}
                        >
                          {g.name} ({g.branch})
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {athleteId !== "new" && <MembershipFreezeSection athleteId={athleteId} />}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.full_name.trim()}
            className="mt-3 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </>
      )}
    </Modal>
  );
}

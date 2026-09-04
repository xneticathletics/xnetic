import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormField, { inputClass } from "../../components/FormField";
import { listBranches, type Branch } from "../../lib/api/branches";
import {
  listMusabikAthletesForBranch,
  getFitnessGroup,
  createFitnessGroup,
  updateFitnessGroup,
  type MusabikAthlete,
} from "../../lib/api/fitnessGroups";
import { getCurrentAppUserId } from "../../lib/api/currentUser";

// Yeni/var olan bir fitness grubu — branş seçilince o branştaki TÜM müsabık
// (spor okulu değil) ve aktif sporcular listelenir, içlerinden istenenler
// işaretlenip kaydedilir. Düzenlemede branş değiştirilemez (üyeler zaten o
// branşa göre seçilmiş) — sadece ad ve üye seçimi güncellenebilir.
export default function FitnessGroupFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState("");
  const [name, setName] = useState("");
  const [athletes, setAthletes] = useState<MusabikAthlete[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBranches()
      .then(setBranches)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    getFitnessGroup(id!)
      .then((g) => {
        setName(g.name);
        setBranch(g.branch);
        setSelectedIds(new Set(g.athleteIds));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  useEffect(() => {
    if (!branch) {
      setAthletes([]);
      return;
    }
    setAthletesLoading(true);
    listMusabikAthletesForBranch(branch)
      .then(setAthletes)
      .catch((e) => setError(e.message))
      .finally(() => setAthletesLoading(false));
  }, [branch]);

  const toggleAthlete = (athleteId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(athleteId)) next.delete(athleteId);
      else next.add(athleteId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return setError("Grup adı girmelisin.");
    if (!branch) return setError("Bir branş seçmelisin.");
    if (selectedIds.size === 0) return setError("En az bir sporcu seçmelisin.");

    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const myUserId = await getCurrentAppUserId();
        await createFitnessGroup({ name: name.trim(), branch, athleteIds: Array.from(selectedIds), created_by: myUserId });
      } else {
        await updateFitnessGroup(id!, { name: name.trim(), athleteIds: Array.from(selectedIds) });
      }
      navigate("/fitness/groups");
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      <Link to="/fitness/groups" className="mb-4 inline-block text-sm font-semibold text-teal hover:underline">
        ‹ Fitness Grupları
      </Link>
      <h1 className="mb-6 text-xl font-bold text-ink">{isNew ? "Yeni Fitness Grubu" : "Fitness Grubunu Düzenle"}</h1>

      <div className="max-w-xl">
        <FormField label="Grup Adı *">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. İl Takımı Adayları" />
        </FormField>

        <FormField label="Branş *">
          <select className={inputClass} value={branch} onChange={(e) => setBranch(e.target.value)} disabled={!isNew}>
            <option value="">Branş seç</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </FormField>
        {!isNew && <p className="-mt-3 mb-3 text-xs italic text-muted">Branş oluşturulduktan sonra değiştirilemez.</p>}

        {branch && (
          <FormField label={`Müsabık Sporcular (${selectedIds.size} seçili)`}>
            {athletesLoading && <p className="text-sm text-muted">Yükleniyor…</p>}
            {!athletesLoading && athletes.length === 0 && (
              <p className="text-sm text-muted">Bu branşta müsabık tipinde aktif sporcu bulunamadı.</p>
            )}
            <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg border border-line bg-bg p-3">
              {athletes.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface">
                  <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleAthlete(a.id)} />
                  <span className="text-sm text-ink">{a.full_name}</span>
                </label>
              ))}
            </div>
          </FormField>
        )}

        {error && <p className="mb-3 mt-3 text-sm font-semibold text-coral">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import { inputClass } from "../../components/FormField";
import {
  getTestGroup,
  addAthletesToGroup,
  removeAthleteFromGroup,
  type TestGroup,
  type TestGroupAthlete,
} from "../../lib/api/performanceTestGroups";
import { createMeasurements, listLatestMeasurements } from "../../lib/api/performanceMeasurements";
import { listAllAthletes, type Athlete } from "../../lib/api/athletes";
import type { CustomPerformanceTest } from "../../lib/api/customPerformanceTests";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const cellKey = (athleteId: string, testId: string) => `${athleteId}|${testId}`;

// Mobildeki TestGroupDetailScreen'in web karşılığı. Mobilde dar ekran
// yüzünden "sporcuya dokun → altında giriş açılır" akışı var; web'de
// sporcu satır, test sütun olacak şekilde tek tabloda hepsi birden
// görünüyor. Kaydetme davranışı aynı: girilen tüm hücreler tek seferde,
// bugünün tarihiyle kaydediliyor.
export default function TestGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<TestGroup | null>(null);
  const [athletes, setAthletes] = useState<TestGroupAthlete[]>([]);
  const [tests, setTests] = useState<CustomPerformanceTest[]>([]);
  const [latest, setLatest] = useState<Map<string, { value: number; measured_at: string }>>(new Map());
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      setError(null);
      const data = await getTestGroup(groupId);
      setGroup(data.group);
      setAthletes(data.athletes);
      setTests(data.tests);
      try {
        setLatest(
          await listLatestMeasurements(
            data.athletes.map((a) => a.id),
            data.tests.map((t) => `custom:${t.id}`)
          )
        );
      } catch {
        // "son ölçüm" ipucu kritik değil — sessizce geçiliyor
      }
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const enteredCount = useMemo(() => Object.values(values).filter((v) => v.trim() !== "").length, [values]);

  const openPicker = async () => {
    setPickerOpen(true);
    setPickerSelection(new Set());
    setPickerQuery("");
    if (allAthletes.length === 0) {
      try {
        setAllAthletes(await listAllAthletes());
      } catch (e: any) {
        alert(e.message ?? "Sporcular yüklenemedi");
      }
    }
  };

  const handleAddAthletes = async () => {
    if (!groupId || pickerSelection.size === 0) return;
    try {
      await addAthletesToGroup(groupId, Array.from(pickerSelection));
      setPickerOpen(false);
      load();
    } catch (e: any) {
      alert(e.message ?? "Eklenemedi");
    }
  };

  const handleRemoveAthlete = async (athlete: TestGroupAthlete) => {
    if (!groupId) return;
    if (!confirm(`"${athlete.full_name}" bu test grubundan çıkarılacak. Emin misin?`)) return;
    try {
      await removeAthleteFromGroup(groupId, athlete.id);
      load();
    } catch (e: any) {
      alert(e.message ?? "Çıkarılamadı");
    }
  };

  const handleSave = async () => {
    if (saving || enteredCount === 0) return;
    const rows: { athlete_id: string; test_key: string; value: number; measured_at: string; notes: null }[] = [];
    for (const athlete of athletes) {
      for (const test of tests) {
        const raw = (values[cellKey(athlete.id, test.id)] ?? "").trim();
        if (!raw) continue;
        const num = Number(raw.replace(",", "."));
        if (!Number.isFinite(num)) {
          alert(`${athlete.full_name} — ${test.name} için geçerli bir sayı gir.`);
          return;
        }
        rows.push({
          athlete_id: athlete.id,
          test_key: `custom:${test.id}`,
          value: num,
          measured_at: todayKey(),
          notes: null,
        });
      }
    }
    setSaving(true);
    try {
      await createMeasurements(rows);
      setValues({});
      await load();
      alert(`${rows.length} ölçüm kaydedildi.`);
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const pickerCandidates = useMemo(() => {
    const already = new Set(athletes.map((a) => a.id));
    const q = pickerQuery.trim().toLocaleLowerCase("tr");
    return allAthletes
      .filter((a) => !already.has(a.id))
      .filter((a) => !q || a.full_name.toLocaleLowerCase("tr").includes(q));
  }, [allAthletes, athletes, pickerQuery]);

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;
  if (!group) return <p className="text-sm font-semibold text-coral">{error ?? "Test grubu bulunamadı."}</p>;

  return (
    <div>
      <Link to="/performance/groups" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Test Grupları
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">{group.name}</h1>
          <p className="text-sm text-muted">
            {athletes.length} sporcu · {tests.length} test · {formatDate(group.created_at)}
          </p>
        </div>
        <button onClick={openPicker} className="rounded-lg border border-yellow px-4 py-2 text-sm font-bold text-yellow">
          + Sporcu Ekle
        </button>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <p className="mb-3 text-xs text-muted">
        Hücrelere ölçümleri yaz ve "Kaydet"e bas — hepsi bugünün tarihiyle kaydedilir. Gri değer, o testteki son ölçüm.
      </p>

      {athletes.length === 0 || tests.length === 0 ? (
        <p className="text-sm text-muted">
          {athletes.length === 0 ? "Bu test grubunda henüz sporcu yok." : "Bu test grubunda test yok."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 bg-surface px-4 py-3 text-left text-xs font-bold text-muted">Sporcu</th>
                {tests.map((t) => (
                  <th key={t.id} className="px-3 py-3 text-left text-xs font-bold text-muted">
                    {t.name}
                    <span className="ml-1 font-normal">({t.unit})</span>
                  </th>
                ))}
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {athletes.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="sticky left-0 bg-surface px-4 py-2 font-semibold text-ink">
                    {a.full_name}
                    {a.groups?.name && <div className="text-xs font-normal text-muted">{a.groups.name}</div>}
                  </td>
                  {tests.map((t) => {
                    const key = cellKey(a.id, t.id);
                    const last = latest.get(`${a.id}|custom:${t.id}`);
                    return (
                      <td key={t.id} className="px-3 py-2">
                        <input
                          className="w-24 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-yellow"
                          value={values[key] ?? ""}
                          onChange={(e) =>
                            setValues((prev) => ({ ...prev, [key]: e.target.value.replace(/[^0-9.,]/g, "") }))
                          }
                          inputMode="decimal"
                          placeholder={last ? String(last.value) : "—"}
                          aria-label={`${a.full_name} ${t.name}`}
                        />
                        {last && <div className="mt-0.5 text-[10px] text-muted">son: {formatDate(last.measured_at)}</div>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleRemoveAthlete(a)} className="text-xs font-bold text-coral hover:underline">
                      Çıkar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || enteredCount === 0}
        className="mt-4 rounded-lg bg-yellow px-5 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : `Kaydet${enteredCount > 0 ? ` (${enteredCount})` : ""}`}
      </button>

      {pickerOpen && (
        <Modal title="Sporcu Ekle" onClose={() => setPickerOpen(false)}>
          <input
            className={`${inputClass} mb-3`}
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder="Sporcu ara..."
            aria-label="Sporcu ara"
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {pickerCandidates.length === 0 && <p className="text-xs text-muted">Eklenecek sporcu bulunamadı.</p>}
            {pickerCandidates.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2">
                <input
                  type="checkbox"
                  checked={pickerSelection.has(a.id)}
                  onChange={() =>
                    setPickerSelection((prev) => {
                      const next = new Set(prev);
                      if (next.has(a.id)) next.delete(a.id);
                      else next.add(a.id);
                      return next;
                    })
                  }
                />
                <span className="flex-1 text-sm text-ink">{a.full_name}</span>
                {a.groups?.name && <span className="text-xs text-muted">{a.groups.name}</span>}
              </label>
            ))}
          </div>
          <button
            onClick={handleAddAthletes}
            disabled={pickerSelection.size === 0}
            className="mt-4 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            Ekle ({pickerSelection.size})
          </button>
        </Modal>
      )}
    </div>
  );
}

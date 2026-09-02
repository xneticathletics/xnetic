import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  createMatch,
  updateMatch,
  deleteMatch,
  getMatchResult,
  notifyMatchResult,
  getMatchRoster,
  setMatchRoster,
  checkRosterConflict,
  type MatchRow,
  type MatchInput,
  type MatchRosterEntry,
} from "../../lib/api/matches";
import type { Group } from "../../lib/api/groups";
import type { Branch } from "../../lib/api/branches";

const RESULT_LABEL: Record<string, string> = { win: "Galibiyet", draw: "Beraberlik", loss: "Mağlubiyet" };
const RESULT_CLASS: Record<string, string> = { win: "text-teal", draw: "text-yellow", loss: "text-coral" };

export default function MatchModal({
  match,
  defaultDate,
  groups,
  branches,
  onClose,
  onSaved,
}: {
  match: MatchRow | null;
  defaultDate: string;
  groups: Group[];
  branches: Branch[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!match;
  const [form, setForm] = useState<MatchInput>(
    match
      ? {
          group_id: match.group_id,
          opponent_name: match.opponent_name,
          match_date: match.match_date,
          start_time: match.start_time.slice(0, 5),
          location: match.location,
          notes: match.notes,
          our_score: match.our_score,
          opponent_score: match.opponent_score,
          result_note: match.result_note,
        }
      : {
          group_id: "",
          opponent_name: "",
          match_date: defaultDate,
          start_time: "",
          location: null,
          notes: null,
          our_score: null,
          opponent_score: null,
          result_note: null,
        }
  );
  const [ourScoreText, setOurScoreText] = useState(match?.our_score != null ? String(match.our_score) : "");
  const [oppScoreText, setOppScoreText] = useState(match?.opponent_score != null ? String(match.opponent_score) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roster, setRoster] = useState<MatchRosterEntry[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const loadRoster = async (matchId: string, groupId: string) => {
    setRosterLoading(true);
    try {
      setRoster(await getMatchRoster(matchId, groupId));
    } catch {
      setRoster([]);
    } finally {
      setRosterLoading(false);
    }
  };

  // Yeni müsabakada, kaydedilmeden kadro seçilemez — mobil uygulamayla
  // aynı davranış (kadro seçimi müsabaka bir kere kaydedildikten sonra açılır).
  useEffect(() => {
    if (match && match.group_id) loadRoster(match.id, match.group_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id]);

  const set = <K extends keyof MatchInput>(key: K, value: MatchInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleGroupChange = (groupId: string) => {
    set("group_id", groupId);
    if (match) loadRoster(match.id, groupId);
    else setRoster([]);
  };

  const applyRosterToggle = (athleteId: string) => {
    setRoster((prev) => prev.map((r) => (r.athlete_id === athleteId ? { ...r, selected: !r.selected } : r)));
  };

  // Bir sporcuyu kadroya EKLERKEN, aynı gün başka bir maçın kadrosunda
  // zaten olup olmadığını kontrol ediyoruz — engelleyici değil, sadece
  // bilgilendirme amaçlı bir uyarı.
  const toggleRoster = async (athleteId: string) => {
    const entry = roster.find((r) => r.athlete_id === athleteId);
    if (!entry) return;

    if (!entry.selected && match && form.match_date) {
      try {
        const conflict = await checkRosterConflict(athleteId, form.match_date, match.id);
        if (conflict) {
          const proceed = confirm(
            `${entry.full_name}, ${conflict.matchDate} tarihinde "${conflict.opponentName}" maçının kadrosunda da yer alıyor. Yine de bu maça da eklemek istiyor musun?`
          );
          if (!proceed) return;
        }
      } catch {
        // Kontrol başarısız olsa bile kadro seçimini engelleme.
      }
    }

    applyRosterToggle(athleteId);
  };

  const selectedCount = roster.filter((r) => r.selected).length;

  // Bireysel branşlarda (Yüzme, Atletizm vb.) "vs. rakip takım" ve skor
  // kavramı yok — sonuç serbest metinle giriliyor (bkz. mobil MatchFormScreen).
  const selectedGroupBranch = groups.find((g) => g.id === form.group_id)?.branch ?? null;
  const isIndividualBranch = useMemo(
    () => !!branches.find((b) => b.name === selectedGroupBranch)?.is_individual,
    [branches, selectedGroupBranch]
  );

  const liveOur = ourScoreText.trim() ? Number(ourScoreText) : null;
  const liveOpp = oppScoreText.trim() ? Number(oppScoreText) : null;
  const liveResult = getMatchResult({ our_score: liveOur, opponent_score: liveOpp });

  const handleSave = async () => {
    if (!form.group_id || !form.match_date || !form.start_time) {
      setError("Grup, tarih ve saat alanları zorunludur.");
      return;
    }
    if (!isIndividualBranch && !form.opponent_name.trim()) {
      setError("Rakip takım adı zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Bireysel branşta "Rakip Takım" alanı gösterilmiyor ama veritabanında
      // zorunlu — mobildeki gibi otomatik bir değerle dolduruyoruz.
      const payload: MatchInput = {
        ...form,
        opponent_name: isIndividualBranch
          ? form.opponent_name.trim() || selectedGroupBranch || "Müsabaka"
          : form.opponent_name,
        our_score: isIndividualBranch ? null : liveOur,
        opponent_score: isIndividualBranch ? null : liveOpp,
        result_note: isIndividualBranch ? (form.result_note?.trim() || null) : null,
      };

      let shouldNotify = false;
      if (isEdit && match) {
        if (isIndividualBranch) {
          const trimmedNote = payload.result_note;
          shouldNotify = trimmedNote !== null && trimmedNote !== (match.result_note?.trim() || null);
        } else {
          shouldNotify =
            (payload.our_score !== match.our_score || payload.opponent_score !== match.opponent_score) &&
            payload.our_score !== null &&
            payload.opponent_score !== null;
        }
      }

      let saved: MatchRow;
      if (isEdit && match) {
        saved = (await updateMatch(match.id, payload)) as unknown as MatchRow;
      } else {
        saved = (await createMatch(payload)) as unknown as MatchRow;
      }
      await setMatchRoster(saved.id, roster.filter((r) => r.selected).map((r) => r.athlete_id));
      if (shouldNotify) notifyMatchResult(saved).catch(() => {});
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!match) return;
    if (!confirm("Bu müsabaka kaydını silmek istediğine emin misin?")) return;
    try {
      await deleteMatch(match.id);
      onSaved();
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  return (
    <Modal title={isEdit ? "Müsabakayı Düzenle" : "Yeni Müsabaka"} onClose={onClose}>
      <FormField label="Grup *">
        <select className={inputClass} value={form.group_id ?? ""} onChange={(e) => handleGroupChange(e.target.value)}>
          <option value="">Grup seç</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </FormField>

      {!isIndividualBranch && (
        <FormField label="Rakip Takım *">
          <input
            className={inputClass}
            value={form.opponent_name}
            onChange={(e) => set("opponent_name", e.target.value)}
            placeholder="Örn. Fenerbahçe U16"
          />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tarih *">
          <input type="date" className={inputClass} value={form.match_date} onChange={(e) => set("match_date", e.target.value)} />
        </FormField>
        <FormField label="Saat *">
          <input type="time" className={inputClass} value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
        </FormField>
      </div>

      <FormField label="Konum">
        <input
          className={inputClass}
          value={form.location ?? ""}
          onChange={(e) => set("location", e.target.value || null)}
          placeholder="Örn. Şehir Spor Salonu"
        />
      </FormField>

      <FormField label="Açıklama">
        <textarea className={`${inputClass} h-20`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
      </FormField>

      {form.group_id && (
        <FormField label={`Maç Kadrosu ${roster.length > 0 ? `(${selectedCount}/${roster.length})` : ""}`}>
          {rosterLoading ? (
            <p className="text-sm text-muted">Yükleniyor…</p>
          ) : !isEdit ? (
            <p className="text-xs text-muted">Kadro seçimi, müsabaka bir kere kaydedildikten sonra açılır.</p>
          ) : roster.length === 0 ? (
            <p className="text-xs text-muted">Bu grupta Müsabık işaretli sporcu yok — Spor Okulu sporcuları maç kadrosuna girmiyor.</p>
          ) : (
            <div className="max-h-[35vh] space-y-1.5 overflow-y-auto pr-1">
              {roster.map((r) => (
                <label
                  key={r.athlete_id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-bg p-2"
                >
                  <input type="checkbox" checked={r.selected} onChange={() => toggleRoster(r.athlete_id)} className="h-4 w-4" />
                  {r.photo_url ? (
                    <img src={r.photo_url} className="h-7 w-7 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-line text-xs font-bold">
                      {r.full_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold">{r.full_name}</span>
                </label>
              ))}
            </div>
          )}
        </FormField>
      )}

      {isEdit && (
        <div className="mb-3 rounded-lg border border-violet/40 bg-violet/5 p-3">
          <p className="mb-2 text-xs font-bold text-violet">Müsabaka Sonucu</p>
          {isIndividualBranch ? (
            <FormField label="Sonuç Açıklaması">
              <textarea
                className={`${inputClass} h-20`}
                value={form.result_note ?? ""}
                onChange={(e) => set("result_note", e.target.value || null)}
                placeholder="Örn. Ali 1., Ayşe 3. oldu. Mehmet finale kaldı."
              />
            </FormField>
          ) : (
            <>
              <div className="mb-2 grid grid-cols-2 gap-3">
                <FormField label="Bizim Skor">
                  <input
                    className={`${inputClass} text-center font-bold`}
                    value={ourScoreText}
                    onChange={(e) => setOurScoreText(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="—"
                    inputMode="numeric"
                  />
                </FormField>
                <FormField label="Rakip Skor">
                  <input
                    className={`${inputClass} text-center font-bold`}
                    value={oppScoreText}
                    onChange={(e) => setOppScoreText(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="—"
                    inputMode="numeric"
                  />
                </FormField>
              </div>
              {liveResult && (
                <p className={`text-xs font-bold ${RESULT_CLASS[liveResult]}`}>{RESULT_LABEL[liveResult]}</p>
              )}
            </>
          )}
          <p className="mt-2 text-[11px] text-muted">
            Sonucu kaydedince grubun velilerine, antrenörlerine, koordinatörüne ve sporcularına otomatik bildirim gider.
          </p>
        </div>
      )}

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>

      {isEdit && (
        <button onClick={handleDelete} className="mt-2 w-full rounded-lg border border-coral py-2.5 text-sm font-bold text-coral">
          Müsabakayı Sil
        </button>
      )}
    </Modal>
  );
}

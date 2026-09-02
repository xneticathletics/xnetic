import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import { getSessionRoster, saveAttendance, type AttendanceStatus, type RosterEntry } from "../../lib/api/attendance";
import type { TrainingSession } from "../../lib/api/trainingSessions";

export default function AttendanceModal({
  session,
  groupName,
  onClose,
}: {
  session: TrainingSession;
  groupName: string;
  onClose: () => void;
}) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSessionRoster(session.id, session.group_id)
      .then(setRoster)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session.id, session.group_id]);

  const setStatus = (athleteId: string, status: AttendanceStatus) => {
    setRoster((r) => r.map((entry) => (entry.athlete_id === athleteId ? { ...entry, status } : entry)));
  };

  const markAllPresent = () => {
    setRoster((r) => r.map((entry) => ({ ...entry, status: "geldi" as AttendanceStatus })));
  };

  const markedCount = roster.filter((r) => r.status !== null).length;

  const handleSave = async () => {
    const entries = roster.filter((r) => r.status !== null) as { athlete_id: string; status: AttendanceStatus }[];
    if (entries.length === 0) {
      setError("En az bir sporcu için durum seçmelisiniz.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveAttendance(session.id, entries);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Yoklama — ${groupName}`} onClose={onClose}>
      {loading ? (
        <p className="py-6 text-center text-sm text-muted">Yükleniyor…</p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">{markedCount}/{roster.length} işaretlendi</p>
            {roster.length > 0 && (
              <button onClick={markAllPresent} className="text-xs font-bold text-teal hover:underline">
                ✓ Hepsini Geldi İşaretle
              </button>
            )}
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {roster.length === 0 && <p className="text-sm text-muted">Bu grupta aktif sporcu bulunamadı.</p>}
            {roster.map((r) => (
              <div key={r.athlete_id} className="flex items-center gap-3 rounded-lg border border-line bg-bg p-2.5">
                {r.photo_url ? (
                  <img src={r.photo_url} className="h-9 w-9 rounded-full object-cover" alt="" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-line text-xs font-bold">
                    {r.full_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{r.full_name}</span>
                  {!!r.birth_date && <span className="block text-[11px] text-muted">{r.birth_date}</span>}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setStatus(r.athlete_id, "geldi")}
                    className={`rounded-md border px-3 py-1.5 text-xs font-bold ${
                      r.status === "geldi" ? "border-teal bg-teal text-bg" : "border-teal text-teal"
                    }`}
                  >
                    Geldi
                  </button>
                  <button
                    onClick={() => setStatus(r.athlete_id, "gelmedi")}
                    className={`rounded-md border px-3 py-1.5 text-xs font-bold ${
                      r.status === "gelmedi" ? "border-coral bg-coral text-bg" : "border-coral text-coral"
                    }`}
                  >
                    Gelmedi
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="mb-3 mt-3 text-sm font-semibold text-coral">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Yoklamayı Kaydet"}
          </button>
        </>
      )}
    </Modal>
  );
}

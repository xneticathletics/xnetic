import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import { getSessionRoster, saveAttendance, type AttendanceStatus, type RosterEntry } from "../../lib/api/attendance";
import { listExcusesForSession, type SessionExcuse } from "../../lib/api/sessionExcuses";
import { isAttendanceWindowOpen, isSessionPast, type TrainingSession } from "../../lib/api/trainingSessions";
import { useClubSettings } from "../../context/ClubSettingsContext";

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
  const [excusesByAthlete, setExcusesByAthlete] = useState<Record<string, SessionExcuse>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // disabled={saving} tek başına hızlı bir çift tıklamayı engellemiyor —
  // React state güncellemesi bir sonraki render'a kadar gecikebiliyor,
  // bu sırada ikinci tıklama da geçebiliyor. Mobildeki aynı düzeltme
  // deseni (savingRef) — senkron bir bayrak, render'ı beklemiyor.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useClubSettings();
  // Pencere dışında (admin dahil) kimse yazamıyor — geçmiş bir antrenman
  // için salt önizleme (kullanıcı kararı, 2026-09-26; mobildeki
  // AttendanceScreen'le aynı desen, sunucu tarafında can_write_attendance
  // ile zaten zorunlu kılınıyor, burası kullanıcıya erken/anlaşılır uyarı).
  const attendanceOpen = isAttendanceWindowOpen(
    session, settings.attendance_window_before_minutes, settings.attendance_window_after_minutes
  );
  const sessionIsPast = isSessionPast(session);

  useEffect(() => {
    Promise.all([getSessionRoster(session.id, session.group_id), listExcusesForSession(session.id)])
      .then(([rosterData, excuses]) => {
        setRoster(rosterData);
        const byAthlete: Record<string, SessionExcuse> = {};
        excuses.forEach((e) => (byAthlete[e.athlete_id] = e));
        setExcusesByAthlete(byAthlete);
      })
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
    if (savingRef.current || !attendanceOpen) return;
    const entries = roster.filter((r) => r.status !== null) as { athlete_id: string; status: AttendanceStatus }[];
    if (entries.length === 0) {
      setError("En az bir sporcu için durum seçmelisiniz.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await saveAttendance(session.id, entries);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
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
            {roster.length > 0 && attendanceOpen && (
              <button onClick={markAllPresent} className="text-xs font-bold text-teal hover:underline">
                ✓ Hepsini Geldi İşaretle
              </button>
            )}
          </div>

          {!attendanceOpen && (
            <p className="mb-3 rounded-lg bg-yellow/15 p-2.5 text-xs text-yellow">
              {sessionIsPast
                ? "🔒 Bu antrenmanın yoklama penceresi kapandı — sadece önizleme, değiştirilemez."
                : `⏱ Yoklama, antrenman başlamadan ${settings.attendance_window_before_minutes} dakika önce açılır, başladıktan ${settings.attendance_window_after_minutes} dakika sonra kapanır.`}
            </p>
          )}

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
                  {excusesByAthlete[r.athlete_id] && (
                    <span className="mt-0.5 block text-[11px] font-semibold text-yellow">
                      ⚠️ Gelemeyeceğini bildirdi: "{excusesByAthlete[r.athlete_id].reason}"
                    </span>
                  )}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setStatus(r.athlete_id, "geldi")}
                    disabled={!attendanceOpen}
                    className={`rounded-md border px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
                      r.status === "geldi" ? "border-teal bg-teal text-bg" : "border-teal text-teal"
                    }`}
                  >
                    Geldi
                  </button>
                  <button
                    onClick={() => setStatus(r.athlete_id, "gelmedi")}
                    disabled={!attendanceOpen}
                    className={`rounded-md border px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
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
            disabled={saving || sessionIsPast}
            className="mt-3 w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : sessionIsPast ? "Sadece Önizleme" : "Yoklamayı Kaydet"}
          </button>
        </>
      )}
    </Modal>
  );
}

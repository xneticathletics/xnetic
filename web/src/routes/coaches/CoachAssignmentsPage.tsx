import { useEffect, useState } from "react";
import { listGroups, type Group } from "../../lib/api/groups";
import { listCoaches, getGroupStaffingDetailed, setCoachAssignment, type Coach, type GroupStaffingDetailed } from "../../lib/api/coaches";

export default function CoachAssignmentsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [staffing, setStaffing] = useState<Record<string, GroupStaffingDetailed>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([listGroups(), listCoaches(), getGroupStaffingDetailed()])
      .then(([g, c, s]) => {
        setGroups(g);
        setCoaches(c);
        setStaffing(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleHeadChange = async (groupId: string, coachId: string) => {
    setBusyGroupId(groupId);
    setError(null);
    try {
      const current = staffing[groupId]?.headCoachId;
      if (current) await setCoachAssignment(current, groupId, "none");
      if (coachId) await setCoachAssignment(coachId, groupId, "head");
      load();
    } catch (e: any) {
      setError(e.message ?? "Atanamadı");
    } finally {
      setBusyGroupId(null);
    }
  };

  const handleAssistantToggle = async (groupId: string, coachId: string, isAssistant: boolean) => {
    setBusyGroupId(groupId);
    setError(null);
    try {
      await setCoachAssignment(coachId, groupId, isAssistant ? "none" : "assistant");
      load();
    } catch (e: any) {
      setError(e.message ?? "Atanamadı");
    } finally {
      setBusyGroupId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink">Grup Atamaları</h1>
      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <div className="space-y-4">
        {groups.map((g) => {
          const s = staffing[g.id] ?? { headCoachId: null, headCoachName: null, assistants: [] };
          const assistantIds = new Set(s.assistants.map((a) => a.id));
          const busy = busyGroupId === g.id;
          return (
            <div key={g.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="mb-3">
                <span className="font-bold text-ink">{g.name}</span>
                <span className="ml-2 text-xs text-muted">{g.branch}</span>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-muted">Baş Antrenör</label>
                <select
                  className="w-full max-w-xs rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink"
                  value={s.headCoachId ?? ""}
                  disabled={busy}
                  onChange={(e) => handleHeadChange(g.id, e.target.value)}
                >
                  <option value="">Yok</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Yardımcı Antrenörler</label>
                <div className="flex flex-wrap gap-2">
                  {coaches
                    .filter((c) => c.id !== s.headCoachId)
                    .map((c) => {
                      const active = assistantIds.has(c.id);
                      return (
                        <button
                          key={c.id}
                          disabled={busy}
                          onClick={() => handleAssistantToggle(g.id, c.id, active)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                            active ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

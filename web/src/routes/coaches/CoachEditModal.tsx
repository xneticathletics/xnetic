import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { updateCoachLevel, setCoachBranches, type Coach, type CoachBranchInfo } from "../../lib/api/coaches";
import type { Branch } from "../../lib/api/branches";

export default function CoachEditModal({
  coach,
  branches,
  currentBranches,
  onClose,
  onSaved,
}: {
  coach: Coach;
  branches: Branch[];
  currentBranches: CoachBranchInfo[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [level, setLevel] = useState<string>(coach.coach_level?.toString() ?? "");
  const [selected, setSelected] = useState<Record<string, number>>(
    Object.fromEntries(currentBranches.map((b) => [b.branch_id, b.level]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBranch = (branchId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (branchId in next) delete next[branchId];
      else next[branchId] = 1;
      return next;
    });
  };

  const setBranchLevel = (branchId: string, lvl: number) => {
    setSelected((prev) => ({ ...prev, [branchId]: lvl }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateCoachLevel(coach.id, level ? Number(level) : null);
      await setCoachBranches(
        coach.id,
        Object.entries(selected).map(([branch_id, lvl]) => ({ branch_id, level: lvl }))
      );
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`${coach.name} — Düzenle`} onClose={onClose}>
      <FormField label="Antrenörlük Kademesi (1-5)">
        <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Belirtilmedi</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Uzmanlık Branşları">
        <div className="space-y-2">
          {branches.map((b) => {
            const active = b.id in selected;
            return (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border border-line bg-bg p-2.5">
                <label className="flex flex-1 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={active} onChange={() => toggleBranch(b.id)} />
                  {b.name}
                </label>
                {active && (
                  <select
                    className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
                    value={selected[b.id]}
                    onChange={(e) => setBranchLevel(b.id, Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        Kademe {n}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </FormField>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </Modal>
  );
}

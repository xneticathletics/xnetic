import { useState } from "react";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import { setCoachBranches, type Coach, type CoachBranchInfo, type CoachBranchEntry } from "../../lib/api/coaches";
import type { Branch } from "../../lib/api/branches";

type BranchState = Omit<CoachBranchEntry, "branch_id">;

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
  const [selected, setSelected] = useState<Record<string, BranchState>>(
    Object.fromEntries(
      currentBranches.map((b) => [
        b.branch_id,
        { level: b.level, license_no: b.license_no, experience_years: b.experience_years, hire_date: b.hire_date },
      ])
    )
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBranch = (branchId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (branchId in next) delete next[branchId];
      else next[branchId] = { level: 1, license_no: null, experience_years: null, hire_date: null };
      return next;
    });
  };

  const patchBranch = (branchId: string, patch: Partial<BranchState>) => {
    setSelected((prev) => ({ ...prev, [branchId]: { ...prev[branchId], ...patch } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await setCoachBranches(
        coach.id,
        Object.entries(selected).map(([branch_id, b]) => ({ branch_id, ...b }))
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
      <FormField label="Uzmanlık Branşları">
        <div className="space-y-2">
          {branches.map((b) => {
            const active = b.id in selected;
            const state = selected[b.id];
            return (
              <div key={b.id} className="rounded-lg border border-line bg-bg p-2.5">
                <div className="flex items-center gap-3">
                  <label className="flex flex-1 items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" checked={active} onChange={() => toggleBranch(b.id)} />
                    {b.name}
                  </label>
                  {active && (
                    <select
                      className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
                      value={state.level}
                      onChange={(e) => patchBranch(b.id, { level: Number(e.target.value) })}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          Kademe {n}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {active && (
                  <div className="mt-2.5 grid grid-cols-1 gap-2 border-t border-line pt-2.5 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-muted">Belge Numarası</label>
                      <input
                        type="text"
                        value={state.license_no ?? ""}
                        onChange={(e) => patchBranch(b.id, { license_no: e.target.value || null })}
                        placeholder="Belge/lisans no"
                        className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-violet"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-muted">Deneyim Yılı</label>
                      <input
                        type="number"
                        value={state.experience_years ?? ""}
                        onChange={(e) => patchBranch(b.id, { experience_years: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Örn. 5"
                        className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-violet"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-muted">Başlama Tarihi</label>
                      <input
                        type="date"
                        value={state.hire_date ?? ""}
                        onChange={(e) => patchBranch(b.id, { hire_date: e.target.value || null })}
                        className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-violet"
                      />
                    </div>
                  </div>
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

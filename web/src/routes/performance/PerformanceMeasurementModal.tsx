import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import {
  createMeasurement,
  updateMeasurement,
  type PerformanceMeasurement,
} from "../../lib/api/performanceMeasurements";
import type { Athlete } from "../../lib/api/athletes";
import type { PerformanceTest } from "../../lib/performanceTests";

function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function PerformanceMeasurementModal({
  athlete,
  test,
  measurement,
  onClose,
  onSaved,
}: {
  athlete: Athlete;
  test: PerformanceTest;
  measurement: PerformanceMeasurement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(measurement ? String(measurement.value) : "");
  const [measuredAt, setMeasuredAt] = useState(measurement?.measured_at ?? todayKey());
  const [notes, setNotes] = useState(measurement?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const num = Number(value.trim().replace(",", "."));
    if (!value.trim() || !Number.isFinite(num)) {
      setError("Geçerli bir ölçüm değeri girmelisin.");
      return;
    }
    if (!measuredAt) {
      setError("Tarih seçmelisin.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (measurement) {
        await updateMeasurement(measurement.id, {
          value: num,
          measured_at: measuredAt,
          notes: notes.trim() || null,
        });
      } else {
        await createMeasurement({
          athlete_id: athlete.id,
          test_key: test.key,
          value: num,
          measured_at: measuredAt,
          notes: notes.trim() || null,
        });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`${athlete.full_name} — ${test.name}`} onClose={onClose}>
      <FormField label={`Değer (${test.unit}) *`}>
        <input
          className={inputClass}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Örn. 4.5"
          autoFocus
        />
      </FormField>

      <FormField label="Tarih *">
        <input
          type="date"
          className={inputClass}
          value={measuredAt}
          onChange={(e) => setMeasuredAt(e.target.value)}
        />
      </FormField>

      <FormField label="Not">
        <textarea
          className={`${inputClass} min-h-[72px]`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="İsteğe bağlı not"
        />
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

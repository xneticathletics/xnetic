import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { updateCoach, type Coach } from "../../lib/api/coaches";

const EDUCATION_OPTIONS: { value: string; label: string }[] = [
  { value: "lise", label: "Lise" },
  { value: "universite", label: "Üniversite" },
  { value: "yuksek_lisans", label: "Yüksek Lisans" },
  { value: "doktora", label: "Doktora" },
];

export default function CoachPersonalInfoModal({
  coach,
  onClose,
  onSaved,
}: {
  coach: Coach;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [phone, setPhone] = useState(coach.phone ?? "");
  const [birthDate, setBirthDate] = useState(coach.birth_date ?? "");
  const [educationLevel, setEducationLevel] = useState(coach.education_level ?? "");
  const [address, setAddress] = useState(coach.address ?? "");
  const [emergencyName, setEmergencyName] = useState(coach.emergency_contact_name ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(coach.emergency_contact_phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateCoach(coach.id, {
        phone: phone.trim() || null,
        birth_date: birthDate || null,
        education_level: educationLevel || null,
        address: address.trim() || null,
        emergency_contact_name: emergencyName.trim() || null,
        emergency_contact_phone: emergencyPhone.trim() || null,
      });
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`${coach.name} — Kişisel Bilgiler`} onClose={onClose}>
      <FormField label="Telefon">
        <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0532-123-45-67" />
      </FormField>
      <FormField label="Doğum Tarihi">
        <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </FormField>
      <FormField label="Öğrenim Durumu">
        <select className={inputClass} value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
          <option value="">Belirtilmedi</option>
          {EDUCATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Adres">
        <textarea
          className={`${inputClass} min-h-[70px]`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </FormField>
      <FormField label="Acil Durum Kişisi — Ad Soyad">
        <input className={inputClass} value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
      </FormField>
      <FormField label="Acil Durum Kişisi — Telefon">
        <input className={inputClass} value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="0532-123-45-67" />
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

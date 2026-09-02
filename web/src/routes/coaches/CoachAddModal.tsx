import { useState } from "react";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { inviteUser } from "../../lib/api/inviteUser";

// "Kullanıcı Davet Et" genel sayfası kaldırıldı — antrenör hesabı artık
// doğrudan Antrenörler sayfasından, buradaki rol-kilitli akıştan açılıyor
// (mobildeki "+ Antrenör Ekle" ile aynı karar).
export default function CoachAddModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const handleCreate = async () => {
    if (!email.trim()) {
      setError("E-posta zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await inviteUser({ identifier: email.trim(), role: "coach" });
      setResult({ email: res.identifier, tempPassword: res.tempPassword });
      onCreated();
    } catch (e: any) {
      setError(e.message ?? "Hesap oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Antrenör Ekle" onClose={onClose}>
      {result ? (
        <div className="rounded-lg border border-teal bg-teal/10 p-4">
          <p className="mb-1 font-bold text-ink">✓ Hesap Oluşturuldu</p>
          <p className="mb-2 text-sm text-ink">E-posta: {result.email}</p>
          <p className="mb-2 select-all rounded-md bg-bg px-3 py-3 text-center text-lg font-extrabold tracking-widest text-ink">
            {result.tempPassword}
          </p>
          <p className="mb-4 text-xs text-muted">Bu geçici şifreyi antrenöre ilet — bir daha burada görüntülenmeyecek.</p>
          <button onClick={onClose} className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg">
            Kapat
          </button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs leading-relaxed text-muted">
            E-posta girip hesap oluşturuyorsun — bir geçici şifre üretilir. Bu şifreyi antrenöre kendin iletmen
            gerekiyor. İlk girişte kendi şifresini belirlemesi zorunlu tutulur.
          </p>
          <FormField label="E-posta *">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="antrenor@ornek.com"
              autoFocus
            />
          </FormField>
          {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Oluşturuluyor…" : "Hesap Oluştur"}
          </button>
        </>
      )}
    </Modal>
  );
}

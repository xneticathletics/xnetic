import { useState } from "react";
import { inviteUser, type InviteRole } from "../../lib/api/inviteUser";
import { inputClass } from "../../components/FormField";

const ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: "parent", label: "Veli" },
  { value: "athlete", label: "Sporcu" },
  { value: "coach", label: "Antrenör" },
];

export default function InviteUserPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const handleInvite = async () => {
    if (!email.trim() || !role) {
      setError("E-posta ve rol zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const res = await inviteUser({ email: email.trim(), role });
      setResult({ email: res.email, tempPassword: res.tempPassword });
      setEmail("");
      setRole(null);
    } catch (e: any) {
      setError(e.message ?? "Hesap oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-ink">Kullanıcı Davet Et</h1>

      <p className="mb-5 rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-muted">
        E-posta ve rol girip hesap oluşturuyorsun — bir geçici şifre üretilir. Bu şifreyi kişiye kendin (WhatsApp,
        SMS, telefonla vb.) iletmen gerekiyor. Kişi bu e-posta ve geçici şifreyle uygulamaya giriş yapar, ilk
        girişte kendi şifresini belirlemesi zorunlu tutulur.
      </p>

      {result && (
        <div className="mb-5 rounded-lg border border-teal bg-teal/10 p-4">
          <p className="mb-1 font-bold text-ink">✓ Hesap Oluşturuldu</p>
          <p className="mb-2 text-sm text-ink">E-posta: {result.email}</p>
          <p className="mb-2 select-all rounded-md bg-bg px-3 py-3 text-center text-lg font-extrabold tracking-widest text-ink">
            {result.tempPassword}
          </p>
          <p className="text-xs text-muted">Bu geçici şifreyi kişiye ilet — bir daha burada görüntülenmeyecek.</p>
        </div>
      )}

      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-semibold text-muted">E-posta *</span>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="veli@ornek.com"
        />
      </label>

      <div className="mb-4">
        <span className="mb-1 block text-xs font-semibold text-muted">Rol *</span>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRole(opt.value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                role === opt.value ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <button
        onClick={handleInvite}
        disabled={saving}
        className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
      >
        {saving ? "Oluşturuluyor…" : "Hesap Oluştur"}
      </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import FormField, { inputClass } from "../../components/FormField";
import { useAuth, type UserRole } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  getCurrentUserName,
  getCurrentUserPhone,
  getCurrentUserPhoto,
  updateMyProfile,
  uploadMyPhoto,
} from "../../lib/api/currentUser";
import { formatPhoneNumber } from "../../lib/phoneFormat";
import { translatePasswordError } from "../../lib/passwordErrors";

const ROLE_LABEL: Record<UserRole, string> = {
  club_admin: "Kulüp Yöneticisi",
  coach: "Antrenör",
  parent: "Veli",
  athlete: "Sporcu",
  super_admin: "Süper Admin",
};

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-3 w-[3px] rounded-sm bg-yellow" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function AccountPage() {
  const { session, role } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCurrentUserName(), getCurrentUserPhone(), getCurrentUserPhoto()])
      .then(([n, p, photo]) => {
        setName(n ?? "");
        setPhone(p ?? "");
        setPhotoUrl(photo);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePickPhoto = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const url = await uploadMyPhoto(file);
      setPhotoUrl(url);
    } catch (e: any) {
      alert(e.message ?? "Fotoğraf yüklenemedi");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Ad Soyad boş bırakılamaz.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile({ name: name.trim(), phone: phone.trim() || null });
      alert("Bilgilerin güncellendi.");
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (newPassword !== newPassword2) {
      setPasswordError("Şifreler eşleşmiyor.");
      return;
    }
    setChangingPassword(true);
    setPasswordError(null);
    try {
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) throw pwError;
      setNewPassword("");
      setNewPassword2("");
      alert("Şifren değiştirildi.");
    } catch (e: any) {
      setPasswordError(translatePasswordError(e.message ?? ""));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;

  const initial = (name || "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-ink">Hesabım</h1>

      <SettingsCard title="Kişisel Bilgiler">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="Profil fotoğrafı" className="h-20 w-20 rounded-full border border-line object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-line bg-bg text-2xl font-extrabold text-yellow">
                {initial}
              </div>
            )}
          </div>
          <div>
            <label className="inline-block cursor-pointer rounded-lg border border-teal px-3 py-2 text-xs font-bold text-teal">
              {uploadingPhoto ? "Yükleniyor…" : "Fotoğrafı Değiştir"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePickPhoto(f);
                }}
              />
            </label>
            {role && <p className="mt-2 text-xs text-muted">{ROLE_LABEL[role]}</p>}
            {session?.user?.email && <p className="text-xs text-muted">{session.user.email}</p>}
          </div>
        </div>

        <FormField label="Ad Soyad">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField label="Telefon">
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            placeholder="0532-123-45-67"
            maxLength={14}
          />
        </FormField>

        {error && <p className="text-sm font-semibold text-coral">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-yellow py-2.5 text-sm font-bold text-bg disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </SettingsCard>

      <SettingsCard title="Şifre Değiştir">
        <FormField label="Yeni Şifre">
          <input
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="En az 6 karakter"
          />
        </FormField>

        <FormField label="Yeni Şifre (Tekrar)">
          <input type="password" className={inputClass} value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} />
        </FormField>

        {passwordError && <p className="text-sm font-semibold text-coral">{passwordError}</p>}

        <button
          onClick={handleChangePassword}
          disabled={changingPassword}
          className="w-full rounded-lg border border-teal py-2.5 text-sm font-bold text-teal disabled:opacity-60"
        >
          {changingPassword ? "…" : "Şifreyi Değiştir"}
        </button>
      </SettingsCard>
    </div>
  );
}

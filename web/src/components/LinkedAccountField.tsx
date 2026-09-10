import { useState } from "react";
import { inputClass } from "./FormField";
import { inviteUser, type InviteRole } from "../lib/api/inviteUser";
import type { LinkedUser } from "../lib/api/athletes";

// Sporcu/Veli giriş hesabı bağlama bölümleri için ortak bileşen — mobildeki
// src/components/LinkedAccountField.tsx ile aynı sözleşme: ya mevcut bir
// hesap seçilir ya da doğrudan burada yeni bir hesap oluşturulur (invite-user
// edge function). Bu bileşen athletes tablosuna hiçbir şey yazmaz — sadece
// bir kullanıcı id'si seçer/oluşturur, asıl athlete_user_id/parent_user_id
// yazımı çağıran ekranın (AthleteEditModal) Kaydet akışının sorumluluğunda.
export default function LinkedAccountField({
  title,
  hint,
  inviteRole,
  defaultName,
  linkedUser,
  existingUsers,
  onUnlink,
  onLinkExisting,
  onCreated,
}: {
  title: string;
  hint: string;
  inviteRole: InviteRole;
  defaultName: string;
  linkedUser: LinkedUser | null;
  existingUsers: LinkedUser[];
  onUnlink: () => void;
  onLinkExisting: (user: LinkedUser) => void;
  onCreated: (user: LinkedUser) => void;
}) {
  const [newIdentifier, setNewIdentifier] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ identifier: string; tempPassword: string } | null>(null);

  const handleCreate = async () => {
    if (!defaultName.trim()) {
      setCreateError("Önce yukarıdaki ad soyad alanını doldurmalısın.");
      return;
    }
    if (!newIdentifier.trim()) {
      setCreateError("Telefon numarası veya kullanıcı adı gir.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await inviteUser({ identifier: newIdentifier.trim(), role: inviteRole, name: defaultName.trim() });
      setCreatedResult({ identifier: res.identifier, tempPassword: res.tempPassword });
      setNewIdentifier("");
      onCreated({ id: res.id, name: defaultName.trim(), email: null });
    } catch (e: any) {
      setCreateError(e.message ?? "Hesap oluşturulamadı");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="mb-0.5 text-xs font-bold text-ink">{title}</p>
      <p className="mb-2 text-[11px] text-muted">{hint}</p>

      {linkedUser ? (
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2">
          <span className="text-sm font-semibold text-teal">{linkedUser.name}</span>
          <button
            type="button"
            onClick={() => {
              setCreatedResult(null);
              onUnlink();
            }}
            className="text-xs font-bold text-coral"
          >
            Kaldır
          </button>
        </div>
      ) : (
        <>
          <select
            className={inputClass}
            value=""
            onChange={(e) => {
              const u = existingUsers.find((x) => x.id === e.target.value);
              if (u) onLinkExisting(u);
            }}
          >
            <option value="">Mevcut bir hesap seç</option>
            {existingUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <p className="my-2 text-center text-[11px] text-muted">veya yeni hesap oluştur</p>
          <p className="mb-1.5 text-[11px] text-muted">
            Hesap adı: <span className="font-semibold text-ink">{defaultName.trim() || "— önce yukarıdaki alanı doldur"}</span>
          </p>
          <div className="flex gap-2">
            <input
              className={`${inputClass} flex-1`}
              value={newIdentifier}
              onChange={(e) => setNewIdentifier(e.target.value.trim().toLowerCase())}
              placeholder="Telefon ya da kullanıcı adı"
              autoCapitalize="none"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="shrink-0 rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg disabled:opacity-60"
            >
              {creating ? "…" : "Oluştur"}
            </button>
          </div>
          {createError && <p className="mt-1.5 text-xs font-semibold text-coral">{createError}</p>}
        </>
      )}

      {createdResult && (
        <div className="mt-2 rounded-lg border border-teal bg-teal/10 p-3">
          <p className="mb-1 text-sm font-bold text-ink">✓ Hesap Oluşturuldu</p>
          <p className="mb-1.5 text-xs text-ink">Giriş Bilgisi: {createdResult.identifier}</p>
          <p className="mb-1.5 select-all rounded-md bg-bg px-3 py-2.5 text-center text-base font-extrabold tracking-widest text-ink">
            {createdResult.tempPassword}
          </p>
          <p className="text-[11px] text-muted">Bu şifreyi ilet — bir daha görüntülenmeyecek. İlk girişte değiştirmesi zorunlu.</p>
        </div>
      )}
    </div>
  );
}

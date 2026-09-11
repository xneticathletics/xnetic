import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import { listClubUsers, type ClubUser } from "../../lib/api/clubUsers";
import { resetUserPassword } from "../../lib/api/passwordReset";
import { listPendingPasswordResetRequests, markNotificationRead } from "../../lib/api/notifications";
import { getUserIdsForRoleBucket } from "../../lib/api/notificationRolePrefs";
import { inviteUser, type InviteRole } from "../../lib/api/inviteUser";
import type { UserRole } from "../../context/AuthContext";

const ROLE_LABEL: Record<UserRole, string> = {
  club_admin: "Kulüp Yöneticisi",
  coach: "Antrenör",
  parent: "Veli",
  athlete: "Sporcu",
  super_admin: "Süper Admin",
};

const INVITE_ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: "parent", label: "Veli" },
  { value: "athlete", label: "Sporcu" },
  { value: "coach", label: "Antrenör" },
];

function InviteUserModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<InviteRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ identifier: string; tempPassword: string } | null>(null);

  const handleInvite = async () => {
    if (!identifier.trim() || !role) {
      setError("Telefon/kullanıcı adı ve rol zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await inviteUser({ identifier: identifier.trim(), role });
      setResult({ identifier: res.identifier, tempPassword: res.tempPassword });
      setIdentifier("");
      setRole(null);
      onInvited();
    } catch (e: any) {
      setError(e.message ?? "Hesap oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Kullanıcı Ekle" onClose={onClose}>
      <p className="mb-4 rounded-lg border border-line bg-bg p-3 text-xs text-muted">
        Telefon numarası, kullanıcı adı ya da e-posta ve rol girip hesap oluşturuyorsun — bir geçici şifre üretilir.
        Bu şifreyi kişiye kendin (WhatsApp, SMS, telefonla vb.) iletmen gerekiyor. Kişi ilk girişte kendi şifresini
        belirlemek zorunda kalır.
      </p>

      {result ? (
        <div className="rounded-lg border border-teal bg-teal/10 p-4">
          <p className="mb-2 text-sm font-bold text-ink">✓ Hesap Oluşturuldu</p>
          <p className="mb-2 text-sm text-ink">Giriş Bilgisi: {result.identifier}</p>
          <p className="mb-2 select-all rounded-md bg-bg px-3 py-3 text-center text-lg font-extrabold tracking-widest text-ink">
            {result.tempPassword}
          </p>
          <p className="mb-4 text-xs text-muted">
            Bu geçici şifreyi kişiye ilet — bir daha görüntülenmeyecek.
          </p>
          <button onClick={onClose} className="w-full rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
            Kapat
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-bold text-muted">Telefon veya Kullanıcı Adı *</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="05XX XXX XX XX ya da kullaniciadi"
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-yellow"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold text-muted">Rol *</label>
            <div className="flex flex-wrap gap-2">
              {INVITE_ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                    role === opt.value ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

          <button
            onClick={handleInvite}
            disabled={saving}
            className="w-full rounded-lg bg-yellow px-4 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {saving ? "Oluşturuluyor…" : "Hesap Oluştur"}
          </button>
        </>
      )}
    </Modal>
  );
}

export default function UsersListPage() {
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [pendingByUserId, setPendingByUserId] = useState<Record<string, string[]>>({});
  const [coordinatorIds, setCoordinatorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; tempPassword: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([listClubUsers(), listPendingPasswordResetRequests(), getUserIdsForRoleBucket("coordinator")])
      .then(([u, pending, coordinators]) => {
        setUsers(u);
        const byUser: Record<string, string[]> = {};
        pending.forEach((p) => {
          (byUser[p.requesterId] ??= []).push(p.notificationId);
        });
        setPendingByUserId(byUser);
        setCoordinatorIds(new Set(coordinators));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.phone ?? "").toLowerCase().includes(q));
  }, [users, query]);

  const handleReset = async (u: ClubUser) => {
    if (!confirm(`"${u.name}" için yeni bir geçici şifre üretilecek, eski şifresi geçersiz olacak. Devam edilsin mi?`)) return;
    setResettingId(u.id);
    try {
      const res = await resetUserPassword(u.id);
      setResult({ name: u.name, tempPassword: res.tempPassword });
      const pendingIds = pendingByUserId[u.id];
      if (pendingIds?.length) {
        await Promise.all(pendingIds.map((id) => markNotificationRead(id).catch(() => {})));
        setPendingByUserId((prev) => {
          const next = { ...prev };
          delete next[u.id];
          return next;
        });
      }
    } catch (e: any) {
      alert(e.message ?? "Şifre sıfırlanamadı");
    } finally {
      setResettingId(null);
    }
  };

  const columns: Column<ClubUser>[] = [
    {
      key: "name",
      label: "Ad Soyad",
      render: (u) => (
        <div>
          {!!pendingByUserId[u.id]?.length && (
            <div className="mb-0.5 text-xs font-bold text-coral">🔔 Şifre sıfırlama talep etti</div>
          )}
          <span className="font-semibold">{u.name}</span>
        </div>
      ),
    },
    {
      key: "role",
      label: "Rol",
      render: (u) =>
        u.role === "coach" && coordinatorIds.has(u.id) ? (
          <span className="inline-flex items-center gap-1">
            {ROLE_LABEL[u.role]}
            <span className="rounded-full bg-violet/20 px-2 py-0.5 text-[10px] font-bold text-violet">🏷️ Koordinatör</span>
          </span>
        ) : (
          ROLE_LABEL[u.role] ?? u.role
        ),
    },
    { key: "phone", label: "Telefon", render: (u) => u.phone ?? "—" },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (u) => (
        <button
          onClick={() => handleReset(u)}
          disabled={resettingId === u.id}
          className="rounded-lg border border-coral px-3 py-1.5 text-xs font-bold text-coral disabled:opacity-60"
        >
          {resettingId === u.id ? "Sıfırlanıyor…" : "Şifreyi Sıfırla"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Kullanıcılar</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kullanıcı ara..."
            aria-label="Kullanıcı ara"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-yellow sm:w-64"
          />
          <button
            onClick={() => setInviting(true)}
            className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg"
          >
            + Kullanıcı Ekle
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-muted">
        Bildirim tercihlerini artık rol bazında Kulüp Ayarları → Bildirim Tercihleri'nden yönetiyorsun.
      </p>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={filteredUsers}
        rowKey={(u) => u.id}
        loading={loading}
        emptyText={query ? "Eşleşen kullanıcı bulunamadı." : "Henüz kullanıcı yok."}
      />

      {result && (
        <Modal title={`${result.name} — Yeni Geçici Şifre`} onClose={() => setResult(null)}>
          <p className="mb-3 select-all rounded-md bg-bg px-3 py-3 text-center text-lg font-extrabold tracking-widest text-ink">
            {result.tempPassword}
          </p>
          <p className="text-xs text-muted">Bu şifreyi kişiye ilet — bir daha görüntülenmeyecek. İlk girişte değiştirmesi zorunlu.</p>
        </Modal>
      )}

      {inviting && <InviteUserModal onClose={() => setInviting(false)} onInvited={load} />}
    </div>
  );
}

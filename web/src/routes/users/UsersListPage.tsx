import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import { listClubUsers, type ClubUser } from "../../lib/api/clubUsers";
import { resetUserPassword } from "../../lib/api/passwordReset";
import { listPendingPasswordResetRequests, markNotificationRead } from "../../lib/api/notifications";
import { getUserIdsForRoleBucket } from "../../lib/api/notificationRolePrefs";
import type { UserRole } from "../../context/AuthContext";

const ROLE_LABEL: Record<UserRole, string> = {
  club_admin: "Kulüp Yöneticisi",
  coach: "Antrenör",
  parent: "Veli",
  athlete: "Sporcu",
  super_admin: "Süper Admin",
};

export default function UsersListPage() {
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [pendingByUserId, setPendingByUserId] = useState<Record<string, string[]>>({});
  const [coordinatorIds, setCoordinatorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; tempPassword: string } | null>(null);

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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kullanıcı ara..."
          className="w-64 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-yellow"
        />
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
    </div>
  );
}

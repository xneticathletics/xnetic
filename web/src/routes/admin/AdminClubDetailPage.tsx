import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import Modal from "../../components/Modal";
import FormField, { inputClass } from "../../components/FormField";
import { resetUserPassword } from "../../lib/api/passwordReset";
import {
  deleteClub,
  getClub,
  getClubAdmins,
  getClubSubscriptionHistory,
  upsertSubscription,
  type ClubAdmin,
  type ClubSummary,
  type SubscriptionHistoryEntry,
} from "../../lib/api/superAdmin";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Onay Bekliyor",
  active: "Aktif",
  mock_paid: "Test Ödemesi",
  past_due: "Ödeme Gecikti",
  cancelled: "İptal Edildi / Askıda",
  none: "Abonelik kaydı yok",
};
const PERIOD_LABELS: Record<string, string> = { monthly: "Aylık", yearly: "Yıllık" };

export default function AdminClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [club, setClub] = useState<ClubSummary | null>(null);
  const [admins, setAdmins] = useState<ClubAdmin[]>([]);
  const [history, setHistory] = useState<SubscriptionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; tempPassword: string } | null>(null);

  const [suspending, setSuspending] = useState(false);

  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([getClub(id), getClubAdmins(id), getClubSubscriptionHistory(id)])
      .then(([c, a, h]) => {
        setClub(c);
        setAdmins(a);
        setHistory(h);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleReset = async (admin: ClubAdmin) => {
    if (!confirm(`"${admin.name}" için yeni bir geçici şifre üretilecek, eski şifresi geçersiz olacak. Devam edilsin mi?`)) return;
    setResettingId(admin.id);
    try {
      const res = await resetUserPassword(admin.id);
      setResetResult({ name: admin.name, tempPassword: res.tempPassword });
    } catch (e: any) {
      alert(e.message ?? "Şifre sıfırlanamadı");
    } finally {
      setResettingId(null);
    }
  };

  const handleSuspend = async () => {
    if (!club || !id) return;
    if (!confirm(`"${club.name}" kulübünün aboneliği iptal edilecek ve uygulamaya erişimi kilitlenecek. Devam edilsin mi?`)) return;
    setSuspending(true);
    try {
      await upsertSubscription({
        club_id: id,
        billing_period: club.subscription?.billing_period ?? "monthly",
        status: "cancelled",
        amount_try: club.subscription?.amount_try ?? 0,
      });
      load();
    } catch (e: any) {
      alert(e.message ?? "İşlem başarısız oldu");
    } finally {
      setSuspending(false);
    }
  };

  const handleReactivate = async () => {
    if (!club || !id) return;
    setSuspending(true);
    try {
      await upsertSubscription({
        club_id: id,
        billing_period: club.subscription?.billing_period ?? "monthly",
        status: "active",
        amount_try: club.subscription?.amount_try ?? 0,
      });
      load();
    } catch (e: any) {
      alert(e.message ?? "İşlem başarısız oldu");
    } finally {
      setSuspending(false);
    }
  };

  const handleDelete = async () => {
    if (!club || !id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteClub(id, confirmName);
      navigate("/admin/clubs", { replace: true });
    } catch (e: any) {
      setDeleteError(e.message ?? "Silinemedi");
    } finally {
      setDeleting(false);
    }
  };

  const adminColumns: Column<ClubAdmin>[] = [
    { key: "name", label: "Ad Soyad", render: (a) => <span className="font-semibold">{a.name}</span> },
    { key: "phone", label: "Telefon", render: (a) => a.phone ?? "—" },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (a) => (
        <button
          onClick={() => handleReset(a)}
          disabled={resettingId === a.id}
          className="rounded-lg border border-coral px-3 py-1.5 text-xs font-bold text-coral disabled:opacity-60"
        >
          {resettingId === a.id ? "Sıfırlanıyor…" : "Şifreyi Sıfırla"}
        </button>
      ),
    },
  ];

  const historyColumns: Column<SubscriptionHistoryEntry>[] = [
    { key: "changed_at", label: "Tarih", render: (h) => new Date(h.changed_at).toLocaleString("tr-TR") },
    { key: "status", label: "Durum", render: (h) => STATUS_LABELS[h.status] ?? h.status },
    { key: "period", label: "Plan", render: (h) => PERIOD_LABELS[h.billing_period] ?? h.billing_period },
    { key: "amount", label: "Tutar", render: (h) => (h.amount_try ? `₺${h.amount_try.toLocaleString("tr-TR")}` : "—") },
  ];

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;
  if (error) return <p className="text-sm font-semibold text-coral">{error}</p>;
  if (!club) return <p className="text-sm text-muted">Kulüp bulunamadı.</p>;

  const isCancelled = club.subscription?.status === "cancelled";

  return (
    <div>
      <button onClick={() => navigate("/admin/clubs")} className="mb-4 text-xs font-semibold text-muted hover:text-ink">
        ← Kulüplere Dön
      </button>

      <h1 className="mb-1 text-xl font-bold text-ink">{club.name}</h1>
      <p className="mb-6 text-sm text-muted">
        Katılım: {new Date(club.created_at).toLocaleDateString("tr-TR")} · Abonelik:{" "}
        <span className={club.subscription?.status === "pending_review" || isCancelled ? "font-bold text-coral" : ""}>
          {STATUS_LABELS[club.subscription?.status ?? "none"] ?? club.subscription?.status}
        </span>
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-ink">Kulüp Adminleri</h2>
        <DataTable columns={adminColumns} rows={admins} rowKey={(a) => a.id} loading={false} emptyText="Bu kulübün admini yok." />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-ink">Abonelik — Geçmiş</h2>
        <DataTable
          columns={historyColumns}
          rows={history}
          rowKey={(h) => h.id}
          loading={false}
          emptyText="Henüz durum değişikliği kaydı yok. Abonelikler sayfasından bir güncelleme yapıldığında burada birikmeye başlar."
        />
        <div className="mt-3 flex gap-2">
          {isCancelled ? (
            <button
              onClick={handleReactivate}
              disabled={suspending}
              className="rounded-lg bg-teal px-4 py-2 text-xs font-bold text-bg disabled:opacity-60"
            >
              {suspending ? "İşleniyor…" : "Aboneliği Yeniden Aktifleştir"}
            </button>
          ) : (
            <button
              onClick={handleSuspend}
              disabled={suspending}
              className="rounded-lg border border-coral px-4 py-2 text-xs font-bold text-coral disabled:opacity-60"
            >
              {suspending ? "İşleniyor…" : "Kulübü Askıya Al"}
            </button>
          )}
          <button onClick={() => navigate("/admin/subscriptions")} className="text-xs font-bold text-teal hover:underline">
            Tutar/Plan Düzenle →
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-coral/40 bg-coral/5 p-5">
        <h2 className="mb-1 text-sm font-bold text-coral">Tehlikeli Bölge</h2>
        <p className="mb-4 text-xs text-muted">
          Bu kulübü ve TÜM bağlı verisini (sporcular, antrenörler, veliler, ödemeler, fitness/beslenme kayıtları — her şey) kalıcı
          olarak siler. Bu işlem GERİ ALINAMAZ.
        </p>
        <FormField label={`Onaylamak için kulüp adını tam olarak yaz: "${club.name}"`}>
          <input className={inputClass} value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
        </FormField>
        {deleteError && <p className="mb-3 text-sm font-semibold text-coral">{deleteError}</p>}
        <button
          onClick={handleDelete}
          disabled={deleting || confirmName.trim() !== club.name}
          className="rounded-lg bg-coral px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
        >
          {deleting ? "Siliniyor…" : "Kulübü Kalıcı Olarak Sil"}
        </button>
      </section>

      {resetResult && (
        <Modal title={`${resetResult.name} — Yeni Geçici Şifre`} onClose={() => setResetResult(null)}>
          <p className="mb-3 select-all rounded-md bg-bg px-3 py-3 text-center text-lg font-extrabold tracking-widest text-ink">
            {resetResult.tempPassword}
          </p>
          <p className="text-xs text-muted">Bu şifreyi kişiye ilet — bir daha görüntülenmeyecek. İlk girişte değiştirmesi zorunlu.</p>
        </Modal>
      )}
    </div>
  );
}

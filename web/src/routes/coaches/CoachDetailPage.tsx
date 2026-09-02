import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getCoach,
  getAllCoachBranches,
  getCoachGroups,
  deactivateCoach,
  reactivateCoach,
  deleteCoachPermanently,
  type Coach,
  type CoachBranchInfo,
} from "../../lib/api/coaches";
import { listBranches, type Branch } from "../../lib/api/branches";
import CoachEditModal from "./CoachEditModal";
import CoachPersonalInfoModal from "./CoachPersonalInfoModal";

const EDUCATION_LABELS: Record<string, string> = {
  lise: "Lise",
  universite: "Üniversite",
  yuksek_lisans: "Yüksek Lisans",
  doktora: "Doktora",
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className={value ? "text-sm font-semibold text-ink" : "text-sm text-muted"}>{value || "—"}</span>
    </div>
  );
}

export default function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [coach, setCoach] = useState<Coach | null>(null);
  const [branches, setBranches] = useState<CoachBranchInfo[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string; branch: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingBranches, setEditingBranches] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([getCoach(id), getAllCoachBranches(), getCoachGroups(id), listBranches()])
      .then(([c, allCoachBranches, g, b]) => {
        setCoach(c);
        setBranches(allCoachBranches[id] ?? []);
        setGroups(g);
        setAllBranches(b);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleDeactivate = async () => {
    if (!coach) return;
    if (!confirm(`"${coach.name}" adlı antrenörü pasifleştirmek istediğine emin misin?`)) return;
    await deactivateCoach(coach.id);
    load();
  };

  const handleReactivate = async () => {
    if (!coach) return;
    await reactivateCoach(coach.id);
    load();
  };

  const handleDeletePermanently = async () => {
    if (!coach) return;
    if (
      !confirm(
        `"${coach.name}" adlı antrenörü KALICI olarak silmek istediğine emin misin? Bu işlem geri alınamaz — branş/grup atamaları da kaldırılır.`
      )
    )
      return;
    try {
      await deleteCoachPermanently(coach.id);
      navigate("/coaches");
    } catch (e: any) {
      alert(e.message ?? "Silinemedi — bu antrenöre bağlı kayıtlar (ör. geçmiş antrenmanlar) olabilir.");
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;
  if (error || !coach) return <p className="text-sm font-semibold text-coral">{error ?? "Antrenör bulunamadı."}</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/coaches" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Antrenörler
      </Link>

      <div className="mb-6 flex items-start gap-4 rounded-xl border border-line bg-surface p-5">
        {coach.photo_url ? (
          <img src={coach.photo_url} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow/20 text-2xl font-extrabold text-yellow">
            {coach.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-ink">{coach.name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${coach.is_active ? "bg-teal/20 text-teal" : "bg-line text-muted"}`}>
              {coach.is_active ? "Aktif" : "Pasif"}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted">Antrenör</p>
          {branches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {branches.map((b) => (
                <span key={b.branch_id} className="rounded-full bg-teal px-3 py-1 text-xs font-bold text-bg">
                  {b.branch_name.toUpperCase()} · {b.level}. Kademe
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">İletişim &amp; Kişisel</h2>
            <button onClick={() => setEditingPersonal(true)} className="text-xs font-bold text-teal hover:underline">
              Düzenle
            </button>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <InfoRow label="E-posta" value={coach.email} />
            <InfoRow label="Telefon" value={coach.phone} />
            <InfoRow label="Doğum Tarihi" value={coach.birth_date} />
            <InfoRow label="Öğrenim Durumu" value={coach.education_level ? EDUCATION_LABELS[coach.education_level] ?? coach.education_level : null} />
            <InfoRow label="Adres" value={coach.address} />
          </div>

          <h2 className="mb-3 mt-6 text-sm font-bold text-ink">Acil Durum Kişisi</h2>
          <div className="rounded-xl border border-line bg-surface p-4">
            <InfoRow label="Ad Soyad" value={coach.emergency_contact_name} />
            <InfoRow label="Telefon" value={coach.emergency_contact_phone} />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Branş &amp; Kademe</h2>
            <button onClick={() => setEditingBranches(true)} className="text-xs font-bold text-teal hover:underline">
              Düzenle
            </button>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            {branches.length === 0 ? (
              <p className="text-sm text-muted">Henüz branş atanmadı.</p>
            ) : (
              branches.map((b) => (
                <div key={b.branch_id} className="border-b border-line py-2 last:border-0">
                  <p className="text-sm font-semibold text-ink">{b.branch_name}</p>
                  <p className="text-xs text-muted">{b.level}. Kademe</p>
                </div>
              ))
            )}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-bold text-ink">Sorumlu Gruplar</h2>
          <div className="rounded-xl border border-line bg-surface p-4">
            {groups.length === 0 ? (
              <p className="text-sm text-muted">Henüz bir gruba atanmadı.</p>
            ) : (
              groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                  <span className="text-sm font-semibold text-ink">{g.name}</span>
                  <span className="text-xs text-muted">{g.branch}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {coach.is_active ? (
          <button onClick={handleDeactivate} className="rounded-lg border border-coral px-4 py-2 text-sm font-bold text-coral">
            Pasifleştir
          </button>
        ) : (
          <button onClick={handleReactivate} className="rounded-lg border border-teal px-4 py-2 text-sm font-bold text-teal">
            Aktifleştir
          </button>
        )}
        <button onClick={handleDeletePermanently} className="rounded-lg bg-coral px-4 py-2 text-sm font-bold text-bg">
          Komple Sil
        </button>
      </div>

      {editingBranches && (
        <CoachEditModal
          coach={coach}
          branches={allBranches}
          currentBranches={branches}
          onClose={() => setEditingBranches(false)}
          onSaved={() => {
            setEditingBranches(false);
            load();
          }}
        />
      )}

      {editingPersonal && (
        <CoachPersonalInfoModal
          coach={coach}
          onClose={() => setEditingPersonal(false)}
          onSaved={() => {
            setEditingPersonal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

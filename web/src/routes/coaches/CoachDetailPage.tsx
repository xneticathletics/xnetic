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
import { listBranches, setBranchCoordinator, type Branch } from "../../lib/api/branches";
import { listCoachLeaves, createCoachLeave, deleteCoachLeave, type CoachLeave } from "../../lib/api/coachLeaves";
import { listVenues, type Venue } from "../../lib/api/venues";
import { getCoachVenueIds, setCoachVenue } from "../../lib/api/venueCoaches";
import { listAthletesInGroups } from "../../lib/api/athletes";
import CoachEditModal from "./CoachEditModal";
import CoachPersonalInfoModal from "./CoachPersonalInfoModal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

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
  const [leaves, setLeaves] = useState<CoachLeave[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [authorizedVenueIds, setAuthorizedVenueIds] = useState<string[]>([]);
  const [athleteCounts, setAthleteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingBranches, setEditingBranches] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [savingLeave, setSavingLeave] = useState(false);
  const [venueTogglingId, setVenueTogglingId] = useState<string | null>(null);
  const [coordinatorSaving, setCoordinatorSaving] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getCoach(id), getAllCoachBranches(), getCoachGroups(id), listBranches(), listCoachLeaves(id),
      listVenues(), getCoachVenueIds(id),
    ])
      .then(([c, allCoachBranches, g, b, l, v, venueIds]) => {
        setCoach(c);
        setBranches(allCoachBranches[id] ?? []);
        setGroups(g);
        setAllBranches(b);
        setLeaves(l);
        setVenues(v);
        setAuthorizedVenueIds(venueIds);
        // Bu antrenörün grup başına aktif sporcu sayısı için, kulübün TÜM
        // sporcularını (sağlık verisi dahil ağır bir sorgu — listAllAthletes())
        // çekmek yerine sadece bu antrenörün gruplarına scope'lu bir sorgu
        // yeterli.
        return listAthletesInGroups(g.map((x) => x.id));
      })
      .then((athletes) => {
        const counts: Record<string, number> = {};
        athletes.forEach((a) => {
          if (a.group_id && a.status === "active") counts[a.group_id] = (counts[a.group_id] ?? 0) + 1;
        });
        setAthleteCounts(counts);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const myCoordinatorBranch = allBranches.find((b) => b.coordinator_user_id === id) ?? null;

  const handleSetCoordinator = async (branch: Branch | null) => {
    if (!id) return;
    setCoordinatorSaving(true);
    try {
      if (myCoordinatorBranch && myCoordinatorBranch.id !== branch?.id) {
        await setBranchCoordinator(myCoordinatorBranch.id, null);
      }
      if (branch) await setBranchCoordinator(branch.id, id);
      setAllBranches(await listBranches());
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setCoordinatorSaving(false);
    }
  };

  const handleToggleVenue = async (venueId: string, currentlyOn: boolean) => {
    if (!id) return;
    setVenueTogglingId(venueId);
    try {
      await setCoachVenue(id, venueId, !currentlyOn);
      setAuthorizedVenueIds(await getCoachVenueIds(id));
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setVenueTogglingId(null);
    }
  };

  const handleAddLeave = async () => {
    if (!id || !leaveForm.start_date || !leaveForm.end_date) {
      alert("Başlangıç ve bitiş tarihi seçmelisin.");
      return;
    }
    if (leaveForm.end_date < leaveForm.start_date) {
      alert("Bitiş tarihi başlangıçtan önce olamaz.");
      return;
    }
    setSavingLeave(true);
    try {
      await createCoachLeave({
        coach_id: id,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason.trim() || null,
      });
      setLeaveForm({ start_date: "", end_date: "", reason: "" });
      setLeaves(await listCoachLeaves(id));
    } catch (e: any) {
      alert(e.message ?? "Kaydedilemedi");
    } finally {
      setSavingLeave(false);
    }
  };

  const handleDeleteLeave = async (leave: CoachLeave) => {
    if (!id) return;
    if (!confirm("Bu izin kaydını silmek istediğine emin misin?")) return;
    try {
      await deleteCoachLeave(leave.id);
      setLeaves(await listCoachLeaves(id));
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

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

          <h2 className="mb-3 mt-6 text-sm font-bold text-ink">Sorumlu Gruplar</h2>
          <div className="rounded-xl border border-line bg-surface p-4">
            {groups.length === 0 ? (
              <p className="text-sm text-muted">Henüz bir gruba atanmadı.</p>
            ) : (
              groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                  <span className="text-sm font-semibold text-ink">{g.name}</span>
                  <span className="text-xs text-muted">{athleteCounts[g.id] ?? 0} sporcu · {g.branch}</span>
                </div>
              ))
            )}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-bold text-ink">İzin İşlemleri</h2>
          <div className="mb-3 rounded-xl border border-line bg-surface p-4">
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-muted">Başlangıç</label>
                <input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-violet"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-muted">Bitiş</label>
                <input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-violet"
                />
              </div>
            </div>
            <input
              type="text"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Neden (isteğe bağlı)"
              className="mb-2 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-violet"
            />
            <button
              onClick={handleAddLeave}
              disabled={savingLeave}
              className="w-full rounded-lg bg-violet px-4 py-2 text-sm font-bold text-bg disabled:opacity-60"
            >
              {savingLeave ? "Kaydediliyor…" : "+ İzin Ekle"}
            </button>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            {leaves.length === 0 ? (
              <p className="text-sm text-muted">Henüz izin kaydı yok.</p>
            ) : (
              leaves.map((l) => (
                <div key={l.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {formatDate(l.start_date)} – {formatDate(l.end_date)}
                    </p>
                    {l.reason && <p className="text-xs text-muted">{l.reason}</p>}
                  </div>
                  <button onClick={() => handleDeleteLeave(l)} className="text-xs font-bold text-coral hover:underline">
                    Sil
                  </button>
                </div>
              ))
            )}
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
                  {(b.license_no || b.experience_years != null || b.hire_date) && (
                    <p className="mt-0.5 text-[11px] text-muted">
                      {[
                        b.license_no && `Belge: ${b.license_no}`,
                        b.experience_years != null && `${b.experience_years} yıl deneyim`,
                        b.hire_date && `Başlama: ${formatDate(b.hire_date)}`,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {allBranches.length > 1 && (
            <>
              <h2 className="mb-3 mt-6 text-sm font-bold text-ink">Branş Koordinatörlüğü</h2>
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="mb-3 text-xs leading-relaxed text-muted">
                  Koordinatör olduğu branşta, sadece kendi grupları değil o branşın TÜM sporcularını ve aidatlarını görebilir.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSetCoordinator(null)}
                    disabled={coordinatorSaving}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                      !myCoordinatorBranch ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                    }`}
                  >
                    Yok
                  </button>
                  {allBranches.map((b) => {
                    const active = myCoordinatorBranch?.id === b.id;
                    const takenByOther = !!b.coordinator_user_id && b.coordinator_user_id !== id;
                    return (
                      <button
                        key={b.id}
                        disabled={coordinatorSaving}
                        onClick={() => {
                          if (takenByOther) {
                            if (
                              confirm(
                                `${b.name} branşının koordinatörü şu an ${b.coordinator?.name ?? "başka bir antrenör"}. Bunu ${coach.name} ile değiştirmek istiyor musun?`
                              )
                            ) {
                              handleSetCoordinator(b);
                            }
                            return;
                          }
                          handleSetCoordinator(b);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                          active ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
                        }`}
                      >
                        {b.name}
                        {takenByOther ? ` (${b.coordinator?.name ?? "atanmış"})` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {venues.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 text-sm font-bold text-ink">Salon Yetkisi</h2>
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="mb-3 text-xs leading-relaxed text-muted">
                  İşaretli salon(lar) için bu antrenör, kendi branşındaki tüm gruplar adına antrenman planı oluşturabilir.
                </p>
                {venues.map((v) => {
                  const on = authorizedVenueIds.includes(v.id);
                  return (
                    <label
                      key={v.id}
                      className="flex cursor-pointer items-center justify-between border-b border-line py-2 last:border-0"
                    >
                      <span className="text-sm font-semibold text-ink">{v.name}</span>
                      {venueTogglingId === v.id ? (
                        <span className="text-xs text-muted">…</span>
                      ) : (
                        <input type="checkbox" checked={on} onChange={() => handleToggleVenue(v.id, on)} />
                      )}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to={`/finance/coach-payments?coach=${coach.id}`}
          className="rounded-lg border border-violet px-4 py-2 text-sm font-bold text-violet"
        >
          💰 Ödemeler &amp; Avanslar
        </Link>
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

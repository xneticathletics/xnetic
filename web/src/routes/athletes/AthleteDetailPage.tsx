import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAthlete, deleteAthlete, type Athlete } from "../../lib/api/athletes";
import { listAthleteRecentAttendance, type AthleteRecentAttendance, type AttendanceStatus } from "../../lib/api/attendance";
import AthleteEditModal from "./AthleteEditModal";

const STATUS_LABEL: Record<string, string> = { active: "Aktif", passive: "Pasif" };
const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  geldi: "Katıldı",
  gelmedi: "Gelmedi",
  gec_kaldi: "Geç Kaldı",
  raporlu: "Raporlu",
  izinli: "İzinli",
};
const ATTENDANCE_COLOR: Record<AttendanceStatus, string> = {
  geldi: "text-teal",
  gelmedi: "text-coral",
  gec_kaldi: "text-yellow",
  raporlu: "text-violet",
  izinli: "text-violet",
};

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// wa.me linkleri uluslararası formatta numara istiyor — yerel "0532..."
// yazımını "90532..."a çeviriyoruz (Türkiye numaraları için yeterli,
// mobildeki loginIdentifier.ts'teki extractPhoneDigits ile aynı yaklaşım).
function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `90${digits.slice(1)}` : digits;
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className={value !== null && value !== undefined && value !== "" ? "text-sm font-semibold text-ink" : "text-sm text-muted"}>
        {value !== null && value !== undefined && value !== "" ? value : "—"}
      </span>
    </div>
  );
}

export default function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [attendance, setAttendance] = useState<AthleteRecentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([getAthlete(id), listAthleteRecentAttendance(id)])
      .then(([a, att]) => {
        setAthlete(a);
        setAttendance(att);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const age = athlete ? calcAge(athlete.birth_date) : null;
  const attendancePct = useMemo(() => {
    if (attendance.length === 0) return null;
    const attended = attendance.filter((a) => a.status === "geldi").length;
    return Math.round((attended / attendance.length) * 100);
  }, [attendance]);
  const recentSessions = attendance.slice(0, 5);

  const handleDelete = async () => {
    if (!athlete) return;
    if (!confirm(`"${athlete.full_name}" silinsin mi? Bağlı tüm yoklama/aidat/sakatlık kayıtları da silinir. Bu işlem geri alınamaz.`)) return;
    try {
      await deleteAthlete(athlete.id);
      navigate("/athletes");
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  if (loading) return <p className="text-sm text-muted">Yükleniyor…</p>;
  if (error || !athlete) return <p className="text-sm font-semibold text-coral">{error ?? "Sporcu bulunamadı."}</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/athletes" className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← Sporcular
      </Link>

      <div className="mb-6 flex items-start gap-4 rounded-xl border border-line bg-surface p-5">
        {athlete.photo_url ? (
          <img src={athlete.photo_url} alt="" className="h-28 w-28 rounded-full object-cover" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-yellow/20 text-4xl font-extrabold text-yellow">
            {athlete.full_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-ink">{athlete.full_name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${athlete.status === "active" ? "bg-teal/20 text-teal" : "bg-line text-muted"}`}>
              {STATUS_LABEL[athlete.status] ?? athlete.status}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${athlete.athlete_type === "musabik" ? "bg-yellow/20 text-yellow" : "bg-line text-muted"}`}>
              {athlete.athlete_type === "musabik" ? "🏆 MÜSABIK" : "SPOR OKULU"}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted">{athlete.groups?.name ?? "Grup atanmadı"}</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-line bg-bg px-3 py-2 text-center">
              <p className="text-base font-extrabold text-ink">{age ?? "—"}</p>
              <p className="text-[10px] font-bold text-muted">YAŞ</p>
            </div>
            <div className="rounded-lg border border-line bg-bg px-3 py-2 text-center">
              <p className="text-base font-extrabold text-teal">{attendancePct !== null ? `%${attendancePct}` : "—"}</p>
              <p className="text-[10px] font-bold text-muted">DEVAM</p>
            </div>
            <div className="rounded-lg border border-line bg-bg px-3 py-2 text-center">
              <p className="text-base font-extrabold text-ink">{athlete.jersey_number ?? "—"}</p>
              <p className="text-[10px] font-bold text-muted">FORMA NO</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href={athlete.parent_phone ? `tel:${athlete.parent_phone}` : undefined}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-bold ${
            athlete.parent_phone ? "border-teal text-teal" : "cursor-not-allowed border-line text-muted"
          }`}
          onClick={(e) => !athlete.parent_phone && e.preventDefault()}
        >
          📞 Veli Ara
        </a>
        <a
          href={athlete.parent_phone ? `https://wa.me/${toWhatsAppNumber(athlete.parent_phone)}` : undefined}
          target="_blank"
          rel="noreferrer"
          className={`flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-bold ${
            athlete.parent_phone ? "border-violet text-violet" : "cursor-not-allowed border-line text-muted"
          }`}
          onClick={(e) => !athlete.parent_phone && e.preventDefault()}
        >
          💬 Mesaj
        </a>
        <a href="#yoklama" className="flex-1 rounded-lg border border-yellow px-4 py-2.5 text-center text-sm font-bold text-yellow">
          📋 Yoklama
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold text-ink">Bilgiler</h2>
          <div className="rounded-xl border border-line bg-surface p-4">
            <InfoRow label="Doğum Tarihi" value={athlete.birth_date} />
            <InfoRow label="Boy (cm)" value={athlete.height_cm} />
            <InfoRow label="Kilo (kg)" value={athlete.weight_kg} />
            <InfoRow label="Okul" value={athlete.school} />
            <InfoRow label="Lisans No" value={athlete.license_no} />
            <InfoRow label="Forma Bedeni" value={athlete.jersey_size} />
          </div>

          <h2 className="mb-3 mt-6 text-sm font-bold text-ink">Veli</h2>
          <div className="rounded-xl border border-line bg-surface p-4">
            <InfoRow label="Ad Soyad" value={athlete.parent_name} />
            <InfoRow label="Telefon" value={athlete.parent_phone} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-ink">Sağlık</h2>
          <div className="rounded-xl border border-line bg-surface p-4">
            <InfoRow label="Kan Grubu" value={athlete.blood_type} />
            <InfoRow label="Alerjiler" value={athlete.allergies} />
            <InfoRow label="Kullandığı İlaçlar" value={athlete.medications} />
            <InfoRow label="Sağlık Notu" value={athlete.health_info} />
          </div>

          <h2 id="yoklama" className="mb-3 mt-6 scroll-mt-4 text-sm font-bold text-ink">
            Son Antrenmanlar
          </h2>
          <div className="rounded-xl border border-line bg-surface p-4">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted">Henüz yoklama kaydı yok.</p>
            ) : (
              recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                  <span className="text-sm text-ink">
                    {s.group_name ?? "Grup"} <span className="text-xs text-muted">· {s.venue_name ?? "Salon atanmadı"}</span>
                  </span>
                  <span className={`text-xs font-bold ${ATTENDANCE_COLOR[s.status]}`}>
                    {ATTENDANCE_LABEL[s.status]} · {formatDate(s.session_date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setEditing(true)} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
          Düzenle
        </button>
        <button onClick={handleDelete} className="rounded-lg border border-coral px-4 py-2 text-sm font-bold text-coral">
          Sporcuyu Sil
        </button>
      </div>

      {editing && (
        <AthleteEditModal
          athleteId={athlete.id}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </div>
  );
}

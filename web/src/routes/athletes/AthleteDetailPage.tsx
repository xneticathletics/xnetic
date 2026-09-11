import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAthlete, deleteAthlete, type Athlete } from "../../lib/api/athletes";
import { listAthleteRecentAttendance, type AthleteRecentAttendance, type AttendanceStatus } from "../../lib/api/attendance";
import { listAthleteNotes, createAthleteNote, type AthleteNote } from "../../lib/api/athleteNotes";
import { listInjuries, createInjury, type Injury } from "../../lib/api/injuries";
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
  const [notes, setNotes] = useState<AthleteNote[]>([]);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [addingInjury, setAddingInjury] = useState(false);
  const [injuryForm, setInjuryForm] = useState({ injury_type: "", injury_date: "", expected_return: "", note: "" });
  const [savingInjury, setSavingInjury] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([getAthlete(id), listAthleteRecentAttendance(id), listAthleteNotes(id), listInjuries(id)])
      .then(([a, att, n, inj]) => {
        setAthlete(a);
        setAttendance(att);
        setNotes(n);
        setInjuries(inj);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleAddNote = async () => {
    if (!id || !newNote.trim()) return;
    setSavingNote(true);
    try {
      await createAthleteNote(id, newNote.trim());
      setNewNote("");
      setNotes(await listAthleteNotes(id));
    } catch (e: any) {
      alert(e.message ?? "Not eklenemedi");
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddInjury = async () => {
    if (!id || !injuryForm.injury_type.trim() || !injuryForm.injury_date) {
      alert("Sakatlık türü ve tarihi zorunludur.");
      return;
    }
    setSavingInjury(true);
    try {
      await createInjury({
        athlete_id: id,
        injury_type: injuryForm.injury_type.trim(),
        injury_date: injuryForm.injury_date,
        expected_return: injuryForm.expected_return || null,
        note: injuryForm.note.trim() || null,
      });
      setInjuryForm({ injury_type: "", injury_date: "", expected_return: "", note: "" });
      setAddingInjury(false);
      setInjuries(await listInjuries(id));
    } catch (e: any) {
      alert(e.message ?? "Sakatlık kaydı eklenemedi");
    } finally {
      setSavingInjury(false);
    }
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

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Sakatlık Geçmişi</h2>
            <button
              onClick={() => setAddingInjury((v) => !v)}
              className="rounded-lg border border-coral px-3 py-1 text-xs font-bold text-coral"
            >
              {addingInjury ? "Vazgeç" : "+ Ekle"}
            </button>
          </div>

          {addingInjury && (
            <div className="mb-3 rounded-xl border border-coral bg-surface p-4">
              <input
                type="text"
                value={injuryForm.injury_type}
                onChange={(e) => setInjuryForm((f) => ({ ...f, injury_type: e.target.value }))}
                placeholder="Sakatlık türü *"
                className="mb-2 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-coral"
              />
              <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-muted">Tarih *</label>
                  <input
                    type="date"
                    value={injuryForm.injury_date}
                    onChange={(e) => setInjuryForm((f) => ({ ...f, injury_date: e.target.value }))}
                    className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-muted">Beklenen Dönüş</label>
                  <input
                    type="date"
                    value={injuryForm.expected_return}
                    onChange={(e) => setInjuryForm((f) => ({ ...f, expected_return: e.target.value }))}
                    className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                </div>
              </div>
              <textarea
                value={injuryForm.note}
                onChange={(e) => setInjuryForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Not (opsiyonel)"
                rows={2}
                className="mb-2 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-coral"
              />
              <button
                onClick={handleAddInjury}
                disabled={savingInjury}
                className="w-full rounded-lg bg-coral px-4 py-2 text-sm font-bold text-bg disabled:opacity-60"
              >
                {savingInjury ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          )}

          <div className="rounded-xl border border-line bg-surface p-4">
            {injuries.length === 0 ? (
              <p className="text-sm text-muted">Sakatlık kaydı yok.</p>
            ) : (
              injuries.map((inj) => (
                <div key={inj.id} className="border-b border-line py-2 last:border-0">
                  <p className="text-sm font-bold text-ink">{inj.injury_type}</p>
                  <p className="text-xs text-muted">
                    {formatDate(inj.injury_date)}
                    {inj.expected_return ? ` — Beklenen dönüş: ${formatDate(inj.expected_return)}` : ""}
                  </p>
                  {inj.note && <p className="mt-1 text-xs text-ink">{inj.note}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-ink">Koç Notları</h2>
          <div className="mb-3 rounded-xl border border-line bg-surface p-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Yeni not yaz…"
              rows={2}
              className="mb-2 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-yellow"
            />
            <button
              onClick={handleAddNote}
              disabled={savingNote || !newNote.trim()}
              className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg disabled:opacity-60"
            >
              {savingNote ? "Kaydediliyor…" : "Not Ekle"}
            </button>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            {notes.length === 0 ? (
              <p className="text-sm text-muted">Henüz not yok.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="border-b border-line py-2 last:border-0">
                  <p className="text-sm text-ink">{n.note}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(n.created_at)}</p>
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

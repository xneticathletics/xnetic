import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import { listRecentCheckins, type RecentCheckinRow } from "../../lib/api/wellnessCheckins";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// Mobildeki CoachWellnessScreen.tsx'in web karşılığı — salt okunur bir
// liste. Sporcular kendi doldurduğu için admin panelinde düzenleme yok,
// sadece son check-in'leri görüntüleme (bkz. görev kapsamı — en düşük
// öncelikli madde).
export default function FitnessWellnessPage() {
  const [rows, setRows] = useState<RecentCheckinRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRecentCheckins()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const displayRows = q ? rows.filter((r) => r.athlete_full_name.toLowerCase().includes(q)) : rows;

  const columns: Column<RecentCheckinRow>[] = [
    { key: "athlete", label: "Sporcu", render: (r) => <span className="font-semibold">{r.athlete_full_name}</span> },
    { key: "group", label: "Grup", render: (r) => r.athlete_group_name ?? "—" },
    { key: "date", label: "Tarih", render: (r) => formatDate(r.checkin_date) },
    { key: "sleep_hours", label: "Uyku (sa)", render: (r) => r.sleep_hours ?? "—" },
    { key: "sleep_quality", label: "Uyku Kalitesi", render: (r) => r.sleep_quality ?? "—" },
    { key: "energy", label: "Enerji", render: (r) => r.energy ?? "—" },
    { key: "soreness", label: "Kas Ağrısı", render: (r) => r.soreness ?? "—" },
    { key: "mood", label: "Ruh Hâli", render: (r) => r.mood ?? "—" },
    { key: "resting_hr", label: "Dinlenik Nabız", render: (r) => r.resting_hr ?? "—" },
  ];

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-ink">Wellness Check-in</h1>
      <p className="mb-6 text-sm text-muted">
        Sporcuların her sabah kendi doldurduğu uyku/enerji/kas ağrısı/ruh hâli anketi — salt okunur, resmi bir test değil.
      </p>

      <input
        className="mb-4 w-full max-w-sm rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-yellow"
        placeholder="Sporcu ara…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={displayRows}
        rowKey={(r) => r.id}
        loading={loading}
        emptyText={q ? "Eşleşen sporcu bulunamadı." : "Henüz check-in kaydı yok."}
      />
    </div>
  );
}

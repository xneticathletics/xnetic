import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import { listRecentCheckins, type RecentCheckinRow } from "../../lib/api/wellnessCheckins";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

// Not: kasıtlı olarak toISOString() KULLANILMIYOR — yerel tarih parçalarından
// elle kuruyoruz (bkz. web/src/lib/date.ts'teki aynı notta açıklanan UTC
// kaynaklı gün kayması sorunu).
function todayKey() {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Mobildeki CoachWellnessScreen.tsx'in web karşılığı — salt okunur bir
// liste. Sporcular kendi doldurduğu için admin panelinde düzenleme yok,
// sadece görüntüleme. Sayfa açılışında varsayılan olarak bugünün
// check-in'leri gösterilir, üstteki tarih filtresiyle değiştirilebilir.
export default function FitnessWellnessPage() {
  const [rows, setRows] = useState<RecentCheckinRow[]>([]);
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRecentCheckins()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const displayRows = rows.filter(
    (r) => r.checkin_date === selectedDate && (!q || r.athlete_full_name.toLowerCase().includes(q))
  );

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

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-muted">
          Tarih
          <input
            type="date"
            className="mt-1 block rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-yellow"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
        {selectedDate !== todayKey() && (
          <button onClick={() => setSelectedDate(todayKey())} className="pb-2 text-xs font-bold text-teal hover:underline">
            Bugüne dön
          </button>
        )}
        <input
          className="ml-auto w-full max-w-sm rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-yellow"
          placeholder="Sporcu ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      <DataTable
        columns={columns}
        rows={displayRows}
        rowKey={(r) => r.id}
        loading={loading}
        emptyText={q ? "Eşleşen sporcu bulunamadı." : "Bu tarihte check-in kaydı yok."}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DataTable, { type Column } from "../../components/DataTable";
import { inputClass } from "../../components/FormField";
import { COLOR_CLASSES, getPerformanceCategory, type PerformanceCategory } from "../../lib/performanceTests";
import { getCustomTest, type CustomPerformanceTest } from "../../lib/api/customPerformanceTests";
import { listAllAthletes, type Athlete } from "../../lib/api/athletes";
import {
  listMeasurementsForAthleteTest,
  deleteMeasurement,
  type PerformanceMeasurement,
} from "../../lib/api/performanceMeasurements";
import PerformanceMeasurementModal from "./PerformanceMeasurementModal";

const CUSTOM_PREFIX = "custom:";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function PerformanceTestDetailPage() {
  const { testKey } = useParams<{ category: string; testKey: string }>();

  const [test, setTest] = useState<CustomPerformanceTest | null | undefined>(undefined);
  const [category, setCategory] = useState<PerformanceCategory | null>(null);

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [history, setHistory] = useState<PerformanceMeasurement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<PerformanceMeasurement | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!testKey?.startsWith(CUSTOM_PREFIX)) {
      setTest(null);
      return;
    }
    let cancelled = false;
    getCustomTest(testKey.slice(CUSTOM_PREFIX.length))
      .then((t) => {
        if (cancelled) return;
        setTest(t);
        setCategory(t ? getPerformanceCategory(t.category) ?? null : null);
      })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [testKey]);

  useEffect(() => {
    listAllAthletes()
      .then(setAthletes)
      .catch((e) => setError(e.message));
  }, []);

  const loadHistory = (athleteId: string) => {
    if (!testKey) return;
    setLoadingHistory(true);
    listMeasurementsForAthleteTest(athleteId, testKey)
      .then(setHistory)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    if (athlete) loadHistory(athlete.id);
    else setHistory([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athlete, testKey]);

  const filteredAthletes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? athletes.filter((a) => a.full_name.toLowerCase().includes(q)) : athletes;
    return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
  }, [athletes, query]);

  const handleSelectAthlete = (a: Athlete) => {
    setAthlete(a);
    setPickerOpen(false);
    setQuery("");
  };

  const handleDelete = async (m: PerformanceMeasurement) => {
    if (!test) return;
    if (!confirm(`${formatDate(m.measured_at)} tarihli ${m.value} ${test.unit} kaydını silmek istediğine emin misin?`)) return;
    try {
      await deleteMeasurement(m.id);
      if (athlete) loadHistory(athlete.id);
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  if (test === undefined) {
    return <p className="text-sm text-muted">Yükleniyor…</p>;
  }

  if (!test || !category) {
    return <p className="text-sm font-semibold text-coral">Test bulunamadı.</p>;
  }

  const cls = COLOR_CLASSES[category.color];

  const columns: Column<PerformanceMeasurement>[] = [
    { key: "date", label: "Tarih", render: (m) => formatDate(m.measured_at) },
    { key: "value", label: "Değer", render: (m) => <span className="font-semibold">{m.value} {test.unit}</span> },
    { key: "notes", label: "Not", render: (m) => m.notes ?? <span className="text-muted">—</span> },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (m) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setEditing(m);
              setShowModal(true);
            }}
            className="text-xs font-bold text-teal hover:underline"
          >
            Düzenle
          </button>
          <button onClick={() => handleDelete(m)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Link to={`/performance/${category.key}`} className="mb-4 inline-block text-xs font-bold text-muted hover:text-ink">
        ← {category.label}
      </Link>

      <div className={`mb-4 rounded-xl border-2 ${cls.border} ${cls.bgSoft} p-6 text-center`}>
        <div className="mb-1 text-3xl">{category.icon}</div>
        <div className={`text-lg font-extrabold ${cls.text}`}>{test.name}</div>
        <div className="mt-1 text-xs text-muted">Birim: {test.unit}</div>
        {test.equipment && <div className="mt-1 text-xs italic text-muted">🔧 {test.equipment}</div>}
      </div>

      <div className="mb-6 rounded-xl border border-line bg-surface p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-bold uppercase text-muted">Nasıl Yapılır?</div>
          {test.video_url && (
            <a href={test.video_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal hover:underline">
              🎥 Video İzle
            </a>
          )}
        </div>
        <p className="text-sm leading-relaxed text-ink">{test.instructions}</p>
      </div>

      <div className="mb-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase text-muted">Sporcu</div>
            <div className="text-sm font-bold text-ink">{athlete ? athlete.full_name : "Henüz seçilmedi"}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-bg"
            >
              {athlete ? "Sporcuyu Değiştir" : "Sporcu Ara"}
            </button>
            {athlete && (
              <button
                onClick={() => {
                  setEditing(null);
                  setShowModal(true);
                }}
                className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg"
              >
                + Ölçüm Ekle
              </button>
            )}
          </div>
        </div>

        {pickerOpen && (
          <div className="mt-3 border-t border-line pt-3">
            <input
              className={`${inputClass} mb-2`}
              placeholder="Sporcu ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-56 overflow-y-auto rounded-lg border border-line">
              {filteredAthletes.length === 0 && (
                <div className="p-3 text-center text-sm text-muted">Eşleşen sporcu bulunamadı.</div>
              )}
              {filteredAthletes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSelectAthlete(a)}
                  className="flex w-full items-center justify-between border-b border-line px-3 py-2 text-left text-sm last:border-0 hover:bg-bg"
                >
                  <span className="font-semibold text-ink">{a.full_name}</span>
                  <span className="text-xs text-muted">{a.groups?.name ?? "Grup atanmadı"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-coral">{error}</p>}

      {athlete && (
        <DataTable
          columns={columns}
          rows={history}
          rowKey={(m) => m.id}
          loading={loadingHistory}
          emptyText="Bu sporcu için henüz kayıt yok."
        />
      )}

      {showModal && athlete && (
        <PerformanceMeasurementModal
          athlete={athlete}
          test={test}
          measurement={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditing(null);
            loadHistory(athlete.id);
          }}
        />
      )}
    </div>
  );
}

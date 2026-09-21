import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import {
  listContentReports, resolveContentReport, REPORT_REASON_LABEL, REPORT_TYPE_LABEL, type ContentReport,
} from "../../lib/api/contentReports";

export default function ContentReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listContentReports()
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resolve = async (id: string) => {
    try {
      await resolveContentReport(id);
      load();
    } catch (e: any) {
      setError(e.message ?? "İşlem yapılamadı");
    }
  };

  const columns: Column<ContentReport>[] = [
    { key: "date", label: "Tarih", render: (r) => new Date(r.created_at).toLocaleString("tr-TR") },
    { key: "type", label: "Tür", render: (r) => REPORT_TYPE_LABEL[r.content_type] ?? r.content_type },
    { key: "reason", label: "Sebep", render: (r) => REPORT_REASON_LABEL[r.reason] ?? r.reason },
    { key: "reporter", label: "Şikayet Eden", render: (r) => r.reporter_name },
    { key: "reported", label: "Şikayet Edilen", render: (r) => r.reported_name },
    {
      key: "content",
      label: "İçerik / Açıklama",
      render: (r) => (
        <div className="max-w-md">
          {r.content_snapshot && <div className="italic text-ink">"{r.content_snapshot}"</div>}
          {r.details && <div className="text-muted">{r.details}</div>}
        </div>
      ),
    },
    {
      key: "status",
      label: "Durum",
      render: (r) =>
        r.status === "open" ? (
          <button
            onClick={() => resolve(r.id)}
            className="rounded-lg bg-yellow px-3 py-1 text-xs font-bold text-bg hover:opacity-90"
          >
            İncelendi
          </button>
        ) : (
          <span className="text-xs font-bold text-teal">✓ İncelendi</span>
        ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Şikayetler</h1>
      <p className="mb-6 text-sm text-muted">
        Üyelerin mobil uygulamadan bildirdiği mesaj, paylaşım ve kullanıcı şikayetleri. İçeriği kaldırmak için Sosyal
        sekmesinden paylaşımı silebilir, gerekirse kullanıcıyı Kullanıcılar sayfasından devre dışı bırakabilirsiniz.
      </p>
      {error && <p className="mb-4 text-sm text-coral">{error}</p>}
      <DataTable columns={columns} rows={reports} rowKey={(r) => r.id} emptyText="Henüz şikayet yok." loading={loading} />
    </div>
  );
}

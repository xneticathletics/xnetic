import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Modal from "../../components/Modal";
import { bulkCreateAthletes } from "../../lib/api/athletes";
import type { Branch } from "../../lib/api/branches";

const NAME_HEADER = "Adı Soyadı";
const BRANCH_HEADER = "Branşı";

type ParsedRow = {
  fullName: string;
  rawBranch: string | null;
  matchedBranch: string | null;
  branchNotFound: boolean;
};

export default function AthleteBulkImportModal({
  branches,
  onClose,
  onImported,
}: {
  branches: Branch[];
  onClose: () => void;
  onImported: () => void;
}) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const wsData = [[NAME_HEADER, BRANCH_HEADER], ["Örn. Elif Kaya", branches[0]?.name ?? "Örn. Voleybol"]];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 28 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sporcular");

    if (branches.length > 0) {
      const branchSheet = XLSX.utils.aoa_to_sheet([["Geçerli Branşlar"], ...branches.map((b) => [b.name])]);
      XLSX.utils.book_append_sheet(wb, branchSheet, "Branşlar");
    }

    XLSX.writeFile(wb, "sporcu-sablonu.xlsx");
  };

  const matchBranch = (raw: string | null): { matched: string | null; notFound: boolean } => {
    if (!raw || !raw.trim()) return { matched: null, notFound: false };
    const found = branches.find((b) => b.name.trim().toLowerCase() === raw.trim().toLowerCase());
    return found ? { matched: found.name, notFound: false } : { matched: null, notFound: true };
  };

  const handlePickFile = (file: File) => {
    setError(null);
    setFileName(file.name);
    setRows([]);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        const parsed: ParsedRow[] = json
          .map((r) => {
            const fullName = String(r[NAME_HEADER] ?? "").trim();
            const rawBranch = String(r[BRANCH_HEADER] ?? "").trim() || null;
            const { matched, notFound } = matchBranch(rawBranch);
            return { fullName, rawBranch, matchedBranch: matched, branchNotFound: notFound };
          })
          .filter((r) => r.fullName.length > 0);

        if (parsed.length === 0) {
          setError(`Dosyada "${NAME_HEADER}" sütununda geçerli isim bulunamadı.`);
        }
        setRows(parsed);
      } catch (err: any) {
        setError(err.message ?? "Dosya okunamadı — geçerli bir .xlsx dosyası olduğundan emin ol.");
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => {
      setError("Dosya okunamadı.");
      setParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const count = await bulkCreateAthletes(rows.map((r) => ({ full_name: r.fullName, branch: r.matchedBranch })));
      alert(`${count} sporcu eklendi. Grup atamalarını Sporcu Yönetimi'nden koordinatör/admin yapabilir.`);
      onImported();
    } catch (e: any) {
      setError(e.message ?? "İçe aktarılamadı");
    } finally {
      setImporting(false);
    }
  };

  const notFoundCount = rows.filter((r) => r.branchNotFound).length;

  return (
    <Modal title="Excelden Toplu Sporcu Aktar" onClose={onClose}>
      <p className="mb-4 text-xs text-muted">
        Şablonu indir, "Adı Soyadı" ve "Branşı" sütunlarını doldur, sonra buradan yükle. Diğer bilgileri (boy, kilo,
        veli bilgisi vb.) sporcunun kendisi ya da admin sonradan tamamlar. Grup ataması koordinatör/admin tarafından
        ayrıca yapılır.
      </p>

      <button onClick={handleDownloadTemplate} className="mb-4 w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-bg">
        📥 Şablonu İndir
      </button>

      <div className="mb-4 border-t border-line pt-4">
        <label className="mb-2 block text-xs font-bold uppercase text-muted">Doldurulmuş Dosyayı Yükle</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && handlePickFile(e.target.files[0])}
          disabled={parsing}
          className="w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:border file:border-line file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-ink"
        />
        {fileName && <p className="mt-2 text-xs text-muted">{fileName}</p>}
      </div>

      {error && <p className="mb-3 text-sm font-semibold text-coral">{error}</p>}

      {rows.length > 0 && (
        <>
          <p className="mb-2 text-xs font-bold uppercase text-muted">
            Önizleme ({rows.length} sporcu{notFoundCount > 0 ? `, ${notFoundCount} branş eşleşmedi` : ""})
          </p>
          <div className="mb-4 max-h-60 overflow-y-auto rounded-lg border border-line">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between border-b border-line bg-surface px-3 py-2 last:border-0">
                <span className="text-sm font-semibold text-ink">{r.fullName}</span>
                {r.matchedBranch ? (
                  <span className="text-xs font-bold text-teal">{r.matchedBranch}</span>
                ) : r.branchNotFound ? (
                  <span className="text-xs font-semibold text-coral">"{r.rawBranch}" bulunamadı</span>
                ) : (
                  <span className="text-xs text-muted">Branş yok</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full rounded-lg bg-yellow px-4 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
          >
            {importing ? "Aktarılıyor…" : `İçe Aktar (${rows.length})`}
          </button>
        </>
      )}
    </Modal>
  );
}

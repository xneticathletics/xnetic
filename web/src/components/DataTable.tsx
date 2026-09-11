import { useEffect, useState, type ReactNode } from "react";

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
};

const DEFAULT_PAGE_SIZE = 25;

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyText,
  loading,
  onRowClick,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyText: string;
  loading: boolean;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

  // Filtre/arama değişip satır sayısı azaldığında geçerli sayfa artık
  // dışarıda kalabiliyor — bu durumda sessizce 1. sayfaya dön.
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface">
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 text-left font-semibold text-muted ${c.className ?? ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                  {emptyText}
                </td>
              </tr>
            )}
            {!loading &&
              pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={`border-b border-line last:border-0 hover:bg-surface/60 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 text-ink ${c.className ?? ""}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > pageSize && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, rows.length)} / {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Önceki sayfa"
              className="rounded-lg border border-line px-3 py-1.5 font-bold text-ink disabled:opacity-40"
            >
              ‹ Önceki
            </button>
            <span className="font-semibold text-ink">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              aria-label="Sonraki sayfa"
              className="rounded-lg border border-line px-3 py-1.5 font-bold text-ink disabled:opacity-40"
            >
              Sonraki ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

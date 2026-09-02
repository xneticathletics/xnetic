import { useState } from "react";

// Kulüp Ayarları gibi çok bölümlü sayfalarda, hepsi açıkken sayfa aşağı
// doğru uzayıp gitmesin diye — başlığa tıklayınca içerik açılıp kapanır.
export default function CollapsibleCard({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-3 rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left sm:p-5"
      >
        <span className="flex items-center gap-2">
          <span className="h-3 w-[3px] shrink-0 rounded-sm bg-yellow" />
          <span className="text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
        </span>
        <span className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>}
    </div>
  );
}

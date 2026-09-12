import type { ReactNode } from "react";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      onClick={onClose}
    >
      {/* İçerik ekrandan uzun olduğunda (özellikle telefonda) modal kutusu
          ekranın dışına taşıp ne arka plan ne kendisi kayan, tamamen
          kilitli bir sayfa bırakıyordu — flex-col + max-h-[90dvh] ile
          başlık/kapat sabit kalıp SADECE içerik kendi içinde kayıyor. */}
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-2xl border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-xl leading-none"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

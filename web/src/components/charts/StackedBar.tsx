// Kategorik dağılımı (ör. son antrenmanlarda kaç kez Katıldı/Gelmedi/İzinli)
// tek bir yatay çubukta oranlı segmentler olarak gösterir. Kategorik veri
// olduğu için her segment kendi sabit rengini korur (aynı renk her zaman
// aynı kategori — dataviz ilkesi: "renk varlığı takip eder, sırayı değil").
export type StackedBarSegment = { key: string; label: string; count: number; colorClassName: string };

export default function StackedBar({ segments }: { segments: StackedBarSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const visible = segments.filter((s) => s.count > 0);

  if (total === 0) {
    return <div className="h-2.5 w-full rounded-full bg-line" />;
  }

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-line">
        {visible.map((seg) => (
          <div
            key={seg.key}
            className={seg.colorClassName}
            style={{ width: `${(seg.count / total) * 100}%` }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {visible.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1 text-[11px] font-semibold text-muted">
            <span className={`h-2 w-2 rounded-full ${seg.colorClassName}`} />
            {seg.label} · {seg.count}
          </span>
        ))}
      </div>
    </div>
  );
}

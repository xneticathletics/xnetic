// Zaman içindeki tek bir ölçümün (ör. bir performans testinin değeri)
// değişimini gösteren basit bir çizgi grafik — harici bir kütüphane
// olmadan SVG polyline. Veri noktaları ESKİDEN YENİYE sıralı beklenir.
// dataviz ilkesi: ince (2px) çizgi, son noktada vurgulu bir nokta + değer
// etiketi (seçici doğrudan etiketleme — her noktaya değil, sadece en
// anlamlı olana).
export type TrendPoint = { label: string; value: number };

export default function TrendLine({
  points,
  height = 120,
  accentClassName = "stroke-teal",
  dotClassName = "fill-teal",
  formatValue = (v: number) => String(v),
}: {
  points: TrendPoint[];
  height?: number;
  accentClassName?: string;
  dotClassName?: string;
  formatValue?: (v: number) => string;
}) {
  if (points.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Henüz grafik için yeterli veri yok.</p>;
  }
  if (points.length === 1) {
    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <span className="text-2xl font-extrabold text-ink">{formatValue(points[0].value)}</span>
        <span className="text-xs text-muted">({points[0].label})</span>
      </div>
    );
  }

  const width = 400;
  const padX = 8;
  const padY = 16;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (p.value - min) / range) * (height - padY * 2);
    return { x, y, ...p };
  });
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <path d={path} className={`fill-none ${accentClassName}`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r={4} className={dotClassName} />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-muted">
        <span>{first.label}</span>
        <span className="text-ink">Son: {formatValue(last.value)}</span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

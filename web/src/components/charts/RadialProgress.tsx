// Bir yüzdeyi (ör. devam oranı) düz bir sayı yerine göze hitap eden bir
// halka olarak gösterir — bağımsız bir grafik kütüphanesi eklemeden
// (bundle'ı büyütmeden) basit bir SVG. Renk sabit tek bir vurgu rengi
// (accentClassName) alır — kategorik değil, tek bir büyüklüğü (magnitude)
// gösterdiği için dataviz ilkesine göre "sequential/tek renk" burada doğru
// seçim, çoklu renk (ör. değere göre kırmızı/sarı/yeşil) yanıltıcı olurdu.
export default function RadialProgress({
  value,
  size = 72,
  strokeWidth = 7,
  accentClassName = "stroke-teal",
  label,
  labelClassName = "text-sm font-extrabold text-ink",
}: {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  accentClassName?: string;
  label?: string;
  labelClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} strokeWidth={strokeWidth} className="fill-none stroke-line" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`fill-none ${accentClassName}`}
        />
      </svg>
      <span className={`absolute ${labelClassName}`}>{label ?? `%${Math.round(clamped)}`}</span>
    </div>
  );
}

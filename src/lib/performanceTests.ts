import { colors } from "../theme/tokens";

export type PerformanceTest = {
  key: string;
  name: string;
  unit: string;
  equipment?: string;
  instructions: string;
  // Test videosu daha sonra eklenecek — şimdilik boş, ileride bir video
  // kaynağı (URL) atanınca detay ekranındaki video simgesi otomatik
  // aktif olacak.
  videoUrl?: string;
};

export type PerformanceCategory = {
  key: string;
  label: string;
  icon: string;
  color: string;
  soft: string;
  tests: PerformanceTest[];
};

// Sahada en yaygın kullanılan testler, kategori kategori, kolaydan zora
// sıralı. Sabit bir katalog — kulüpler arası ortak, admin tarafından
// düzenlenmiyor (Beslenme'nin aksine).
export const PERFORMANCE_CATEGORIES: PerformanceCategory[] = [
  {
    key: "antropometrik",
    label: "Antropometrik",
    icon: "📏",
    color: colors.yellow,
    soft: colors.yellowSoft,
    tests: [],
  },
  {
    key: "surat",
    label: "Sürat",
    icon: "🏃",
    color: colors.coral,
    soft: colors.coralSoft,
    tests: [],
  },
  {
    key: "ceviklik",
    label: "Çeviklik",
    icon: "🔄",
    color: colors.teal,
    soft: colors.tealSoft,
    tests: [],
  },
  {
    key: "sicrama",
    label: "Sıçrama / Patlayıcı Kuvvet",
    icon: "💥",
    color: colors.yellow,
    soft: colors.yellowSoft,
    tests: [],
  },
  {
    key: "kuvvet",
    label: "Kuvvet",
    icon: "💪",
    color: colors.violet,
    soft: `${colors.violet}22`,
    tests: [],
  },
  {
    key: "dayaniklilik",
    label: "Dayanıklılık",
    icon: "🫁",
    color: colors.coral,
    soft: colors.coralSoft,
    tests: [],
  },
  {
    key: "esneklik",
    label: "Esneklik",
    icon: "🤸",
    color: colors.teal,
    soft: colors.tealSoft,
    tests: [],
  },
  {
    key: "denge",
    label: "Denge / Koordinasyon",
    icon: "⚖️",
    color: colors.violet,
    soft: `${colors.violet}22`,
    tests: [],
  },
];

export function getPerformanceCategory(key: string): PerformanceCategory | undefined {
  return PERFORMANCE_CATEGORIES.find((c) => c.key === key);
}

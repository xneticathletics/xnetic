// Performans Ölçümleri kataloğu — mobil uygulamadaki src/lib/performanceTests.ts
// ile birebir aynı test listesi/metinleri. Sabit bir katalog, kulüpler arası
// ortak; admin tarafından düzenlenmiyor.
//
// Not: mobildeki tokens.ts renkleri (colors.yellow vb.) burada Tailwind
// class adlarına karşılık gelen sabit string'lerle temsil ediliyor — Tailwind
// v4'ün JIT tarayıcısı dinamik `bg-${x}` gibi ifadeleri yakalayamadığı için
// her rengin tam class adları COLOR_CLASSES içinde literal olarak yazılı.

export type PerformanceColorKey = "yellow" | "teal" | "coral" | "violet";

export const COLOR_CLASSES: Record<
  PerformanceColorKey,
  { text: string; border: string; bgSoft: string; bg: string }
> = {
  yellow: { text: "text-yellow", border: "border-yellow", bgSoft: "bg-yellow/15", bg: "bg-yellow" },
  teal: { text: "text-teal", border: "border-teal", bgSoft: "bg-teal/15", bg: "bg-teal" },
  coral: { text: "text-coral", border: "border-coral", bgSoft: "bg-coral/15", bg: "bg-coral" },
  violet: { text: "text-violet", border: "border-violet", bgSoft: "bg-violet/15", bg: "bg-violet" },
};

export type PerformanceTest = {
  key: string;
  name: string;
  unit: string;
  equipment?: string;
  instructions: string;
};

export type PerformanceCategory = {
  key: string;
  label: string;
  icon: string;
  color: PerformanceColorKey;
  tests: PerformanceTest[];
};

export const PERFORMANCE_CATEGORIES: PerformanceCategory[] = [
  {
    key: "antropometrik",
    label: "Antropometrik",
    icon: "📏",
    color: "yellow",
    tests: [],
  },
  {
    key: "surat",
    label: "Sürat",
    icon: "🏃",
    color: "coral",
    tests: [],
  },
  {
    key: "ceviklik",
    label: "Çeviklik",
    icon: "🔄",
    color: "teal",
    tests: [],
  },
  {
    key: "sicrama",
    label: "Sıçrama / Patlayıcı Kuvvet",
    icon: "💥",
    color: "yellow",
    tests: [],
  },
  {
    key: "kuvvet",
    label: "Kuvvet",
    icon: "💪",
    color: "violet",
    tests: [],
  },
  {
    key: "dayaniklilik",
    label: "Dayanıklılık",
    icon: "🫁",
    color: "coral",
    tests: [],
  },
  {
    key: "esneklik",
    label: "Esneklik",
    icon: "🤸",
    color: "teal",
    tests: [],
  },
  {
    key: "denge",
    label: "Denge / Koordinasyon",
    icon: "⚖️",
    color: "violet",
    tests: [],
  },
];

export function getPerformanceCategory(key: string): PerformanceCategory | undefined {
  return PERFORMANCE_CATEGORIES.find((c) => c.key === key);
}

// Antrenörün fitness/kuvvet odasında sporculara uyguladığı yaygın
// egzersizler, vücut bölgesine göre kategorize edilmiş sabit bir katalog.
// Mobil uygulamadaki src/lib/fitnessExercises.ts ile birebir aynı veri —
// exercise "key" değerleri fitness_program_items / fitness_measurements
// tablolarında referans olarak kullanıldığı için mobil ile senkron kalmalı.

export type FitnessExercise = {
  key: string;
  name: string;
  bodyweight?: boolean; // true ise ağırlık alanı isteğe bağlıdır (ör. max tekrar testleri)
  instructions: string;
};

// Tailwind'in derleme zamanında sınıf adlarını tarayabilmesi için renkler
// sabit bir token adı (coral/teal/yellow/violet) olarak tutulur — asıl
// literal sınıf adları CATEGORY_COLOR_CLASSES içinde tanımlanır.
export type CategoryColorToken = "coral" | "teal" | "yellow" | "violet";

export type FitnessCategory = {
  key: string;
  label: string;
  icon: string;
  color: CategoryColorToken;
  exercises: FitnessExercise[];
};

export const CATEGORY_COLOR_CLASSES: Record<CategoryColorToken, { border: string; text: string; bg: string }> = {
  coral: { border: "border-coral", text: "text-coral", bg: "bg-coral/10" },
  teal: { border: "border-teal", text: "text-teal", bg: "bg-teal/10" },
  yellow: { border: "border-yellow", text: "text-yellow", bg: "bg-yellow/10" },
  violet: { border: "border-violet", text: "text-violet", bg: "bg-violet/10" },
};

export const FITNESS_CATEGORIES: FitnessCategory[] = [
  {
    key: "gogus",
    label: "Göğüs",
    icon: "🏋️",
    color: "coral",
    exercises: [],
  },
  {
    key: "sirt",
    label: "Sırt",
    icon: "🧗",
    color: "teal",
    exercises: [],
  },
  {
    key: "bacak",
    label: "Bacak",
    icon: "🦵",
    color: "yellow",
    exercises: [],
  },
  {
    key: "kol",
    label: "Kol",
    icon: "💪",
    color: "violet",
    exercises: [],
  },
  {
    key: "omuz",
    label: "Omuz",
    icon: "🤸",
    color: "coral",
    exercises: [],
  },
  {
    key: "karin",
    label: "Karın",
    icon: "🔥",
    color: "teal",
    exercises: [],
  },
];

export function getFitnessCategory(key: string): FitnessCategory | undefined {
  return FITNESS_CATEGORIES.find((c) => c.key === key);
}

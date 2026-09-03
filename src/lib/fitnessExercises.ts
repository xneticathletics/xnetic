import { colors } from "../theme/tokens";

export type FitnessExercise = {
  key: string;
  name: string;
  bodyweight?: boolean; // true ise ağırlık alanı isteğe bağlıdır (ör. max tekrar testleri)
  instructions: string;
  // Hareket videosu daha sonra eklenecek — şimdilik boş, ileride bir video
  // kaynağı (URL) atanınca detay ekranındaki video simgesi otomatik aktif
  // olacak.
  videoUrl?: string;
};

export type FitnessCategory = {
  key: string;
  label: string;
  icon: string;
  color: string;
  soft: string;
  exercises: FitnessExercise[];
};

// Antrenörün fitness/kuvvet odasında sporculara uyguladığı yaygın
// egzersizler, vücut bölgesine göre kategorize edilmiş sabit bir katalog.
export const FITNESS_CATEGORIES: FitnessCategory[] = [
  {
    key: "gogus",
    label: "Göğüs",
    icon: "🏋️",
    color: colors.coral,
    soft: colors.coralSoft,
    exercises: [],
  },
  {
    key: "sirt",
    label: "Sırt",
    icon: "🧗",
    color: colors.teal,
    soft: colors.tealSoft,
    exercises: [],
  },
  {
    key: "bacak",
    label: "Bacak",
    icon: "🦵",
    color: colors.yellow,
    soft: colors.yellowSoft,
    exercises: [],
  },
  {
    key: "kol",
    label: "Kol",
    icon: "💪",
    color: colors.violet,
    soft: `${colors.violet}22`,
    exercises: [],
  },
  {
    key: "omuz",
    label: "Omuz",
    icon: "🤸",
    color: colors.coral,
    soft: colors.coralSoft,
    exercises: [],
  },
  {
    key: "karin",
    label: "Karın",
    icon: "🔥",
    color: colors.teal,
    soft: colors.tealSoft,
    exercises: [],
  },
];

export function getFitnessCategory(key: string): FitnessCategory | undefined {
  return FITNESS_CATEGORIES.find((c) => c.key === key);
}

export function getFitnessExercise(exerciseKey: string): { exercise: FitnessExercise; category: FitnessCategory } | undefined {
  for (const category of FITNESS_CATEGORIES) {
    const exercise = category.exercises.find((e) => e.key === exerciseKey);
    if (exercise) return { exercise, category };
  }
  return undefined;
}

// Tasarım tokenleri — kulup-app.jsx prototipiyle birebir uyumlu.
export const colors = {
  bg: "#10122A",
  surface: "#1B1E3F",
  line: "#2C2F58",
  yellow: "#FFC845",
  teal: "#3FD6C6",
  coral: "#FF6B5D",
  violet: "#9B7BFF",
  ink: "#F5F5F2",
  muted: "#8B8FB8",
  // Kutucuk/kart aksanları için yumuşak (düşük opaklıklı) tonlar —
  // performans maliyeti yok, sadece 8 haneli hex (alpha dahil) renk kodları.
  yellowSoft: "#FFC84522",
  tealSoft: "#3FD6C622",
  coralSoft: "#FF6B5D22",
};

// Kutucukları sırayla dolaşarak renklendirmek için kullanılan aksan listesi.
export const accentRotation = [colors.yellow, colors.teal, colors.coral] as const;
export const accentSoftRotation = [colors.yellowSoft, colors.tealSoft, colors.coralSoft] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 22,
  full: 999,
};

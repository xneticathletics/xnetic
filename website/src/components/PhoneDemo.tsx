import { useState } from "react";

// Kaydolmadan denenebilen, örnek veriyle dolu bir "telefon" simülasyonu —
// gerçek uygulamanın React Native ekranlarını birebir yeniden üretmiyor,
// aynı veri modelini/etiketleri/renk paletini kullanan sadeleştirilmiş
// statik kopyalar. Hiçbir ekran gerçek bir API çağrısı yapmıyor — tamamen
// istemci tarafında, elle yazılmış örnek veriyle çalışıyor.

type Screen =
  | { kind: "home" }
  | { kind: "sporcuList" }
  | { kind: "sporcuDetail"; id: string }
  | { kind: "antrenorList" }
  | { kind: "antrenorDetail"; id: string }
  | { kind: "finans" }
  | { kind: "financeGroup"; group: string; branch: string }
  | { kind: "takvim" }
  | { kind: "fitnessHub" }
  | { kind: "fitnessProgram" }
  | { kind: "performansCategories" }
  | { kind: "performansDetail" }
  | { kind: "clubStructure" }
  | { kind: "clubStructureList"; listType: "gruplar" | "branslar" | "salonlar" }
  | { kind: "beslenme" }
  | { kind: "wellness" }
  | { kind: "calisma" }
  | { kind: "individualProgram" }
  | { kind: "sosyalAlan" }
  | { kind: "infoList"; title: string; backLabel: string; items: ListItem[] };

type ListItem = { icon?: string; title: string; sub: string; tag?: string };

const ATHLETES = [
  // Basketbol
  { id: "mert-c", name: "Mert Coşkun", group: "U10 Erkek", branch: "Basketbol", musabik: false, age: 10, height: 140, weight: 33 },
  { id: "baris-k", name: "Barış Kılıç", group: "U10 Erkek", branch: "Basketbol", musabik: false, age: 10, height: 138, weight: 32 },
  { id: "elif-k", name: "Elif Kaya", group: "U12 Kız", branch: "Basketbol", musabik: false, age: 12, height: 151, weight: 40 },
  { id: "su-y", name: "Su Yılmaz", group: "U12 Kız", branch: "Basketbol", musabik: false, age: 12, height: 149, weight: 39 },
  { id: "defne-a", name: "Defne Arık", group: "U14 Kız", branch: "Basketbol", musabik: true, age: 14, height: 162, weight: 50 },
  { id: "mehmet-y", name: "Mehmet Yılmaz", group: "U11 Erkek", branch: "Basketbol", musabik: false, age: 11, height: 146, weight: 36 },
  { id: "kerem-u", name: "Kerem Uslu", group: "U11 Erkek", branch: "Basketbol", musabik: false, age: 11, height: 144, weight: 35 },
  { id: "can-oz", name: "Can Öztürk", group: "U16 Umutlar", branch: "Basketbol", musabik: true, age: 16, height: 179, weight: 68 },
  // Futbol
  { id: "kaan", name: "Kaan Şahin", group: "U10 Spor Okulu", branch: "Futbol", musabik: false, age: 10, height: 139, weight: 32 },
  { id: "efe-k", name: "Efe Korkmaz", group: "U10 Spor Okulu", branch: "Futbol", musabik: false, age: 10, height: 141, weight: 33 },
  { id: "ece", name: "Ece Aydın", group: "U14 Kartallar", branch: "Futbol", musabik: false, age: 14, height: 160, weight: 49 },
  { id: "arda-b", name: "Arda Bulut", group: "U15 Erkek", branch: "Futbol", musabik: true, age: 15, height: 168, weight: 58 },
  // Voleybol
  { id: "ayse", name: "Ayşe Demir", group: "Genç Kız", branch: "Voleybol", musabik: true, age: 16, height: 171, weight: 60 },
  { id: "deniz", name: "Deniz Arslan", group: "Genç Kız", branch: "Voleybol", musabik: false, age: 16, height: 168, weight: 57 },
  { id: "naz-g", name: "Naz Güneş", group: "Midi Kız", branch: "Voleybol", musabik: false, age: 12, height: 155, weight: 42 },
  { id: "ela-t", name: "Ela Turan", group: "Mini Kız", branch: "Voleybol", musabik: false, age: 9, height: 135, weight: 30 },
  { id: "irem-s", name: "İrem Şahin", group: "2012-13 Spor Okulu", branch: "Voleybol", musabik: false, age: 13, height: 158, weight: 45 },
  // Yüzme
  { id: "zeynep", name: "Zeynep Kaya", group: "Balinalar", branch: "Yüzme", musabik: true, age: 15, height: 162, weight: 52 },
  { id: "asli-e", name: "Aslı Er", group: "Balinalar", branch: "Yüzme", musabik: false, age: 15, height: 160, weight: 50 },
  { id: "berk", name: "Berk Yıldız", group: "Foklar", branch: "Yüzme", musabik: false, age: 11, height: 142, weight: 36 },
  { id: "onur-a", name: "Onur Aydın", group: "Köpek Balıkları", branch: "Yüzme", musabik: true, age: 13, height: 156, weight: 44 },
  { id: "mira-c", name: "Mira Çelik", group: "U15 Yıldızlar", branch: "Yüzme", musabik: false, age: 14, height: 159, weight: 48 },
  // Cimnastik
  { id: "selin-a", name: "Selin Acar", group: "Canlar", branch: "Cimnastik", musabik: false, age: 7, height: 118, weight: 21 },
  { id: "yaren-d", name: "Yaren Doğan", group: "Çılgınlar", branch: "Cimnastik", musabik: true, age: 9, height: 128, weight: 25 },
  { id: "lina-k", name: "Lina Kurt", group: "Şirinler", branch: "Cimnastik", musabik: false, age: 6, height: 112, weight: 19 },
];

const BRANCHES = Array.from(new Set(ATHLETES.map((a) => a.branch)));

const GROUPS = Array.from(
  new Map(ATHLETES.map((a) => [`${a.branch}__${a.group}`, { group: a.group, branch: a.branch }])).values()
);

const VENUES = ["Gül Spor Salonu", "Kaktüs Halı Saha", "Lale Spor Salonu", "Merkez Spor Salonu"];

type CoachField = { label: string; value: string | null };
type CoachData = {
  id: string;
  name: string;
  branch: string;
  level: number;
  groups: string[];
  venue: string | null;
  isCoordinator: boolean;
  brans: CoachField[];
  kisisel: CoachField[];
  acil: CoachField[];
};

const COACHES: CoachData[] = [
  {
    id: "ahmet-y",
    name: "Ahmet Yılmaz",
    branch: "Basketbol",
    level: 3,
    groups: ["U10 Erkek", "U12 Kız", "U14 Kız"],
    venue: "Gül Spor Salonu",
    isCoordinator: false,
    brans: [
      { label: "Kademe", value: "3. Kademe" },
      { label: "Belge numarası", value: null },
      { label: "Deneyim yılı", value: null },
      { label: "Kulübe başlama", value: null },
    ],
    kisisel: [
      { label: "Telefon", value: "0532 111 22 33" },
      { label: "E-posta", value: null },
    ],
    acil: [
      { label: "Acil durum kişisi", value: null },
      { label: "Telefon", value: null },
    ],
  },
  {
    id: "caner-s",
    name: "Caner Şahinkaya",
    branch: "Basketbol",
    level: 2,
    groups: ["U12 Erkek", "U14 Erkek", "U16 Erkek", "U11 Erkek"],
    venue: null,
    isCoordinator: true,
    brans: [
      { label: "Kademe", value: "2. Kademe" },
      { label: "Belge numarası", value: "TR-2016-045" },
      { label: "Deneyim yılı", value: "9 yıl" },
      { label: "Kulübe başlama", value: "Mart 2019" },
    ],
    kisisel: [
      { label: "Telefon", value: "0533 444 55 66" },
      { label: "E-posta", value: "caner@example.com" },
    ],
    acil: [
      { label: "Acil durum kişisi", value: "Sena Şahinkaya (Eş)" },
      { label: "Telefon", value: "0533 444 55 66" },
    ],
  },
  {
    id: "cem-p",
    name: "Cem Polater",
    branch: "Futbol",
    level: 1,
    groups: ["U10 Spor Okulu", "U14 Erkek", "U16 Erkek", "U15 Erkek"],
    venue: "Kaktüs Halı Saha",
    isCoordinator: false,
    brans: [
      { label: "Kademe", value: "1. Kademe" },
      { label: "Belge numarası", value: "TR-2021-077" },
      { label: "Deneyim yılı", value: null },
      { label: "Kulübe başlama", value: "Şubat 2023" },
    ],
    kisisel: [
      { label: "Telefon", value: "0536 222 11 00" },
      { label: "E-posta", value: null },
    ],
    acil: [
      { label: "Acil durum kişisi", value: "Derya Polater (Eş)" },
      { label: "Telefon", value: null },
    ],
  },
  {
    id: "ece-c",
    name: "Ece Çelikbaş",
    branch: "Voleybol",
    level: 1,
    groups: ["2012-13 Spor Okulu", "Küçük Kız", "Mini Kız", "Genç Kız", "Midi Kız"],
    venue: "Lale Spor Salonu",
    isCoordinator: false,
    brans: [
      { label: "Kademe", value: "1. Kademe" },
      { label: "Belge numarası", value: null },
      { label: "Deneyim yılı", value: null },
      { label: "Kulübe başlama", value: "Ocak 2024" },
    ],
    kisisel: [
      { label: "Telefon", value: "0544 777 88 99" },
      { label: "E-posta", value: null },
    ],
    acil: [
      { label: "Acil durum kişisi", value: null },
      { label: "Telefon", value: null },
    ],
  },
  {
    id: "ege-a",
    name: "Ege Aydınlı",
    branch: "Basketbol",
    level: 1,
    groups: ["U13 Kız", "U15 Erkek", "U13 Erkek"],
    venue: null,
    isCoordinator: false,
    brans: [
      { label: "Kademe", value: "1. Kademe" },
      { label: "Belge numarası", value: null },
      { label: "Deneyim yılı", value: "3 yıl" },
      { label: "Kulübe başlama", value: "Eylül 2023" },
    ],
    kisisel: [
      { label: "Telefon", value: "0538 999 00 11" },
      { label: "E-posta", value: "ege@example.com" },
    ],
    acil: [
      { label: "Acil durum kişisi", value: null },
      { label: "Telefon", value: null },
    ],
  },
  {
    id: "emre-d",
    name: "Emre Demiröz",
    branch: "Voleybol",
    level: 1,
    groups: ["2014-15-16 Spor Okulu", "Midi Kız", "Yıldız Kız"],
    venue: null,
    isCoordinator: false,
    brans: [
      { label: "Kademe", value: "1. Kademe" },
      { label: "Belge numarası", value: "TR-2022-133" },
      { label: "Deneyim yılı", value: "2 yıl" },
      { label: "Kulübe başlama", value: "Ocak 2025" },
    ],
    kisisel: [
      { label: "Telefon", value: "0541 333 22 11" },
      { label: "E-posta", value: "emre@example.com" },
    ],
    acil: [
      { label: "Acil durum kişisi", value: "Aylin Demiröz (Anne)" },
      { label: "Telefon", value: "0541 333 22 11" },
    ],
  },
];

const PROGRAM_EXERCISES = [
  { name: "Şınav", sets: "4x15" },
  { name: "Plank", sets: "3x45sn" },
  { name: "Squat", sets: "4x20" },
];

const SPEED_HISTORY = [
  { date: "01.09.2026", value: "3.21 sn" },
  { date: "10.03.2026", value: "3.42 sn" },
  { date: "02.01.2026", value: "3.55 sn" },
];

const BESINLER_ITEMS: ListItem[] = [
  { icon: "🍗", title: "Tavuk Göğsü", sub: "165 kcal · 31g protein — kas onarımı için ideal, yağsız bir protein kaynağı.", tag: "100g" },
  { icon: "🥣", title: "Yulaf", sub: "389 kcal · 17g protein · 66g karbonhidrat — uzun süreli enerji için düşük glisemik indeksli tahıl.", tag: "100g" },
  { icon: "🍌", title: "Muz", sub: "89 kcal · yüksek potasyum — antrenman öncesi hızlı enerji ve kramp önleme.", tag: "1 adet" },
  { icon: "🥚", title: "Yumurta", sub: "78 kcal · 6g protein — tüm amino asitleri içeren tam bir protein kaynağı.", tag: "1 adet" },
  { icon: "🥑", title: "Avokado", sub: "160 kcal · sağlıklı yağlar — iltihap karşıtı omega-3 kaynağı.", tag: "100g" },
];

const TARIFLER_ITEMS: ListItem[] = [
  { icon: "🥤", title: "Proteinli Muzlu Smoothie", sub: "Süt, muz, yulaf ve protein tozu — antrenman sonrası toparlanma için.", tag: "5 dk" },
  { icon: "🍗", title: "Izgara Tavuklu Kinoa Salatası", sub: "Yüksek proteinli, dengeli bir öğün — maç öncesi ideal.", tag: "20 dk" },
  { icon: "🥣", title: "Yulaf ve Meyveli Kahvaltı", sub: "Yavaş sindirilen karbonhidrat — sabah antrenmanları için enerji deposu.", tag: "10 dk" },
];

const BESLENME_REHBERI_ITEMS: ListItem[] = [
  { title: "Antrenman Öncesi Beslenme", sub: "Performansı en üst düzeye çıkaran öğün zamanlaması ve içerik önerileri.", tag: "3 dk okuma" },
  { title: "Su Tüketimi ve Performans", sub: "Sıvı kaybının odaklanma ve dayanıklılığa etkisi.", tag: "4 dk okuma" },
  { title: "Büyüme Çağında Protein İhtiyacı", sub: "Genç sporcular için günlük protein hedefleri.", tag: "5 dk okuma" },
];

const FITNESS_GRUPLARI_ITEMS: ListItem[] = [
  { icon: "🏀", title: "Basketbol Kuvvet Grubu", sub: "Branştaki müsabık sporculardan oluşan özel kuvvet antrenmanı grubu.", tag: "3 sporcu" },
  { icon: "🏊", title: "Yüzme Sürat Grubu", sub: "Patlayıcı güç ve sürat odaklı ek çalışma grubu.", tag: "2 sporcu" },
  { icon: "🤸", title: "Cimnastik Esneklik Grubu", sub: "Genç müsabık sporcular için esneklik ve denge çalışması grubu.", tag: "1 sporcu" },
];

const MAGAZA_ITEMS: ListItem[] = [
  { icon: "👕", title: "Kulüp Forması", sub: "Nefes alabilen kumaş, isim/numara baskı seçeneği.", tag: "450 ₺" },
  { icon: "🩳", title: "Antrenman Şortu", sub: "Hafif ve esnek, tüm branşlara uygun.", tag: "180 ₺" },
  { icon: "🧴", title: "Su Matarası", sub: "1L, kulüp logolu, sızdırmaz kapak.", tag: "90 ₺" },
  { icon: "🎒", title: "Spor Çantası", sub: "Ayakkabı bölmeli, geniş iç hacim.", tag: "320 ₺" },
];

const ETKINLIK_ITEMS: ListItem[] = [
  { icon: "🏀", title: "Yaz Basketbol Kampı", sub: "15–20 Temmuz · Gül Spor Salonu", tag: "24 kayıt" },
  { icon: "🏆", title: "Bahar Turnuvası", sub: "3 Mayıs · Tüm branşlar", tag: "Kayıtlar açık" },
  { icon: "🏊", title: "Yüzme Deplasmanı", sub: "12 Eylül · Deniz Yüzme Havuzu", tag: "9 kayıt" },
];

const HOME_TILES: { key: Screen; icon: string; label: string; sub: string }[] = [
  { key: { kind: "sporcuList" }, icon: "👥", label: "Sporcu Yönetimi", sub: "Sporcular, gruplar" },
  { key: { kind: "antrenorList" }, icon: "🧑‍🏫", label: "Antrenörler", sub: "Kadro ve atamalar" },
  { key: { kind: "takvim" }, icon: "📅", label: "Takvim", sub: "Antrenman ve Müsabakalar" },
  { key: { kind: "clubStructure" }, icon: "🏛️", label: "Kulüp Yapısı", sub: "Grup, branş, salon" },
  { key: { kind: "finans" }, icon: "💰", label: "Finans", sub: "Aidat ve giderler" },
  { key: { kind: "performansCategories" }, icon: "⏱️", label: "Performans Ölçümleri", sub: "Hız, sıçrama, kuvvet" },
  { key: { kind: "beslenme" }, icon: "🥗", label: "Beslenme", sub: "Besinler ve Rehber" },
  { key: { kind: "fitnessHub" }, icon: "💪", label: "Fitness", sub: "Check-in ve çalışma takibi" },
  { key: { kind: "infoList", title: "Mağaza", backLabel: "Ana Ekran", items: MAGAZA_ITEMS }, icon: "🛍️", label: "Mağaza", sub: "Ürünler ve siparişler" },
  { key: { kind: "infoList", title: "Etkinlik/Turnuva/Kamp", backLabel: "Ana Ekran", items: ETKINLIK_ITEMS }, icon: "🏆", label: "Etkinlik/Turnuva/Kamp", sub: "Oluştur ve yönet" },
  { key: { kind: "sosyalAlan" }, icon: "📸", label: "Sosyal Alan", sub: "Fotoğraf ve videolar" },
];

function Avatar({ letter, color }: { letter: string; color: string }) {
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${color}`}>
      {letter}
    </div>
  );
}

function BackHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button onClick={onBack} className="mb-3 flex items-center gap-1 text-xs font-bold text-muted">
      <span aria-hidden="true">←</span> {label}
    </button>
  );
}

function GridTile({ icon, label, sub, border, onClick }: { icon: string; label: string; sub: string; border: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-xl border ${border} bg-surface p-3 text-left transition-colors active:opacity-80`}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-bg text-base">{icon}</div>
      <p className="text-xs font-bold leading-tight text-ink">{label}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-muted">{sub}</p>
    </button>
  );
}

function StructureRow({ icon, label, sub, border, onClick }: { icon: string; label: string; sub: string; border: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`mb-3 flex w-full items-center gap-3 rounded-xl border ${border} bg-surface p-3 text-left`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg text-lg">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="truncate text-[10px] text-muted">{sub}</p>
      </div>
      <span className="text-muted">›</span>
    </button>
  );
}

const HOME_ACCENTS: ("yellow" | "teal" | "coral")[] = ["yellow", "teal", "coral"];

function HomeTile({ icon, label, sub, accent, onClick }: { icon: string; label: string; sub: string; accent: "yellow" | "teal" | "coral"; onClick: () => void }) {
  const bar = { yellow: "bg-yellow", teal: "bg-teal", coral: "bg-coral" }[accent];
  return (
    <button onClick={onClick} className="relative overflow-hidden rounded-xl border border-line bg-surface p-3 pt-4 text-left transition-colors active:border-yellow">
      <span className={`absolute inset-x-0 top-0 h-[3px] ${bar}`} />
      <span className={`absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 ${bar}`} />
      <div className="relative mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-bg text-base">{icon}</div>
      <p className="relative text-xs font-bold leading-tight text-ink">{label}</p>
      <p className="relative mt-0.5 text-[10px] leading-tight text-muted">{sub}</p>
    </button>
  );
}

function StatPill({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-full border border-line bg-surface py-2">
      <p className="text-xs font-extrabold text-ink">{icon} {value}</p>
      <p className="text-[9px] font-semibold text-muted">{label}</p>
    </div>
  );
}

function TabIcon({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 px-1">
      <span className={`text-sm ${active ? "" : "opacity-60"}`}>{icon}</span>
      <span className={`text-[8px] font-semibold ${active ? "text-yellow" : "text-muted"}`}>{label}</span>
    </button>
  );
}

export default function PhoneDemo() {
  const [stack, setStack] = useState<Screen[]>([{ kind: "home" }]);
  const screen = stack[stack.length - 1];

  const push = (s: Screen) => setStack((prev) => [...prev, s]);
  const back = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const goHome = () => setStack([{ kind: "home" }]);

  return (
    <div className="mx-auto w-[300px] select-none">
      <div className="relative rounded-[2.5rem] border-[6px] border-line bg-[#0a0b1c] p-2 shadow-2xl shadow-black/40">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#0a0b1c]" />
        <div className="flex flex-col overflow-hidden rounded-[2rem] bg-bg">
          <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[11px] font-bold text-ink">
            <span>08:41</span>
            <span className="flex items-center gap-1 text-[10px]">
              <span>📶</span>
              <span>🔋</span>
            </span>
          </div>
          <div className="h-[452px] overflow-y-auto px-4 pb-4 pt-2">
          {screen.kind === "home" && <HomeScreen onSelect={push} />}
          {screen.kind === "sporcuList" && <AthleteListScreen onBack={back} onSelect={(id) => push({ kind: "sporcuDetail", id })} />}
          {screen.kind === "sporcuDetail" && <AthleteDetailScreen id={screen.id} onBack={back} />}
          {screen.kind === "antrenorList" && <CoachListScreen onBack={back} onSelect={(id) => push({ kind: "antrenorDetail", id })} />}
          {screen.kind === "antrenorDetail" && <CoachDetailScreen id={screen.id} onBack={back} />}
          {screen.kind === "finans" && <FinanceScreen onBack={back} onSelectGroup={(group, branch) => push({ kind: "financeGroup", group, branch })} />}
          {screen.kind === "financeGroup" && <FinanceGroupScreen group={screen.group} branch={screen.branch} onBack={back} />}
          {screen.kind === "takvim" && <CalendarScreen onBack={back} />}
          {screen.kind === "fitnessHub" && <FitnessHubScreen onBack={back} onSelect={push} />}
          {screen.kind === "fitnessProgram" && <FitnessProgramScreen onBack={back} />}
          {screen.kind === "performansCategories" && <PerformanceCategoriesScreen onBack={back} onSelect={() => push({ kind: "performansDetail" })} />}
          {screen.kind === "performansDetail" && <PerformanceDetailScreen onBack={back} />}
          {screen.kind === "clubStructure" && <ClubStructureScreen onBack={back} onSelect={(listType) => push({ kind: "clubStructureList", listType })} />}
          {screen.kind === "clubStructureList" && <ClubStructureListScreen listType={screen.listType} onBack={back} />}
          {screen.kind === "beslenme" && <BeslenmeScreen onBack={back} onSelect={push} />}
          {screen.kind === "wellness" && <WellnessScreen onBack={back} />}
          {screen.kind === "calisma" && <CalismaScreen onBack={back} />}
          {screen.kind === "individualProgram" && <IndividualProgramScreen onBack={back} />}
          {screen.kind === "sosyalAlan" && <SocialFeedScreen onBack={back} />}
          {screen.kind === "infoList" && <InfoListScreen title={screen.title} backLabel={screen.backLabel} items={screen.items} onBack={back} />}
          </div>
          <div className="flex items-end justify-around border-t border-line bg-bg px-2 pb-2 pt-1.5">
            <TabIcon icon="🏠" label="Ana Menü" active={screen.kind === "home"} onClick={goHome} />
            <TabIcon icon="💬" label="Mesajlar" />
            <div className="-mt-3 flex flex-col items-center gap-0.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow text-sm font-black text-bg shadow-lg">X</div>
              <span className="text-[8px] font-semibold text-muted">Asistan</span>
            </div>
            <TabIcon icon="⚙️" label="Kulüp Ayarları" />
            <TabIcon icon="👤" label="Profil" />
          </div>
        </div>
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-line" />
      </div>
    </div>
  );
}

function HomeScreen({ onSelect }: { onSelect: (s: Screen) => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow text-2xl font-black text-bg">X</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-ink">
            Hoş geldin, <span className="text-yellow">Demo</span>
          </p>
          <p className="truncate text-[10px] font-semibold text-muted">DEMO SPOR KULÜBÜ</p>
        </div>
        <span className="text-lg">🔔</span>
      </div>

      <div className="mb-3 flex gap-1.5">
        <StatPill icon="👥" value={ATHLETES.length} label="Aktif Sporcu" />
        <StatPill icon="🥇" value={BRANCHES.length} label="Branş" />
        <StatPill icon="🧑‍🏫" value={COACHES.length} label="Antrenör" />
      </div>

      <div className="mb-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-yellow">
          <span className="h-3 w-1 rounded-full bg-yellow" /> Duyurular
        </p>
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2.5">
          <p className="truncate text-[11px] font-semibold text-ink">Cumartesi tüm branşlarda kondisyon testi var</p>
          <span className="text-yellow">›</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {HOME_TILES.map((t, i) => (
          <HomeTile key={t.label} icon={t.icon} label={t.label} sub={t.sub} accent={HOME_ACCENTS[i % HOME_ACCENTS.length]} onClick={() => onSelect(t.key)} />
        ))}
      </div>
    </div>
  );
}

function AthleteListScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "okul" | "musabik">("all");

  const filtered = ATHLETES.filter((a) => {
    if (branchFilter && a.branch !== branchFilter) return false;
    if (typeFilter === "okul" && a.musabik) return false;
    if (typeFilter === "musabik" && !a.musabik) return false;
    if (query.trim() && !a.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    const branchCmp = a.branch.localeCompare(b.branch, "tr");
    if (branchCmp !== 0) return branchCmp;
    const groupCmp = a.group.localeCompare(b.group, "tr");
    if (groupCmp !== 0) return groupCmp;
    return a.name.localeCompare(b.name, "tr");
  });

  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="text-base font-extrabold text-ink">Tüm Sporcular</h3>
      <p className="mb-3 text-[11px] text-muted">{filtered.length} sporcu — Gruba göre</p>

      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setBranchFilter(null)}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${!branchFilter ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
        >
          Tüm Branşlar
        </button>
        {BRANCHES.map((b) => (
          <button
            key={b}
            onClick={() => setBranchFilter(b)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${branchFilter === b ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
          >
            {b}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Sporcu ara…"
        className="mb-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted focus:outline-none"
      />

      <div className="mb-3 flex gap-1.5">
        {([["all", "Tümü"], ["okul", "Spor Okulu"], ["musabik", "🏆 Müsabık"]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${typeFilter === val ? "border-teal bg-teal text-bg" : "border-line text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filtered.map((a) => (
          <button key={a.id} onClick={() => onSelect(a.id)} className="rounded-xl border border-line bg-surface p-2.5 text-left">
            <Avatar letter={a.name[0]} color="bg-yellow/20 text-yellow text-xs h-9 w-9" />
            <p className="mt-1.5 truncate text-xs font-bold text-ink">{a.name}</p>
            <p className="truncate text-[10px] text-muted">{a.group}</p>
            {a.musabik && <p className="mt-0.5 text-[9px] font-bold text-yellow">🏆 Müsabık</p>}
          </button>
        ))}
        {filtered.length === 0 && <p className="col-span-2 py-6 text-center text-xs text-muted">Eşleşen sporcu bulunamadı.</p>}
      </div>
    </div>
  );
}

function AthleteDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const a = ATHLETES.find((x) => x.id === id) ?? ATHLETES[0];
  return (
    <div>
      <BackHeader label="Sporcular" onBack={onBack} />
      <div className="mb-4 flex items-center gap-3">
        <Avatar letter={a.name[0]} color="bg-yellow/20 text-yellow text-2xl h-16 w-16" />
        <div>
          <p className="text-base font-extrabold text-ink">{a.name}</p>
          <p className="text-xs text-muted">{a.group}</p>
          <div className="mt-1 flex gap-1.5">
            <span className="rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-bold text-teal">Aktif</span>
            {a.musabik && <span className="rounded-full bg-yellow/20 px-2 py-0.5 text-[10px] font-bold text-yellow">🏆 Müsabık</span>}
          </div>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-line bg-surface p-2 text-center">
          <p className="text-sm font-extrabold text-ink">{a.age}</p>
          <p className="text-[9px] font-bold uppercase text-muted">Yaş</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2 text-center">
          <p className="text-sm font-extrabold text-ink">{a.height}</p>
          <p className="text-[9px] font-bold uppercase text-muted">Boy (cm)</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2 text-center">
          <p className="text-sm font-extrabold text-ink">{a.weight}</p>
          <p className="text-[9px] font-bold uppercase text-muted">Kilo (kg)</p>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        <div className="rounded-lg border border-violet py-2 text-center text-[10px] font-bold text-violet">📞 Veli Ara</div>
        <div className="rounded-lg border border-teal py-2 text-center text-[10px] font-bold text-teal">💬 Mesaj</div>
        <div className="rounded-lg border border-yellow py-2 text-center text-[10px] font-bold text-yellow">📋 Yoklama</div>
      </div>
      <p className="mb-1.5 text-xs font-bold text-ink">Son Antrenmanlar</p>
      <div className="rounded-lg border border-line bg-surface p-3 text-xs text-muted">Bu hafta 3 antrenmana katıldı.</div>
    </div>
  );
}

function CoachListScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState<string | null>(null);

  const filtered = COACHES.filter((c) => {
    if (branchFilter && c.branch !== branchFilter) return false;
    if (venueFilter && c.venue !== venueFilter) return false;
    if (query.trim() && !c.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Antrenörler</h3>

      <div className="mb-3 rounded-full bg-yellow py-2.5 text-center text-xs font-bold text-bg">+ Antrenör Ekle</div>

      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setBranchFilter(null)}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${!branchFilter ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
        >
          Tüm Branşlar
        </button>
        {BRANCHES.map((b) => (
          <button
            key={b}
            onClick={() => setBranchFilter(b)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${branchFilter === b ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setVenueFilter(null)}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${!venueFilter ? "border-teal bg-teal text-bg" : "border-line text-muted"}`}
        >
          Tüm Salonlar
        </button>
        {VENUES.map((v) => (
          <button
            key={v}
            onClick={() => setVenueFilter(v)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${venueFilter === v ? "border-teal bg-teal text-bg" : "border-line text-muted"}`}
          >
            {v}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Antrenör ara…"
        className="mb-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-2">
        {filtered.map((c) => (
          <button key={c.id} onClick={() => onSelect(c.id)} className="rounded-xl border border-line bg-surface p-2.5 text-left">
            <div className="mb-2 flex items-start justify-between gap-1">
              <Avatar letter={c.name[0]} color="bg-teal/20 text-teal text-xs h-9 w-9" />
              <div className="flex flex-col items-end gap-1">
                {c.venue ? (
                  <span className="rounded-full bg-violet px-1.5 py-0.5 text-center text-[7px] font-bold leading-tight text-bg">🏛️ SALON YETKİLİSİ</span>
                ) : c.isCoordinator ? (
                  <span className="rounded-full bg-yellow px-1.5 py-0.5 text-[7px] font-bold text-bg">★ KOORDİNATÖR</span>
                ) : null}
                <span className="rounded-full bg-line px-1.5 py-0.5 text-[7px] font-bold text-ink">{c.groups.length} GRUP</span>
              </div>
            </div>
            <p className="truncate text-xs font-bold text-ink">{c.name}</p>
            <p className="truncate text-[10px] font-semibold text-teal">{c.branch} · {c.level}. Kademe</p>
            <p className="mt-0.5 text-[9px] leading-tight text-muted">{c.groups.join(", ")}</p>
          </button>
        ))}
        {filtered.length === 0 && <p className="col-span-2 py-6 text-center text-xs text-muted">Eşleşen antrenör bulunamadı.</p>}
      </div>

      <div className="mt-3 rounded-full bg-yellow py-2.5 text-center text-xs font-bold text-bg">Antrenör Atamaları</div>
    </div>
  );
}

function CoachDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const c = COACHES.find((x) => x.id === id) ?? COACHES[0];
  const [tab, setTab] = useState<"brans" | "kisisel" | "acil">("brans");

  const missing = {
    brans: c.brans.filter((f) => f.value === null).length,
    kisisel: c.kisisel.filter((f) => f.value === null).length,
    acil: c.acil.filter((f) => f.value === null).length,
  };
  const totalFields = c.brans.length + c.kisisel.length + c.acil.length;
  const missingTotal = missing.brans + missing.kisisel + missing.acil;
  const profile = Math.round(((totalFields - missingTotal) / totalFields) * 100);
  const activeFields = c[tab];

  return (
    <div>
      <BackHeader label="Antrenörler" onBack={onBack} />
      <div className="mb-3 flex items-center gap-3">
        <Avatar letter={c.name[0]} color="bg-teal/20 text-teal text-2xl h-16 w-16" />
        <div className="min-w-0">
          <p className="text-base font-extrabold text-ink">{c.name}</p>
          <p className="text-xs text-muted">Antrenör</p>
          <span className="mt-1 inline-block rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-bg">
            {c.branch.toUpperCase()} · {c.level}. Kademe
          </span>
        </div>
      </div>
      <p className="mb-3 text-[11px] text-muted">{c.groups.join(", ")}</p>
      {c.venue && (
        <div className="mb-4">
          <span className="inline-block rounded-full bg-violet px-2.5 py-1 text-[10px] font-bold text-bg">🏛️ SALON YETKİLİSİ</span>
          <p className="mt-1 text-[11px] text-muted">{c.venue}</p>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-1.5">
        <div className="rounded-lg border border-teal py-2 text-center text-[10px] font-bold text-teal">📞 Ara</div>
        <div className="rounded-lg border border-violet py-2 text-center text-[10px] font-bold text-violet">💬 Mesaj</div>
        <div className="rounded-lg border border-yellow py-2 text-center text-[10px] font-bold text-yellow">📌 Atamalar</div>
      </div>

      <div className="mb-4 rounded-xl border border-line bg-surface p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-bold text-ink">Profil tamamlanma</p>
          <p className="text-xs font-extrabold text-yellow">%{profile}</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-yellow" style={{ width: `${profile}%` }} />
        </div>
        {missingTotal > 0 && <p className="mt-1.5 text-[10px] text-muted">{missingTotal} alan eksik.</p>}
      </div>

      <div className="mb-3 flex gap-1.5">
        {([["brans", "Branş"], ["kisisel", "Kişisel"], ["acil", "Acil"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
              tab === key ? "border-yellow bg-yellow text-bg" : "border-line text-muted"
            }`}
          >
            {label}
            <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] ${tab === key ? "bg-bg text-yellow" : "bg-line text-ink"}`}>
              {missing[key]}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-surface">
        {activeFields.map((f, i) => (
          <div key={f.label} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
            <span className="text-xs text-muted">{f.label}</span>
            {f.value ? (
              <span className="text-xs font-bold text-ink">{f.value}</span>
            ) : (
              <span className="rounded-full border border-dashed border-yellow px-2 py-0.5 text-[10px] font-bold text-yellow">+ Ekle</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceScreen({ onBack, onSelectGroup }: { onBack: () => void; onSelectGroup: (group: string, branch: string) => void }) {
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string | null>(null);

  const filteredGroups = GROUPS.filter((g) => {
    if (branchFilter && g.branch !== branchFilter) return false;
    const q = query.trim().toLowerCase();
    if (q) {
      const hasMatch = ATHLETES.some((a) => a.group === g.group && a.branch === g.branch && a.name.toLowerCase().includes(q));
      if (!hasMatch) return false;
    }
    return true;
  });

  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Finans</h3>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted">Aidat Gelirleri</p>
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        <div className="rounded-lg border border-teal py-2 text-center">
          <p className="text-xs font-extrabold text-teal">16.000 ₺</p>
          <p className="mt-0.5 text-[8px] font-semibold text-muted">Tahsil Edilen</p>
        </div>
        <div className="rounded-lg border border-yellow py-2 text-center">
          <p className="text-xs font-extrabold text-yellow">28.500 ₺</p>
          <p className="mt-0.5 text-[8px] font-semibold text-muted">Bekleyen</p>
        </div>
        <div className="rounded-lg border border-coral py-2 text-center">
          <p className="text-xs font-extrabold text-coral">3.000 ₺</p>
          <p className="mt-0.5 text-[8px] font-semibold text-muted">Vadesi Geçmiş</p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-1.5">
        <div className="rounded-lg border border-teal py-2 text-center text-[10px] font-bold text-teal">+ Gelir</div>
        <div className="rounded-lg border border-coral py-2 text-center text-[10px] font-bold text-coral">+ Gider</div>
        <div className="rounded-lg border border-violet py-2 text-center text-[10px] font-bold text-violet">Antrenör Ödemeleri</div>
        <div className="rounded-lg bg-yellow py-2 text-center text-[10px] font-bold text-bg">+ Aidat Planı</div>
      </div>

      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink">
          📄 Finansal Dökümanlarımı Listele <span className="text-muted">›</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink">
          ⚙️ Sabit Aidat Ücreti <span className="text-muted">›</span>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Sporcu ara…"
        className="mb-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted focus:outline-none"
      />

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setBranchFilter(null)}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${!branchFilter ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
        >
          Tüm Branşlar
        </button>
        {BRANCHES.map((b) => (
          <button
            key={b}
            onClick={() => setBranchFilter(b)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${branchFilter === b ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
          >
            {b}
          </button>
        ))}
      </div>

      <p className="mb-1.5 text-xs font-bold text-ink">Aidat Planları</p>
      <div className="grid grid-cols-2 gap-2">
        {filteredGroups.map((g) => (
          <button
            key={`${g.branch}-${g.group}`}
            onClick={() => onSelectGroup(g.group, g.branch)}
            className="rounded-lg border border-line bg-surface p-2.5 text-left"
          >
            <p className="text-xs font-bold text-ink">{g.group}</p>
            <p className="text-[10px] text-muted">{g.branch}</p>
          </button>
        ))}
        {filteredGroups.length === 0 && <p className="col-span-2 py-6 text-center text-xs text-muted">Eşleşen grup bulunamadı.</p>}
      </div>
    </div>
  );
}

function FinanceGroupScreen({ group, branch, onBack }: { group: string; branch: string; onBack: () => void }) {
  const statusMeta = {
    paid: { label: "Ödendi", color: "text-teal" },
    pending: { label: "Bekliyor", color: "text-yellow" },
    overdue: { label: "Gecikmiş", color: "text-coral" },
  };
  const statuses: ("paid" | "pending" | "overdue")[] = ["paid", "pending", "overdue"];
  const members = ATHLETES.filter((a) => a.group === group && a.branch === branch);

  return (
    <div>
      <BackHeader label="Finans" onBack={onBack} />
      <h3 className="text-base font-extrabold text-ink">{group}</h3>
      <p className="mb-4 text-[11px] text-muted">{branch} · Aidat Ödemeleri</p>
      <div className="rounded-lg border border-line bg-surface">
        {members.map((a, i) => {
          const status = statuses[i % statuses.length];
          return (
            <div key={a.id} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
              <div>
                <p className="text-xs font-semibold text-ink">{a.name}</p>
                <p className="text-[10px] text-muted">1.500 ₺</p>
              </div>
              <span className={`text-[10px] font-bold ${statusMeta[status].color}`}>{statusMeta[status].label}</span>
            </div>
          );
        })}
        {members.length === 0 && <p className="p-3 text-xs text-muted">Bu grupta sporcu yok.</p>}
      </div>
    </div>
  );
}

type CalDay = { day: number; type: "antrenman" | "musabaka" | null; today?: boolean };

const CAL_WEEKS: (CalDay | null)[][] = [
  [null, { day: 1, type: null }, { day: 2, type: null }, { day: 3, type: null }, { day: 4, type: null }, { day: 5, type: null }, { day: 6, type: null }],
  [
    { day: 7, type: "antrenman" }, { day: 8, type: "antrenman" }, { day: 9, type: "antrenman" }, { day: 10, type: "antrenman" },
    { day: 11, type: null, today: true }, { day: 12, type: "musabaka" }, { day: 13, type: "musabaka" },
  ],
  [
    { day: 14, type: "antrenman" }, { day: 15, type: null }, { day: 16, type: "antrenman" }, { day: 17, type: null },
    { day: 18, type: null }, { day: 19, type: null }, { day: 20, type: null },
  ],
  [
    { day: 21, type: "antrenman" }, { day: 22, type: null }, { day: 23, type: "antrenman" }, { day: 24, type: null },
    { day: 25, type: null }, { day: 26, type: null }, { day: 27, type: null },
  ],
  [{ day: 28, type: "antrenman" }, { day: 29, type: null }, { day: 30, type: "antrenman" }, null, null, null, null],
];

type CalEvent = { title: string; time: string; coaches?: string; venue: string; note?: string; status: string; branch: string };

function eventsForDay(day: number, type: "antrenman" | "musabaka" | null): CalEvent[] {
  if (day === 11) {
    return [
      { title: "Genç Kız", time: "16:00–17:00", coaches: "Ece Çelikbaş, Emre Demiröz", venue: "Lale Spor Salonu", note: "Maç Öncesi Hazırlık", status: "Planlandı", branch: "Voleybol" },
      { title: "U13 Erkek", time: "16:00–17:00", coaches: "Ege Aydınlı, Caner Şahinkaya", venue: "Gül Spor Salonu", status: "Planlandı", branch: "Basketbol" },
    ];
  }
  if (type === "antrenman") {
    const g = GROUPS[day % GROUPS.length];
    return [{ title: g.group, time: "17:00–18:00", venue: VENUES[day % VENUES.length], status: "Planlandı", branch: g.branch }];
  }
  if (type === "musabaka") {
    return [{ title: "Deplasman Maçı", time: "14:00–16:00", venue: "Rakip Salon", status: "Planlandı", branch: BRANCHES[day % BRANCHES.length] }];
  }
  return [];
}

function CalendarScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(11);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);

  const selectedType = CAL_WEEKS.flat().find((d) => d?.day === selected)?.type ?? null;
  const events = eventsForDay(selected, selectedType).filter((e) => !branchFilter || e.branch === branchFilter);

  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Takvim</h3>

      <div className="mb-3 grid grid-cols-2 gap-1.5">
        <div className="rounded-full bg-yellow py-2 text-center text-[10px] font-bold text-bg">+ Antrenman</div>
        <div className="rounded-full border border-coral py-2 text-center text-[10px] font-bold text-coral">+ Müsabaka</div>
        <div className="rounded-full border border-violet py-2 text-center text-[10px] font-bold text-violet">Sonuçlar</div>
        <div className="rounded-full bg-teal py-2 text-center text-[10px] font-bold text-bg">Takvimime Ekle</div>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setBranchFilter(null)}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${!branchFilter ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
        >
          Tüm Branşlar
        </button>
        {BRANCHES.map((b) => (
          <button
            key={b}
            onClick={() => setBranchFilter(b)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${branchFilter === b ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted">‹</span>
        <p className="text-sm font-extrabold text-ink">Eylül 2026</p>
        <span className="text-muted">›</span>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-bold text-muted">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mb-3 space-y-1.5">
        {CAL_WEEKS.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((d, di) =>
              d ? (
                <button
                  key={di}
                  onClick={() => setSelected(d.day)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
                    d.type === "antrenman" ? "bg-yellow text-bg" : d.type === "musabaka" ? "bg-coral text-bg" : "text-ink"
                  } ${d.today ? "ring-2 ring-teal ring-offset-2 ring-offset-bg" : ""} ${selected === d.day ? "outline outline-2 outline-yellow" : ""}`}
                >
                  {d.day}
                </button>
              ) : (
                <span key={di} />
              )
            )}
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-center gap-4 text-[9px] font-semibold text-muted">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow" /> Antrenman
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-coral" /> Müsabaka
        </span>
      </div>

      <p className="mb-2 text-xs font-bold text-ink">
        2026-09-{String(selected).padStart(2, "0")} · {events.length} etkinlik
      </p>
      <div className="space-y-2.5">
        {events.map((e, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-extrabold text-ink">{e.title}</p>
              <p className="text-xs font-bold text-teal">{e.time}</p>
            </div>
            {e.coaches && <p className="mb-0.5 text-[10px] text-muted">🧑‍🏫 {e.coaches}</p>}
            <p className="mb-0.5 text-[10px] text-muted">🏛️ {e.venue}</p>
            {e.note && <p className="mb-1.5 text-[10px] text-muted">📝 {e.note}</p>}
            <span className="mb-2 inline-block rounded-full bg-line px-2 py-0.5 text-[9px] font-bold text-muted">{e.status}</span>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <div className="rounded-lg border border-teal py-1.5 text-center text-[9px] font-bold text-teal">👥 Sporcular</div>
              <div className="rounded-lg border border-line py-1.5 text-center text-[9px] font-bold text-muted">Yoklama Al</div>
              <div className="rounded-lg border border-line py-1.5 text-center text-[9px] font-bold text-muted">✓ Tamamlandı</div>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="py-6 text-center text-xs text-muted">Bu gün için planlanan etkinlik yok.</p>}
      </div>
    </div>
  );
}

function FitnessHubScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (s: Screen) => void }) {
  const tiles: { icon: string; label: string; sub: string; border: string; target: Screen }[] = [
    { icon: "🌡️", label: "Wellness Check-in", sub: "Uyku, enerji ve ruh hâli takibi", border: "border-teal", target: { kind: "wellness" } },
    { icon: "🏋️", label: "Çalışma", sub: "Göğüs, sırt, bacak, kol, omuz", border: "border-coral", target: { kind: "calisma" } },
    {
      icon: "🎯", label: "Fitness Grupları", sub: "Branştaki müsabık sporculardan özel gruplar", border: "border-yellow",
      target: { kind: "infoList", title: "Fitness Grupları", backLabel: "Fitness", items: FITNESS_GRUPLARI_ITEMS },
    },
    { icon: "📋", label: "Program", sub: "Örnek Programlar", border: "border-teal", target: { kind: "fitnessProgram" } },
    { icon: "📝", label: "Bireysel Programlar", sub: "Sporcuların kendi yazdığı programlar", border: "border-coral", target: { kind: "individualProgram" } },
  ];
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Fitness</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <GridTile key={t.label} icon={t.icon} label={t.label} sub={t.sub} border={t.border} onClick={() => onSelect(t.target)} />
        ))}
      </div>
    </div>
  );
}

function FitnessProgramScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <BackHeader label="Fitness" onBack={onBack} />
      <h3 className="text-base font-extrabold text-ink">Genel Kuvvet Programı</h3>
      <p className="mb-4 text-[11px] text-muted">U15 Yıldızlar · Haftada 3 gün</p>
      <div className="space-y-2">
        {PROGRAM_EXERCISES.map((e) => (
          <div key={e.name} className="flex items-center justify-between rounded-lg border border-line bg-surface p-3">
            <span className="text-sm font-semibold text-ink">{e.name}</span>
            <span className="text-xs font-bold text-violet">{e.sets}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceCategoriesScreen({ onBack, onSelect }: { onBack: () => void; onSelect: () => void }) {
  const cats = [
    { icon: "🏃", label: "Sürat", action: onSelect },
    { icon: "🦘", label: "Sıçrama" },
    { icon: "💪", label: "Kuvvet" },
    { icon: "🫁", label: "Dayanıklılık" },
  ];
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Performans Ölçümleri</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {cats.map((c) => (
          <button key={c.label} onClick={c.action} className="rounded-xl border border-line bg-surface p-4 text-center">
            <div className="mb-1 text-xl">{c.icon}</div>
            <p className="text-xs font-bold text-ink">{c.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function PerformanceDetailScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <BackHeader label="Sürat" onBack={onBack} />
      <div className="mb-4 rounded-xl border border-coral bg-coral/10 p-4 text-center">
        <div className="mb-1 text-2xl">🏃</div>
        <p className="text-sm font-extrabold text-coral">20m Sürat</p>
        <p className="text-[10px] text-muted">Birim: sn</p>
      </div>
      <div className="mb-3 flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2.5">
        <div>
          <p className="text-[9px] font-bold uppercase text-muted">Sporcu</p>
          <p className="text-xs font-semibold text-ink">Zeynep Kaya</p>
        </div>
        <span className="rounded-lg bg-yellow px-2.5 py-1.5 text-[10px] font-bold text-bg">+ Ölçüm Ekle</span>
      </div>
      <div className="rounded-lg border border-line bg-surface">
        {SPEED_HISTORY.map((h, i) => (
          <div key={h.date} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
            <span className="text-xs text-muted">{h.date}</span>
            <span className="text-xs font-bold text-ink">{h.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClubStructureScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (t: "gruplar" | "branslar" | "salonlar") => void }) {
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Kulüp Yapısı</h3>
      <StructureRow icon="🏷️" label="Gruplar" sub="Yaş grupları / takımlar" border="border-yellow" onClick={() => onSelect("gruplar")} />
      <StructureRow icon="🥇" label="Branşlar" sub="Voleybol, basketbol vb." border="border-teal" onClick={() => onSelect("branslar")} />
      <StructureRow icon="🏟️" label="Salonlar" sub="Antrenman ve maç salonları" border="border-coral" onClick={() => onSelect("salonlar")} />
    </div>
  );
}

function ClubStructureListScreen({ listType, onBack }: { listType: "gruplar" | "branslar" | "salonlar"; onBack: () => void }) {
  const title = listType === "gruplar" ? "Gruplar" : listType === "branslar" ? "Branşlar" : "Salonlar";
  return (
    <div>
      <BackHeader label="Kulüp Yapısı" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">{title}</h3>
      <div className="rounded-lg border border-line bg-surface">
        {listType === "gruplar" &&
          GROUPS.map((g, i) => {
            const count = ATHLETES.filter((a) => a.group === g.group && a.branch === g.branch).length;
            return (
              <div key={`${g.branch}-${g.group}`} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
                <div>
                  <p className="text-xs font-semibold text-ink">{g.group}</p>
                  <p className="text-[10px] text-muted">{g.branch}</p>
                </div>
                <span className="text-[10px] font-bold text-yellow">{count} sporcu</span>
              </div>
            );
          })}
        {listType === "branslar" &&
          BRANCHES.map((b, i) => {
            const athleteCount = ATHLETES.filter((a) => a.branch === b).length;
            const coachCount = COACHES.filter((c) => c.branch === b).length;
            return (
              <div key={b} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
                <p className="text-xs font-semibold text-ink">{b}</p>
                <p className="text-[10px] text-muted">{athleteCount} sporcu · {coachCount} antrenör</p>
              </div>
            );
          })}
        {listType === "salonlar" &&
          VENUES.map((v, i) => (
            <div key={v} className={`flex items-center gap-2 px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
              <span className="text-sm">🏟️</span>
              <p className="text-xs font-semibold text-ink">{v}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

function BeslenmeScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (s: Screen) => void }) {
  const tiles: { icon: string; label: string; sub: string; border: string; target: Screen }[] = [
    { icon: "🍎", label: "Besinler", sub: "Besin değerleri ve faydaları", border: "border-teal", target: { kind: "infoList", title: "Besinler", backLabel: "Beslenme", items: BESINLER_ITEMS } },
    { icon: "🍳", label: "Sporcu Tarifleri", sub: "Pratik ve besleyici tarifler", border: "border-yellow", target: { kind: "infoList", title: "Sporcu Tarifleri", backLabel: "Beslenme", items: TARIFLER_ITEMS } },
    { icon: "📖", label: "Beslenme Rehberi", sub: "Bilimsel kaynaklı yazılar", border: "border-teal", target: { kind: "infoList", title: "Beslenme Rehberi", backLabel: "Beslenme", items: BESLENME_REHBERI_ITEMS } },
  ];
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-2 text-base font-extrabold text-ink">Beslenme</h3>
      <p className="mb-4 text-[11px] leading-relaxed text-muted">
        Buradaki bilgiler bilimsel makalelere ve büyük kuruluşlara dayanır; her içerikte kaynakça belirtilir.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <GridTile key={t.label} icon={t.icon} label={t.label} sub={t.sub} border={t.border} onClick={() => onSelect(t.target)} />
        ))}
      </div>
    </div>
  );
}

function InfoListScreen({ title, backLabel, items, onBack }: { title: string; backLabel: string; items: ListItem[]; onBack: () => void }) {
  return (
    <div>
      <BackHeader label={backLabel} onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">{title}</h3>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.title} className="rounded-lg border border-line bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-ink">
                {it.icon ? `${it.icon} ` : ""}
                {it.title}
              </p>
              {it.tag && <span className="shrink-0 rounded-full bg-line px-2 py-0.5 text-[9px] font-bold text-muted">{it.tag}</span>}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">{it.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const WELLNESS_HISTORY = [
  { date: "11 Eylül", sleep: 7, energy: 8, mood: 9 },
  { date: "10 Eylül", sleep: 6, energy: 6, mood: 7 },
  { date: "09 Eylül", sleep: 8, energy: 9, mood: 8 },
];

function WellnessScreen({ onBack }: { onBack: () => void }) {
  const today = WELLNESS_HISTORY[0];
  return (
    <div>
      <BackHeader label="Fitness" onBack={onBack} />
      <h3 className="mb-1 text-base font-extrabold text-ink">Wellness Check-in</h3>
      <p className="mb-4 text-[11px] text-muted">Zeynep Kaya · Bugün</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-teal py-3 text-center">
          <p className="text-lg">😴</p>
          <p className="text-sm font-extrabold text-teal">{today.sleep}/10</p>
          <p className="text-[9px] font-semibold text-muted">Uyku</p>
        </div>
        <div className="rounded-lg border border-yellow py-3 text-center">
          <p className="text-lg">⚡</p>
          <p className="text-sm font-extrabold text-yellow">{today.energy}/10</p>
          <p className="text-[9px] font-semibold text-muted">Enerji</p>
        </div>
        <div className="rounded-lg border border-coral py-3 text-center">
          <p className="text-lg">🙂</p>
          <p className="text-sm font-extrabold text-coral">{today.mood}/10</p>
          <p className="text-[9px] font-semibold text-muted">Ruh Hali</p>
        </div>
      </div>
      <p className="mb-1.5 text-xs font-bold text-ink">Geçmiş</p>
      <div className="rounded-lg border border-line bg-surface">
        {WELLNESS_HISTORY.slice(1).map((h, i) => (
          <div key={h.date} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
            <span className="text-xs text-muted">{h.date}</span>
            <span className="text-[10px] font-semibold text-ink">
              😴{h.sleep} ⚡{h.energy} 🙂{h.mood}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CALISMA_CATEGORIES = ["Göğüs", "Sırt", "Bacak", "Kol", "Omuz"];
const CALISMA_EXERCISE: Record<string, string> = { "Göğüs": "Bench Press", "Sırt": "Lat Pulldown", "Bacak": "Squat", "Kol": "Biceps Curl", "Omuz": "Shoulder Press" };
const CALISMA_HISTORY = [
  { date: "09.09.2026", sets: "3 set", detail: "40kg×10, 42kg×8, 45kg×6" },
  { date: "02.09.2026", sets: "3 set", detail: "38kg×10, 40kg×8, 42kg×6" },
  { date: "26.08.2026", sets: "3 set", detail: "36kg×10, 38kg×8, 40kg×6" },
];

function CalismaScreen({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState("Göğüs");
  return (
    <div>
      <BackHeader label="Fitness" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Çalışma</h3>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {CALISMA_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${category === c ? "border-yellow bg-yellow text-bg" : "border-line text-muted"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="mb-1.5 text-xs font-bold text-ink">{CALISMA_EXERCISE[category]} · {category}</p>
      <div className="rounded-lg border border-line bg-surface">
        {CALISMA_HISTORY.map((h, i) => (
          <div key={h.date} className={`px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">{h.date}</span>
              <span className="text-[10px] text-muted">{h.sets}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted">{h.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const INDIVIDUAL_PROGRAM_EXERCISES = [
  { name: "Mekik", sets: "4x20" },
  { name: "Burpee", sets: "3x12" },
  { name: "Jump Squat", sets: "4x15" },
];

function IndividualProgramScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <BackHeader label="Fitness" onBack={onBack} />
      <h3 className="text-base font-extrabold text-ink">Yaz Formu Programı</h3>
      <p className="mb-4 text-[11px] text-muted">Zeynep Kaya'nın kendi oluşturduğu program</p>
      <div className="space-y-2">
        {INDIVIDUAL_PROGRAM_EXERCISES.map((e) => (
          <div key={e.name} className="flex items-center justify-between rounded-lg border border-line bg-surface p-3">
            <span className="text-sm font-semibold text-ink">{e.name}</span>
            <span className="text-xs font-bold text-violet">{e.sets}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] leading-relaxed text-muted">
        Kulüp tarafından atanmadı — sporcu bu programı ve set/tekrar günlüğünü tamamen kendisi oluşturup takip ediyor.
      </p>
    </div>
  );
}

const SOCIAL_POSTS = [
  { emoji: "🏀", caption: "Basketbol antrenmanı", color: "bg-yellow/20" },
  { emoji: "🏆", caption: "Turnuva kupası", color: "bg-coral/20" },
  { emoji: "🏊", caption: "Yüzme yarışı", color: "bg-teal/20" },
  { emoji: "🤸", caption: "Cimnastik gösterisi", color: "bg-violet/20" },
  { emoji: "⚽", caption: "Maç günü", color: "bg-yellow/20" },
  { emoji: "🏐", caption: "Voleybol maçı", color: "bg-teal/20" },
];

function SocialFeedScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Sosyal Alan</h3>
      <div className="grid grid-cols-2 gap-2">
        {SOCIAL_POSTS.map((p) => (
          <div key={p.caption} className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-line ${p.color} p-3 text-center`}>
            <span className="text-3xl">{p.emoji}</span>
            <p className="text-[10px] font-semibold text-ink">{p.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

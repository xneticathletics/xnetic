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
  | { kind: "fitnessHub" }
  | { kind: "fitnessProgram" }
  | { kind: "performansCategories" }
  | { kind: "performansDetail" }
  | { kind: "clubStructure" }
  | { kind: "clubStructureList"; listType: "gruplar" | "branslar" | "salonlar" }
  | { kind: "beslenme" }
  | { kind: "placeholder"; label: string; icon: string; note: string };

const ATHLETES = [
  { id: "mehmet-y", name: "Mehmet Yılmaz", group: "U13 Filizler", branch: "Basketbol", musabik: false, age: 13, height: 158, weight: 48 },
  { id: "elif-k", name: "Elif Kaya", group: "U13 Filizler", branch: "Basketbol", musabik: false, age: 13, height: 155, weight: 46 },
  { id: "can-oz", name: "Can Öztürk", group: "U16 Umutlar", branch: "Basketbol", musabik: true, age: 16, height: 179, weight: 68 },
  { id: "ayse", name: "Ayşe Demir", group: "U17 Gençler", branch: "Voleybol", musabik: true, age: 17, height: 171, weight: 60 },
  { id: "deniz", name: "Deniz Arslan", group: "U17 Gençler", branch: "Voleybol", musabik: false, age: 17, height: 168, weight: 57 },
  { id: "zeynep", name: "Zeynep Kaya", group: "U15 Yıldızlar", branch: "Yüzme", musabik: true, age: 15, height: 162, weight: 52 },
  { id: "berk", name: "Berk Yıldız", group: "U11 Minikler", branch: "Yüzme", musabik: false, age: 11, height: 142, weight: 36 },
  { id: "kaan", name: "Kaan Şahin", group: "U14 Kartallar", branch: "Futbol", musabik: true, age: 14, height: 163, weight: 51 },
  { id: "ece", name: "Ece Aydın", group: "U14 Kartallar", branch: "Futbol", musabik: false, age: 14, height: 160, weight: 49 },
];

const BRANCHES = Array.from(new Set(ATHLETES.map((a) => a.branch)));

const GROUPS = Array.from(
  new Map(ATHLETES.map((a) => [`${a.branch}__${a.group}`, { group: a.group, branch: a.branch }])).values()
);

const VENUES = ["Gül Spor Salonu", "Merkez Spor Salonu", "Deniz Yüzme Havuzu"];

type CoachField = { label: string; value: string | null };
type CoachData = {
  id: string;
  name: string;
  branch: string;
  level: number;
  groups: string[];
  venue: string | null;
  brans: CoachField[];
  kisisel: CoachField[];
  acil: CoachField[];
};

const COACHES: CoachData[] = [
  {
    id: "mehmet-d",
    name: "Mehmet Demir",
    branch: "Yüzme",
    level: 1,
    groups: ["U11 Minikler", "U15 Yıldızlar"],
    venue: "Gül Spor Salonu",
    brans: [
      { label: "Kademe", value: "1. Kademe" },
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
    id: "elif-c",
    name: "Elif Çelik",
    branch: "Basketbol",
    level: 2,
    groups: ["U13 Filizler", "U16 Umutlar"],
    venue: null,
    brans: [
      { label: "Kademe", value: "2. Kademe" },
      { label: "Belge numarası", value: null },
      { label: "Deneyim yılı", value: "7 yıl" },
      { label: "Kulübe başlama", value: "Eylül 2022" },
    ],
    kisisel: [
      { label: "Telefon", value: "0555 222 33 44" },
      { label: "E-posta", value: "elif@example.com" },
    ],
    acil: [
      { label: "Acil durum kişisi", value: "Ali Çelik (Eş)" },
      { label: "Telefon", value: null },
    ],
  },
];

const PAYMENTS = [
  { name: "Zeynep Kaya", amount: "1.500 ₺", status: "paid" as const },
  { name: "Mehmet Yılmaz", amount: "1.500 ₺", status: "pending" as const },
  { name: "Ayşe Demir", amount: "1.500 ₺", status: "overdue" as const },
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

const HOME_TILES: { key: Screen; icon: string; label: string; sub: string }[] = [
  { key: { kind: "sporcuList" }, icon: "👥", label: "Sporcu Yönetimi", sub: "Sporcular, gruplar" },
  { key: { kind: "antrenorList" }, icon: "🧑‍🏫", label: "Antrenörler", sub: "Kadro ve atamalar" },
  { key: { kind: "placeholder", label: "Takvim", icon: "📅", note: "Antrenman ve müsabaka programı, yoklama." }, icon: "📅", label: "Takvim", sub: "Antrenman ve Müsabakalar" },
  { key: { kind: "clubStructure" }, icon: "🏛️", label: "Kulüp Yapısı", sub: "Grup, branş, salon" },
  { key: { kind: "finans" }, icon: "💰", label: "Finans", sub: "Aidat ve giderler" },
  { key: { kind: "performansCategories" }, icon: "⏱️", label: "Performans Ölçümleri", sub: "Hız, sıçrama, kuvvet" },
  { key: { kind: "beslenme" }, icon: "🥗", label: "Beslenme", sub: "Besinler ve Rehber" },
  { key: { kind: "fitnessHub" }, icon: "💪", label: "Fitness", sub: "Check-in ve çalışma takibi" },
  { key: { kind: "placeholder", label: "Mağaza", icon: "🛍️", note: "Forma ve ekipman satışı." }, icon: "🛍️", label: "Mağaza", sub: "Ürünler ve siparişler" },
  { key: { kind: "placeholder", label: "Etkinlik/Turnuva/Kamp", icon: "🏆", note: "Etkinlik oluştur ve kayıtları yönet." }, icon: "🏆", label: "Etkinlik/Turnuva/Kamp", sub: "Oluştur ve yönet" },
  { key: { kind: "placeholder", label: "Sosyal Alan", icon: "📸", note: "Fotoğraf ve video paylaşımı." }, icon: "📸", label: "Sosyal Alan", sub: "Fotoğraf ve videolar" },
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
        <div className="h-[560px] overflow-y-auto rounded-[2rem] bg-bg px-4 pb-4 pt-7">
          {screen.kind === "home" && <HomeScreen onSelect={push} />}
          {screen.kind === "sporcuList" && <AthleteListScreen onBack={back} onSelect={(id) => push({ kind: "sporcuDetail", id })} />}
          {screen.kind === "sporcuDetail" && <AthleteDetailScreen id={screen.id} onBack={back} />}
          {screen.kind === "antrenorList" && <CoachListScreen onBack={back} onSelect={(id) => push({ kind: "antrenorDetail", id })} />}
          {screen.kind === "antrenorDetail" && <CoachDetailScreen id={screen.id} onBack={back} />}
          {screen.kind === "finans" && <FinanceScreen onBack={back} />}
          {screen.kind === "fitnessHub" && <FitnessHubScreen onBack={back} onSelect={push} />}
          {screen.kind === "fitnessProgram" && <FitnessProgramScreen onBack={back} />}
          {screen.kind === "performansCategories" && <PerformanceCategoriesScreen onBack={back} onSelect={() => push({ kind: "performansDetail" })} />}
          {screen.kind === "performansDetail" && <PerformanceDetailScreen onBack={back} />}
          {screen.kind === "clubStructure" && <ClubStructureScreen onBack={back} onSelect={(listType) => push({ kind: "clubStructureList", listType })} />}
          {screen.kind === "clubStructureList" && <ClubStructureListScreen listType={screen.listType} onBack={back} />}
          {screen.kind === "beslenme" && <BeslenmeScreen onBack={back} onSelect={push} />}
          {screen.kind === "placeholder" && <PlaceholderScreen label={screen.label} icon={screen.icon} note={screen.note} onBack={back} />}
        </div>
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-line" />
      </div>
      {screen.kind !== "home" && (
        <button onClick={goHome} className="mx-auto mt-4 block text-xs font-bold text-teal hover:underline">
          ⌂ Ana Ekrana Dön
        </button>
      )}
    </div>
  );
}

function HomeScreen({ onSelect }: { onSelect: (s: Screen) => void }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted">4 Eylül 2026 Cuma</p>
      <h3 className="mb-4 text-lg font-extrabold text-ink">Demo Spor Kulübü</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {HOME_TILES.map((t) => (
          <button
            key={t.label}
            onClick={() => onSelect(t.key)}
            className="rounded-xl border border-line bg-surface p-3 text-left transition-colors active:border-yellow"
          >
            <div className="mb-1.5 text-xl">{t.icon}</div>
            <p className="text-xs font-bold leading-tight text-ink">{t.label}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-muted">{t.sub}</p>
          </button>
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
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Antrenörler</h3>
      <div className="space-y-2">
        {COACHES.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left"
          >
            <Avatar letter={c.name[0]} color="bg-teal/20 text-teal" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{c.name}</p>
              <p className="truncate text-[11px] text-muted">{c.branch} · {c.level}. Kademe</p>
            </div>
          </button>
        ))}
      </div>
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

function FinanceScreen({ onBack }: { onBack: () => void }) {
  const statusMeta = {
    paid: { label: "Ödendi", color: "text-teal" },
    pending: { label: "Bekliyor", color: "text-yellow" },
    overdue: { label: "Gecikmiş", color: "text-coral" },
  };
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Finans</h3>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted">Aidat Gelirleri</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-line bg-surface p-2.5 text-center">
          <p className="text-sm font-extrabold text-teal">1.500 ₺</p>
          <p className="mt-0.5 text-[9px] font-semibold text-muted">Tahsil Edilen</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5 text-center">
          <p className="text-sm font-extrabold text-yellow">1.500 ₺</p>
          <p className="mt-0.5 text-[9px] font-semibold text-muted">Bekleyen</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5 text-center">
          <p className="text-sm font-extrabold text-coral">1.500 ₺</p>
          <p className="mt-0.5 text-[9px] font-semibold text-muted">Vadesi Geçmiş</p>
        </div>
      </div>
      <p className="mb-1.5 text-xs font-bold text-ink">Aidat Ödemeleri</p>
      <div className="rounded-lg border border-line bg-surface">
        {PAYMENTS.map((p, i) => (
          <div key={p.name} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
            <div>
              <p className="text-xs font-semibold text-ink">{p.name}</p>
              <p className="text-[10px] text-muted">{p.amount}</p>
            </div>
            <span className={`text-[10px] font-bold ${statusMeta[p.status].color}`}>{statusMeta[p.status].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FitnessHubScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (s: Screen) => void }) {
  const tiles: { icon: string; label: string; sub: string; border: string; target: Screen }[] = [
    {
      icon: "🌡️", label: "Wellness Check-in", sub: "Uyku, enerji ve ruh hâli takibi", border: "border-teal",
      target: { kind: "placeholder", label: "Wellness Check-in", icon: "🌡️", note: "Sporcunun günlük uyku, enerji ve ruh hâli takibi." },
    },
    {
      icon: "🏋️", label: "Çalışma", sub: "Göğüs, sırt, bacak, kol, omuz", border: "border-coral",
      target: { kind: "placeholder", label: "Çalışma", icon: "🏋️", note: "Bölgeye göre hareket kütüphanesi ve ağırlık/tekrar geçmişi." },
    },
    {
      icon: "🎯", label: "Fitness Grupları", sub: "Branştaki müsabık sporculardan özel gruplar", border: "border-yellow",
      target: { kind: "placeholder", label: "Fitness Grupları", icon: "🎯", note: "Branştaki müsabık sporculardan oluşturulan özel fitness grupları." },
    },
    { icon: "📋", label: "Program", sub: "Örnek Programlar", border: "border-teal", target: { kind: "fitnessProgram" } },
    {
      icon: "📝", label: "Bireysel Programlar", sub: "Sporcuların kendi yazdığı programlar", border: "border-coral",
      target: { kind: "placeholder", label: "Bireysel Programlar", icon: "📝", note: "Sporcunun kulüpten bağımsız kendi oluşturduğu program ve set/tekrar günlüğü." },
    },
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
    {
      icon: "🍎", label: "Besinler", sub: "Besin değerleri ve faydaları", border: "border-teal",
      target: { kind: "placeholder", label: "Besinler", icon: "🍎", note: "Besin değerleri, faydaları ve porsiyon önerileri — kaynakçalı." },
    },
    {
      icon: "🍳", label: "Sporcu Tarifleri", sub: "Pratik ve besleyici tarifler", border: "border-yellow",
      target: { kind: "placeholder", label: "Sporcu Tarifleri", icon: "🍳", note: "Antrenman öncesi/sonrası pratik ve besleyici tarifler." },
    },
    {
      icon: "📖", label: "Beslenme Rehberi", sub: "Bilimsel kaynaklı yazılar", border: "border-teal",
      target: { kind: "placeholder", label: "Beslenme Rehberi", icon: "📖", note: "Bilimsel makalelere dayanan beslenme yazıları." },
    },
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

function PlaceholderScreen({ label, icon, note, onBack }: { label: string; icon: string; note: string; onBack: () => void }) {
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <div className="flex flex-col items-center rounded-xl border border-line bg-surface p-8 text-center">
        <div className="mb-3 text-3xl">{icon}</div>
        <p className="mb-1.5 text-sm font-extrabold text-ink">{label}</p>
        <p className="text-xs leading-relaxed text-muted">{note}</p>
      </div>
    </div>
  );
}

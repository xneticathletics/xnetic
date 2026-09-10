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
  | { kind: "placeholder"; label: string; icon: string; note: string };

const ATHLETES = [
  { id: "zeynep", name: "Zeynep Kaya", group: "U15 Yıldızlar", branch: "Yüzme", musabik: true, age: 15, height: 162, weight: 52 },
  { id: "mehmet-y", name: "Mehmet Yılmaz", group: "U13 Filizler", branch: "Basketbol", musabik: false, age: 13, height: 158, weight: 48 },
  { id: "ayse", name: "Ayşe Demir", group: "U17 Gençler", branch: "Voleybol", musabik: true, age: 17, height: 171, weight: 60 },
];

const COACHES = [
  { id: "mehmet-d", name: "Mehmet Demir", branch: "Yüzme", level: 1, groups: ["U15 Yıldızlar", "U11 Minikler"] },
  { id: "elif", name: "Elif Çelik", branch: "Basketbol", level: 2, groups: ["U13 Filizler"] },
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
  { key: { kind: "placeholder", label: "Kulüp Yapısı", icon: "🏛️", note: "Branş, grup ve salon tanımları." }, icon: "🏛️", label: "Kulüp Yapısı", sub: "Grup, branş, salon" },
  { key: { kind: "finans" }, icon: "💰", label: "Finans", sub: "Aidat ve giderler" },
  { key: { kind: "performansCategories" }, icon: "⏱️", label: "Performans Ölçümleri", sub: "Hız, sıçrama, kuvvet" },
  { key: { kind: "placeholder", label: "Beslenme", icon: "🥗", note: "Besin ve tarif rehberi." }, icon: "🥗", label: "Beslenme", sub: "Besinler ve Rehber" },
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
          {screen.kind === "fitnessHub" && <FitnessHubScreen onBack={back} onSelect={() => push({ kind: "fitnessProgram" })} />}
          {screen.kind === "fitnessProgram" && <FitnessProgramScreen onBack={back} />}
          {screen.kind === "performansCategories" && <PerformanceCategoriesScreen onBack={back} onSelect={() => push({ kind: "performansDetail" })} />}
          {screen.kind === "performansDetail" && <PerformanceDetailScreen onBack={back} />}
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
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Sporcular</h3>
      <div className="mb-3 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">Sporcu ara…</div>
      <div className="space-y-2">
        {ATHLETES.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left"
          >
            <Avatar letter={a.name[0]} color="bg-yellow/20 text-yellow" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{a.name}</p>
              <p className="truncate text-[11px] text-muted">{a.group} · {a.branch}</p>
            </div>
            {a.musabik && <span className="shrink-0 text-sm">🏆</span>}
          </button>
        ))}
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
  return (
    <div>
      <BackHeader label="Antrenörler" onBack={onBack} />
      <div className="mb-4 flex items-center gap-3">
        <Avatar letter={c.name[0]} color="bg-teal/20 text-teal text-2xl h-16 w-16" />
        <div>
          <p className="text-base font-extrabold text-ink">{c.name}</p>
          <p className="text-xs text-muted">Antrenör</p>
          <span className="mt-1 inline-block rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-bg">
            {c.branch.toUpperCase()} · {c.level}. Kademe
          </span>
        </div>
      </div>
      <p className="mb-1.5 text-xs font-bold text-ink">Sorumlu Gruplar</p>
      <div className="mb-4 rounded-lg border border-line bg-surface">
        {c.groups.map((g, i) => (
          <div key={g} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}>
            <span className="text-xs font-semibold text-ink">{g}</span>
            <span className="text-[10px] text-muted">{c.branch}</span>
          </div>
        ))}
      </div>
      <p className="mb-1.5 text-xs font-bold text-ink">İzin İşlemleri</p>
      <div className="rounded-lg border border-line bg-surface p-3 text-xs text-muted">Henüz izin kaydı yok.</div>
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

function FitnessHubScreen({ onBack, onSelect }: { onBack: () => void; onSelect: () => void }) {
  const tiles = [
    { icon: "🏋️", label: "Egzersiz Kütüphanesi" },
    { icon: "🎯", label: "Fitness Grupları" },
    { icon: "📋", label: "Programlar", action: onSelect },
    { icon: "📝", label: "Bireysel Programlar" },
    { icon: "🌡️", label: "Wellness Check-in" },
  ];
  return (
    <div>
      <BackHeader label="Ana Ekran" onBack={onBack} />
      <h3 className="mb-3 text-base font-extrabold text-ink">Fitness</h3>
      <div className="space-y-2">
        {tiles.map((t) => (
          <button
            key={t.label}
            onClick={t.action}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left"
          >
            <span className="text-lg">{t.icon}</span>
            <span className="text-sm font-bold text-ink">{t.label}</span>
            <span className="ml-auto text-muted">›</span>
          </button>
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

import type { ReactNode } from "react";

// Ekran görüntüsü olmayan özellikler için, uygulamanın görünümüne uygun
// (koyu lacivert + sarı/turkuaz/mercan/mor) telefon çerçeveli çizimler.
// Tamamen statik — gerçek veri/istek içermez.

export type MockKind = "magaza" | "mesajlasma" | "guvenlik";

function Phone({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative flex h-[558px] w-[279px] shrink-0 flex-col overflow-hidden rounded-3xl border border-line bg-bg shadow-2xl shadow-black/40">
      <div className="flex items-center gap-3 px-4 pb-3 pt-5">
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-[10px] font-bold text-yellow">
          🏠 Ana Sayfa
        </span>
        <span className="truncate text-sm font-bold text-ink">{title}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden px-4">{children}</div>
      <div className="flex items-end justify-between border-t border-line bg-bg px-3 pb-2 pt-2 text-center text-[8px] text-muted">
        {["🏠 Ana Menü", "📸 Sosyal", "🛍️ Mağaza", "🏆 Etkinlik", "💬 Mesajlar", "👤 Profil"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Shop() {
  const products = [
    { emoji: "👕", name: "Antrenman Forması", price: "450 ₺", sizes: "S M L XL", tone: "border-yellow" },
    { emoji: "🎒", name: "Sırt Çantası", price: "650 ₺", sizes: "Tek beden", tone: "border-teal" },
    { emoji: "🧦", name: "Spor Çorap", price: "120 ₺", sizes: "36-40 · 41-45", tone: "border-coral" },
    { emoji: "🏀", name: "Kulüp Topu", price: "800 ₺", sizes: "5 · 6 · 7", tone: "border-violet" },
  ];
  return (
    <Phone title="Mağaza">
      <div className="grid grid-cols-2 gap-2.5">
        {products.map((p) => (
          <div key={p.name} className={`rounded-2xl border-2 bg-surface p-2.5 ${p.tone}`}>
            <div className="flex h-16 items-center justify-center rounded-xl bg-bg text-3xl">{p.emoji}</div>
            <div className="mt-2 text-[11px] font-bold leading-tight text-ink">{p.name}</div>
            <div className="mt-0.5 text-[10px] text-muted">{p.sizes}</div>
            <div className="mt-1.5 text-xs font-extrabold text-yellow">{p.price}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Son sipariş</div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-ink">
          <span>Antrenman Forması · M</span>
          <span className="rounded-full bg-teal/20 px-2 py-0.5 text-[9px] font-bold text-teal">Hazırlanıyor</span>
        </div>
      </div>
    </Phone>
  );
}

function Messaging() {
  return (
    <Phone title="Mesajlar">
      <div className="rounded-2xl border-2 border-yellow bg-surface p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-yellow">📢 Duyuru</div>
        <div className="mt-1 text-xs font-bold text-ink">Cumartesi antrenmanı 10:00'a alındı</div>
        <div className="mt-1 text-[10px] text-muted">U12 Erkek · Okundu: 18 / 22</div>
      </div>
      <div className="space-y-2 rounded-2xl border border-line bg-surface p-3">
        <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-bg px-3 py-2 text-[11px] text-ink">
          Hocam yarınki antrenmana geç kalacağız.
        </div>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-yellow px-3 py-2 text-[11px] font-medium text-bg">
          Tamam, haber verdiğin için sağ ol 👍
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-bg px-3 py-2 text-[11px] text-ink">
          Teşekkürler hocam.
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet/20 text-lg">🔔</span>
        <div>
          <div className="text-[11px] font-bold text-ink">Aidat hatırlatması</div>
          <div className="text-[10px] text-muted">Eylül aidatı 3 gün içinde</div>
        </div>
      </div>
    </Phone>
  );
}

function Privacy() {
  const rows = [
    { who: "👨‍👩‍👧 Veli", sees: "Sadece kendi çocuğunun bilgileri", color: "border-teal text-teal" },
    { who: "🏃 Sporcu", sees: "Sadece kendi profili ve grubu", color: "border-yellow text-yellow" },
    { who: "🧑‍🏫 Antrenör", sees: "Sadece kendi grupları", color: "border-violet text-violet" },
    { who: "🛡️ Kulüp yöneticisi", sees: "Sadece kendi kulübü", color: "border-coral text-coral" },
  ];
  return (
    <Phone title="Gizlilik">
      <div className="text-[11px] leading-snug text-muted">Herkes yalnızca kendisini ilgilendiren veriyi görür.</div>
      {rows.map((r) => (
        <div key={r.who} className={`rounded-2xl border-2 bg-surface p-3 ${r.color.split(" ")[0]}`}>
          <div className={`text-xs font-extrabold ${r.color.split(" ")[1]}`}>{r.who}</div>
          <div className="mt-0.5 text-[11px] text-ink">{r.sees}</div>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-[11px] text-ink">
        <span className="text-base">🔒</span> KVKK onayı alınır · kulüpler birbirinden izole
      </div>
    </Phone>
  );
}

export default function MockScreen({ kind }: { kind: MockKind }) {
  return (
    <div className="flex justify-center">
      {kind === "magaza" ? <Shop /> : kind === "mesajlasma" ? <Messaging /> : <Privacy />}
    </div>
  );
}

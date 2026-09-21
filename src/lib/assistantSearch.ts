import type { UserRole } from "../context/AuthContext";
import { MANUAL_ENTRIES, type ManualEntry, type Audience } from "./assistantManualData";

// Asistan'ın arama motoru — gerçek bir dil modeli değil, kılavuz girişleri
// (assistantManualData.ts) üzerinde çalışan ağırlıklı bir metin eşleştirici.
// İnternet/anahtar gerektirmez, tamamen cihazda çalışır.
//
// Nasıl çalışır:
//  1. Soru ve kılavuz metinleri aynı şekilde normalleştirilir: küçük harf,
//     Türkçe karakterler ASCII'ye (ç→c, ı→i …), noktalama atılır.
//  2. Türkçe ek çeşitliliği ("sporcuyu", "sporcular", "sporcunun") için
//     kelimeler köke indirilir: önce alan adı köklerine (sporcu, antrenör,
//     antrenman…) eşlenir, geri kalanlar ilk 6 harfe kısaltılır.
//  3. Dolgu sözcükler ("nasıl", "bir", "mi"…) atılır, eşanlamlılar tek
//     köke toplanır (parola→sifre, mac→musabaka…).
//  4. Her kılavuz girişi başlık + örnek soru ifadeleri + cevap metni üzerinden
//     puanlanır; nadir kelimelere (yüksek IDF) ve başlık/soru eşleşmelerine
//     daha çok ağırlık verilir.
//  5. Skor yeterince yüksek ve ayırt edici ise cevap verilir; belirsizse en
//     yakın 3 başlık önerilir.

export type { Audience } from "./assistantManualData";

// Kullanıcının rolünden kılavuzda hangi harflerin görüneceğini çıkarır.
// Koordinatör = hem koordinatör (K) hem antrenör (C) girişlerini görür.
export function audiencesFor(role: UserRole | null, isCoordinator: boolean): Audience[] {
  switch (role) {
    case "club_admin": return ["A"];
    case "coach": return isCoordinator ? ["K", "C"] : ["C"];
    case "parent": return ["P"];
    case "athlete": return ["S"];
    case "super_admin": return ["X"];
    default: return [];
  }
}

export function isVisibleTo(entry: ManualEntry, audiences: Audience[]): boolean {
  return audiences.some((a) => entry.roles.includes(a));
}

export function entriesFor(audiences: Audience[]): ManualEntry[] {
  return MANUAL_ENTRIES.filter((e) => isVisibleTo(e, audiences));
}

// ---------------------------------------------------------------- normalizasyon

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

export function normalize(text: string): string {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLowerCase()
    .replace(/[çğıöşüâîû]/g, (c) => TR_MAP[c] ?? c)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "ve", "veya", "ya", "bir", "bu", "su", "o", "mi", "mu", "misin", "musun", "miyim", "muyum", "midir", "mudur",
  "ne", "nasil", "nerede", "nereden", "nereye", "neden", "nicin", "niye", "nedir", "hangi", "kim", "kimler", "kac",
  "icin", "ile", "de", "da", "ki", "ben", "benim", "bana", "beni", "sen", "senin", "biz", "var", "yok", "olur",
  "olarak", "ise", "gibi", "kadar", "en", "cok", "daha", "hic", "her", "tum", "ama", "fakat", "lazim", "gerek",
  "istiyorum", "istiyoruz", "yapabilirim", "yapilir", "yapiyorum", "edilir", "olunur", "yapmak", "etmek", "olmak",
  "yapabilir", "yapilabilir", "mumkun", "lutfen", "acaba", "sadece", "yalnizca", "hemen", "simdi", "sonra", "once",
  "gorebilirim", "gorurum", "bulurum", "bulabilirim", "kullanirim", "kullanabilirim", "kullanilir",
  "yeni", "bilgilerimi", "bilgi", "bilgiler", "zaman", "lazim", "olsun", "gerekiyor", "gerekli",
]);

// Alan adı kökleri — ek çeşitliliği yüksek, birbirine çok benzeyen kelimeler.
const ROOTS: [RegExp, string][] = [
  [/^antrenor/, "antrenor"],
  [/^antrenman/, "antrenman"],
  [/^sporcu/, "sporcu"],
  [/^veli/, "veli"],
  [/^yonetici/, "yonetici"],
  [/^yoklama/, "yoklama"],
  [/^musabaka/, "musabaka"],
  [/^aidat/, "aidat"],
  [/^odeme|^odem/, "odeme"],
  [/^sifre/, "sifre"],
  [/^bildirim/, "bildirim"],
  [/^duyuru/, "duyuru"],
  [/^mesaj/, "mesaj"],
  [/^kulup/, "kulup"],
  [/^brans/, "brans"],
  [/^grup/, "grup"],
  [/^salon/, "salon"],
  [/^takvim/, "takvim"],
  [/^rozet/, "rozet"],
  [/^olcum|^olcu/, "olcum"],
  [/^fotograf/, "fotograf"],
  [/^kayit/, "kayit"],
  [/^etkinlik/, "etkinlik"],
  [/^magaza/, "magaza"],
  [/^siparis/, "siparis"],
  [/^beslenme/, "beslenme"],
  [/^kalori/, "kalori"],
  [/^tarif/, "tarif"],
  [/^hesap/, "hesap"],
  [/^profil/, "profil"],
  [/^kullanic/, "kullanici"],
  [/^kullan/, "kullan"],
  [/^koordinator/, "koordinator"],
  [/^istatistik/, "istatistik"],
  [/^zorluk/, "zorluk"],
  [/^dondur/, "dondur"],
  [/^gider/, "gider"],
  [/^gelir/, "gelir"],
  [/^dekont/, "dekont"],
  [/^makbuz/, "makbuz"],
  [/^kadro/, "kadro"],
  [/^skor|^sonuc/, "sonuc"],
];

// Eşanlamlılar — kelimenin TAMAMI eşleşince (kısa kelimeler için güvenli).
const SYN_EXACT: Record<string, string> = {
  mac: "musabaka", turnuva: "etkinlik", kamp: "etkinlik",
  uye: "sporcu", oglum: "sporcu", kizim: "sporcu", evlat: "sporcu",
  hoca: "antrenor", koc: "antrenor",
  admin: "yonetici",
  para: "odeme", ucret: "odeme", borc: "aidat", tahsilat: "odeme",
  sil: "sil", yok: "sil",
  ekle: "ekle", yeni: "yeni",
  bak: "gor", gor: "gor",
  giris: "giris", login: "giris", cikis: "cikis",
  wellness: "checkin", checkin: "checkin", check: "checkin", yorgunluk: "checkin", uyku: "checkin",
  rpe: "zorluk", push: "bildirim", uyari: "bildirim", xlsx: "excel", tablo: "excel",
  iban: "banka", eft: "banka", havale: "banka",
  numara: "telefon", cep: "telefon",
  foto: "fotograf", resim: "fotograf", gorsel: "fotograf",
  forma: "magaza", urun: "magaza", stok: "magaza",
  yemek: "beslenme", diyet: "beslenme", besin: "beslenme",
  sikayet: "destek", yardim: "destek", sorun: "destek",
};

// Eşanlamlılar — kelime BU ile BAŞLIYORSA (Türkçe ek çeşitliliği için:
// "eklerim", "ekleme", "eklemek" → ekle; "değiştirirken" → düzenle).
const SYN_PREFIX: [string, string][] = [
  ["parola", "sifre"],
  ["ogrenci", "sporcu"], ["cocuk", "sporcu"], ["cocug", "sporcu"],
  ["kocluk", "antrenor"],
  ["kaldir", "sil"], ["silme", "sil"], ["silin", "sil"], ["siler", "sil"], ["silmek", "sil"],
  ["olustur", "ekle"], ["ekleri", "ekle"], ["eklem", "ekle"], ["eklen", "ekle"], ["ekler", "ekle"], ["kaydet", "ekle"], ["kaydede", "ekle"],
  ["degist", "duzenle"], ["degisi", "duzenle"], ["guncel", "duzenle"], ["duzenl", "duzenle"], ["duzelt", "duzenle"],
  ["goster", "gor"], ["gorun", "gor"], ["gorme", "gor"], ["gorur", "gor"], ["gorul", "gor"], ["goruntu", "gor"], ["gorebi", "gor"], ["gormek", "gor"],
  ["kapat", "kapat"], ["kapan", "kapat"], ["kapal", "kapat"],
  ["ac", "ac"],
  ["ulas", "ulas"],
  // mesajlasma
  ["konus", "mesaj"], ["yazis", "mesaj"], ["haberlesm", "mesaj"], ["iletisim", "mesaj"],
  // saglik
  ["incin", "sakat"], ["sakat", "sakat"], ["yaral", "sakat"], ["burkul", "sakat"], ["agri", "sakat"],
  // etkinlik ve kayit
  ["kamp", "etkinlik"], ["turnuv", "etkinlik"], ["kaydol", "kayit"], ["kaydettir", "kayit"], ["kaydini", "kayit"],
  // kurmak/acmak = eklemek
  ["kurma", "ekle"], ["kurul", "ekle"], ["acma", "ekle"],
  // bildirmek
  ["bildir", "bildir"],
];

// Kök çıkarma: alan kökü → eşanlamlı → ön ek eşanlamlı → 6 harfe kısalt.
function stem(token: string): string {
  for (const [re, root] of ROOTS) if (re.test(token)) return SYN_EXACT[root] ?? root;
  if (SYN_EXACT[token]) return SYN_EXACT[token];
  for (const [prefix, target] of SYN_PREFIX) {
    if (prefix.length >= 3 && token.startsWith(prefix)) return target;
  }
  return token.length > 6 ? token.slice(0, 6) : token;
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem)
    .filter((t) => t.length > 1);
}

// ---------------------------------------------------------------- indeks

type IndexedEntry = {
  entry: ManualEntry;
  titleTokens: Set<string>;
  questionTokens: Set<string>;
  answerTokens: Set<string>;
  questionPhrases: string[]; // normalize edilmiş soru ifadeleri (tam ifade eşleşmesi için)
  titlePhrase: string;
};

let INDEX: IndexedEntry[] | null = null;
let IDF: Map<string, number> | null = null;
let VOCAB: string[] = [];

// Sorgudaki bir kelimeyi kılavuz sözlüğündeki bir kelimeye eşler. Tam eşleşme
// yoksa ön ek benzerliğine bakar ("yayinlarim" ↔ "yayinla"); en az 4 harf ortak
// olmalı ve en uzun ortak ön eke sahip kelime seçilir.
function resolveToken(token: string): string | null {
  if (IDF!.has(token)) return token;
  if (token.length < 4) return null;
  let best: string | null = null;
  let bestLen = 0;
  for (const v of VOCAB) {
    if (v.length < 4) continue;
    if (v.startsWith(token) || token.startsWith(v)) {
      const len = Math.min(v.length, token.length);
      if (len > bestLen) { best = v; bestLen = len; }
    }
  }
  return best;
}

function buildIndex() {
  const docs: IndexedEntry[] = MANUAL_ENTRIES.map((entry) => ({
    entry,
    titleTokens: new Set(tokenize(entry.title)),
    questionTokens: new Set(entry.questions.flatMap((q) => tokenize(q))),
    answerTokens: new Set(tokenize(entry.answer)),
    questionPhrases: entry.questions.map(normalize),
    titlePhrase: normalize(entry.title),
  }));

  const df = new Map<string, number>();
  for (const d of docs) {
    const all = new Set<string>([...d.titleTokens, ...d.questionTokens, ...d.answerTokens]);
    all.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
  }
  const n = docs.length;
  const idf = new Map<string, number>();
  df.forEach((count, t) => idf.set(t, Math.log(1 + n / count)));

  INDEX = docs;
  IDF = idf;
  VOCAB = Array.from(idf.keys());
}

// ---------------------------------------------------------------- arama

export type SearchResult = {
  // En iyi eşleşme (hiçbir şey bulunamadıysa null).
  best: ManualEntry | null;
  // true: eşleşme güçlü ve rakiplerinden belirgin ayrışıyor. false: "en yakın
  // bulduğum bu" diye sunulmalı; alttaki suggestions'tan seçim yapılabilir.
  confident: boolean;
  // Diğer yakın başlıklar (en fazla 3).
  suggestions: ManualEntry[];
};

const W_TITLE = 3;
const W_QUESTION = 3;
const W_ANSWER = 1;

export function scoreEntries(question: string, audiences: Audience[]): { entry: ManualEntry; score: number; coverage: number }[] {
  if (!INDEX || !IDF) buildIndex();
  const qNorm = normalize(question);
  const qTokens = Array.from(new Set(tokenize(question)));
  if (qTokens.length === 0) {
    // Tüm sözcükler dolgu olabilir ("nerede bulurum"): yalnızca birebir ifade eşleşmesine bak.
    const exact: { entry: ManualEntry; score: number; coverage: number }[] = [];
    for (const d of INDEX!) {
      if (isVisibleTo(d.entry, audiences) && (d.titlePhrase === qNorm || d.questionPhrases.includes(qNorm))) {
        exact.push({ entry: d.entry, score: 50, coverage: 1 });
      }
    }
    return exact;
  }

  const known = Array.from(new Set(qTokens.map(resolveToken).filter((t): t is string => t !== null)));
  if (known.length === 0) return [];
  const totalIdf = known.reduce((s, t) => s + IDF!.get(t)!, 0);

  const scored: { entry: ManualEntry; score: number; coverage: number }[] = [];
  for (const d of INDEX!) {
    if (!isVisibleTo(d.entry, audiences)) continue;

    let score = 0;
    let coveredIdf = 0;
    for (const t of known) {
      const idf = IDF!.get(t)!;
      let w = 0;
      if (d.titleTokens.has(t)) w = W_TITLE;
      else if (d.questionTokens.has(t)) w = W_QUESTION;
      else if (d.answerTokens.has(t)) w = W_ANSWER;
      if (w > 0) {
        score += idf * w;
        coveredIdf += idf * (w >= W_QUESTION ? 1 : 0.55);
      }
    }

    // İfade bonusu: sorunun tamamı bir örnek ifadeyle AYNIYSA en güçlü işaret;
    // soru bir ifadeyi içeriyorsa (ya da ifadenin büyük kısmını kapsıyorsa)
    // güçlü işaret. Birden çok ifade eşleşirse EN İYİSİ alınır.
    let bonus = 0;
    for (const phrase of d.questionPhrases) {
      if (phrase.length < 4) continue;
      let b = 0;
      if (qNorm === phrase) b = 40;
      else if (phrase.length >= 5 && qNorm.includes(phrase)) b = 14 + Math.min(phrase.length, 40) * 0.15;
      else if (qNorm.length >= 8 && phrase.includes(qNorm) && qNorm.length >= phrase.length * 0.8) b = 14 + Math.min(qNorm.length, 40) * 0.15;
      if (b > bonus) bonus = b;
    }
    if (qNorm === d.titlePhrase) bonus = Math.max(bonus, 40);
    else if (d.titlePhrase.length >= 5 && qNorm.includes(d.titlePhrase)) bonus = Math.max(bonus, 12);
    if (bonus > 0) {
      score += bonus;
      if (bonus >= 14) coveredIdf = Math.max(coveredIdf, totalIdf * 0.95);
    }

    if (score > 0) scored.push({ entry: d.entry, score, coverage: totalIdf > 0 ? coveredIdf / totalIdf : 0 });
  }
  return scored.sort((a, b) => b.score - a.score);
}

export function searchManual(question: string, audiences: Audience[]): SearchResult {
  const scored = scoreEntries(question, audiences);
  if (scored.length === 0) return { best: null, confident: false, suggestions: [] };

  const top = scored[0];
  const second = scored[1];
  const margin = second ? (top.score - second.score) / top.score : 1;

  // Emin: soru sözcüklerinin çoğu bu girişte var ve rakibinden belirgin ayrışıyor.
  const confident = top.coverage >= 0.6 && (margin >= 0.12 || top.score >= 24);

  // Anlamlı bir eşleşme yoksa (çok düşük kapsama/puan) hiçbir şey uydurma.
  if (top.coverage < 0.3 || top.score < 6) return { best: null, confident: false, suggestions: [] };

  const suggestions = scored
    .slice(1, 4)
    .filter((s) => s.coverage >= 0.3 && s.score >= top.score * 0.4)
    .map((s) => s.entry);

  return { best: top.entry, confident, suggestions };
}

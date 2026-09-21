// Kullanım:  node scripts/build-manual.js
//
// Kaynak: scripts/manual/*.js (kılavuz girişleri) + samples.js (örnek sorular)
// Üretir:
//   1) src/lib/assistantManualData.ts  — uygulamadaki Asistan'ın bilgi tabanı
//   2) docs/kilavuz/*.md               — rol bazlı kullanma kılavuzları
// Ayrıca arama motorunu (src/lib/assistantSearch.ts) TÜM sorularla test eder;
// bir örnek soru kendi girişini bulamazsa betik hata ile durur.

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.join(__dirname, "..");
const { MODULES, entries } = require("./manual/helpers");
for (const f of fs.readdirSync(path.join(__dirname, "manual")).sort()) {
  if (/^\d\d-.*\.js$/.test(f)) require("./manual/" + f);
}
const { SAMPLES, NATURAL_TESTS } = require("./manual/samples");

const AUDIENCES = {
  A: { file: "kulup-yoneticisi", title: "Kulüp Yöneticisi", letters: ["A"], intro: "Kulübünün tamamını yöneten kişi olarak kullandığın bölümler." },
  K: { file: "brans-koordinatoru", title: "Branş Koordinatörü", letters: ["K", "C"], intro: "Bir branşın sorumlusu olan antrenör olarak, kendi branşında yönetici gibi çalışırsın; antrenörün yapabildiği her şeyi de yaparsın." },
  C: { file: "antrenor", title: "Antrenör", letters: ["C"], intro: "Sana atanan gruplarla çalışan antrenör olarak kullandığın bölümler." },
  P: { file: "veli", title: "Veli", letters: ["P"], intro: "Çocuğunun/çocuklarının kulüp süreçlerini takip eden veli olarak kullandığın bölümler." },
  S: { file: "sporcu", title: "Sporcu", letters: ["S"], intro: "Sporcu hesabıyla kullandığın bölümler." },
  X: { file: "super-admin", title: "Süper Admin", letters: ["X"], intro: "Platformu yöneten Süper Admin olarak kullandığın bölümler." },
};

// ------------------------------------------------------------ 1) doğrulama (yapısal)
const errors = [];
const seenQ = new Map();
for (const en of entries) {
  if (en.questions.length < 3) errors.push(`${en.id}: en az 3 örnek soru ifadesi olmalı`);
  if (en.answer.length < 40) errors.push(`${en.id}: cevap çok kısa`);
}
for (const m of MODULES) {
  if (!entries.some((en) => en.module === m.key)) errors.push(`modül boş: ${m.key}`);
}
for (const [aud, list] of Object.entries(SAMPLES)) {
  if (list.length !== 20) errors.push(`örnek sorular ${aud}: ${list.length} adet (20 olmalı)`);
  const letters = AUDIENCES[aud].letters;
  for (const [id] of list) {
    const en = entries.find((x) => x.id === id);
    if (!en) errors.push(`örnek soru: bilinmeyen id ${id} (${aud})`);
    else if (!letters.some((l) => en.roles.includes(l))) errors.push(`örnek soru ${aud}: "${id}" bu role görünmüyor`);
  }
}
if (errors.length) { console.error("YAPISAL HATALAR:\n - " + errors.join("\n - ")); process.exit(1); }

// Örnek sorular, ilgili girişin kanonik soru ifadesi olarak da eklenir — böylece
// kullanıcı bir örneğe dokununca ya da aynı cümleyi yazınca kesin eşleşir.
for (const list of Object.values(SAMPLES)) {
  for (const [id, q] of list) {
    const en = entries.find((x) => x.id === id);
    if (en && !en.questions.includes(q)) en.questions.push(q);
  }
}

// ------------------------------------------------------------ 2) TS veri dosyası
const dataTs = `// BU DOSYA OTOMATİK ÜRETİLİR — elle düzenleme!
// Kaynak: scripts/manual/*.js   |   Yeniden üret: node scripts/build-manual.js
//
// Roller: A=Kulüp Yöneticisi, K=Branş Koordinatörü, C=Antrenör, P=Veli, S=Sporcu, X=Süper Admin.

export type Audience = "A" | "K" | "C" | "P" | "S" | "X";

export type ManualEntry = {
  id: string;
  module: string;
  roles: string; // görebilen rollerin harfleri, ör. "ACK"
  title: string;
  questions: string[];
  answer: string;
};

export type ManualModule = { key: string; title: string; icon: string };

export const MANUAL_MODULES: ManualModule[] = ${JSON.stringify(MODULES, null, 2)};

export const MANUAL_ENTRIES: ManualEntry[] = ${JSON.stringify(entries, null, 2)};

// "💡 Örnek Sorular" — her rol için 20 soru. id: MANUAL_ENTRIES girişi.
export const SAMPLE_QUESTIONS: Record<Audience, { id: string; q: string }[]> = ${JSON.stringify(
  Object.fromEntries(Object.entries(SAMPLES).map(([k, v]) => [k, v.map(([id, q]) => ({ id, q }))])), null, 2)};
`;
fs.writeFileSync(path.join(root, "src/lib/assistantManualData.ts"), dataTs);

// ------------------------------------------------------------ 3) arama motoru testi
function loadTs(file, requireMap) {
  const src = fs.readFileSync(file, "utf8");
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
  const mod = { exports: {} };
  new Function("require", "exports", "module", out)((n) => requireMap[n] ?? require(n), mod.exports, mod);
  return mod.exports;
}
const dataMod = loadTs(path.join(root, "src/lib/assistantManualData.ts"), {});
const engine = loadTs(path.join(root, "src/lib/assistantSearch.ts"), { "./assistantManualData": dataMod });

const failures = [];
let total = 0, ok = 0;
function check(label, question, letters, expectedId, mode) {
  total++;
  const res = engine.searchManual(question, letters);
  const got = res.best ? res.best.id : null;
  const inSug = res.suggestions.some((s) => s.id === expectedId);
  const pass = mode === "strict" ? got === expectedId : got === expectedId || (!res.confident && inSug);
  if (pass) ok++;
  else failures.push(`[${label}] "${question}" -> ${got ?? "(belirsiz: " + res.suggestions.map((s) => s.id).join(",") + ")"} | beklenen: ${expectedId}`);
}

// (a) Örnek sorular: kesin doğru giriş dönmeli
for (const [aud, list] of Object.entries(SAMPLES)) for (const [id, q] of list) check("örnek " + aud, q, AUDIENCES[aud].letters, id, "strict");
// (b) Doğal cümleler
for (const [aud, q, id] of NATURAL_TESTS) {
  const letters = aud === "ALL" ? ["A"] : AUDIENCES[aud].letters;
  check("doğal " + aud, q, letters, id, "lenient");
}
// (c) Her girişin kendi başlığı ve örnek ifadeleri, görebilen HER rolde kendini bulmalı
for (const en of entries) {
  for (const a of ["A", "K", "C", "P", "S", "X"]) {
    if (!en.roles.includes(a)) continue;
    const letters = AUDIENCES[a].letters;
    for (const q of [en.title, ...en.questions]) {
      total++;
      const res = engine.searchManual(q, letters);
      const got = res.best ? res.best.id : null;
      if (got === en.id) ok++;
      else if (!res.confident && res.suggestions.some((s) => s.id === en.id)) ok++;
      else failures.push(`[kendi ifadesi ${a}] "${q}" -> ${got ?? "(belirsiz)"} | beklenen: ${en.id}`);
    }
  }
}

// (d) SINAMA SETİ — motor ayarlanırken görülmemiş cümleler (dürüst genelleme ölçümü)
const HOLDOUT = require("./manual/holdout");
let hoTotal = 0, hoOk = 0, hoTop3 = 0; const hoFails = [];
for (const [aud, q, ids] of HOLDOUT) {
  hoTotal++;
  const letters = aud === "ALL" ? ["A"] : AUDIENCES[aud].letters;
  const res = engine.searchManual(q, letters);
  const got = res.best ? res.best.id : null;
  const list = [res.best, ...res.suggestions].filter(Boolean).map((x) => x.id);
  if (got && ids.includes(got)) { hoOk++; hoTop3++; }
  else if (list.some((id) => ids.includes(id))) hoTop3++;
  else hoFails.push("[" + aud + "] \"" + q + "\" -> " + (got ?? "(belirsiz: " + list.join(",") + ")") + " | beklenen: " + ids.join("/"));
}
console.log("SINAMA SETİ (görülmemiş " + hoTotal + " soru): doğrudan doğru " + hoOk + " (" + ((hoOk / hoTotal) * 100).toFixed(0) + "%), ilk 3 öneride/doğru " + hoTop3 + " (" + ((hoTop3 / hoTotal) * 100).toFixed(0) + "%)");
if (hoFails.length) console.log("  bulunamayanlar:\n   - " + hoFails.join("\n   - "));
console.log(`Arama testi: ${ok}/${total} başarılı (${((ok / total) * 100).toFixed(1)}%)`);
if (failures.length) {
  console.log(`\nBaşarısız ${failures.length} test (ilk 400):\n - ` + failures.slice(0, 400).join("\n - "));
}
const sampleFails = failures.filter((f) => f.startsWith("[örnek"));
if (sampleFails.length) { console.error(`\nÖRNEK SORU HATALARI: ${sampleFails.length}`); process.exit(2); }

// ------------------------------------------------------------ 4) Markdown kılavuzlar
const outDir = path.join(root, "docs", "kilavuz");
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith(".md")) fs.unlinkSync(path.join(outDir, f));

const indexLines = [
  "# X-NETIC Kullanma Kılavuzları", "",
  "Bu kılavuzlar uygulamadaki **Asistan**'ın bilgi tabanıyla aynı kaynaktan üretilir (`scripts/manual/`). " +
  "Asistan'a bu kılavuzdaki her başlığı kendi cümlenle sorabilirsin.", "",
  "> Kılavuzları güncellemek için `scripts/manual/*.js` dosyalarını düzenleyip `node scripts/build-manual.js` çalıştırın; " +
  "hem bu dosyalar hem uygulama içi Asistan verisi yeniden üretilir.", "",
  "| Kılavuz | Kim için | Başlık sayısı |", "|---|---|---|",
];
for (const [aud, meta] of Object.entries(AUDIENCES)) {
  const list = entries.filter((en) => meta.letters.some((l) => en.roles.includes(l)));
  indexLines.push(`| [${meta.title}](${meta.file}.md) | ${meta.intro} | ${list.length} |`);

  const lines = [`# X-NETIC Kullanma Kılavuzu — ${meta.title}`, "", meta.intro, "", "## İçindekiler", ""];
  const byModule = MODULES.map((m) => ({ m, items: list.filter((en) => en.module === m.key) })).filter((x) => x.items.length);
  byModule.forEach(({ m, items }, i) => {
    lines.push(`${i + 1}. [${m.icon} ${m.title}](#${slug(m.title)}) (${items.length})`);
  });
  lines.push("");
  for (const { m, items } of byModule) {
    lines.push(`## ${m.icon} ${m.title}`, "");
    for (const en of items) {
      lines.push(`### ${en.title}`, "");
      lines.push(...en.answer.split("\n").map((l) => (l.startsWith("•") ? "- " + l.slice(1).trim() : l)), "");
    }
  }
  lines.push("---", "", "*Bu kılavuz uygulamadaki Asistan ile aynı içeriği kullanır. Sorun yaşarsan: Profil → Yardım / Destek.*", "");
  fs.writeFileSync(path.join(outDir, meta.file + ".md"), lines.join("\n"));
}
fs.writeFileSync(path.join(outDir, "README.md"), indexLines.join("\n") + "\n");

function slug(t) {
  return t.toLowerCase().replace(/[^a-z0-9ğüşıöç\s-]/gi, "").trim().replace(/\s+/g, "-");
}

console.log(`\nÜretildi: ${entries.length} kılavuz girişi, ${Object.keys(AUDIENCES).length} rol kılavuzu, ${Object.values(SAMPLES).reduce((a, b) => a + b.length, 0)} örnek soru.`);

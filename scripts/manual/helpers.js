// Kullanma kılavuzu KAYNAĞI — tek doğru yer burası.
//   node scripts/build-manual.js
// komutu bu dosyalardan iki şey üretir:
//   1) src/lib/assistantManualData.ts   → uygulamadaki Asistan'ın bilgi tabanı
//   2) docs/kilavuz/*.md                → rol bazlı okunabilir kullanma kılavuzları
//
// Rol harfleri:
//   A = Kulüp Yöneticisi   K = Branş Koordinatörü (koordinatör olan antrenör)
//   C = Antrenör           P = Veli
//   S = Sporcu             X = Süper Admin
// Bir koordinatör hem K hem C girişlerini görür (antrenörün yapabildiği her
// şeyi yapar + branşında yönetici gibi çalışır).

const MODULES = [
  { key: "baslarken", title: "Başlarken ve Hesap", icon: "🚀" },
  { key: "anasayfa", title: "Ana Sayfa ve Bildirimler", icon: "🏠" },
  { key: "profil", title: "Profil ve Ayarlar", icon: "👤" },
  { key: "sporcu", title: "Sporcu Yönetimi ve Kayıt İşlemleri", icon: "👥" },
  { key: "sporcum", title: "Sporcum (Veli ve Sporcu)", icon: "🧒" },
  { key: "takvim", title: "Takvim, Antrenman ve Yoklama", icon: "📅" },
  { key: "musabaka", title: "Müsabakalar", icon: "🏆" },
  { key: "antrenor", title: "Antrenörler", icon: "🧑‍🏫" },
  { key: "yapi", title: "Kulüp Yapısı (Branş, Grup, Salon)", icon: "🏛️" },
  { key: "ayar", title: "Kulüp Ayarları", icon: "⚙️" },
  { key: "finans", title: "Finans ve Aidat", icon: "💰" },
  { key: "performans", title: "Performans Ölçümleri", icon: "📊" },
  { key: "fitness", title: "Fitness", icon: "🏋️" },
  { key: "beslenme", title: "Beslenme", icon: "🥗" },
  { key: "takip", title: "Günlük Check-in ve Zorluk Derecesi", icon: "🌡️" },
  { key: "etkinlik", title: "Etkinlik, Turnuva ve Kamp", icon: "🎪" },
  { key: "magaza", title: "Mağaza", icon: "🛍️" },
  { key: "sosyal", title: "Sosyal Alan", icon: "📸" },
  { key: "mesaj", title: "Mesajlar", icon: "💬" },
  { key: "duyuru", title: "Duyurular", icon: "📣" },
  { key: "rozet", title: "Rozetler", icon: "🎖️" },
  { key: "sa", title: "Süper Admin", icon: "🛡️" },
  { key: "sss", title: "Sık Sorulan Sorular ve Sorun Giderme", icon: "🆘" },
];

const entries = [];

// e(id, modül, roller, başlık, [kullanıcının sorabileceği ifadeler], cevap)
function e(id, module, roles, title, questions, answer) {
  if (!MODULES.some((m) => m.key === module)) throw new Error("bilinmeyen modül: " + module + " (" + id + ")");
  if (entries.some((x) => x.id === id)) throw new Error("tekrarlanan id: " + id);
  if (!/^[ACKPSX]+$/.test(roles)) throw new Error("geçersiz rol: " + roles + " (" + id + ")");
  entries.push({ id, module, roles, title, questions, answer: answer.trim() });
}

module.exports = { MODULES, entries, e };

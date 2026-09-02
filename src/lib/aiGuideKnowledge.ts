// AI Asistan'ın "rehber" tarafı — gerçek bir dil modeli olmadan, anahtar
// kelime eşleştirmesiyle çalışan basit ama GERÇEK/doğru bir yardım
// sistemi. Ücretsiz, anahtar gerekmiyor, bugün çalışıyor. Serbest
// soru-cevap (kendi verilerine dayalı esnek sorular) ise gerçek bir LLM
// gerektiriyor — o kısım API anahtarı eklenince bağlanacak (bkz. AIScreen.tsx).
export type GuideEntry = {
  keywords: string[];
  title: string;
  answer: string;
};

export const GUIDE_ENTRIES: GuideEntry[] = [
  {
    keywords: ["şifre sıfırla", "şifresini unut", "şifre unut", "parola sıfırla", "yeni şifre ver"],
    title: "Bir kullanıcının şifresini sıfırlama",
    answer:
      "1. Kulüp Ayarları → Kullanıcılar'a gir.\n" +
      "2. Listede ilgili kişiyi bul (role göre gruplanmış — Veli, Sporcu, Antrenör vb.).\n" +
      "3. Yanındaki \"Şifreyi Sıfırla\" butonuna bas ve onayla.\n" +
      "4. Ekranda çıkan yeni geçici şifreyi kopyala, kişiye elden/WhatsApp'tan ilet.\n" +
      "5. Kişi bu geçici şifreyle giriş yapınca kendi şifresini belirlemesi zorunlu olacak.",
  },
  {
    keywords: ["yeni sporcu", "sporcu ekle", "sporcu kaydı"],
    title: "Yeni sporcu ekleme",
    answer:
      "1. Ana Menü → Sporcu Yönetimi'ne gir.\n" +
      "2. Bir gruba tıkla, sonra \"+ Ekle\"ye ya da doğrudan \"+ Yeni Sporcu\"ya bas.\n" +
      "3. Ad Soyad, Grup, Veli Adı Soyadı ve Veli Telefon zorunlu alanlardır.\n" +
      "4. İstersen aynı ekrandan Veli ve/veya Sporcu giriş hesabı da açıp bağlayabilirsin (telefon/kullanıcı adıyla).\n" +
      "5. Kaydet'e bas.",
  },
  {
    keywords: ["antrenör ekle", "antrenör davet", "koç ekle", "koç davet"],
    title: "Yeni antrenör ekleme",
    answer:
      "1. Kulüp Ayarları → Kullanıcı Davet Et'e gir.\n" +
      "2. Rol olarak \"Antrenör\"ü seç, telefon numarası ya da kullanıcı adı gir.\n" +
      "3. \"Hesap Oluştur\"a bas — bir geçici şifre üretilir.\n" +
      "4. Bu şifreyi kişiye ilet; ilk girişte kendi şifresini belirleyip branş/bilgi tamamlama adımından geçecek.",
  },
  {
    keywords: ["aidat planı", "aidat oluştur", "aidat ekle"],
    title: "Aidat planı oluşturma",
    answer:
      "1. Finans → Aidat Planı Oluştur'a gir.\n" +
      "2. Sporcuyu seç, Aylık Tutar ve Ayın Kaçında ödeneceğini gir.\n" +
      "3. Oluştur'a bas — bir sonraki aydan başlayarak otomatik tekrarlayan bir aidat planı kurulur, önümüzdeki birkaç ay için kayıt hazır olur.",
  },
  {
    keywords: ["yoklama al", "yoklama nasıl", "devamsızlık gir"],
    title: "Yoklama alma",
    answer:
      "1. Takvim'den ilgili antrenmana gir.\n" +
      "2. \"Yoklama Al\" butonuna bas (bu buton, antrenman başlamadan belirli bir süre önce açılır).\n" +
      "3. Listedeki her sporcu için durumu (Geldi / Gelmedi / Geç Kaldı / Raporlu / İzinli) işaretle ve kaydet.",
  },
  {
    keywords: ["maç sonucu", "müsabaka sonucu", "sonuç gir", "skor gir"],
    title: "Müsabaka sonucu girme",
    answer:
      "1. Takvim'de ilgili günü aç, maçın yanındaki \"Sonuç Gir\" butonuna bas.\n" +
      "2. Takım sporunda skoru gir; bireysel branşta (Yüzme, Atletizm vb.) skor yerine serbest metin sonuç açıklaması yazarsın.\n" +
      "3. Kaydedince, grubun velilerine, antrenörlerine, koordinatörüne ve sporcularına otomatik bildirim gider.",
  },
  {
    keywords: ["duyuru gönder", "duyuru oluştur", "duyuru paylaş"],
    title: "Duyuru oluşturma",
    answer:
      "1. Duyurular ekranına gir.\n" +
      "2. \"+ Duyuru\" ile başlık ve içerik yazıp kaydet — kimlerin göreceğini seçebilirsin.",
  },
  {
    keywords: ["takvime ekle", "takvim senkron", "google takvim", "telefonun takvimi"],
    title: "Programı telefonun takvimine ekleme",
    answer:
      "1. Takvim ekranında (ya da Programım'da) \"Takvimime Ekle\" butonuna bas.\n" +
      "2. Takvim izni ver — antrenman/maç programın telefonunun kendi takviminde, ayrı bir \"X-NETIC\" takvimi olarak oluşur.\n" +
      "3. Program değişince aynı butona tekrar basman yeterli, otomatik güncellenir.",
  },
  {
    keywords: ["ürün ekle", "mağazaya ürün", "mağaza ürün"],
    title: "Mağazaya ürün ekleme",
    answer:
      "1. Mağaza Yönetimi'ne gir, \"+ Ürün Ekle\"ye bas.\n" +
      "2. Başlık, fiyat, kategori ve cinsiyet gir; varsa renk/beden seçeneklerini ekle.\n" +
      "3. Fotoğraf ekleyip Kaydet'e bas.",
  },
  {
    keywords: ["kullanıcı davet", "hesap oluştur", "yeni kullanıcı"],
    title: "Yeni kullanıcı (Veli, Sporcu, Antrenör) hesabı açma",
    answer:
      "Rolüne göre farklı bir yerden açılıyor:\n" +
      "• Veli / Sporcu: Sporcu Yönetimi → ilgili sporcunun kaydına gir → \"Veli Giriş Hesabı\" ya da " +
      "\"Sporcu Giriş Hesabı\" bölümünden \"yeni hesap oluştur\"a bas.\n" +
      "• Antrenör: Antrenörler ekranındaki \"+ Antrenör Ekle\"ye bas.\n" +
      "Her iki yolda da telefon/kullanıcı adı girip \"Oluştur\"a basınca bir geçici şifre üretilir, bunu kişiye elden/mesajla iletmen gerekir.",
  },
];

export function findGuideAnswer(question: string): GuideEntry | null {
  const q = question.toLowerCase().trim();
  if (!q) return null;
  return GUIDE_ENTRIES.find((entry) => entry.keywords.some((k) => q.includes(k))) ?? null;
}

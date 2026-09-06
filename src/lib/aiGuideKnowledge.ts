import type { UserRole } from "../context/AuthContext";

// Asistan'ın "rehber" tarafı — gerçek bir dil modeli olmadan, anahtar
// kelime eşleştirmesiyle çalışan basit ama GERÇEK/doğru bir yardım
// sistemi. Ücretsiz, anahtar gerekmiyor, bugün çalışıyor. Serbest
// soru-cevap (kendi verilerine dayalı esnek sorular) ise gerçek bir LLM
// gerektiriyor — o kısım API anahtarı eklenince bağlanacak (bkz. AIScreen.tsx).
//
// sampleQuestion: hem "Örnek Sorular" menüsünde gösterilen etiket hem de
// dokununca gönderilen soru metni — findGuideAnswer'ın kendi keywords'üyle
// eşleşecek şekilde yazılmalı. roles verilmezse tüm roller görür.
export type GuideEntry = {
  keywords: string[];
  title: string;
  answer: string;
  sampleQuestion: string;
  roles?: UserRole[];
};

export const GUIDE_ENTRIES: GuideEntry[] = [
  // --- Kulüp Admini: kullanıcı/kadro yönetimi ---
  {
    keywords: ["şifre sıfırla", "şifresini unut", "şifre unut", "parola sıfırla", "yeni şifre ver"],
    title: "Bir kullanıcının şifresini sıfırlama",
    sampleQuestion: "Bir kullanıcının şifresini nasıl sıfırlarım?",
    roles: ["club_admin"],
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
    sampleQuestion: "Yeni bir sporcu nasıl eklerim?",
    roles: ["club_admin", "coach"],
    answer:
      "1. Ana Menü → Sporcu Yönetimi'ne gir.\n" +
      "2. Bir gruba tıkla, sonra \"+ Ekle\"ye ya da doğrudan \"+ Yeni Sporcu\"ya bas.\n" +
      "3. Ad Soyad, Grup, Veli Adı Soyadı ve Veli Telefon zorunlu alanlardır.\n" +
      "4. İstersen aynı ekrandan Veli ve/veya Sporcu giriş hesabı da açıp bağlayabilirsin (telefon/kullanıcı adıyla).\n" +
      "5. Kaydet'e bas.",
  },
  {
    keywords: ["ek branş", "ikinci branş", "başka gruba da ekle", "birden fazla branş"],
    title: "Bir sporcuyu ikinci bir branşa/gruba ekleme",
    sampleQuestion: "Bir sporcuyu ikinci bir branşa nasıl eklerim?",
    roles: ["club_admin", "coach"],
    answer:
      "Sporcu Yönetimi'nden sporcunun profiline gir, altındaki \"Ek Branşlar ve Gruplar\" butonuna bas — " +
      "sporcuyu, ana branşına ek olarak başka bir branş/gruba da bağlayabilirsin.",
  },
  {
    keywords: ["sporcu tipi", "müsabık mı spor okulu mu", "spor okulu grubu"],
    title: "Sporcu tipini (müsabık / spor okulu) ayarlama",
    sampleQuestion: "Bir sporcunun tipini müsabık ya da spor okulu yapmak için ne yapmalıyım?",
    roles: ["club_admin"],
    answer:
      "Sporcu tipi artık gruptan miras alınıyor — Kulüp Yapısı → Gruplar'da bir grubun tipini (Müsabık/Spor Okulu) ayarla, " +
      "o gruptaki tüm sporcular otomatik olarak aynı tipte olur. Tek tek sporcu üzerinden değiştirilemez.",
  },
  {
    keywords: ["antrenör ekle", "antrenör davet", "koç ekle", "koç davet"],
    title: "Yeni antrenör ekleme",
    sampleQuestion: "Yeni bir antrenör nasıl eklerim?",
    roles: ["club_admin"],
    answer:
      "1. Kulüp Ayarları → Kullanıcı Davet Et'e gir.\n" +
      "2. Rol olarak \"Antrenör\"ü seç, telefon numarası ya da kullanıcı adı gir.\n" +
      "3. \"Hesap Oluştur\"a bas — bir geçici şifre üretilir.\n" +
      "4. Bu şifreyi kişiye ilet; ilk girişte kendi şifresini belirleyip branş/bilgi tamamlama adımından geçecek.",
  },
  {
    keywords: ["kullanıcı davet", "hesap oluştur", "yeni kullanıcı"],
    title: "Yeni kullanıcı (Veli, Sporcu, Antrenör) hesabı açma",
    sampleQuestion: "Bir veliye/sporcuya nasıl giriş hesabı açarım?",
    roles: ["club_admin"],
    answer:
      "Rolüne göre farklı bir yerden açılıyor:\n" +
      "• Veli / Sporcu: Sporcu Yönetimi → ilgili sporcunun kaydına gir → \"Veli Giriş Hesabı\" ya da " +
      "\"Sporcu Giriş Hesabı\" bölümünden \"yeni hesap oluştur\"a bas.\n" +
      "• Antrenör: Antrenörler ekranındaki \"+ Antrenör Ekle\"ye bas.\n" +
      "Her iki yolda da telefon/kullanıcı adı girip \"Oluştur\"a basınca bir geçici şifre üretilir, bunu kişiye elden/mesajla iletmen gerekir.",
  },

  {
    keywords: ["antrenör izni", "antrenörün izin günleri", "izinli antrenör", "antrenör izinli"],
    title: "Bir antrenörün izin günlerini kaydetme",
    sampleQuestion: "Bir antrenörün izin günlerini nereden kaydederim?",
    roles: ["club_admin"],
    answer: "Antrenörler'den ilgili antrenörün profiline gir, \"İzin İşlemleri\"ne bas — başlangıç/bitiş tarihi girip izin kaydı oluşturabilirsin.",
  },

  // --- Kulüp Admini: kulüp yapısı ve ayarlar ---
  {
    keywords: ["yeni grup", "branş ekle", "salon ekle", "kulüp yapısı"],
    title: "Yeni grup, branş ya da salon ekleme",
    sampleQuestion: "Yeni bir grup ya da branş nasıl eklerim?",
    roles: ["club_admin"],
    answer:
      "Kulüp Yapısı'na gir — Gruplar, Branşlar ve Salonlar sekmelerinden ekleme yapabilirsin.\n" +
      "Bir sporcu eklemeden önce en az bir branş ve bir grup tanımlı olmalı.",
  },
  {
    keywords: ["kulüp logosu", "logo değiştir", "kulüp adı değiştir", "logo yükle"],
    title: "Kulüp adı/logosunu değiştirme",
    sampleQuestion: "Kulüp logomu nasıl değiştiririm?",
    roles: ["club_admin"],
    answer:
      "1. Kulüp Ayarları → Kulüp Adı ve Logosu'na gir.\n" +
      "2. Yeni kulüp adını yaz ve/veya yeni bir logo fotoğrafı yükle.\n" +
      "3. Kaydet'e bas — Giriş ekranında ve Ana Sayfa'da hemen görünür.",
  },
  {
    keywords: ["banka bilgisi", "iban ekle", "iban gir", "havale bilgisi"],
    title: "Banka bilgisi (IBAN) girme",
    sampleQuestion: "Banka/IBAN bilgimi nereden girerim?",
    roles: ["club_admin"],
    answer:
      "1. Kulüp Ayarları → Banka Bilgileri'ne gir.\n" +
      "2. Hesap Sahibi ve IBAN alanlarını doldurup kaydet.\n" +
      "3. Veliler Havale/EFT ile aidat öderken bu bilgiyi görecek.",
  },
  {
    keywords: ["ana sayfa özellik", "kutucuk kapat", "özellik kapat", "mağaza kullanmıyorum"],
    title: "Ana Sayfa kutucuklarını açma/kapatma",
    sampleQuestion: "Ana Sayfa'daki bir özelliği nasıl kapatırım?",
    roles: ["club_admin"],
    answer:
      "1. Kulüp Ayarları → Ana Sayfa Özellikleri'ne gir.\n" +
      "2. Kullanmadığın özellikleri (ör. Mağaza kullanmıyorsan) kapat.\n" +
      "3. Kapattığın özellik, antrenör/veli/sporcunun Ana Sayfa'sından kaybolur — istediğin an tekrar açabilirsin.",
  },
  {
    keywords: ["dışa aktar", "excel indir", "verileri indir", "verilerimi indir"],
    title: "Kulüp verilerini dışa aktarma",
    sampleQuestion: "Kulüp verilerimi Excel'e nasıl aktarırım?",
    roles: ["club_admin"],
    answer:
      "Kulüp Ayarları → Kulüp Bilgilerini Dışa Aktar'a gir — sporcu, antrenör ve grup verilerin Excel dosyası olarak inecek.",
  },

  // --- Antrenman ve performans ---
  {
    keywords: ["yoklama al", "yoklama nasıl", "devamsızlık gir"],
    title: "Yoklama alma",
    sampleQuestion: "Yoklama nasıl alınır?",
    roles: ["coach", "club_admin"],
    answer:
      "1. Takvim'den ilgili antrenmana gir.\n" +
      "2. \"Yoklama Al\" butonuna bas (bu buton, antrenman başlamadan belirli bir süre önce açılır).\n" +
      "3. Listedeki her sporcu için durumu (Geldi / Gelmedi / Geç Kaldı / Raporlu / İzinli) işaretle ve kaydet.",
  },
  {
    keywords: ["maç sonucu", "müsabaka sonucu", "sonuç gir", "skor gir"],
    title: "Müsabaka sonucu girme",
    sampleQuestion: "Bir müsabaka sonucunu nereden girerim?",
    roles: ["coach", "club_admin"],
    answer:
      "1. Takvim'de ilgili günü aç, maçın yanındaki \"Sonuç Gir\" butonuna bas.\n" +
      "2. Takım sporunda skoru gir; bireysel branşta (Yüzme, Atletizm vb.) skor yerine serbest metin sonuç açıklaması yazarsın.\n" +
      "3. Kaydedince, grubun velilerine, antrenörlerine, koordinatörüne ve sporcularına otomatik bildirim gider.",
  },
  {
    keywords: ["performans testi ekle", "yeni test ekle", "ölçüm testi ekle"],
    title: "Yeni bir performans testi ekleme",
    sampleQuestion: "Kulübüme özel yeni bir performans testi nasıl eklerim?",
    roles: ["club_admin"],
    answer:
      "Performans Ölçümleri → ilgili kategoriye (Sürat, Sıçrama, Kuvvet vb.) gir, \"+ Test Ekle\"ye bas.\n" +
      "Bu test sadece senin kulübünde görünür, global (tüm kulüplerdeki) listeyi etkilemez.",
  },
  {
    keywords: ["hareket gizle", "egzersiz kaldır", "hareketleri yönet", "hareket kapat"],
    title: "Fitness hareketini kendi kulübün için gizleme",
    sampleQuestion: "Fitness listesinden bir hareketi nasıl gizlerim?",
    roles: ["club_admin"],
    answer:
      "Fitness → Egzersiz Kütüphanesi'nde bir kategoriye gir, \"🎚 Hareketleri Yönet\"e bas, istemediğin hareketleri kapat.\n" +
      "Bu sadece senin kulübünün görünümünü etkiler, global listeye dokunmaz — istediğin an geri açabilirsin.",
  },
  {
    keywords: ["fitness programı oluştur", "antrenman programı ver", "program hazırla"],
    title: "Fitness/antrenman programı oluşturma",
    sampleQuestion: "Bir gruba nasıl fitness programı hazırlarım?",
    roles: ["coach", "club_admin"],
    answer:
      "Fitness → Programlar'a gir, \"+ Program Oluştur\"a bas, hareketleri seç ve bir gruba ya da tek bir sporcuya ata.",
  },
  {
    keywords: ["beslenme pdf", "rehbere pdf ekle", "pdf yükle", "beslenme yazısı ekle"],
    title: "Beslenme Rehberine yazı/PDF ekleme",
    sampleQuestion: "Beslenme Rehberi'ne nasıl PDF eklerim?",
    roles: ["coach", "club_admin"],
    answer:
      "Beslenme → Beslenme Rehberi → \"+ Yazı Ekle\"ye gir. Metin yazabilir, ya da onun yerine (veya yanında) bir PDF yükleyebilirsin — kullanıcılar bunu indirmeden uygulama içinde görüntüler.",
  },

  // --- Finans / Mağaza / Duyuru ---
  {
    keywords: ["aidat planı", "aidat oluştur", "aidat ekle"],
    title: "Aidat planı oluşturma",
    sampleQuestion: "Bir sporcuya aidat planı nasıl oluştururum?",
    roles: ["club_admin"],
    answer:
      "1. Finans → Aidat Planı Oluştur'a gir.\n" +
      "2. Sporcuyu seç, Aylık Tutar ve Ayın Kaçında ödeneceğini gir.\n" +
      "3. Oluştur'a bas — bir sonraki aydan başlayarak otomatik tekrarlayan bir aidat planı kurulur, önümüzdeki birkaç ay için kayıt hazır olur.",
  },
  {
    keywords: ["ürün ekle", "mağazaya ürün", "mağaza ürün"],
    title: "Mağazaya ürün ekleme",
    sampleQuestion: "Mağazaya yeni bir ürün nasıl eklerim?",
    roles: ["club_admin"],
    answer:
      "1. Mağaza Yönetimi'ne gir, \"+ Ürün Ekle\"ye bas.\n" +
      "2. Başlık, fiyat, kategori ve cinsiyet gir; varsa renk/beden seçeneklerini ekle.\n" +
      "3. Fotoğraf ekleyip Kaydet'e bas.",
  },
  {
    keywords: ["mağaza sipariş", "siparişleri gör", "sipariş yönetimi", "sipariş geldi"],
    title: "Mağaza siparişlerini görme",
    sampleQuestion: "Gelen mağaza siparişlerini nereden görürüm?",
    roles: ["club_admin"],
    answer: "Mağaza Yönetimi ekranındaki \"📦 Siparişler\" butonuna bas — bekleyen siparişler burada rozetle gösterilir.",
  },
  {
    keywords: ["duyuru gönder", "duyuru oluştur", "duyuru paylaş"],
    title: "Duyuru oluşturma",
    sampleQuestion: "Kulübe nasıl duyuru gönderirim?",
    roles: ["club_admin"],
    answer:
      "1. Duyurular ekranına gir.\n" +
      "2. \"+ Duyuru\" ile başlık ve içerik yazıp kaydet — kimlerin göreceğini seçebilirsin.",
  },

  // --- Veli ---
  {
    keywords: ["aidat öde", "aidat nasıl öder", "ödeme yap", "borcumu öde"],
    title: "Aidat ödeme",
    sampleQuestion: "Aidatımı nasıl öderim?",
    roles: ["parent"],
    answer:
      "Ana Sayfa → Aidat Öde'ye gir. Güncel borcunu görürsün; Havale/EFT ya da Elden Ödeme seçeneklerinden birini seçip \"Ödedim, Bildir\" dersin — kulüp yönetimi kontrol edince durumun \"Ödendi\" olarak güncellenir.",
  },
  {
    keywords: ["kayıt dondur", "üyeliği dondur", "dondurma talebi"],
    title: "Kayıt dondurma talebi",
    sampleQuestion: "Çocuğumun kaydını nasıl dondururum?",
    roles: ["parent"],
    answer: "Ana Sayfa → Kayıt Dondurma'ya gir. En az 1, en fazla 3 aylık bir dondurma talebi oluşturabilirsin.",
  },
  {
    keywords: ["sporcunun kaydını dondur", "sporcuyu dondur", "kayıt dondurma oluştur"],
    title: "Bir sporcunun kaydını dondurma",
    sampleQuestion: "Bir sporcunun kaydını nasıl dondururum?",
    roles: ["club_admin", "coach"],
    answer:
      "Sporcu Yönetimi'nden sporcunun profiline gir, Kayıt Dondurma bölümünden yeni bir dondurma oluştur (1-3 ay arası) — " +
      "oluşturunca admin, grubun antrenörü ve veli/sporcu hesabına bildirim gider.",
  },
  {
    keywords: ["çocuğumun gelişimi", "sporcu takibi", "performansını gör", "gelişimini takip"],
    title: "Çocuğunun gelişimini takip etme",
    sampleQuestion: "Çocuğumun gelişimini nereden takip ederim?",
    roles: ["parent"],
    answer: "Ana Sayfa → Sporcum'a gir — çocuğunun profilini, performans testi sonuçlarını ve fitness programını görebilirsin.",
  },
  {
    keywords: ["yoklama durumu", "katılım durumu", "devamsızlığımı gör", "çocuğum geldi mi"],
    title: "Çocuğunun yoklama durumunu görme",
    sampleQuestion: "Çocuğumun yoklama durumunu nasıl görürüm?",
    roles: ["parent"],
    answer: "Ana Sayfa → Yoklama Durumu'na gir — çocuğunun geçmiş antrenmanlara katılım kaydını görürsün.",
  },

  // --- Sporcu ---
  {
    keywords: ["günlük check-in", "uyku enerji", "ruh halimi kaydet", "wellness"],
    title: "Günlük check-in yapma",
    sampleQuestion: "Günlük check-in'i nasıl yaparım?",
    roles: ["athlete"],
    answer: "Ana Sayfa → Günlük Check-in'e gir — uyku, enerji ve ruh hâlini kaydet, antrenörün bunu görecek.",
  },
  {
    keywords: ["performansım", "test sonuçlarım", "gelişimimi gör", "ölçüm sonuçlarım"],
    title: "Kendi performansını görme",
    sampleQuestion: "Performans sonuçlarımı nereden görürüm?",
    roles: ["athlete"],
    answer: "Ana Sayfa → Performansım'a gir — test sonuçlarını ve zaman içindeki gelişimini görürsün.",
  },
  {
    keywords: ["antrenman programım", "bugün ne yapacağım", "fitness programım"],
    title: "Kendi antrenman programını görme",
    sampleQuestion: "Antrenman programımı nereden görürüm?",
    roles: ["athlete"],
    answer: "Ana Sayfa → Performansım → Program'a gir — antrenörünün sana ya da grubuna atadığı fitness programını görürsün.",
  },

  // --- Herkes ortak ---
  {
    keywords: ["takvime ekle", "takvim senkron", "google takvim", "telefonun takvimi"],
    title: "Programı telefonun takvimine ekleme",
    sampleQuestion: "Programımı telefonumun takvimine nasıl eklerim?",
    answer:
      "1. Takvim ekranında (ya da Programım'da) \"Takvimime Ekle\" butonuna bas.\n" +
      "2. Takvim izni ver — antrenman/maç programın telefonunun kendi takviminde, ayrı bir \"X-NETIC\" takvimi olarak oluşur.\n" +
      "3. Program değişince aynı butona tekrar basman yeterli, otomatik güncellenir.",
  },
  {
    keywords: ["şifremi unuttum", "şifre hatırlamıyorum", "giriş yapamıyorum"],
    title: "Şifremi unuttum",
    sampleQuestion: "Şifremi unuttum, ne yapmalıyım?",
    answer:
      "Giriş ekranında \"Şifremi Unuttum\"a bas, telefon numaranı ya da kullanıcı adını gir.\n" +
      "Gerçek bir e-postan varsa doğrudan bir sıfırlama linki gelir; yoksa kulüp yöneticine bir bildirim gider, o sana yeni bir geçici şifre üretip iletir.",
  },
  {
    keywords: ["mesaj gönder", "nasıl mesajlaşırım", "yazışma"],
    title: "Mesajlaşma",
    sampleQuestion: "Bir kullanıcıya nasıl mesaj gönderirim?",
    answer: "Alt menüdeki Mesajlar sekmesine gir — kulüp içindeki diğer kullanıcılarla birebir yazışabilirsin.",
  },
  {
    keywords: ["bildirimleri gör", "zil ikonu", "bildirim ayarı", "bildirim kapat"],
    title: "Bildirimleri görme ve ayarlama",
    sampleQuestion: "Bildirim ayarlarımı nereden değiştiririm?",
    answer:
      "Ekranın üstündeki zil ikonuna dokun — tüm bildirimlerini listeler.\n" +
      "Profil → Bildirim Tercihleri'nden, hangi bildirim türlerini almak istemediğini de seçebilirsin.",
  },
  {
    keywords: ["profilimi güncelle", "bilgilerimi değiştir", "telefonumu değiştir", "adımı soyadımı değiştir", "fotoğrafımı değiştir"],
    title: "Profil bilgilerini güncelleme",
    sampleQuestion: "Profil bilgilerimi nasıl güncellerim?",
    answer: "Alt menüdeki Profil sekmesinden Kişisel Bilgiler'e gir — fotoğraf, ad soyad ve telefon gibi bilgilerini oradan güncelleyebilirsin.",
  },
  {
    keywords: ["giriş bilgimi değiştir", "giriş yöntemimi değiştir", "kullanıcı adımı değiştir", "email adresimi değiştir", "e-postamı değiştir"],
    title: "Giriş bilgini (telefon/e-posta/kullanıcı adı) değiştirme",
    sampleQuestion: "Giriş yaparken kullandığım telefon/kullanıcı adımı nasıl değiştiririm?",
    answer:
      "Profil → Giriş ve Şifre İşlemleri'ne gir, üstteki Giriş Bilgisi bölümünden yeni telefon numaranı, kullanıcı adını ya da e-postanı girip kaydet.\n" +
      "Bir sonraki girişte artık yeni bilgiyle giriş yaparsın.",
  },
  {
    keywords: ["şifremi değiştir", "kendi şifremi güncelle", "yeni şifre belirle"],
    title: "Kendi şifreni değiştirme",
    sampleQuestion: "Kendi şifremi nasıl değiştiririm?",
    answer:
      "Profil → Giriş ve Şifre İşlemleri'ne gir, Şifre Değiştir bölümünde mevcut şifreni ve yeni şifreni girip kaydet.\n" +
      "Güvenlik için mevcut şifreni bilmen gerekir — bilmiyorsan \"Şifremi Unuttum\" akışını kullanman gerekir.",
  },
  {
    keywords: ["yardım al", "destek iste", "kulübe soru sor", "teknik destek", "sorun bildir"],
    title: "Yardım/Destek'ten kulübe ulaşma",
    sampleQuestion: "Bir sorun yaşarsam nereden yardım isterim?",
    answer:
      "Profil → Yardım/Destek'e gir, mesajını yaz ve \"Mail Gönder\"e bas — mail uygulaman, kulübün destek adresine önceden doldurulmuş bir maille açılır.",
  },
  {
    keywords: ["mağazadan ürün al", "ürün sipariş ver", "kulüp ürünü satın al", "mağazadan sipariş"],
    title: "Mağazadan ürün sipariş etme",
    sampleQuestion: "Mağazadan bir ürünü nasıl sipariş ederim?",
    roles: ["parent", "athlete"],
    answer:
      "Ana Sayfa → Mağaza'ya gir, bir ürüne dokun. Varsa renk/beden seç, ödeme yöntemini (Havale/EFT ya da Elden) seç ve \"Sipariş Ver\"e bas.\n" +
      "Siparişinin durumunu Mağaza ekranındaki \"📦 Siparişlerim\"den takip edebilirsin.",
  },
  {
    keywords: ["beslenme tarifi", "yemek tarifi", "hangi besinleri yemeliyim", "beslenme önerisi"],
    title: "Beslenme önerilerini görme",
    sampleQuestion: "Beslenme önerilerini nereden görürüm?",
    roles: ["parent", "athlete"],
    answer: "Ana Sayfa → Beslenme'ye gir — antrenörünün kulübün için hazırladığı besin listelerini ve rehber yazılarını/PDF'lerini buradan görebilirsin.",
  },
];

export function findGuideAnswer(question: string, role: UserRole | null): GuideEntry | null {
  const q = question.toLowerCase().trim();
  if (!q) return null;
  const visibleToRole = GUIDE_ENTRIES.filter((entry) => !entry.roles || (role && entry.roles.includes(role)));
  return visibleToRole.find((entry) => entry.keywords.some((k) => q.includes(k))) ?? null;
}

export function getSuggestedQuestions(role: UserRole | null): GuideEntry[] {
  return GUIDE_ENTRIES.filter((entry) => !entry.roles || (role && entry.roles.includes(role)));
}

const { e } = require("./helpers");

// ===================== SIK SORULAN SORULAR VE SORUN GİDERME =====================
e("roller-ozet", "sss", "ACPSKX", "Roller ne yapabilir (Yönetici, Koordinatör, Antrenör, Veli, Sporcu)",
  ["roller nedir", "hangi rol ne yapar", "koordinatör ile antrenör farkı", "yetkilerim neler", "veli ne görür", "yönetici yetkileri", "rol farkları"],
  `• Kulüp Yöneticisi: Kulübün tamamını yönetir — sporcular, antrenörler, gruplar/branşlar/salonlar, finans, duyurular, kulüp ayarları, kullanıcı hesapları.
• Branş Koordinatörü: Bir branşın sorumlusu olan antrenördür. Kendi branşında yönetici gibi çalışır (tüm sporcular, antrenörler, gruplar, salonlar, aidatlar, duyuru, rozet ayarı, mağaza/etkinlik yönetimi) ama diğer branşlara ve kulüp ayarlarına erişemez.
• Antrenör: Yalnızca kendisine atanan grupların sporcularını görür; yoklama alır, antrenman planlar, ölçüm ve fitness girişi yapar, müsabaka sonucu girer.
• Veli: Kendi çocuklarının profilini, yoklamasını, takvimini, ölçümlerini görür; aidat ödeme bildirimi yapar, mağazadan sipariş verir, etkinliklere kayıt yaptırır, "gelemeyecek" bildirimi gönderir.
• Sporcu: Kendi profilini, takvimini, ölçümlerini görür; check-in ve zorluk derecesi girer, bireysel fitness programı yazar, paylaşım yapar (onaya tabi).
• Süper Admin: Platformu yönetir; hiçbir kulübün üye verisine erişemez.
Herkes yalnızca kendisini ilgilendiren veriyi görür; kulüpler birbirinden tamamen ayrıdır.`);

e("gizlilik-kim-gorur", "sss", "ACPSKX", "Kişisel bilgilerimi kimler görebilir",
  ["verilerimi kim görür", "gizlilik", "kişisel bilgiler güvende mi", "başka veliler görebilir mi", "telefonumu kim görür", "veri güvenliği"],
  `Veriler role göre kısıtlıdır ve kulüpler birbirini göremez:
• Veli, yalnızca kendi çocuğunun bilgilerini görür; başka velilerin ya da sporcuların bilgilerini göremez.
• Sporcular birbirlerinin sadece ad soyad ve fotoğrafını görebilir (mesajlaşma için), telefon/adres gibi bilgileri göremez.
• Antrenör, yalnızca atandığı grupların sporcu/veli bilgilerini görür.
• Koordinatör kendi branşını, yönetici kendi kulübünü görür.
• Koç notlarını sadece yönetici ve antrenörler görür.
• Süper Admin kulüplerin üye verisine erişemez.
Detaylı bilgi için xnetic.net/kvkk adresindeki aydınlatma metnine bak.`);

e("sporcu-gorunmuyor", "sss", "PS", "\"Bağlı bir sporcu bulunamadı\" hatası",
  ["bağlı bir sporcu bulunamadı", "sporcum görünmüyor", "çocuğumu göremiyorum", "hesabım sporcuya bağlı değil"],
  `Bu, hesabının henüz bir sporcuya bağlanmadığı anlamına gelir. Sporcu kaydı açılmış olsa bile hesabın o sporcuya bağlanması yönetici (ya da koordinatör) tarafından yapılır. Kulüp yöneticine haber ver: sporcu kaydında "Veli Giriş Hesabı" / "Sporcu Giriş Hesabı" alanında senin hesabını bağlaması gerekir.`);

e("foto-izin", "sss", "ACPSK", "Fotoğraf/galeri yüklenmiyor (izin)",
  ["fotoğraf seçemiyorum", "galeri izni", "izin gerekli", "fotoğraf yüklenmiyor", "galeriye erişim", "video seçemiyorum"],
  `Fotoğraf ya da video seçerken "İzin gerekli" uyarısı çıkıyorsa telefonunun Ayarlar → X-NETIC → Fotoğraflar bölümünden galeri erişimine izin ver, sonra tekrar dene. Uygulama kameranı ve mikrofonunu kullanmaz; yalnızca galerinden seçtiğin dosyalara erişir.`);

e("dosya-buyuk", "sss", "AKC", "\"Dosya çok büyük\" hatası",
  ["dosya çok büyük", "ek yüklenmiyor", "duyuru eki boyutu", "video çok büyük", "dosya boyutu sınırı", "yükleme hatası"],
  `Duyuru ekleri en fazla 1 MB olabilir; daha büyük dosyalarda "Dosya çok büyük" uyarısı çıkar. Fotoğrafı küçültüp tekrar dene ya da ağır videoları paylaşmak yerine kısa bir sürüm/bağlantı kullan. Sosyal Alan ve etkinlik görselleri seçildiğinde uygulama tarafından otomatik küçültülür.`);

e("baglanti-sorunu", "sss", "ACPSKX", "Veriler yüklenmiyor / bağlantı sorunu",
  ["veriler yüklenmiyor", "internet yok hatası", "ekran boş", "yüklenemedi hatası", "uygulama yavaş", "bağlantı hatası", "sayfa açılmıyor"],
  `1. İnternet bağlantını (Wi-Fi ya da mobil veri) kontrol et.
2. Listeyi aşağı çekerek yenile.
3. Uygulamayı tamamen kapatıp yeniden aç.
4. Sorun sürerse ve "Bakım Çalışması" ekranı çıkmıyorsa Profil → Yardım / Destek'ten bize yaz.`);

e("islem-geri-alinamaz", "sss", "AKC", "Yanlışlıkla sildim, geri alabilir miyim",
  ["yanlışlıkla sildim", "silineni geri al", "geri alma", "silme geri alınamaz", "veriyi kurtar"],
  `Silme işlemleri (sporcu, antrenman, grup, müsabaka, gelir/gider, duyuru vb.) genellikle KALICIDIR ve geri alınamaz; bu yüzden silmeden önce onay sorulur. Sporcu silmek yerine Pasif yapmak, antrenörü silmek yerine "Kulüpten Çıkar"mak geri dönülebilir seçeneklerdir. Kritik bir veriyi yanlışlıkla sildiysen Profil → Yardım / Destek'ten destek ekibine yaz.`);

e("asistan-nedir", "sss", "ACPSKX", "Asistan ne işe yarar",
  ["asistan nedir", "asistan ne yapar", "yapay zeka mısın", "sen kimsin", "nasıl soru sorulur", "asistan yardım", "kılavuz"],
  `Ben X-NETIC Asistanı: uygulamanın kullanma kılavuzuyum. Uygulamadaki her özelliğin nasıl kullanıldığını rolüne göre (yönetici, koordinatör, antrenör, veli, sporcu ya da süper admin) adım adım anlatırım. Kendi cümlenle sorabilirsin (ör. "yoklama nasıl alınır"), sağ üstteki "💡 Örnek Sorular"dan hazır bir soru seçebilir ya da "📖 Kılavuz"dan başlıkları tek tek gezebilirsin.
Not: Gerçek bir yapay zeka değilim ve kulübünün kendi verilerini (ör. "bu ay kaç sporcu geldi") okuyup yorumlayamam; onlar için ilgili ekrana bakman gerekir. Cevabı bulamazsam en yakın başlıkları önerir, yine olmazsa Profil → Yardım / Destek'i gösteririm.`);

e("hangi-ekranda", "sss", "ACPSKX", "Bir özelliği hangi ekranda bulurum",
  ["nerede bulurum", "hangi ekranda", "özellik nerede", "menüde göremiyorum", "bu özellik yok", "kutucuk görünmüyor", "neden göremiyorum"],
  `Bir özelliği göremiyorsan üç olası sebep vardır: 1) Rolünde o özellik yoktur (ör. veli, sporcu ekranlarında yönetim düğmeleri görünmez). 2) Kulübün o özelliği kapatmıştır (Ana Sayfa Özellikleri, Günlük Check-in, Zorluk Derecesi, Kayıt Dondurma ayarlarından). 3) Henüz veri yoktur (ör. bir gruba atanmadıysan sporcu listesi boş görünür). Sorduğun özelliğin adını yaz, hangi rolde nereden ulaşıldığını söyleyeyim.`);

e("veli-hesap-cikis", "sss", "P", "Birden fazla çocuğum var, hepsi tek hesapta mı",
  ["iki çocuğum var", "birden fazla çocuk", "kardeş", "ikinci çocuğu ekle", "tek hesapla birden fazla sporcu"],
  `Evet. Aynı veli hesabına birden fazla sporcu bağlanabilir. Ana Sayfa → "Sporcum"a girdiğinde önce çocuklarının listesi gelir, sonra hangisinin profilini görmek istediğini seçersin. Yeni bir çocuğun bağlanması için kulüp yöneticinden onu senin veli hesabına bağlamasını iste.`);

e("hesap-kilitlendi", "sss", "ACPSKX", "Şifreyi çok yanlış girdim / hesabım açılmıyor",
  ["hesabım kilitlendi", "giriş yapamıyorum şifre yanlış", "hesap devre dışı", "giriş reddedildi", "şifre kabul etmiyor", "şifrem yanlış diyor", "giriş yapamıyorum şifrem yanlış diyor", "şifre yanlış diyor"],
  `1. Kullanıcı adı/telefon/e-postayı ve şifreyi doğru yazdığından emin ol (büyük-küçük harf önemli).
2. Hâlâ giremiyorsan giriş ekranında "Şifremi Unuttum"u kullan.
3. Hesabın devre dışı bırakılmış olabilir (ör. hesap silme talebinden sonra); kulüp yöneticinle iletişime geç.`);

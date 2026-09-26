const { e } = require("./helpers");

// ===================== SPORCU YÖNETİMİ =====================
e("sporcu-listesi", "sporcu", "ACK", "Sporcuları görüntüleme ve arama",
  ["sporcu listesi", "sporcuları görme", "sporcu ara", "sporcularım", "sporcu yönetimi nerede", "tüm sporcular", "sporcu bul"],
  `1. Ana Sayfa → "Sporcu Yönetimi" (antrenörde "Sporcularım") kutucuğuna dokun.
2. Önce branşı, sonra (varsa) salonu ve grubu seç; grubun sporcuları listelenir.
3. Tüm sporcuları tek listede görmek için "📋 Tüm Sporcular"a dokun; arama kutusundan ada göre, üstteki filtrelerden branş ve tipe (Tümü / Spor Okulu / 🏆 Müsabık) göre süzebilirsin.
Antrenörler yalnızca kendilerine atanmış grupların sporcularını görür; koordinatör branşın tüm sporcularını, yönetici kulübün tamamını görür.`);

e("sporcu-ekle", "sporcu", "ACK", "Yeni sporcu ekleme",
  ["yeni sporcu ekle", "sporcu kaydı", "sporcu nasıl eklenir", "sporcu oluştur", "öğrenci ekle", "üye ekle"],
  `1. Ana Sayfa → Sporcu Yönetimi'ne gir ve "+ Yeni Sporcu"ya dokun.
2. Zorunlu alanları doldur: Ad Soyad, Grup, Veli Adı Soyadı ve Veli Telefon.
3. İstersen Doğum Tarihi, Cinsiyet, Boy, Kilo, Okul, Forma Bedeni, Forma Numarası, fotoğraf ve Durum bilgilerini de gir.
4. İstersen aynı ekrandan Veli ve/veya Sporcu giriş hesabı aç ya da bağla (aşağıdaki "hesap bağlama" başlığına bak).
5. İstersen Aylık Aidat ve İlk Ödeme Tarihi'ni girerek aidat planını da başlat.
6. "Kaydet"e dokun.
Sporcu tipi (Spor Okulu/Müsabık) seçtiğin grubun tipine göre otomatik belirlenir.`);

e("sporcu-duzenle-sil", "sporcu", "ACK", "Sporcu bilgisini düzenleme, pasife alma, silme",
  ["sporcu bilgisi düzenle", "sporcuyu sil", "sporcuyu pasif yap", "sporcu bilgilerini değiştir", "sporcu kaydı sil", "sporcu ayrıldı", "sporcunun boyunu kilosunu değiştir", "boy kilo değiştir", "sporcu boyunu güncelle"],
  `• Düzenleme: Sporcuya dokun, profilindeki "Düzenle"ye bas, alanları güncelle ve Kaydet.
• Pasife alma: Düzenleme ekranındaki "Durum" alanını Pasif yap; sporcu listede pasif görünür ve yoklamalarda çıkmaz.
• Silme: Profildeki "Sporcuyu Sil"e dokun. DİKKAT: Sporcunun TÜM yoklama, aidat, sakatlık ve not geçmişi kalıcı olarak silinir ve geri alınamaz. Ayrılan sporcular için silmek yerine Pasif yapmak genellikle daha güvenlidir.`);

e("sporcu-detay", "sporcu", "ACK", "Sporcu detay ekranında neler var",
  ["sporcu profili", "sporcu detayı", "devam yüzdesi", "profil tamamlanma", "sporcu profilinde ne görürüm", "son antrenmanlar sporcu"],
  `Sporcunun profil ekranında şunlar bulunur:
• Üstte fotoğraf, ad, grup, durum ve sporcu tipi; yaş, devam yüzdesi (ve müsabıksa forma numarası).
• Hızlı düğmeler: Veli ara, Mesaj, Yoklama, Performans.
• Profil tamamlanma çubuğu (eksik alan sayısı).
• "Bilgiler" ve "Veli" sekmeleri: kategori, doğum tarihi, boy, kilo, okul, forma bedeni/numarası, veli adı ve telefonu.
• "Son 5 Antrenman": grup, salon, katılım durumu ve tarih.
• Koç Notları ve Sakatlık Geçmişi.
• Düzenle, Ek Branşlar ve Gruplar, Kaydı Dondur, Sporcuyu Sil düğmeleri.`);

e("sporcu-hesap-baglama", "sporcu", "AK", "Veli / sporcu giriş hesabı açma ve bağlama",
  ["veli hesabı aç", "sporcu hesabı aç", "hesap bağla", "veliye giriş ver", "veli giriş yapamıyor", "hesap oluştur", "geçici şifre ver", "bağlı hesap yok"],
  `Veli ya da sporcunun uygulamaya girebilmesi için bir giriş hesabı gerekir; sporcu kaydındaki veli adı/telefonu tek başına giriş vermez.
1. Sporcu ekleme/düzenleme ekranında "Veli Giriş Hesabı" ve "Sporcu Giriş Hesabı" alanlarını bul.
2. Yeni hesap için telefon numarası ya da kullanıcı adını gir ve hesabı oluştur; daha önce davet edilmiş bir hesabın varsa listeden seçip bağla.
3. Ekranda çıkan geçici şifreyi KOPYALA ve kişiye (WhatsApp, SMS, telefonla) ilet — bu şifre bir daha gösterilmez.
4. Kişi bu bilgiyle giriş yapar ve ilk girişte kendi şifresini belirler.
Bağlı hesap yoksa o veliye mesaj ya da uyarı bildirimi gönderilemez.`);

e("sporcu-excel", "sporcu", "ACK", "Excel'den toplu sporcu aktarma",
  ["excelden aktar", "toplu sporcu ekle", "excel ile sporcu yükle", "sporcuları içe aktar", "şablon indir", "toplu kayıt"],
  `1. Sporcu Yönetimi'nde "Excelden Aktar"a dokun.
2. "📥 Şablonu İndir"e bas; şablondaki "Adı Soyadı" ve "Branşı" sütunlarını doldur.
3. "📤 Dosya Seç" ile doldurduğun .xlsx dosyasını yükle; önizlemede eşleşmeyen branşlar uyarı olarak görünür.
4. "İçe Aktar"a bas.
Boy, kilo, veli bilgisi gibi diğer alanları sporcunun kendisi ya da yönetici sonradan tamamlar. Grup ataması içe aktarmada yapılmaz; koordinatör/yönetici Sporcu Yönetimi'nden sonradan atar.`);

e("sporcu-tipi", "sporcu", "AK", "Sporcu tipi (Spor Okulu / Müsabık)",
  ["müsabık nedir", "spor okulu nedir", "sporcu tipi değiştir", "müsabık yap", "sporcu tipi neden değişmiyor", "forma numarası neden yok"],
  `Sporcu tipi sporcuya tek tek değil GRUBA göre belirlenir: gruptaki herkes aynı tiptedir. Bir sporcunun tipini değiştirmek için Kulüp Yapısı → Gruplar'dan grubun tipini (Spor Okulu ya da 🏆 Müsabık) güncelle; gruptaki tüm sporcular otomatik güncellenir.
Müsabık sporcular maç kadrolarına seçilebilir, Günlük Check-in doldurabilir ve forma numarası/bedeni alanları görünür. Spor Okulu sporcuları maç kadrosuna girmez.`);

e("sporcu-ek-grup", "sporcu", "AK", "Sporcuyu ikinci bir branşa/gruba ekleme",
  ["ek branş", "ikinci grup", "birden fazla grupta", "başka gruba da ekle", "ek grup"],
  `Sporcunun profilindeki "Ek Branşlar ve Gruplar"a dokun; sporcuyu ana grubuna ek olarak başka bir branş/gruba da bağlayabilirsin. Listede bu sporcular "Ek Grup" etiketiyle görünür.`);

e("sakatlik", "sporcu", "ACK", "Sakatlık kaydı",
  ["sakatlık bildir", "sakatlık kaydı", "sporcu sakatlandı", "sakatlık geçmişi", "tahmini dönüş tarihi"],
  `1. Sporcunun profilinde "Sakatlık Geçmişi"ne gir ve "+ Bildir"e dokun.
2. Sakatlık Türü (ör. ayak bileği burkulması) ve Tarih'i gir; biliniyorsa Tahmini Dönüş Tarihi'ni ekle.
3. Kaydet.
Geçmiş kayıtlar ve tahmini dönüş tarihleri aynı ekranda listelenir.`);

e("kocluk-notu", "sporcu", "ACK", "Sporcu için koç notu yazma",
  ["koç notu", "sporcu notu ekle", "not yaz sporcu", "antrenör notu"],
  `Sporcunun profilinde "Koç Notları"na gir, "Yeni not yaz..." alanına notunu yaz ve "Ekle"ye dokun. Bu notları sadece kulüp yöneticisi ve ilgili antrenörler görür; veli ve sporcu göremez.`);

e("veli-ara", "sporcu", "ACK", "Veliyi arama / mesaj gönderme",
  ["veliyi ara", "veli telefonu", "veliye mesaj at", "veliye ulaş"],
  `Sporcunun profilinde "Veli ara" düğmesi kayıtlı veli telefonuna arama başlatır, "Mesaj" düğmesi uygulama içi sohbet açar. Sporcunun bağlı bir veli giriş hesabı yoksa mesaj gönderilemez ("Veli hesabı yok" uyarısı çıkar); önce hesabı bağla.`);

// ===================== SPORCUM (VELİ VE SPORCU) =====================
e("cocugumun-profili", "sporcum", "P", "Çocuğumun profilini görme",
  ["çocuğumun profili", "sporcum ekranı", "çocuk seçimi"],
  `Ana Sayfa → "Sporcum"a dokun. Tek çocuğun varsa profili doğrudan açılır; birden fazla çocuğun varsa önce hangisini görmek istediğini seçersin.
"Bağlı bir sporcu bulunamadı" görüyorsan çocuğun hesabına henüz bağlanmamışsın demektir; kulüp yöneticine haber ver, veli hesabını sporcuya o bağlar.`);

e("sporcu-takibi", "sporcum", "PS", "\"Sporcu Takibi\" (gelişimini takip et)",
  ["sporcu takibi", "gelişimi takip et", "ölçümlerim", "günlük durum", "egzersiz geçmişi"],
  `Sporcu profilindeki "Sporcu Takibi" bölümünden gelişimi görüntülersin:
• Bireysel Programım — kendi yazdığın fitness programı (sporcu hesabında)
• Ölçümler — hız, sıçrama, kuvvet ve dayanıklılık testi sonuçların ve önceki ölçüme göre değişim
• Günlük Durum — Günlük Check-in geçmişin (uyku, enerji, yorgunluk)
• Grup Programı — antrenörünün yayınladığı çalışma programı
• Egzersiz Geçmişi — fitness/kuvvet antrenmanı geçmişi
• Kayıt Dondurma — velinin başlatabildiği geçici dondurma
Bu bölümdeki ekranlar velilerde yalnızca görüntülemedir.`);

e("yoklama-durumu", "sporcum", "PS", "Yoklama / katılım durumunu görme",
  ["yoklama durumu", "katılım durumu", "kaç antrenmana katıldı", "devamsızlık", "antrenmana geldi mi", "katılım yüzdesi"],
  `Ana Sayfa → "Yoklama Durumu" (sporcuda "Antrenman Katılım Durumu") ekranında her antrenman için Katıldı / Katılmadı durumunu ve toplam "X/Y antrenmana katıldı" bilgisini görürsün. Henüz yoklama girilmemişse "Henüz yoklama kaydı yok" yazar.`);

e("takvim-veli-sporcu", "sporcum", "PS", "Antrenman ve müsabaka takvimini görme",
  ["takvim", "antrenman saatleri", "antrenman ne zaman", "müsabaka ne zaman", "haftalık program", "ders programı"],
  `Ana Sayfa → "Antrenman ve Müsabaka Takvimi" (sporcuda "Takvim") ekranında aylık takvim açılır. Antrenman olan günlerde sarı, müsabaka olan günlerde kırmızı/mercan işaret görünür. Bir güne dokununca o günün antrenman/müsabakaları listelenir; birine dokunarak konuyu, program notlarını ve katılım durumunu görürsün. "Bu gün antrenman yok" yazıyorsa o gün için planlanmış bir şey yoktur.`);

e("takvime-ekle-kullanici", "sporcum", "PSACK", "Antrenmanları telefonumun takvimine ekleme",
  ["takvimime ekle", "telefon takvimi", "takvime aktar", "takvim senkron", "antrenmanı telefonuma ekle"],
  `Takvim ekranındaki "📅 Takvimime Ekle" (yönetici/antrenörde "📲 Takvimime Ekle") düğmesine dokun. İlk seferde telefonunun takvimine erişim izni istenir; izin verince antrenman ve müsabakalar telefon takvimine eklenir. Bu, hatırlatıcılarını kullanmaz, sadece takvimine etkinlik yazar.`);

e("gelemeyecegim", "sporcum", "PS", "\"Antrenmana gelemeyeceğim\" bildirimi",
  ["antrenmana gelemeyeceğim", "mazeret bildir", "izin bildirimi", "gelemeyeceğini antrenöre bildir", "bildirimi iptal et", "hasta olduğu için gelemeyecek"],
  `1. Takvimden ilgili antrenmanın detayına gir.
2. "Bu Antrenmana Katılamayacak mısın?" (veli hesabında "Çocuğun Bu Antrenmana Katılamayacak mı?") bölümüne sebebi yaz (ör. hastayım, okul sınavım var).
3. Gönder.
Antrenörüne sebebiyle birlikte bildirim gider. Vazgeçersen aynı yerdeki "Bildirimi İptal Et" ile geri alabilirsin. Sebep yazmadan gönderilmez. Küçük sporcuların telefonu olmayabileceği için bunu veli de yapabilir.`);

e("antrenman-detay-sporcu", "sporcum", "PS", "Antrenman detayında neler görünür",
  ["antrenman detayı", "antrenman konusu", "program notları", "antrenmana tıkla"],
  `Takvimden bir antrenmana dokunduğunda: antrenmanın konusu, antrenörün program notları, senin katılım durumun, "gelemeyeceğim" bildirimi ve (sporcuysan) Algılanan Zorluk Derecesi kutusu görünür.`);

// ===================== TAKVİM, ANTRENMAN VE YOKLAMA =====================
e("takvim-yonetici", "takvim", "ACK", "Takvimi kullanma (antrenman/müsabaka)",
  ["takvim yönetici", "antrenman takvimi", "takvim filtre", "takvimde nasıl gezinirim", "takvim renkleri", "gün detayı"],
  `Ana Sayfa → "Takvim" (antrenörde "Antrenman Planla") aylık takvimi açar. Sarı noktalar antrenmanı, kırmızı noktalar müsabakayı gösterir. Bir güne dokununca o günün etkinlikleri altta listelenir. Üstteki filtrelerle Tümü / Antrenman / Müsabaka ve branş/grup seçebilirsin. "🏆 Sonuçlar" biten müsabaka sonuçlarını, "📲 Takvimime Ekle" telefon takvimine aktarmayı sağlar.`);

e("antrenman-ekle", "takvim", "ACK", "Tek seferlik antrenman oluşturma",
  ["antrenman ekle", "antrenman planla", "günlük antrenman planlama", "antrenman oluştur", "yeni antrenman", "antrenman nasıl eklenir"],
  `1. Takvim'de antrenman eklemek istediğin güne dokun ve "🗓 Antrenman Ekle"yi seç (Antrenman Planla kutucuğunda "🗓 Günlük Antrenman Planlama").
2. İstersen önce Salon'u seç; grup listesi o salona atanmış gruplarla sınırlanır.
3. Grup, Tarih, Başlangıç ve Bitiş saatini (SS:DD biçiminde, ör. 18:00) gir. İstersen Konu ve Notlar ekle.
4. Kaydet.
Saat geçersizse (ör. 25:70) uyarı çıkar. Grubun veli ve sporcularına antrenman bildirimi gider.`);

e("haftalik-plan", "takvim", "ACK", "Haftalık antrenman planı oluşturma",
  ["haftalık antrenman planlama", "haftalık program", "sabit haftalık program", "planı gönder", "toplu antrenman oluştur", "her hafta aynı gün antrenman"],
  `Aynı gün ve saatte tekrar eden antrenmanları tek seferde oluşturmak için:
1. Antrenman Planla/Takvim'de "📅 Haftalık Antrenman Planlama"yı seç.
2. Listede yalnızca "Sabit Haftalık Program"ı açık gruplar görünür (bu ayar Kulüp Yapısı → Gruplar → grup ayarlarından açılır).
3. Gruba dokunup "+ Gün Ekle" ile gün, başlangıç/bitiş saati ve salonu ekle.
4. "Kaç haftalık oluşturulsun?" değerini seç (varsayılan 4, en fazla 20).
5. "📤 Planı Gönder"e bas.
Seçtiğin hafta sayısı kadar antrenman kaydı otomatik oluşur. Aynı salon ve saatte çakışan antrenmanlar atlanır ve sonuçta listelenir.`);

e("antrenman-sil", "takvim", "ACK", "Antrenmanı silme veya düzenleme",
  ["antrenmanı sil", "antrenman düzenle", "antrenman saatini değiştir", "yanlış antrenman oluşturdum", "antrenman iptal"],
  `Takvimde o günü açıp antrenmana dokunarak formunu aç; saat, salon, konu ve notları düzenleyip Kaydet'le. Tamamen kaldırmak için formdaki "Antrenmanı Sil"e dokun ya da takvimde (geçmiş) antrenmanı silme seçeneğini kullan. DİKKAT: Silinen antrenmanın yoklama ve fotoğraf kayıtları da silinir, geri alınamaz.`);

e("yoklama-alma", "takvim", "ACK", "Yoklama alma (Günün Programı)",
  ["yoklama al", "yoklama nasıl alınır", "günün programı", "sporcuları işaretle", "geldi gelmedi işaretle", "hepsini geldi işaretle", "yoklamayı kaydet", "yoklama geçmişi", "geçmiş yoklamaları görme"],
  `1. Ana Sayfa → "Günün Programı"na dokun; bugün antrenmanı olan gruplar listelenir.
2. Grubu seç.
3. Her sporcu için Geldi / Gelmedi / İzinli durumunu seç. Herkes geldiyse "✓ Hepsini Geldi İşaretle" işini hızlandırır.
4. "Yoklamayı Kaydet"e dokun.
5. Antrenman bitince "Antrenmanı Tamamlandı Olarak İşaretle"ye bas.
Yoklama, antrenman başlamadan 15 dakika önce açılır ve başladıktan 15 dakika sonra kapanır (bu süreleri yönetici ayarlayabilir). Zamanı gelmediyse "Henüz zamanı değil" uyarısı çıkar. Pencere kapandıktan sonra o antrenmanın yoklaması KİMSE tarafından (yönetici dahil) değiştirilemez — sadece önizlenir, bu bir güvenlik kuralı olarak sunucuda da uygulanır.

Geçmiş bir antrenmanın yoklamasına bakmak için "📅 Geçmiş Antrenmanlar"a dokun — bu, hem "Günün Programı" ekranında hem de Takvim ekranının üstünde "🏆 Sonuçlar"ın yanında "📋 Yoklama" adıyla bulunur. Kulüp yöneticisi birden çok branşı varsa önce bir branş seçer, sonra o branşın grupları çıkar; branş koordinatörü ve antrenör bu adımı hiç görmez, direkt kendi grupları listelenir. Bir grup seçilince o grubun tüm geçmiş antrenmanları tarih tarih listelenir ("X geldi · Y gelmedi" özetiyle, hiç alınmamışsa "Yoklama alınmadı" yazar). Bir antrenmana dokununca yoklaması açılır — sadece görüntülenir, "🔒 Sadece Önizleme" yazar, hiçbir rol değişiklik yapamaz.`);

e("yoklama-zaman-penceresi", "takvim", "ACK", "Yoklama neden açılmıyor / \"Henüz zamanı değil\"",
  ["yoklama açılmıyor", "henüz zamanı değil", "yoklama kapalı", "yoklama süresi", "yoklama penceresi", "yoklama zamanı geçti", "yoklama ekranı kilitli", "yoklama ekranı açılmıyor"],
  `Yoklama ekranı sadece belirli bir zaman aralığında açıktır: antrenman başlangıcından (varsayılan) 15 dakika ÖNCE açılır ve başlangıçtan 15 dakika SONRA kapanır. "Antrenmanı Tamamlandı" işaretleme ise bitişe 10 dakika kala açılır. Antrenman bitişinden 15 dakika sonra hâlâ işaretlenmemişse uygulama açıldığında otomatik "Tamamlandı" yapılır. Bu süreler kulübe göre değiştirilebilir: Profil → Kulüp Ayarları → Gelişmiş Ayarlar → Yoklama & Antrenman (yönetici). Pencere kapandıktan SONRA o antrenmana hâlâ girebilirsin ama sadece görüntülemek için — yönetici dahil kimse artık değiştiremez.`);

e("yoklama-durum-cesitleri", "takvim", "ACK", "Yoklama durumları ve mazeretler",
  ["geç kaldı", "raporlu", "izinli", "mazeret", "gelemeyeceğim bildirimi gördüm", "yoklama durumları", "oturum listesi"],
  `Takvimden bir antrenmanı açtığında sporcu listesi (Oturum Listesi) şu durumlarla işaretlenebilir: Geldi, Gelmedi, Geç Kaldı, Raporlu, İzinli. Veli/sporcu "gelemeyeceğim" bildirimi yaptıysa bildirimi ve mazeret sebebini bu ekranda görürsün; izinli sayıp saymayacağına sen karar verirsin. "X/Y yoklaması girilmiş" satırı kaç sporcunun işaretlendiğini gösterir.`);

e("antrenman-ayarlari", "takvim", "A", "Yoklama pencerelerini ayarlama",
  ["yoklama süresini değiştir", "otomatik tamamla", "yoklama ayarları", "tamamlandı işaretleme süresi", "yoklama dakika ayarı"],
  `Profil → Kulüp Ayarları → Gelişmiş Ayarlar → "Yoklama & Antrenman"a gir ve dört süreyi düzenle:
• Günün Programı antrenmandan kaç dakika önce açılsın
• Antrenman başladıktan kaç dakika sonra kapansın
• Antrenmanı Tamamlandı işaretleme bitişe kaç dakika kala açılsın
• Bitişten kaç dakika sonra otomatik tamamlansın
Kaydet'e basınca tüm uygulama yeni değerleri kullanır.`);

// ===================== MÜSABAKALAR =====================
e("musabaka-ekle", "musabaka", "ACK", "Müsabaka (maç) ekleme ve kadro seçme",
  ["müsabaka ekle", "maç ekle", "maç oluştur", "kadro seç", "maç kadrosu", "rakip takım", "yeni maç"],
  `1. Takvim'de maçın günü'ne dokun ve "🏆 Müsabaka Ekle"yi seç.
2. Grup, Rakip Takım, Tarih ve Saat'i gir; istersen Konum ve Açıklama ekle.
3. Kaydet.
4. Müsabaka kaydedildikten sonra açılan kadro bölümünden maça çıkacak sporcuları seç.
Kadroya sadece Müsabık tipindeki sporcular seçilebilir; Spor Okulu sporcuları maç kadrosuna girmez. Bir sporcu aynı güne iki maça eklenmek istenirse uyarı çıkar. Kaydedince grubun velilerine, sporcularına ve antrenörlerine bildirim gider.`);

e("musabaka-sonuc", "musabaka", "ACK", "Müsabaka sonucu girme",
  ["maç sonucu gir", "skor gir", "sonuç kaydet", "müsabaka sonucu", "bireysel sonuç", "sonuç açıklaması"],
  `1. Takvimde biten maça dokun ve sonuç ekranını aç.
2. Bizim Skor ve Rakip Skor'u gir; istersen Sonuç Açıklaması ekle. Bireysel branşlarda (Yüzme, Atletizm vb.) skor yerine sonuç açıklaması yazılır (ör. "Ali 1., Ayşe 3. oldu").
3. "Sonucu Kaydet"e dokun.
Sonuç kaydedilince grubun velilerine, antrenörlerine, koordinatörüne ve sporcularına otomatik bildirim gider.`);

e("musabaka-sonuclari", "musabaka", "ACKPS", "Biten müsabaka sonuçlarını görme",
  ["maç sonuçları", "sonuçlar", "skorlar", "geçmiş maçlar", "maç sonucunu görme", "sonuçları tarihe göre filtrele", "maç sonucu sil", "birden fazla maç sil", "toplu maç silme"],
  `Takvim ekranındaki "🏆 Sonuçlar" düğmesi biten müsabakaları ve skorlarını listeler; branşa ve tarih aralığına (Başlangıç/Bitiş) göre filtreleyebilirsin.

Kulüp yöneticisi ve branş koordinatörü toplu silme yapabilir: bir sonuca uzun bas, üstte "X seçili" ve "🗑 Sil" çıkar; başka sonuçlara dokunarak seçimi genişlet, Sil'e basıp onayla. Veli ve sporcular sonucu bildirimden ve takvimden görür.`);

e("musabaka-sil", "musabaka", "ACK", "Müsabakayı silme / düzenleme",
  ["maçı sil", "müsabakayı iptal et", "maç bilgisini değiştir", "maç saatini düzenle"],
  `Takvimde maça dokunup form ekranını aç; bilgileri düzenleyip Kaydet'le ya da alttaki "Müsabakayı Sil"e dokunup onayla. Silme geri alınamaz.`);

// ===================== KAYIT DONDURMA =====================
e("kayit-dondurma", "sporcu", "ACKP", "Kayıt dondurma",
  ["kayıt dondur", "üyeliği dondur", "aidat dondur", "geçici ara ver", "sporcu kaydını dondurmak", "dondurma süresi"],
  `Sporcunun kaydını geçici olarak dondurmak için:
• Veli: Sporcu profilindeki Sporcu Takibi bölümünden "Kayıt Dondurma"ya gir.
• Yönetici/antrenör: Sporcu profilindeki "Kaydı Dondur"a dokun.
1. Başlangıç ve Bitiş tarihini seç. En az 1 ay, en fazla 3 ay dondurulabilir.
2. İstersen not (sebep) yaz.
3. "Dondurmayı Kaydet"e dokun.
Kayıt yapılınca admin, grubun antrenörü ve veli/sporcu hesabına bildirim gider. Şu an dondurulmuşsa ekranın üstünde "🧊 Şu An Dondurulmuş" görünür; geçmiş dondurmalar alt listede durur ve silinebilir. Kulüp bu özelliği kapatmışsa "Kayıt Dondurma" hiçbir kullanıcıda görünmez.`);

e("kayit-dondurma-ayar", "ayar", "A", "Kayıt Dondurma'yı kulüpte açma/kapatma",
  ["kayıt dondurma kapat", "dondurma özelliği", "kayıt dondurma ayarı", "dondurmayı devre dışı bırak"],
  `Profil → Kulüp Ayarları → Gelişmiş Ayarlar → "Kayıt Dondurma"ya gir ve anahtarla aç ya da kapat; anlık kaydedilir. Kapatınca yeni dondurma başlatılamaz ve "Kayıt Dondurma" kutucukları hiçbir kullanıcıda görünmez; daha önce oluşturulmuş dondurmalar geçerliliğini korur.`);

// ===================== GÜNLÜK CHECK-IN VE ZORLUK DERECESİ =====================
e("checkin-doldurma", "takip", "S", "Günlük Check-in doldurma",
  ["günlük check-in", "wellness", "uyku kaydı", "enerji seviyesi", "ruh hali", "check-in nasıl doldurulur", "check-in yapamıyorum", "check-in pasif"],
  `1. Ana Sayfa → "Günlük Check-in"e dokun.
2. Uyku süresini (saat), uyku kalitesini, kas ağrısı/yorgunluğu, enerji seviyeni ve stres/ruh hâlini (1-5) seç. İstersen dinlenme kalp atış hızını da yaz.
3. "Kaydet"e dokun.
Bu resmi bir test değil, kişisel bir günlüktür; antrenörün trendleri görüp erken uyarı alması için her gün 30 saniyede doldurman yeterli.
Notlar: Check-in yalnızca Müsabık sporcular içindir. Kulübün belirlediği saat aralığında doldurulabilir (varsayılan 06:00-12:00); aralık dışında form pasiftir, sadece geçmiş kayıtlarını görürsün. Kulüp bu özelliği kapattıysa ekran "Günlük Check-in Kapalı" der.`);

e("checkin-takip", "takip", "ACK", "Sporcuların check-in durumunu izleme",
  ["check-in kimler doldurdu", "wellness takibi", "sporcu uyku takibi", "kim check-in yaptı", "yorgunluk takibi", "erken uyarı"],
  `Fitness (Performans) bölümündeki "Wellness Check-in"e gir. Seçtiğin tarihte hangi müsabık sporcuların check-in yaptığını (ve yapmadığını) görürsün; branş, grup ve ada göre filtreleyebilirsin. Bir sporcuya dokununca uyku süresi, uyku kalitesi, yorgunluk, enerji, ruh hâli ve varsa kalp atış hızı (bpm) kayıtlarını görürsün.`);

e("checkin-ayar", "takip", "A", "Günlük Check-in'i açma/kapatma ve saatini ayarlama",
  ["check-in kapat", "check-in saati", "check-in ayarı", "wellness ayarı", "check-in açılış saati", "check-in kapanış saati"],
  `Profil → Kulüp Ayarları → Gelişmiş Ayarlar → "Günlük Check-in"e gir.
• Anahtarla özelliği tamamen açıp kapatırsın (varsayılan: açık).
• Açıkken "Kaç saatte açılsın (0-23)" ve "Kaç saatte kapansın (1-24)" değerlerini yazarsın (varsayılan 06:00-12:00).
• Kaydet'e bas.
Kapatırsan Ana Sayfa'daki check-in kutucuğu kaybolur, ekran açılmaz ve günlük hatırlatma bildirimi gönderilmez.`);

e("rpe-doldurma", "takip", "S", "Antrenman zorluk derecesini (RPE) girme",
  ["zorluk derecesi", "algılanan zorluk", "rpe", "antrenman nasıl geçti", "antrenman zorluğu puanla", "zorluk bildirimi"],
  `Antrenman bittiği anda sana "Antrenman Nasıl Geçti?" bildirimi gider.
1. Bildirime dokun (ya da Takvim → o antrenmanın detayına gir).
2. "Algılanan Zorluk Derecesi" kutusundan 1-10 arası puanla: "Bu antrenman sana ne kadar zor geldi?"
Değerlendirme antrenman bittiği anda açılır ve kulübün belirlediği süre (varsayılan 60 dakika) boyunca açık kalır; süre dolunca artık giriş yapılamaz. Antrenmana "gelmedi" olarak işaretlendiysen bu kutu görünmez. Zorluk derecesini yalnızca sporcu hesabı girebilir, veli giremez. Kulüp bu özelliği kapatmışsa bildirim gitmez ve kutu görünmez.`);

e("rpe-ayar", "takip", "A", "Zorluk derecesini açma/kapatma ve süresini ayarlama",
  ["zorluk derecesi kapat", "rpe ayarı", "zorluk süresi", "zorluk bildirimi kapat", "antrenman zorluk derecesi ayarı", "rpe kaç dakika açık"],
  `Profil → Kulüp Ayarları → Gelişmiş Ayarlar → "Antrenman Zorluk Derecesi"ne gir (bu, Günlük Check-in'den ayrı bir kutudur).
• Anahtarla özelliği açıp kapatırsın (varsayılan: açık).
• Açıkken "Antrenman bitiminden sonra kaç dakika açık kalsın" değerini yazarsın (5-720 dakika, varsayılan 60).
• Kaydet'e bas.
Kapatırsan sporculara bildirim gitmez ve antrenman detayındaki değerlendirme kutusu görünmez.`);

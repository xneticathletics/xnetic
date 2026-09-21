const { e } = require("./helpers");

// ===================== PERFORMANS ÖLÇÜMLERİ =====================
e("performans-genel", "performans", "ACK", "Performans bölümü nedir",
  ["performans nedir", "performans hub", "performans kutucuğu", "performansta neler var", "fitness ölçüm beslenme"],
  `Ana Sayfa → "Performans" üç bölüm içerir:
• Fitness — Check-in ve çalışma takibi (egzersizler, programlar, günlük check-in izleme)
• Performans Ölçümleri — hız, sıçrama, kuvvet ve dayanıklılık testleri
• Beslenme — besinler, sporcu tarifleri ve beslenme rehberi
Testler ve egzersizler hazır bir kütüphaneden gelir; ayrıca kulübüne özel test/hareket ekleyebilirsin.`);

e("olcum-kaydet", "performans", "ACK", "Sporcunun performans ölçümünü kaydetme",
  ["ölçüm kaydet", "test sonucu gir", "sürat testi gir", "performans ölçümü", "sıçrama testi", "ölçüm nasıl girilir", "sporcunun ölçümünü kaydet"],
  `1. Ana Sayfa → Performans → "Performans Ölçümleri"ne gir.
2. Bir kategori seç (Antropometrik, Sürat, Çeviklik, Sıçrama, Kuvvet, Dayanıklılık, Esneklik, Denge/Koordinasyon).
3. Kolaydan zora sıralı testlerden birini seç; "Nasıl Yapılır?" açıklamasını okuyabilirsin.
4. Sporcuyu seç, ölçüm değerini (testin birimiyle: sn, cm, kg vb.) ve Tarih'i gir; istersen not ekle.
5. Kaydet.
Testin altında sporcunun geçmiş ölçümleri listelenir; yanlış kaydı silebilirsin.`);

e("olcum-toplu", "performans", "ACK", "Test grubuyla toplu ölçüm girme",
  ["test grubu", "toplu ölçüm", "tüm gruba sürat testi", "test grubu oluştur", "hızlı ölçüm girişi", "sporcu listesiyle ölçüm"],
  `Bir grup sporcuyu aynı testlerden geçirdiysen hepsini tek ekranda gir:
1. Performans Ölçümleri'nde "+ Test Grubu Ekle"ye dokun.
2. Grup Adı ver (ör. 13 Eylül Sürat Testi), "👥 Gruptan Ekle" ya da "+ Sporcu Ekle" ile sporcuları, "✓ Testleri Seç" ile testleri seç.
3. "Test Grubunu Oluştur"a bas.
4. Grubu açıp bir sporcunun testine dokun, altında açılan alana ölçümü yaz; "Sonraki ›" ile devam et.
5. Sarı "Kaydet"e basınca girdiğin tüm ölçümler kaydedilir. Her sporcunun "Son ölçüm" değeri altında gösterilir.
Sporcuyu gruptan "Çıkar"abilir, test grubunu silebilirsin.`);

e("ozel-test", "performans", "AK", "Kulübe özel test ekleme / düzenleme",
  ["yeni test ekle", "özel test", "test düzenle", "test sil", "hangi değer daha iyi", "test birimi", "kendi testimi oluştur"],
  `Performans Ölçümleri'nde "+ Test Ekle"ye dokun ve şunları gir: Kategori, Testin Adı, Birim (ör. sn, cm, kg), isteğe bağlı Ekipman, "Hangi Değer Daha İyi?" (Yüksek değer iyi: mesafe, tekrar, kuvvet / Düşük değer iyi: süre, düşme sayısı), "Nasıl Yapılır?" açıklaması ve istersen video linki ya da dosyası. "Hangi Değer Daha İyi?" seçimi, ölçüm ekranındaki artış/azalışın yeşil (iyileşme) mi kırmızı (kötüleşme) mi görüneceğini belirler. Bir testi düzenlemek/silmek için kategori listesinde testin yanındaki ✏️ ve silme düğmelerini kullan.`);

e("olcum-gorme", "performans", "PS", "Kendi/çocuğumun ölçümlerini ve gelişimini görme",
  ["ölçümlerimi gör", "gelişimim", "test sonuçlarım", "performansım", "ölçüm grafiği", "önceki ölçüme göre", "yeşil kırmızı ok", "ölçümlerim iyileşti mi", "gelişim ölçümlerim", "iyileştim mi"],
  `Ana Sayfa → "Performans" (sporcuda) ya da Sporcu Takibi → "Ölçümler" (veli/sporcu) ekranında kategori kategori tüm test sonuçlarını görürsün. Her ölçümün yanında önceki ölçüme göre değişim yüzdesi ve ok gösterilir: yeşil = iyileşme, kırmızı = kötüleşme (bir testte düşük değer iyiyse, örneğin sürat, düşüş yeşil görünür). Henüz ölçüm yoksa "Henüz kaydedilmiş bir ölçüm yok" yazar. Bu ekranlar yalnızca görüntülemedir; ölçümleri antrenör girer.`);

e("olcum-goruntule-yonetici", "performans", "ACK", "Bir sporcunun tüm ölçümlerini görüntüleme",
  ["sporcunun ölçümlerini gör", "ölçümler butonu", "sporcu performansı", "gelişim takibi sporcu"],
  `Performans Ölçümleri ekranındaki "📊 Ölçümler" düğmesine dokun, bir sporcu seç; sporcunun tüm ölçümlerini kategori ve değişim yüzdesiyle görürsün. Sporcu profilindeki "Performans" hızlı düğmesi de aynı bilgiye götürür.`);

// ===================== FİTNESS =====================
e("fitness-genel", "fitness", "ACK", "Fitness bölümü nedir",
  ["fitness nedir", "fitness ekranı", "egzersizler", "fitness neler var", "kuvvet antrenmanı takibi"],
  `Performans → "Fitness" ekranında üç bölüm vardır:
• Wellness Check-in — sporcuların günlük uyku/enerji/ruh hâli takibi
• Egzersizler — göğüs, sırt, bacak, kol, omuz, karın hareketleri; sporcunun kaldırdığı ağırlık/tekrar kaydı
• Program Oluştur — fitness grupları, grup programları ve sporcuların bireysel programları
Fitness grupları ve programları müsabık sporcular içindir.`);

e("fitness-egzersiz-kaydet", "fitness", "ACK", "Sporcunun egzersiz ağırlığını/tekrarını kaydetme",
  ["egzersiz kaydet", "ağırlık kaydet", "kaç kilo kaldırdı", "set tekrar gir", "fitness kaydı", "hareket geçmişi"],
  `1. Fitness → "Egzersizler"e gir ve bir bölge seç (Göğüs, Sırt, Bacak, Kol, Omuz, Karın).
2. Hareketi seç; "Nasıl Yapılır?" açıklaması ve varsa video görünür.
3. Sporcuyu seç; Ağırlık (kg), Set Sayısı, Tekrar Sayısı ve Tarih'i gir, istersen not ekle. (Vücut ağırlığıyla yapılan hareketlerde ağırlık isteğe bağlıdır; tekrar sayısı zorunludur.)
4. Kaydet.
Hareketin altında sporcunun geçmiş kayıtları listelenir; yanlışı silebilirsin.`);

e("fitness-hareket-ekle", "fitness", "AK", "Kulübe özel egzersiz ekleme / genel hareketleri gizleme",
  ["egzersiz ekle", "yeni hareket ekle", "hareketleri yönet", "hareket gizle", "özel egzersiz", "hareket videosu ekle"],
  `• Yeni hareket: Egzersizler ekranında "+ Egzersiz Ekle"ye dokun; Bölge, Hareketin Adı, kısa Açıklama ve istersen video linki (YouTube, Vimeo) ya da dosya ekle.
• Düzenleme/silme: Bir bölgeyi açıp hareketin yanındaki ✏️ Düzenle / 🗑 Sil düğmelerini kullan.
• Gizleme: "🎚 Hareketleri Yönet" ile hazır (genel) hareketlerden kulübünle ilgisiz olanları kapat; sadece senin kulübünde görünmez olur, başka kulüplerden ya da genel listeden hiçbir şey silinmez ve istediğin an tekrar açabilirsin.`);

e("fitness-grubu", "fitness", "ACK", "Fitness grubu oluşturma",
  ["fitness grubu oluştur", "fitness grubu", "il takımı adayları grubu", "özel fitness grubu"],
  `Bir branştaki müsabık sporculardan istediklerini seçerek özel bir fitness grubu kurabilirsin:
1. Fitness → Program Oluştur → "Fitness Grubu Oluştur" (ya da Fitness Grupları'nda "+ Fitness Grubu Ekle").
2. Grup Adı ver (ör. İl Takımı Adayları) ve Branşı seç (oluşturulduktan sonra branş değiştirilemez).
3. Listedeki müsabık sporculardan en az birini seç (arama kutusuyla bulabilirsin).
4. Kaydet.
Fitness grubunu silmek için grubu açıp "Fitness Grubunu Sil"i kullan.`);

e("fitness-grup-programi", "fitness", "ACK", "Fitness grup programı oluşturup yayınlama",
  ["fitness programı oluştur", "gruba program yayınla", "çalışma programı hazırla", "program gönder", "haftalık kuvvet programı"],
  `1. Fitness → Program Oluştur → "Gruba Program Oluştur"a dokun.
2. Program Adı yaz (ör. Haftalık Kuvvet Programı) ve hangi Fitness Grubuna sergileneceğini seç (yoksa "+ Fitness Grubu Oluştur").
3. Hareket ekle: Bölge, Hareket, Set ve Tekrar sayısını seç ve "+ Programa Ekle"; istediğin kadar hareket ekle.
4. "Programı Tamamla"ya, ardından "Gönder ve Sergile"ye dokun.
Program yayınlanır ve gruptaki herkese bildirim gider. Sporcuların programı tamamlayıp tamamlamadığını program detayında "Tamamlayanlar" listesinden görürsün. Programı silebilirsin.`);

e("fitness-bireysel-inceleme", "fitness", "ACK", "Sporcuların bireysel fitness programlarını inceleme",
  ["bireysel program incele", "sporcunun programı", "sporcunun yazdığı program", "bireysel fitness"],
  `Fitness → Program Oluştur → "Bireysel Program Oluştur"a gir ve "Sporcu Seç"; sporcuların kendi yazdığı bireysel fitness programlarını ve girdikleri set/ağırlık/tekrar kayıtlarını inceleyebilirsin.`);

e("fitness-sporcu-bireysel", "fitness", "S", "Bireysel fitness programı oluşturma (sporcu)",
  ["bireysel programım", "kendi programımı oluştur", "bireysel fitness programı yaz", "yeni program", "hareket ekle program"],
  `1. Sporcu profilinde Sporcu Takibi → "Bireysel Programım"a gir.
2. "+ Yeni Program"a dokun; Program Adı yaz (ör. Yaz Kuvvet Programım).
3. Bölge ve hareket seçip Set ve Tekrar sayısı girerek "+ Programa Ekle"; istediğin kadar hareket ekle ve "Programı Tamamla"ya bas.
4. Programı açıp her hareket için set set ağırlık ve tekrarlarını yaz ve "Kaydet"e bas.
Bireysel çalışma yaptığın günler "Bireysel fitness" rozetine sayılır.`);

e("fitness-sporcu-grup-programi", "fitness", "PS", "Antrenörün yayınladığı grup programını görme ve tamamlama",
  ["grup programı", "antrenmanı tamamladım", "program tamamla", "fitness programım", "programı nasıl tamamlarım", "zorluk derecesi süre gir"],
  `Sporcu Takibi → "Grup Programı"na gir. Antrenörün yayınladığı programda hareketler ve hedef set×tekrar görünür.
Antrenmanı yapınca "Antrenmanı Tamamladım"a dokun; istersen set bazlı ağırlık/tekrarını, Zorluk Derecesi'ni (1-10), Süre'yi (dakika) ve bir not gir, tekrar "✓ Antrenmanı Tamamladım"a bas. Tamamladığın programlar "Tamamlanan Grup Programları"nda listelenir; tamamlayanları antrenör de görür. Henüz program yayınlanmadıysa "Henüz Program Yok" yazar.`);

// ===================== BESLENME =====================
e("beslenme-genel", "beslenme", "ACKS", "Beslenme bölümü",
  ["beslenme", "besin değerleri", "tarifler", "beslenme rehberi", "ne yemeliyim", "sporcu beslenmesi", "beslenme önerileri"],
  `Ana Sayfa → Beslenme (sporcuda doğrudan kutucuk; yönetici/antrenörde Performans → Beslenme) üç bölüm içerir; buradaki bilgiler bilimsel makalelere ve büyük sağlık kuruluşlarına dayanır ve her içerikte kaynakça belirtilir:
• Besinler — Karbonhidratlar, Proteinler, Yağlar, Vitaminler kategorilerinde besinler; kalori, protein/karbonhidrat/yağ değerleri, "Nerede Bulunur" ve "Sporcuya Faydası"
• Sporcu Tarifleri — kategori kategori pratik ve besleyici tarifler (malzemeler ve yapılışı)
• Beslenme Rehberi — Müsabaka/Antrenman/Normal Gün Beslenmesi, Genç Sporcu Beslenmesi, Protein, Su ve Sıvı, Kahvaltı, Kemik Sağlığı, Uyku ve Beslenme gibi kaynaklı yazılar`);

e("beslenme-icerik-ekle", "beslenme", "AK", "Besin, tarif ve rehber yazısı ekleme",
  ["besin ekle", "tarif ekle", "yazı ekle", "beslenme rehberi yazı ekle", "kaynakça ekle", "pdf yazı yükle", "beslenme içeriği"],
  `• Besin: Beslenme → Besinler → bir kategori → "+ Ekle"; Besin Adı (zorunlu), kısa açıklama, nerede bulunur, kalori, protein, karbonhidrat, yağ, sporcuya faydası ve Kaynakça gir.
• Tarif: Sporcu Tarifleri → bir kategori → "+ Tarif Ekle"; Tarif Adı (zorunlu), kısa açıklama, malzemeler, yapılışı ve kaynakça yaz.
• Rehber yazısı: Beslenme Rehberi sayfasına gir ve en üstteki "+ Yazı Ekle"ye dokun; Başlık (zorunlu), İçerik metni ya da bir PDF (ikisinden biri zorunlu) ve Kaynakça gir. Eklediğin yazı sayfanın en üstünde, konu kutucuklarının yukarısında görünür; en yeni yazı en üstte durur ve her yazıya dört marka renginden biri otomatik verilir.
Her içeriğin bilimsel bir kaynağa dayandığından ve Kaynakça alanına eklendiğinden emin ol. İçeriği düzenlemek/silmek için detay ekranındaki ✎ Düzenle ve silme seçeneklerini kullan.`);

e("beslenme-rehber-yazisi", "beslenme", "ACKS", "Beslenme Rehberi yazılarını okuma",
  ["beslenme yazısı", "rehber yazısı", "kaynakça", "makale", "beslenme rehberinde yazı", "en yeni yazı"],
  `Beslenme → "Beslenme Rehberi"ne gir. Sayfanın en üstünde kulübünün eklediği yazılar (en yeni en üstte, renkli kutular), altında konu kutucukları görünür. Bir yazıya ya da konuya dokununca içerik açılır; PDF olarak yayınlanmış yazılar PDF olarak görüntülenir. Yazının sonunda "Kaynakça" bölümü yer alır.`);

// ===================== ETKİNLİK, TURNUVA VE KAMP =====================
e("etkinlik-gorme", "etkinlik", "ACPSK", "Etkinlik, turnuva ve kampları görme",
  ["etkinlikler", "turnuva", "kamp", "etkinlik sekmesi", "yayınlanmış etkinlikler", "etkinliğe bak"],
  `Alt menüdeki "Etkinlik" sekmesi kulübün yayınladığı etkinlik, turnuva ve kampları listeler (görsel, tarih, ücret). Birine dokununca tarih, konum, ücret, kontenjan ve son kayıt tarihi görünür. Tarihi geçmiş etkinliklerde "Sona erdi" etiketi görünür ve kayıt kapalıdır.`);

e("etkinlik-kayit", "etkinlik", "P", "Etkinliğe kayıt olma (veli)",
  ["etkinliğe kayıt ol", "turnuvaya kayıt", "kampa kayıt", "etkinlik ödemesi", "katıl butonu", "kayıt yaptıramıyorum", "etkinlik kaydı nasıl yapılır"],
  `Etkinliğe yalnızca veli kayıt yapar; sporcu etkinliği görüntüler ("Etkinliğe kayıt velin tarafından yapılır").
1. Etkinlik sekmesinde etkinliğe dokun ve "Katıl"a bas.
2. Kaydedeceğin sporcuyu seç, istersen not yaz.
3. Etkinlik ücretliyse ödeme yöntemini seç: Havale/EFT (IBAN görünür, istersen dekont fotoğrafı ekle) ya da Elden Ödeme.
4. "Kaydı Onayla"ya dokun.
Kaydın kulüp yönetimine iletilir; ödeme kontrol edildikten sonra durumu güncellenir (Beklemede → Onaylandı/Reddedildi). Etkinlik sona ermişse, son kayıt tarihi geçmişse ya da kontenjan dolmuşsa kayıt yapılamaz.`);

e("etkinlik-kayitlarim", "etkinlik", "P", "Etkinlik kayıtlarımı görme / iptal etme",
  ["kayıtlarım", "etkinlik kaydımı iptal et", "kayıt durumum", "onaylandı mı"],
  `Etkinlik sekmesindeki "📋 Kayıtlarım"a dokun; tüm etkinlik kayıtların ve durumları (Beklemede, Onaylandı, Reddedildi, İptal) listelenir. Beklemede olan bir kaydı "İptal"e dokunup onaylayarak iptal edebilirsin.`);

e("etkinlik-olustur", "etkinlik", "AK", "Etkinlik / turnuva / kamp oluşturma ve yayınlama",
  ["etkinlik oluştur", "turnuva oluştur", "kamp oluştur", "etkinlik yayınla", "banner ekle", "kontenjan belirle", "etkinlik ücreti", "yeni etkinlik"],
  `1. Etkinlik sekmesinde "+ Etkinlik Oluştur"a dokun.
2. Türü seç (Etkinlik / Turnuva / Kamp); Başlık, Açıklama, Branş (ya da Kulüp Geneli), Konum, Başlangıç Tarihi'ni gir. İsteğe bağlı: Bitiş Tarihi, Ücret (0 = ücretsiz), Kontenjan, Son Kayıt Tarihi ve Banner görseli.
3. Kaydet — etkinlik önce "Taslak" olur.
4. Etkinliğin detayında "Yayınla"ya dokun; yayınlanınca veliler görür ve bildirim alır.
Bitiş tarihi (yoksa başlangıç tarihi) bugünden önce olan bir etkinlik oluşturulamaz. Yayındaki etkinliği "Etkinliği İptal Et" ile iptal edebilir, taslakları ya da iptalleri silebilirsin.`);

e("etkinlik-kayit-yonet", "etkinlik", "AK", "Etkinlik kayıtlarını onaylama / reddetme",
  ["etkinlik kayıtlarını gör", "kaydı onayla", "kaydı reddet", "dekontu görüntüle", "kim kayıt oldu", "bekleyen kayıt"],
  `Etkinliğin detayında "Kayıtlar"a dokun; kayıt olan sporcular, ödeme yöntemleri ve durumları listelenir. Ücretli kayıtlarda "Dekontu Görüntüle" ile dekontu incele; kaydı "Onayla" ya da "Reddet". Karar veliye bildirim olarak gider; onaylanan ücretli kayıtlar gelir olarak Finans'a işlenir. Etkinlik listesinde bekleyen kayıt sayısı görünür.`);

// ===================== MAĞAZA =====================
e("magaza-siparis", "magaza", "P", "Mağazadan ürün sipariş etme (veli)",
  ["mağazadan ürün al", "forma sipariş", "sipariş ver", "satın al", "beden seç", "sipariş nasıl verilir", "ürün alma"],
  `1. Alt menüden "Mağaza"ya gir ve bir ürüne dokun (kategoriye göre filtreleyebilirsin).
2. "Satın Al"a bas; Renk ve Beden seç, istersen not yaz (ör. hangi sporcu için).
3. Ödeme yöntemini seç: Havale/EFT (kulübün IBAN'ı görünür) ya da Elden Ödeme.
4. "Siparişi Onayla"ya dokun.
Siparişin kulüp yönetimine iletilir; ödeme kontrol edildikten sonra durumu güncellenir. Siparişlerini Mağaza ekranındaki "📦 Siparişlerim"den takip edersin (Bekliyor → Onaylandı → Teslim Edildi). Sporcu hesabı mağazayı yalnızca görüntüler, sipariş veremez; sipariş yalnızca veli hesabıyla verilir.`);

e("magaza-urun-ekle", "magaza", "AK", "Mağazaya ürün ekleme / düzenleme",
  ["ürün ekle", "mağazaya ürün koy", "stok gir", "ürün fotoğrafı", "beden renk seçenekleri", "ürün fiyatı", "mağaza yönetimi", "ürün sil"],
  `1. Mağaza sekmesinde "+ Ürün Ekle"ye dokun.
2. En fazla 5 fotoğraf ekle; Başlık (zorunlu), Açıklama, Fiyat (₺, zorunlu), Kategori ve Cinsiyet (Kadın/Erkek/Unisex) gir.
3. Renk ve beden seçeneklerini ekle ve her seçenek için stok adedini yaz (tüm seçenekler için geçerli bir stok gerekir).
4. Kaydet.
"📊 Stok" tüm ürünlerin toplam stokunu gösterir. Ürünü düzenlemek ya da silmek için mağaza yönetim listesinden ürüne dokun.`);

e("magaza-siparis-yonet", "magaza", "AK", "Mağaza siparişlerini yönetme",
  ["siparişleri gör", "siparişi onayla", "teslim edildi işaretle", "siparişi iptal et", "sipariş takibi", "stok düşüyor mu"],
  `Mağaza sekmesinde "📦 Siparişler"e gir; siparişleri duruma göre süz (Tümü, Bekliyor, Onaylandı, Teslim Edildi, İptal). Bir siparişte "Onayla", "Teslim Edildi Olarak İşaretle" ya da "İptal Et" seçenekleri bulunur. Sipariş verildiğinde ilgili seçeneğin stoku otomatik düşer. Teslim edilen siparişler gelir olarak Finans'a işlenir.`);

e("magaza-sporcu", "magaza", "S", "Sporcu mağazayı kullanabilir mi",
  ["sporcu sipariş verebilir mi", "mağazayı görüyorum ama alamıyorum", "satın al butonu yok"],
  `Sporcu hesabı mağazayı yalnızca görüntüler; sipariş vermek için veli hesabı gerekir. Ürünlerin fiyat, renk ve bedenlerine bakabilir, isteğini velinle paylaşabilirsin.`);

// ===================== SÜPER ADMİN =====================
e("sa-genel", "sa", "X", "Süper Admin Ana Sayfası",
  ["süper admin", "süper admin neler yapar", "platform yönetimi", "süper admin kutucukları"],
  `Süper Admin Ana Sayfası'nda şu kutucuklar bulunur: Kulüpler, Abonelikler, Finans (X-NETIC'in kendi gelir/gideri), Ekranlar (rol önizlemeleri), Duyurular (kulüp yöneticilerine), Egzersiz Kütüphanesi ve Performans Testleri Kütüphanesi (tüm kulüplerde görünen ortak içerikler). Alt menüde Ana Menü, Mesajlar, Asistan, Sistem Ayarları ve Profil vardır. Süper Admin hiçbir kulübün veli, sporcu ya da antrenör verisine erişemez.`);

e("sa-kulupler", "sa", "X", "Kulüpleri görme ve silme",
  ["kulüpleri gör", "kulüp listesi", "kulüp sil", "kulüp kalıcı sil", "kulüp katılım tarihi", "toplam kulüp"],
  `Ana Sayfa → "Kulüpler" platformdaki tüm kulüpleri (katılım tarihi ve abonelik durumuyla) listeler. Bir kulübü tamamen kaldırmak için "Kulübü Kalıcı Olarak Sil"i kullan; onay için kulüp adını tam yazman gerekir. DİKKAT: Kulübün tüm sporcu, antrenör, ödeme ve dosya verisi kalıcı olarak silinir, geri alınamaz.`);

e("sa-abonelik", "sa", "X", "Abonelikleri yönetme ve onaylama",
  ["abonelik onayla", "abonelik durumu değiştir", "havale onay", "abonelik planı", "ödeme onayı kulüp", "abonelik iptal"],
  `Ana Sayfa → "Abonelikler"de kulüp kartlarına dokun; Durum (Onay Bekliyor, Aktif, Test Ödemesi, Ödeme Gecikti, İptal Edildi), Plan (Aylık/Yıllık) ve Tutar'ı (₺) düzenleyip Kaydet'le. Yeni kaydolan kulüp "Onay Bekliyor" durumunda başlar; havaleyi kontrol edince "Aktif" yaparsın ve kulübün uygulaması kısıtsız açılır. Abonelik kaydı olmayan kulübe kart üzerinden yeni kayıt oluşturabilirsin.`);

e("sa-finans-rapor", "sa", "X", "X-NETIC finans ve platform raporu",
  ["süper admin finans", "platform geliri", "toplam kulüp aktif abonelik", "tamamlanan gelir", "gelir gider kaydı platform"],
  `• Finans: X-NETIC'in kendi işletme gelir/gider muhasebesidir (kulüplerin finansıyla ilgisi yok). "Yeni Kayıt Ekle" ile Gelir ya da Gider için Açıklama, Tutar, Kategori ve Tarih gir; kayıtlar aşağıda listelenir ve silinebilir.
• Rapor: Toplam Kulüp, Aktif Abonelik ve Tamamlanan Gelir sayılarını gösterir; gelir yalnızca gerçekten tamamlanmış ödemeleri sayar.`);

e("sa-duyuru", "sa", "X", "Kulüp yöneticilerine duyuru gönderme",
  ["süper admin duyuru", "tüm kulüplere duyuru", "yöneticilere mesaj", "platform duyurusu"],
  `Ana Sayfa → "Duyurular"da Başlık ve Mesaj yaz, istersen fotoğraf/video/belge ekle ve "Kulüp Yöneticilerine Gönder"e dokun. Bu duyuru SADECE kulüp yöneticilerine gider; gizlilik gereği hiçbir kulübün veli/sporcu/antrenör verisine erişim gerekmez, kapsam bilerek böyle sınırlıdır.`);

e("sa-kutuphane", "sa", "X", "Egzersiz ve performans testi kütüphaneleri",
  ["egzersiz kütüphanesi", "performans testleri kütüphanesi", "global test ekle", "tüm kulüplerde görünen hareket", "ortak içerik"],
  `Ana Sayfa'daki "Egzersiz Kütüphanesi" ve "Performans Testleri Kütüphanesi", tüm kulüplerde görünen ortak hareket ve testleri yönetir. Kategori açıp "+ Egzersiz Ekle" / "+ Test Ekle" ile yeni içerik ekler, mevcut olanı düzenler ya da silersin. Kayıtlar "🌐 Global (Platform)" etiketiyle görünür; kulüplerin kendi eklediği özel içerikler kendi kulüplerine aittir.`);

e("sa-sistem-ayarlari", "sa", "X", "Sistem Ayarları (fiyat, bakım modu, destek bilgisi)",
  ["sistem ayarları", "abonelik fiyatı değiştir", "bakım modunu aç", "bakım mesajı", "destek e-postası", "destek telefonu", "abonelik ödeme hesabı"],
  `Alt menüdeki "Sistem Ayarları" platformdaki TÜM kulüpleri etkiler:
• Abonelik Fiyatları — Aylık ve Yıllık fiyat (Kulüp Oluştur ekranındaki plan fiyatları buradan gelir)
• Bakım Modu — açıkken Süper Admin dışındaki herkes bakım mesajını görür ve yeni kulüp oluşturma kapanır; Bakım Mesajı'nı yaz
• Destek İletişim Bilgileri — destek e-postası ve telefonu
• Abonelik Ödeme Hesabı (Havale/EFT) — hesap sahibi ve IBAN; kulüp oluşturma sayfasında ve onay bekleyen yöneticilere gösterilir
Değişiklikten sonra Kaydet'e bas.`);

e("sa-ekranlar", "sa", "X", "Rol önizlemeleri (Ekranlar)",
  ["rol önizleme", "ekranlar", "veli ekranını gör", "hangi rol ne görür", "ana sayfa önizleme"],
  `Ana Sayfa → "Ekranlar"da bir rol seç (Kulüp Yöneticisi, Branş Koordinatörü, Antrenör, Veli, Sporcu); o rolün Ana Sayfa kutucuk düzenini önizlersin. Bu yalnızca bir önizlemedir, gerçek sporcu/veli/kulüp verisi göstermez ve kutucuklar çalışmaz.`);

e("sa-mesaj", "sa", "X", "Süper Admin mesajlaşması",
  ["süper admin mesaj", "kulüp yöneticisine mesaj", "yöneticilerle mesajlaş", "süper admin kime yazabilir"],
  `Alt menüdeki "Mesajlar"dan yalnızca kulüp yöneticileriyle mesajlaşabilirsin. Gizlilik gereği Süper Admin, kulüplerin veli, sporcu ve antrenörleriyle yazışamaz. "+ Yeni Mesaj"la bir kulüp yöneticisi seçip sohbet başlatırsın.`);

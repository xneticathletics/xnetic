const { e } = require("./helpers");

// ===================== ANTRENÖRLER =====================
e("antrenor-liste", "antrenor", "AK", "Antrenörleri görüntüleme ve arama",
  ["antrenör listesi", "antrenörler nerede", "antrenör ara", "antrenör atamaları", "kim koordinatör", "salon yetkilisi kim"],
  `Ana Sayfa → "Antrenörler" kutucuğu (ekranda "Antrenör Atamaları") kadronu listeler. Üstteki filtrelerden branşa ve salona göre süzebilir, arama kutusundan ada göre bulabilirsin. Kartlarda "★ KOORDİNATÖR" ve "🏟 SALON YETKİLİSİ" etiketleri, branş/kademe ve sorumlu olduğu gruplar görünür. Koordinatör yalnızca kendi branşının kadrosunu görür.`);

e("antrenor-ekle", "antrenor", "A", "Yeni antrenör hesabı açma",
  ["antrenör ekle", "yeni antrenör", "antrenöre hesap aç", "antrenör kaydı", "antrenör nasıl eklenir", "antrenör oluştur"],
  `1. Ana Sayfa → Antrenörler'e gir ve yeni hesap ekleme düğmesine dokun.
2. Antrenörün telefon numarasını, kullanıcı adını ya da e-postasını gir ve rolü "Antrenör" seç.
3. "Hesap Oluştur"a dokun; ekranda bir geçici şifre çıkar.
4. Geçici şifreyi KOPYALA ve antrenöre WhatsApp/SMS ile ilet — bir daha görüntülenmez.
Antrenör bu bilgiyle giriş yapar ve ilk girişte kendi şifresini belirler. Ardından profilini açıp bilgilerini, branşını ve gruplarını tamamlarsın.`);

e("antrenor-duzenle", "antrenor", "AK", "Antrenör bilgilerini düzenleme / kulüpten çıkarma",
  ["antrenör bilgisi düzenle", "antrenörü kulüpten çıkar", "antrenör ayrıldı", "antrenör profili", "antrenör telefonu"],
  `Antrenörler listesinden kişiye dokun; profilinde "Düzenle" ile ad soyad, e-posta, telefon, doğum tarihi, öğrenim, cinsiyet, adres, acil durum kişisi ve fotoğrafı güncelleyebilirsin.
Antrenör ayrılırsa düzenleme ekranındaki "Antrenörü Kulüpten Çıkar"ı kullan: tüm grup atamaları kaldırılır ve giriş kapanır; hesap tamamen silinmez, istersen ileride tekrar aktifleştirebilirsin.`);

e("antrenor-gruba-ata", "antrenor", "AK", "Antrenörü gruba atama (baş / yardımcı)",
  ["antrenör ata", "gruba antrenör ata", "baş antrenör", "yardımcı antrenör", "antrenör görevlendir", "grup antrenörü değiştir"],
  `Antrenörler ekranındaki genel görünümde tüm gruplar ve görevli antrenörleri listelenir; bir gruba dokunarak ata ya da değiştir. Her grubun bir "Baş Antrenör"ü ve sınırlı sayıda "Yardımcı"sı olabilir (varsayılan en fazla 2; Gelişmiş Ayarlar → Antrenör Yönetimi'nden değişir). Bir antrenör yalnızca uzmanlığı (branşı) olan branşların gruplarına atanabilir; bu yüzden önce antrenörün profilinde "Branş ve Belge İşlemleri"nden branşını ekle.`);

e("antrenor-brans-kademe", "antrenor", "AK", "Antrenörün branşı, kademesi ve belge bilgisi",
  ["antrenör branşı", "kademe", "antrenör belge numarası", "deneyim yılı", "kulübe başlama tarihi", "branş ata antrenör"],
  `Antrenör profilinde "Branş ve Belge İşlemleri"ne gir. Burada antrenörün uzman olduğu her branşı ayrı ayrı ekler, her biri için Kademe, Belge/lisans numarası, Deneyim yılı ve Kulübe başlama tarihini girersin. Bir antrenör birden fazla branşta uzman olabilir; görevlendirme yalnızca uzman olduğu branşların gruplarında yapılabilir.`);

e("koordinator-ata", "antrenor", "A", "Branş koordinatörü atama",
  ["koordinatör ata", "branş koordinatörü nasıl olunur", "koordinatör değiştir", "koordinatör yetkisi", "koordinatör nedir"],
  `1. Antrenörün profilinden "Branş ve Belge İşlemleri"ne gir.
2. İlgili branşta "Branş Koordinatörlüğü" bölümünü aç ve antrenörü koordinatör yap. O branşın zaten bir koordinatörü varsa "Koordinatörü değiştir" onayı çıkar.
Koordinatör, kendi branşında yönetici gibi çalışır: sadece kendi grupları değil branşın TÜM sporcularını, antrenörlerini, gruplarını, salonlarını ve aidatlarını görür/yönetir; duyuru ve rozet ayarı yapabilir. Ana Sayfası otomatik o branşa açılır ve branşını değiştiremez.`);

e("salon-yetkilisi", "antrenor", "AK", "Salon yetkilisi atama",
  ["salon yetkilisi", "salon yetkisi", "salon sorumlusu", "salon adına antrenman planla"],
  `Antrenör profilindeki "Salon Yetkisi" bölümünde ilgili salonları işaretle. İşaretlenen salonlar için o antrenör, kendi branşındaki tüm gruplar adına antrenman planı oluşturabilir. Antrenör kartında "🏟 SALON YETKİLİSİ" etiketi görünür.`);

e("antrenor-izin", "antrenor", "AK", "Antrenör izni ekleme",
  ["antrenör izni", "izin ekle", "yıllık izin", "antrenör izinli", "izin kaydı"],
  `Antrenör profilinde "İzin İşlemleri"ne gir, Başlangıç ve Bitiş tarihini seç, istersen Neden yaz (ör. Yıllık izin) ve "+ İzin Ekle"ye dokun. Geçmiş izinler aynı ekranda listelenir ve silinebilir. Bitiş tarihi başlangıçtan önce olamaz.`);

e("antrenor-odeme-plani", "finans", "A", "Antrenör maaş/ödeme planı oluşturma",
  ["antrenör maaşı", "antrenör ödemesi", "ödeme planı antrenör", "antrenöre maaş tanımla", "aylık antrenör ücreti"],
  `1. Ana Sayfa → Finans → "Antrenör Ödemeleri"ne gir.
2. "+ Ödeme Planı"na dokun.
3. Antrenörü seç, Aylık Tutar'ı (₺) ve ayın kaçında ödeneceğini (1-31) gir.
4. Kaydet.
İlk ödeme kaydı bir sonraki ay için oluşturulur (bu ay için kayıt açılmaz); sonraki her ay kaydı otomatik eklenmeye devam eder. Ödemeler listesinde bir kayda dokunarak "Ödendi" olarak işaretleyebilir, geri "Bekliyor"a alabilir ya da silebilirsin.`);

e("antrenor-odeme-filtre", "finans", "A", "Antrenör ödemelerini antrenöre göre filtreleme",
  ["antrenör seç ödemeler", "tek antrenörün ödemeleri", "antrenör ödeme toplamı", "antrenör bazlı ödeme"],
  `Antrenör Ödemeleri ekranında üstteki "Antrenör" açılır listesine dokun ve bir antrenör seç. Liste ve yukarıdaki Bekleyen/Ödenen toplamlar yalnızca o kişiyi gösterir; "Tüm Antrenörler" ile tekrar hepsini görürsün. Durum filtresi (Tümü / Bekleyen / Ödendi) seçtiğin antrenör üzerinde çalışır.`);

e("antrenor-avans", "finans", "A", "Antrenöre avans verme",
  ["avans ver", "antrenör avansı", "avans kesintisi", "maaş avansı", "avans nasıl kesilir"],
  `1. Antrenör Ödemeleri'nde "+ Avans Ver"e dokun.
2. Antrenörü seç; Avans Tutarı (₺) ve Tarih gir; istersen not yaz (ör. Nakit elden verildi).
3. "Avansı Kaydet"e bas.
Avans tutarı otomatik olarak antrenörün sıradaki (en yakın vadeli) bekleyen ödemesinden düşülür; ekranda kesinti sonrası ödeme tutarını görürsün. Antrenörün bekleyen ödemesi yoksa avans kesintisiz kaydedilir.`);

// ===================== KULÜP YAPISI =====================
e("yapi-genel", "yapi", "AK", "Kulüp Yapısı nedir (branş, grup, salon)",
  ["kulüp yapısı", "branş grup salon", "kulübü nasıl kurarım", "yapı nasıl kurulur", "önce ne yapmalıyım"],
  `Ana Sayfa → "Kulüp Yapısı" üç bölümden oluşur: Branşlar (voleybol, basketbol vb.), Gruplar (yaş grupları/takımlar) ve Salonlar (antrenman ve maç salonları). Önerilen kurulum sırası: 1) Branşları ekle, 2) Salonları ekle ve branşlara bağla, 3) Grupları oluştur, 4) Antrenörleri branşlarına ve gruplarına ata, 5) Sporcuları gruplara ekle. Kulüp tek branşla çalışıyorsa branş eklemene gerek yoktur.`);

e("brans-ekle", "yapi", "AK", "Branş ekleme / düzenleme / silme",
  ["branş ekle", "yeni branş", "branş sil", "bireysel branş", "yüzme branşı", "branş düzenle"],
  `Kulüp Yapısı → Branşlar'da "Ekle"ye dokun, branş adını yaz (ör. Basketbol) ve Kaydet. Yüzme, Atletizm gibi bireysel sporlar için "Bireysel branş" kutusunu işaretle: bu branşlarda müsabaka sonucu skor yerine sonuç açıklaması olarak girilir. Bir branşı düzenlemek için "Düzenle", kaldırmak için "Branşı sil"e dokun; silmeden önce bağlı grup sayısı gösterilir.`);

e("grup-ekle", "yapi", "AK", "Grup oluşturma / düzenleme / silme",
  ["grup ekle", "yeni grup", "grup oluştur", "u14 grubu", "grup sil", "grup tipi", "grup ayarları", "sabit haftalık program aç"],
  `1. Kulüp Yapısı → Gruplar'da "+ Ekle"ye dokun.
2. Grup Adı (ör. U14 Kız Grubu), Branş ve Sporcu Tipi'ni (Spor Okulu / 🏆 Müsabık) seç.
3. İstersen "Sabit Haftalık Program"ı Açık yap: bu grubun antrenmanları haftalık şablondan otomatik üretilebilir (Takvim → Haftalık Program).
4. İstersen grubun genelde antrenman yaptığı Ana Salon'u seç.
5. Kaydet.
Sporcu tipi gruba aittir: gruba eklenen her sporcu bu tipte işlenir. Grubu silersen gruba bağlı TÜM antrenman kayıtları da silinir; işlem geri alınamaz.`);

e("salon-ekle", "yapi", "AK", "Salon ekleme / düzenleme",
  ["salon ekle", "yeni salon", "salon oluştur", "salon sil", "salon kapasitesi", "salon adres"],
  `Kulüp Yapısı → Salonlar'da "+ Ekle"ye dokun. Salon Adı (zorunlu), Adres, Kapasite ve salonda yapılan Branşları gir; Kaydet. Salon eklemeden önce branşların tanımlı olması gerekir ("Henüz branş eklenmemiş" uyarısı çıkarsa önce branşı ekle). Salonu silmek için düzenleme ekranındaki "Salonu Sil"i kullan.`);

// ===================== KULÜP AYARLARI =====================
e("ayar-genel", "ayar", "A", "Kulüp Ayarları'nda neler var",
  ["kulüp ayarları", "ayarlar nerede", "kulüp ayarlarına nasıl girerim", "yönetici ayarları"],
  `Profil → "Kulüp Ayarları" (yalnızca kulüp yöneticisi) şu bölümleri içerir:
• Ana Sayfa Özellikleri — kullanılacak ana başlıkları seç
• Kulüp Adı ve Logosu — giriş ve Ana Sayfa'da görünür
• Banka Bilgileri — havale/EFT için IBAN
• Kullanıcılar — hesapları yönet, şifre sıfırla
• Kulüp Bilgilerini Dışa Aktar — sporcu, antrenör, grup verilerini Excel'e al
• Gelişmiş Ayarlar — zaman pencereleri, limitler, özellik aç/kapat`);

e("logo-isim", "ayar", "A", "Kulüp adı ve logosunu değiştirme",
  ["kulüp logosu", "logo yükle", "kulüp adını değiştir", "logo değiştir", "kulüp fotoğrafı"],
  `Profil → Kulüp Ayarları → "Kulüp Adı ve Logosu"na gir; adı düzenle ve logo için görsel seç (galeri izni istenirse ver). Kaydedince ad ve logo giriş ekranında ve Ana Sayfa'da görünür.`);

e("banka-bilgisi", "ayar", "A", "Banka (IBAN) bilgisini girme",
  ["iban gir", "banka bilgisi", "havale eft bilgisi", "hesap sahibi", "kulüp iban", "velilere iban göster", "banka bilgisi girilmemiş"],
  `Profil → Kulüp Ayarları → "Banka Bilgileri"ne gir; Hesap Sahibi ve IBAN'ı yaz ve kaydet. Bu bilgi velilere aidat, mağaza ve etkinlik ödemelerinde Havale/EFT seçeneğinde gösterilir. Girmezsen velilerde "Kulübün banka bilgisi henüz girilmemiş" uyarısı çıkar.`);

e("kullanicilar", "ayar", "A", "Kullanıcıları yönetme (yönetici ekleme, şifre sıfırlama, devre dışı bırakma)",
  ["kullanıcı listesi", "şifre sıfırla", "kullanıcının şifresini sıfırla", "hesabı devre dışı bırak", "hesap silme talebi", "şifre sıfırlama talebi", "geçici şifre üret", "kullanıcıyı engelle", "yeni yönetici ekle", "ikinci yönetici", "yöneticilikten çıkar", "kulüp yöneticisi ekleme"],
  `Profil → Kulüp Ayarları → "Kullanıcılar"a gir; hesaplar role göre gruplanmış (Veli, Sporcu, Antrenör vb.), arama kutusuyla bulabilirsin.
• Şifre sıfırlama: Kişinin yanındaki "Şifreyi Sıfırla"ya dokun ve onayla. Ekranda yeni geçici şifre çıkar; KOPYALAYIP kişiye ilet — bir daha görüntülenmez. Kişi ilk girişte şifresini değiştirmek zorundadır.
• Hesabı devre dışı bırakma: "Hesabı Devre Dışı Bırak" girişi tamamen kapatır (kalıcı veri silme KVKK sürecine göre ayrıca yapılır).
• "Bekleyen Talepler": Şifremi unuttum diyen (🔔) ya da hesap silme talep eden (🗑) kişiler burada en üstte görünür.
• Yeni yönetici ekleme: Üstteki "+ Yönetici Ekle" ile kulübe ikinci (ya da üçüncü) bir kulüp yöneticisi hesabı açarsın; telefon/kullanıcı adı girersin, geçici şifre üretilir ve onu kişiye iletirsin. DİKKAT: Kulüp yöneticisi kulübün TÜM verisine (finans dahil) erişir.
• Yöneticilikten çıkarma: Yönetici satırındaki "Yöneticilikten Çıkar" o hesabı kapatır. Kendi hesabını çıkaramazsın ve kulübün son yöneticisi çıkarılamaz — önce yerine yeni bir yönetici eklemen gerekir.
• Bir hesabın ROLÜ sonradan değiştirilemez (ör. veli hesabı yöneticiye çevrilemez); rol yalnızca hesap açılırken belirlenir, gerekirse yeni hesap açarsın.`);

e("disa-aktar", "ayar", "A", "Kulüp verilerini Excel'e aktarma",
  ["excel'e aktar", "verileri dışa aktar", "sporcu listesi excel", "kulüp bilgilerini indir", "yedek al"],
  `Profil → Kulüp Ayarları → "Kulüp Bilgilerini Dışa Aktar"a gir; sporcu, antrenör ve grup verilerini Excel dosyası olarak alırsın. Dosya oluşunca telefonunun paylaşım menüsüyle kaydedebilir ya da gönderebilirsin.`);

e("ayar-finans", "ayar", "A", "Aidat ve finans ayarları",
  ["aidat planı kaç ay", "gecikme günü", "finansal dönem başlangıcı", "vadesi geçen kaç gün sonra gecikmiş", "aidat ayarı"],
  `Profil → Kulüp Ayarları → Gelişmiş Ayarlar → "Aidat & Finans"ta üç değer vardır:
• Önümüzdeki kaç ay otomatik oluşturulsun (varsayılan 3): bir sporcuya aidat planı bağlanınca bu kadar ay ileriye ödeme kaydı hazırlanır.
• Vadesi geçen ödeme kaç gün sonra "Gecikmiş" sayılsın: 0 = vade geçer geçmez; 3 yaparsan 3 gün beklenir.
• Finansal dönem başlangıç günü: Finansal Dökümanlarım'daki varsayılan tarih aralığı her ay bu günden bugüne hesaplanır (1 = takvim ayı).`);

e("ayar-antrenor-limiti", "ayar", "A", "Yardımcı antrenör limiti",
  ["yardımcı antrenör limiti", "gruba kaç yardımcı antrenör", "antrenör yönetimi ayarı", "yardımcı antrenör sayısını artırmak istiyorum", "yardımcı antrenör sayısını artır", "gruba daha fazla yardımcı antrenör"],
  `Profil → Kulüp Ayarları → Gelişmiş Ayarlar → "Antrenör Yönetimi"nde "Grup Başına Yardımcı Antrenör Limiti"ni yaz (varsayılan 2). Bir gruba bu sayıdan fazla yardımcı antrenör atanamaz.`);

// ===================== FİNANS VE AİDAT =====================
e("finans-genel", "finans", "AK", "Finans ekranı nasıl kullanılır",
  ["finans ekranı", "aidat takibi", "tahsil edilen bekleyen vadesi geçmiş", "kulüp finansı", "finans nerede"],
  `Ana Sayfa → "Finans" kutucuğunda üstte "Aidat Gelirleri" kartı vardır: Tahsil Edilen, Bekleyen ve Vadesi Geçmiş toplamlar. Bu kutulara dokununca ilgili aidat listesi açılır. Altındaki düğmeler: "+ Gelir", "+ Gider", "Antrenör Ödemeleri" (yönetici), "+ Aidat Planı", "📄 Finansal Dökümanlarımı Listele" ve "⚙️ Sabit Aidat Ücreti". Aşağıda branş filtresi, sporcu arama ve grup kartları bulunur; bir gruba, sonra sporcuya dokunarak o sporcunun ödemelerine ulaşırsın. Koordinatör yalnızca kendi branşının aidatlarını görür.`);

e("aidat-plani", "finans", "AK", "Sporcuya aidat planı oluşturma",
  ["aidat planı oluştur", "aidat ekle", "aylık aidat tanımla", "aidat nasıl tanımlanır", "ilk ödeme tarihi", "aidat başlat"],
  `1. Finans → "+ Aidat Planı"na dokun (ya da sporcu eklerken Aylık Aidat ve İlk Ödeme Tarihi'ni gir).
2. Sporcuyu seç, Aylık Tutar (₺) ve İlk Ödeme Tarihi'ni gir.
3. Kaydet.
Girdiğin tutar ve tarih her ay otomatik tekrarlanan bir plan oluşturur; önümüzdeki 3 ay için ödeme kaydı hemen hazırlanır, zaman geçtikçe yeni aylar kendiliğinden eklenir (ay sayısı Aidat & Finans ayarından değişir).`);

e("sabit-aidat", "finans", "AK", "Branş bazlı sabit aidat ücreti",
  ["sabit aidat", "aidat ücretini güncelle", "tüm sporcuların aidatını değiştir", "branş aidatı", "aidat zammı"],
  `Finans → "⚙️ Sabit Aidat Ücreti"ne gir. Her branş için ayrı ücret belirlersin; bir branşın ücretini "Güncelle"yince YALNIZCA o branştaki sporcuların aidat planları güncellenir ve içinde bulunduğun ay HARİÇ, henüz ödenmemiş gelecek aylardaki tutarlar da yeni değere çekilir. Diğer branşlara ve ödenmiş kayıtlara dokunulmaz. İşlem onay ister.`);

e("odendi-isaretle", "finans", "AK", "Aidatı ödendi olarak işaretleme, uyarı gönderme, dekont/makbuz",
  ["ödendi işaretle", "aidat tahsil et", "ödeme onayla", "uyarı gönder", "dekontu gör", "makbuz", "veli ödediğini bildirdi", "erken ödendi", "veliler ödeme yapınca ne olur", "veli ödeme yaptı ne olur"],
  `Finans'ta bir sporcunun ödemelerine gir; "Yaklaşan Ödemeler" ve "Geçmiş Ödemeler" listelenir.
• Veli ödemeyi bildirdiyse kartta "💬 Veli … ile ödediğini bildirdi" görünür; varsa "📎 Dekontu Gör"den dekontu incele, parayı kontrol edip "Ödendi İşaretle"ye dokun ve onayla.
• Vadesi geçmiş ödeme için "🔔 Uyarı Gönder" veliye bildirim yollar (bağlı veli hesabı yoksa gönderilemez).
• Ödenen kayıtta "🧾 Makbuz Görüntüle" makbuzu açar; "Makbuzu PDF Olarak Paylaş"la gönderebilirsin.
• Vadesinden önce ödenenler "🔵 Erken Ödendi" etiketi alır.
Ayrıca vadesi geçen aidatlar için velilere 3 günde bir otomatik "Aidat Hatırlatması" bildirimi gider.`);

e("gelir-gider", "finans", "AK", "Gelir ve gider kaydetme",
  ["gider ekle", "gelir ekle", "kira gideri", "forma satışı geliri", "malzeme gideri", "aidat dışı gelir"],
  `• Finans → "+ Gelir": Aidat dışındaki gelirler (forma/tişört satışı, malzeme satışı vb.) için Açıklama, Tutar (₺) ve Tarih gir, "Geliri Kaydet".
• Finans → "+ Gider": Salon kirası, malzeme alımı gibi giderler için Açıklama, Tutar ve Tarih gir, "Gideri Kaydet".
Kayıtlar "Finansal Dökümanlarım"da görünür. Mağazadan teslim edilen siparişler ve onaylanan ücretli etkinlik kayıtları da gelir olarak buraya işlenir.`);

e("finansal-dokuman", "finans", "AK", "Finansal Dökümanlarım / Excel'e aktarma",
  ["finansal dökümanlarım", "gelir gider raporu", "tarih aralığı rapor", "excel'e aktar finans", "toplam gelir gider", "rapor al"],
  `Finans → "📄 Finansal Dökümanlarımı Listele"de aidat gelirleri, diğer gelirler, giderler ve antrenör ödemeleri tek listede toplanır. Üstten Başlangıç ve Bitiş tarihini seç (varsayılan aralık finansal dönem ayarına göre gelir), arama kutusundan sporcu/antrenör/açıklama ara; Gelir, Gider ve Toplam özetini görürsün. "📥 Excel'e Aktar" ile filtrelenmiş kayıtları dosya olarak paylaşırsın. Gelir/gider satırlarını silebilirsin.`);

e("veli-aidat-ode", "finans", "P", "Aidat ödeme ve ödeme bildirimi (veli)",
  ["aidat öde", "aidatımı nasıl öderim", "havale eft ile öde", "dekont ekle", "ödedim bildir", "elden ödeme", "ödeme yöntemi", "aidat nereden ödenir"],
  `1. Ana Sayfa → "Aidat Öde"ye dokun; "Yaklaşan Ödemeler" ve "Geçmiş Ödemeler" listelenir.
2. Ödemek istediğin aidata dokun ve yöntemi seç:
   • Havale/EFT: Kulübün Hesap Sahibi ve IBAN bilgisi görünür (dokunarak kopyalayabilirsin). Parayı gönder, istersen "📎 Dekont Ekle" ile dekontun fotoğrafını ekle ve "Ödedim, Bildir"e bas.
   • Elden Ödeme: Tutarı antrenörüne ya da yönetime teslim edersin; yine "Ödedim, Bildir"e bas.
   • Online Ödeme (kartla): Yakında eklenecek.
3. Bildirimin kulüp yönetimine iletilir; ödeme kontrol edildikten sonra durumu "Ödendi" olarak güncellenir.
Ödenen aidatlarda "🧾 Makbuz Görüntüle" ile makbuzu açıp PDF olarak paylaşabilirsin.`);

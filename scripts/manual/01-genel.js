const { e } = require("./helpers");

// ===================== BAŞLARKEN VE HESAP =====================
e("giris-yapma", "baslarken", "ACPSKX", "Uygulamaya giriş yapma",
  ["nasıl giriş yaparım", "giriş yapamıyorum", "hesabıma nasıl girerim", "kullanıcı adı ile giriş", "telefon ile giriş", "giriş ekranı"],
  `1. Uygulamayı aç; giriş ekranı gelir.
2. "Telefon numarası veya kullanıcı adı" alanına sana verilen bilgiyi yaz.
3. Şifreni gir ve "Giriş Yap"a dokun.

Hesabı kulüp yöneticin açar; hesabın yoksa yöneticine başvur. Uygulamadan kendi kendine kayıt olunmaz. Yeni bir kulüp kaydı için xnetic.net adresini ziyaret et.`);

e("hesap-nasil-acilir", "baslarken", "ACPSKX", "Hesap nasıl açılır / kayıt olma",
  ["kayıt olmak istiyorum", "hesabım yok", "nasıl üye olurum", "hesap açma", "yeni kullanıcı", "kulüp kaydı"],
  `Veli, sporcu ve antrenör hesaplarını uygulamadan kendin açamazsın — hesabı kulübünün yöneticisi (ya da yetkili antrenör) sana açar ve geçici bir şifre verir.

Yeni bir kulüp kurmak istiyorsan xnetic.net adresinden "Kulüp Oluştur" adımını kullan; bunun için uygulamadan değil web sitesinden başvurulur.`);

e("sifremi-unuttum", "baslarken", "ACPSKX", "Şifremi unuttum",
  ["şifremi unuttum", "şifremi hatırlamıyorum", "şifre sıfırlama", "giriş şifremi kaybettim", "parolamı unuttum", "şifre yenileme"],
  `1. Giriş ekranında "Şifremi Unuttum"a dokun.
2. Kullanıcı adını ya da telefon numaranı yaz ve gönder. İkisinden biri kayıtlı bilgilerinle eşleşmesi yeter — giriş yaparken hangisini kullandığının önemi yok (kullanıcı adıyla giriyorsan da telefonunu yazabilirsin).
3. Talebin kulüp yöneticine bildirim olarak gider; yöneticin Kullanıcılar ekranından yeni bir geçici şifre üretip sana iletir.

Geçici şifreyle girdiğinde kendi şifreni belirlemen istenir. Şifre sıfırlama e-postası/linki gönderilmiyor.`);

e("gecici-sifre", "baslarken", "ACPSKX", "Geçici şifreyle ilk giriş",
  ["geçici şifre", "ilk girişte şifre değiştir", "şifre belirle ve devam et", "yeni şifre belirlemem isteniyor", "hoş geldin şifre"],
  `Sana geçici bir şifre verildiyse ilk girişte "Hoş Geldin" ekranı çıkar ve kendi şifreni belirlemen zorunlu olur.
1. Yeni şifreni yaz (en az 6 karakter).
2. Aynı şifreyi tekrar yaz.
3. "Şifreyi Belirle ve Devam Et"e dokun.
Bundan sonra girişlerde bu yeni şifreni kullanırsın.`);

e("onay-ekrani", "baslarken", "ACPSK", "İlk girişteki onay (KVKK) ekranı",
  ["kvkk onayı", "aydınlatma metni", "okudum kabul ediyorum", "onay ekranı", "gizlilik onayı", "kabul etmeden devam", "açık rıza"],
  `İlk girişte uygulamayı kullanmadan önce üç metni okuyup onaylaman gerekir: KVKK Aydınlatma Metni ve Açık Rıza, Fotoğraf-Video Kullanım İzni ve Sorumluluk (ya da Görev) Beyanı.
1. Metni sonuna kadar oku.
2. "Okudum, Kabul Ediyorum"a dokun.
Onayları kabul etmeden uygulama kullanılamaz; kabul etmek istemiyorsan "Çıkış Yap"a dokunabilirsin.`);

e("onay-veli-cocuk", "baslarken", "PS", "Çocuğumun/sporcunun verisi için onay kimden alınır",
  ["veli onayı", "çocuk verisi rıza", "reşit değil sporcu onay", "kvkk çocuk"],
  `Sporcunun kişisel verileri için açık rızayı velisi/vasisi verir; bu yüzden onay ekranındaki metinler veli hesabına gösterilir ve onay veli tarafından verilir. Verilerinin silinmesini istersen Profil → Hesabımı Sil ya da kulüp yönetimiyle iletişim yolunu kullanabilirsin.`);

e("biyometrik-kilit", "baslarken", "ACPSKX", "Face ID / parmak izi kilidi",
  ["face id", "parmak izi", "uygulama kilidi", "biyometrik", "kilit ekranı", "neden face id soruyor"],
  `Telefonunda Face ID, parmak izi ya da ekran kilidi (PIN) kuruluysa, uygulamayı tamamen kapatıp yeniden açtığında kimliğini doğrulaman istenir. Bu, hesabını başkalarına karşı korur. Telefonunda hiçbir kilit kurulu değilse bu adım atlanır.`);

e("abonelik-durumu", "baslarken", "A", "\"Hesabın İnceleniyor\" / abonelik ekranı",
  ["hesabın inceleniyor", "abonelik aktif değil", "aboneliğim bitti", "hesap onay bekliyor", "abonelik süresi doldu", "abonelik iptal"],
  `• "Hesabın İnceleniyor": Kulübünün kaydı alındı; X-NETIC ekibi kontrolü tamamladığında hesap otomatik aktif olur (genelde birkaç saat).
• "Kulübünün Aboneliği Aktif Değil": Abonelik dönemi bitmiş. Ekranın altındaki "Destek ile İletişime Geç" düğmesiyle X-NETIC destek ekibine ulaş.
• "Abonelik İptal Edildi": Devam etmek için yine destek ile iletişime geç.
Bu durumdayken uygulamanın diğer bölümleri açılmaz.`);

e("bakim-modu", "baslarken", "ACPSKX", "\"Bakım Çalışması\" ekranı",
  ["bakım çalışması", "uygulama bakımda", "bakım modu", "uygulama açılmıyor bakım"],
  `Platformda bakım yapılıyorsa Süper Admin dışındaki herkes "Bakım Çalışması" ekranını görür. Bir süre bekleyip uygulamayı yeniden aç; bakım bitince normal şekilde girersin.`);

e("cikis-yapma", "baslarken", "ACPSKX", "Çıkış yapma",
  ["çıkış yap", "oturumu kapat", "hesaptan çık", "başka hesaba geç"],
  `Alt menüden Profil'e gir ve en alttaki "Çıkış Yap"a dokun. Başka bir hesapla girmek için önce çıkış yap, sonra yeni bilgilerinle giriş yap.`);

e("alt-menu", "baslarken", "ACPSK", "Alt menü ne işe yarar",
  ["alt menü", "sekmeler", "ana menü sosyal mağaza", "alt çubuk", "menüler nerede", "uygulamada nasıl gezinirim"],
  `Ekranın altındaki menüde şunlar bulunur:
• Ana Menü — rolüne özel kutucuklar ve duyurular
• Sosyal — kulüp fotoğraf/video akışı
• Mağaza — kulüp ürünleri
• Ortadaki X-NETIC logosu — Asistan (bu ekran)
• Etkinlik — etkinlik, turnuva ve kamplar
• Mesajlar — mesajlaşma
• Profil — kişisel bilgiler, ayarlar, çıkış
Süper Admin'de menü farklıdır: Ana Menü, Mesajlar, Asistan, Sistem Ayarları ve Profil.`);

e("gezinme-geri", "baslarken", "ACPSKX", "Önceki ekrana / Ana Sayfa'ya dönme",
  ["geri dön", "ana sayfaya dön", "geri butonu", "ana sayfa butonu", "ekranlar arasında nasıl gezinirim"],
  `Ekranın sol üstündeki geri oku bir önceki ekrana, "🏠 Ana Sayfa" düğmesi doğrudan Ana Sayfa'ya götürür. Alt menüdeki "Ana Menü"ye dokunmak da seni başlangıca döndürür.`);

// ===================== ANA SAYFA VE BİLDİRİMLER =====================
e("anasayfa-yonetici", "anasayfa", "A", "Kulüp Yöneticisi Ana Sayfası",
  ["yönetici ana sayfa", "ana sayfada neler var", "ana sayfa kutucukları yönetici", "yönetici menüsü", "kutucuklar"],
  `Ana Sayfa'da kulübünün özet sayıları (Aktif Sporcu, Branş, Antrenör, Salon), güncel duyuruların ve şu kutucuklar yer alır:
• Sporcu Yönetimi — sporcular ve gruplar
• Antrenörler — kadro ve atamalar
• Takvim — antrenman ve müsabakalar
• Finans — aidat ve giderler
• Kulüp Yapısı — grup, branş, salon
• Performans — fitness, ölçüm ve beslenme
Kutucuk listesini Profil → Kulüp Ayarları → Ana Sayfa Özellikleri'nden özelleştirebilirsin.`);

e("anasayfa-koordinator", "anasayfa", "K", "Branş Koordinatörü Ana Sayfası",
  ["koordinatör ana sayfa", "koordinatör kutucukları", "koordinatör menüsü", "koordinatör neler görür"],
  `Branş koordinatörü olarak Ana Sayfan otomatik olarak branşına açılır ve şu kutucukları içerir: Sporcu Yönetimi, Antrenörler, Antrenman-Maç Takvimi, Günün Programı, Kulüp Yapısı, Finans ve Performans. Hepsi yalnızca kendi branşınla sınırlıdır — sadece kendi gruplarını değil, branşın TÜM sporcularını ve aidatlarını görürsün.`);

e("anasayfa-antrenor", "anasayfa", "C", "Antrenör Ana Sayfası",
  ["antrenör ana sayfa", "antrenör kutucukları", "antrenör menüsü", "antrenör neler görür"],
  `Antrenör Ana Sayfası'nda dört kutucuk vardır:
• Sporcularım — sana atanan gruplardaki sporcular
• Günün Programı — yoklama alacağın gruplar
• Antrenman Planla — antrenman oluşturma
• Performans — fitness ve beslenme
Duyurular da bu sayfada özet olarak görünür.`);

e("anasayfa-veli", "anasayfa", "P", "Veli Ana Sayfası",
  ["veli ana sayfa", "veli kutucukları", "veli menüsü", "veli neler görür", "veli olarak ne yapabilirim"],
  `Veli Ana Sayfası'nda dört kutucuk vardır:
• Sporcum — çocuğunun profili (birden fazla çocuğun varsa önce seçersin)
• Yoklama Durumu — çocuğunun antrenmana katılımı
• Antrenman ve Müsabaka Takvimi
• Aidat Öde — aidat durumu ve ödeme bildirimi
Ayrıca alt menüden Mağaza, Etkinlik, Mesajlar ve Sosyal'e ulaşırsın.`);

e("anasayfa-sporcu", "anasayfa", "S", "Sporcu Ana Sayfası",
  ["sporcu ana sayfa", "sporcu kutucukları", "sporcu menüsü", "sporcu neler görür", "sporcu olarak ne yapabilirim"],
  `Sporcu Ana Sayfası'nda şu kutucuklar bulunur:
• Takvim — antrenman ve müsabakalar
• Antrenman Katılım Durumu
• Günlük Check-in — uyku, enerji, ruh hâli (müsabık sporcular ve kulüp açıksa)
• Performans — ölçümlerin ve gelişimin
• Beslenme — besinler, tarifler, rehber
Alt menüden Sosyal, Mağaza (görüntüleme), Etkinlik ve Mesajlar'a da ulaşırsın.`);

e("bildirim-zili", "anasayfa", "ACPSK", "Bildirimleri görme (zil simgesi)",
  ["bildirimler nerede", "zil ikonu", "bildirimlerim", "bildirim listesi", "bildirimi kaçırdım", "eski bildirimler"],
  `Ekranın üstündeki zil simgesine dokun; tüm bildirimlerini listeler. Bir bildirime dokunduğunda ilgili ekran doğrudan açılır (örneğin antrenman, ödeme, etkinlik ya da duyuru). Okunmamış bildirimler zilin üzerinde sayıyla görünür.`);

e("bildirim-izni", "anasayfa", "ACPSK", "Anlık bildirim (push) gelmiyor",
  ["bildirim gelmiyor", "push bildirim", "bildirim izni", "telefonuma bildirim düşmüyor", "bildirimleri açma"],
  `1. Telefonun Ayarlar → Bildirimler bölümünden X-NETIC için bildirimlere izin verildiğinden emin ol.
2. Uygulamada giriş yapmış olman gerekir; bildirim, hesabına bağlı telefona gönderilir.
3. Telefonun "Rahatsız Etme" modu açıksa bildirimler sessize düşer.
Bildirimler uygulamadaki zil listesinde her zaman görünür, telefona düşmese bile.`);

e("ana-sayfa-ozellikleri", "anasayfa", "A", "Ana Sayfa kutucuklarını kapatma/açma",
  ["kutucuğu kapat", "ana sayfa özellikleri", "kullanmadığımız modülü gizle", "beslenme kutusunu kaldır", "başlığı gizle", "kutucukları gizlemek istiyorum", "kutucukları gizle", "kutucuk gizleme"],
  `Kulübün kullanmadığı ana başlıkları gizleyebilirsin.
1. Profil → Kulüp Ayarları → Ana Sayfa Özellikleri'ne gir.
2. Kullanmadığın başlığı kapat (ör. Beslenme).
Kapatılan başlık Ana Sayfa'da hiç görünmez; istediğin zaman tekrar açabilirsin.`);

e("duyuru-onizleme", "anasayfa", "ACPSK", "Ana Sayfa'daki duyuru önizlemesi",
  ["ana sayfadaki duyurular", "duyuru önizleme", "duyuru neden görünmüyor", "duyuru kaç gün görünür"],
  `Ana Sayfa'da güncel duyuruların kısa bir önizlemesi görünür; "Güncel duyuru yok" yazıyorsa görüntülenecek duyuru yoktur. Önizlemede ve tam listede duyuruların ne kadar süre görüneceği kulüp ayarlarıyla belirlenir (Kulüp Ayarları → Gelişmiş Ayarlar → Duyurular; varsayılan önizleme 1 gün, liste 10 gün). Tüm duyurulara Profil → Duyurular'dan ulaşırsın.`);

// ===================== PROFİL VE AYARLAR =====================
e("kisisel-bilgiler", "profil", "ACPSKX", "Kişisel bilgileri ve fotoğrafı güncelleme",
  ["profilimi güncelle", "fotoğrafımı değiştir", "adımı değiştir", "telefon numaramı güncelle", "kişisel bilgilerim", "adres ekle", "acil durum kişisi", "doğum tarihi"],
  `1. Alt menüden Profil'e gir, "Kişisel Bilgiler"e dokun.
2. Fotoğrafı değiştirmek için fotoğrafa dokun ve galerinden seç (izin istenirse ver).
3. Ad Soyad, Telefon, Doğum Tarihi, Öğrenim Durumu, Adres ve Acil Durum Kişisi bilgilerini düzenle.
4. "Kaydet"e dokun.
Not: Veli hesaplarında profil fotoğrafı bulunmaz. Ad Soyad boş bırakılamaz.`);

e("giris-bilgisi-degistir", "profil", "ACPSKX", "Giriş bilgisini (telefon/kullanıcı adı/e-posta) değiştirme",
  ["kullanıcı adımı değiştir", "giriş telefonumu değiştir", "e-postamı değiştir", "giriş bilgisi güncelle", "hangi bilgiyle giriş yapıyorum"],
  `1. Profil → "Giriş ve Şifre İşlemleri"ne gir.
2. Üstteki "Giriş Bilgisi" bölümünde şu an hangi bilgiyle girdiğini görürsün.
3. Yeni telefon, kullanıcı adı ya da e-postanı yaz ve "Giriş Bilgisini Güncelle"ye dokun.
Bir sonraki girişte yeni bilginle giriş yaparsın.`);

e("sifre-degistir", "profil", "ACPSKX", "Kendi şifreni değiştirme",
  ["şifremi değiştir", "şifre değiştirme", "yeni şifre belirle", "şifremi güncelle", "parolamı değiştir"],
  `1. Profil → "Giriş ve Şifre İşlemleri"ne gir.
2. "Şifre Değiştir" bölümüne mevcut şifreni yaz.
3. Yeni şifreni (en az 6 karakter) iki kez gir.
4. "Şifreyi Değiştir"e dokun.
Mevcut şifreni bilmiyorsan giriş ekranındaki "Şifremi Unuttum" akışını kullan.`);

e("destek", "profil", "ACPSKX", "Yardım / Destek'ten bize ulaşma",
  ["destek al", "sorun bildir", "yardım istiyorum", "iletişim", "teknik destek", "hata bildirme", "mail gönder destek"],
  `Profil → "Yardım / Destek"e gir, sorununu ya da isteğini yaz ve "✉️ Mail Gönder"e dokun. Telefonundaki mail uygulaması, destek adresine önceden hazırlanmış bir mailla açılır; göndermeden önce düzenleyebilirsin. Cevap, gönderdiğin mail adresine gelir. Telefonunda mail uygulaması yoksa uyarı çıkar.`);

e("hesap-silme", "profil", "ACPSK", "Hesabımı silme talebi",
  ["hesabımı sil", "hesap silme", "verilerimi silmek istiyorum", "hesabımı kapat", "kvkk silme talebi"],
  `1. Profil ekranının en altındaki "Hesabımı Sil"e dokun.
2. Açıklamayı oku ve "Talep Gönder"e bas.
Talebin kulüp yönetimine (kulüp yöneticiysen X-NETIC ekibine) iletilir; incelendikten sonra hesabın ve kişisel verilerin KVKK sürecine uygun şekilde kapatılır. Bu işlem geri alınamaz. Süper admin hesabı için bu özellik kullanılamaz.`);

e("profil-koordinator-etiketi", "profil", "K", "Profildeki \"Branş Koordinatörü\" etiketi",
  ["koordinatör etiketi", "branşım kilitli", "branşımı değiştiremiyorum", "koordinatörüm ne demek"],
  `Sen bir branşın koordinatörü olarak atandıysan profilinde "🏷 Branş Koordinatörü — [branş]" etiketi görünür. Koordinatörler kendi branşlarını değiştiremez; Ana Sayfa'n otomatik olarak o branşa açılır ve yalnızca o branşın sporcularını, antrenörlerini, gruplarını ve aidatlarını görürsün.`);

// ===================== DUYURULAR =====================
e("duyurulari-gorme", "duyuru", "ACPSKX", "Duyuruları görme",
  ["duyurular nerede", "duyuruları görme", "kulüp duyuruları", "eski duyurular", "duyuru listesi"],
  `Profil → "Duyurular"a gir; sana gönderilmiş tüm duyuruları listeler. Bir duyuruya dokununca içeriği ve varsa eki ("📎 Ek Dosya") açılır. Güncel duyurular Ana Sayfa'da da özet olarak görünür.`);

e("duyuru-yapma", "duyuru", "AK", "Duyuru yayınlama",
  ["duyuru yap", "duyuru oluştur", "duyuru gönder", "toplu duyuru", "velilere duyuru", "duyuru nasıl atılır", "kime gönderilsin"],
  `1. Profil → Duyurular'a gir ve "+ Duyuru Yap"a dokun.
2. Başlık ve İçerik yaz (ikisi de zorunlu).
3. "Kime Gönderilsin?" bölümünden hedefi seç (birden fazla seçebilirsin): Tüm Kulüp, Antrenörler, Branşlar/Gruplar, ya da Veli/Sporcu seçimi.
4. İstersen fotoğraf, video ya da belge ekle (dosya boyutu sınırlıdır).
5. "Yayınla"ya dokun.
Seçtiğin kişilere hem uygulama içi bildirim hem telefon bildirimi gider. Koordinatör olarak yalnızca kendi branşındaki gruplara gönderebilirsin.`);

e("duyuru-kim-okudu", "duyuru", "AK", "Duyuruyu kimlerin okuduğunu görme / duyuru silme",
  ["duyuruyu kim okudu", "okuyanlar", "duyuru sil", "duyuru silme", "duyuru kime gitti"],
  `Profil → Duyurular'dan duyuruya dokun. Detay ekranında "Kime Gönderildi" ve "Okuyanlar" listeleri görünür. Duyuruyu kaldırmak için aynı ekrandaki "Duyuruyu Sil"e dokun ve onayla; silinen duyuru kalıcı olarak kaybolur.`);

e("duyuru-suresi-ayari", "duyuru", "A", "Duyuruların ne kadar süre görüneceğini ayarlama",
  ["duyuru süresi", "duyuru kaç gün kalsın", "duyuru görünürlük süresi"],
  `Profil → Kulüp Ayarları → Gelişmiş Ayarlar → "Duyurular"a gir. İki süreyi ayrı ayrı belirlersin: Ana Sayfa önizlemesinde kaç gün görüneceği ve Duyurular listesinde kaç gün görüneceği. Kaydet'e bas.`);

// ===================== ROZETLER =====================
e("rozet-nedir", "rozet", "ACPSKX", "Rozetler nedir, nasıl kazanılır",
  ["rozet nasıl kazanılır", "rozetlerim", "rozet nedir", "ödüller", "rozet kazanma", "hangi rozetler var"],
  `Rozetler otomatik kazanılır; kimse elle vermez (Şampiyon rozeti hariç). Profil → "Rozetlerim"den kazandıklarını görürsün. Kazanım ölçütleri ve varsayılan eşikler (bronz / gümüş / altın):
• Antrenman serisi: kesintisiz antrenman sayısı (5 / 10 / 20)
• Grup fitness: tamamlanan grup fitness antrenmanı (5 / 10 / 20)
• Bireysel fitness: bireysel çalışma yapılan gün (5 / 10 / 20)
• Kulüp kıdemi: kulüpte geçen yıl (1 / 3 / 5)
• Sosyal paylaşım: Sosyal Alan'da paylaşım sayısı (10 / 25 / 50)
• Mağaza alışverişi: alınan ürün (5 / 10 / 20)
• Mesajlaşma: mesajlaştığın farklı kişi (10 / 20 / 30)
• Şampiyon: antrenörün/yöneticin tarafından elle verilir.
Rozet kazandığında bir sonraki girişinde kutlama penceresi çıkar.`);

e("rozet-esik", "rozet", "AK", "Rozet eşiklerini değiştirme / Şampiyon rozeti verme",
  ["rozet ayarları", "rozet eşiği", "şampiyon rozeti ver", "rozet sayısını değiştir", "rozet kaç olsun"],
  `1. Profil → "Rozet Ayarları"na gir.
2. Her rozet türü için üç eşik sayısını (bronz, gümüş, altın) yaz — sayılar küçükten büyüğe artmalı (ör. 5, 10, 20).
3. Kaydet'e bas. "Varsayılana Dön" ile eski değerlere dönebilirsin.
Şampiyon rozeti için aynı ekranda "🏆 Rozeti Ver"e dokunup bir sporcu seçersin; sporcu bir sonraki girişinde kutlanır. Kazanım hâlâ otomatiktir, sadece eşik sayıları kulübüne özel olur.`);

// ===================== MESAJLAR =====================
e("mesaj-gonder", "mesaj", "ACPSK", "Mesaj gönderme / yeni sohbet",
  ["mesaj gönder", "yeni mesaj", "antrenöre mesaj", "mesajlaşma", "sohbet başlat", "mesaj nasıl atılır", "mesajlar nerede", "hocaya yazmak istiyorum", "antrenöre yazmak istiyorum", "hocaya mesaj"],
  `1. Alt menüden "Mesajlar"a gir.
2. "+ Yeni Mesaj"a dokun; kişi listesinden birini seç (üstteki filtrelerle Antrenörler, Sporcular, Veliler'i ayırabilir, arama kutusuyla bulabilirsin).
3. Mesajını yaz ve "Gönder"e dokun.
Mevcut sohbetlerin Mesajlar ekranında son mesaj ve okunmamış sayısıyla listelenir.`);

e("mesaj-kimle", "mesaj", "ACPSK", "Kimlerle mesajlaşabilirim",
  ["kime mesaj atabilirim", "mesaj kısıtlaması", "veli veliye mesaj", "neden bu kişiye yazamıyorum", "mesajlaşabileceğim kimse yok", "mesaj kuralları", "arkadaşıma mesaj atmak istiyorum"],
  `Mesajlaşma kuralları gizlilik için sınırlıdır:
• Kulüp yöneticisi: kulübündeki herkesle ve süper adminle.
• Antrenör/koordinatör: kulüp yöneticisi, aynı branştaki diğer antrenörler ve kendi gruplarındaki veli/sporcular.
• Veli ve sporcu: çocuğunun/kendi grubunun antrenörleri ve branş koordinatörüyle. Sporcular ayrıca kendi gruplarındaki diğer sporcularla mesajlaşabilir (sadece ad soyad ve fotoğraf görünür).
• Veliler birbirine yazamaz.
"Mesajlaşabileceğin kimse yok" yazıyorsa henüz bir gruba atanmamışsın demektir.`);

e("mesaj-okundu", "mesaj", "ACPSK", "Mesajı okuyup okumadığını anlama / okunmamış mesaj",
  ["okunmamış mesaj", "mesaj okundu mu", "mesaj rozeti", "yeni mesaj bildirimi"],
  `Mesajlar sekmesinin üzerindeki sayı, toplam okunmamış mesajını gösterir. Bir sohbeti açtığında karşı taraftan gelen mesajlar okundu olarak işaretlenir.`);

// ===================== SOSYAL ALAN =====================
e("sosyal-genel", "sosyal", "ACPSK", "Sosyal Alan nedir",
  ["sosyal alan", "sosyal sekmesi", "fotoğraf akışı", "kulüp fotoğrafları", "sosyal ne işe yarar"],
  `Sosyal Alan, kulüp içi fotoğraf/video akışıdır. Paylaşımlar günlere göre gruplanır. Fotoğraf ve videolar yüklendikten 2 hafta sonra otomatik olarak silinir. Sosyal paylaşım sayın rozet kazanmanı da sağlar.`);

e("sosyal-paylas", "sosyal", "ACSK", "Fotoğraf/video paylaşma",
  ["fotoğraf paylaş", "video paylaş", "sosyal paylaşım", "nasıl paylaşım yaparım", "sosyal alana yükle"],
  `1. Alt menüden Sosyal'e gir ve "+ Paylaş"a dokun.
2. "+ Fotoğraf / Video Seç" ile galeriden seç.
3. Branşını seç ve istersen kısa bir not yaz.
4. "Paylaş"a dokun.
Antrenör ve yöneticilerin paylaşımı doğrudan yayınlanır. Sporcu paylaşımı ise branşın antrenörü/koordinatörü onayladıktan sonra akışta görünür ("⏳ Onay Bekliyor"). Veliler Sosyal Alan'da paylaşım yapamaz, yalnızca görüntüler.`);

e("sosyal-onay", "sosyal", "ACK", "Sosyal paylaşımı onaylama / silme",
  ["paylaşımı onayla", "onay bekleyenler", "sosyal paylaşım sil", "paylaşım onayı", "paylaşımı kaldır"],
  `Sosyal ekranında "Onay Bekleyenler" sekmesinde sporcuların gönderdiği paylaşımlar listelenir. Bir paylaşıma dokunup "✓ Onayla" ile yayına alır ya da "🗑 Sil" ile kaldırırsın. Yayındaki herhangi bir paylaşımı da aynı şekilde silebilirsin.`);

e("sosyal-onay-bekliyor", "sosyal", "S", "Paylaşımım neden görünmüyor (Onay Bekliyor)",
  ["paylaşımım görünmüyor", "onay bekliyor", "paylaşımım yayınlanmadı", "paylaşımım onaylanmadı"],
  `Sporcu olarak yaptığın paylaşım, branşının antrenörü ya da koordinatörü onaylayana kadar "⏳ Onay Bekliyor" durumunda kalır ve akışta görünmez. Onaylanınca herkese görünür olur.`);

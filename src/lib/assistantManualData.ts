// BU DOSYA OTOMATİK ÜRETİLİR — elle düzenleme!
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

export const MANUAL_MODULES: ManualModule[] = [
  {
    "key": "baslarken",
    "title": "Başlarken ve Hesap",
    "icon": "🚀"
  },
  {
    "key": "anasayfa",
    "title": "Ana Sayfa ve Bildirimler",
    "icon": "🏠"
  },
  {
    "key": "profil",
    "title": "Profil ve Ayarlar",
    "icon": "👤"
  },
  {
    "key": "sporcu",
    "title": "Sporcu Yönetimi ve Kayıt İşlemleri",
    "icon": "👥"
  },
  {
    "key": "sporcum",
    "title": "Sporcum (Veli ve Sporcu)",
    "icon": "🧒"
  },
  {
    "key": "takvim",
    "title": "Takvim, Antrenman ve Yoklama",
    "icon": "📅"
  },
  {
    "key": "musabaka",
    "title": "Müsabakalar",
    "icon": "🏆"
  },
  {
    "key": "antrenor",
    "title": "Antrenörler",
    "icon": "🧑‍🏫"
  },
  {
    "key": "yapi",
    "title": "Kulüp Yapısı (Branş, Grup, Salon)",
    "icon": "🏛️"
  },
  {
    "key": "ayar",
    "title": "Kulüp Ayarları",
    "icon": "⚙️"
  },
  {
    "key": "finans",
    "title": "Finans ve Aidat",
    "icon": "💰"
  },
  {
    "key": "performans",
    "title": "Performans Ölçümleri",
    "icon": "📊"
  },
  {
    "key": "fitness",
    "title": "Fitness",
    "icon": "🏋️"
  },
  {
    "key": "beslenme",
    "title": "Beslenme",
    "icon": "🥗"
  },
  {
    "key": "takip",
    "title": "Günlük Check-in ve Zorluk Derecesi",
    "icon": "🌡️"
  },
  {
    "key": "etkinlik",
    "title": "Etkinlik, Turnuva ve Kamp",
    "icon": "🎪"
  },
  {
    "key": "magaza",
    "title": "Mağaza",
    "icon": "🛍️"
  },
  {
    "key": "sosyal",
    "title": "Sosyal Alan",
    "icon": "📸"
  },
  {
    "key": "mesaj",
    "title": "Mesajlar",
    "icon": "💬"
  },
  {
    "key": "duyuru",
    "title": "Duyurular",
    "icon": "📣"
  },
  {
    "key": "rozet",
    "title": "Rozetler",
    "icon": "🎖️"
  },
  {
    "key": "sa",
    "title": "Süper Admin",
    "icon": "🛡️"
  },
  {
    "key": "sss",
    "title": "Sık Sorulan Sorular ve Sorun Giderme",
    "icon": "🆘"
  }
];

export const MANUAL_ENTRIES: ManualEntry[] = [
  {
    "id": "giris-yapma",
    "module": "baslarken",
    "roles": "ACPSKX",
    "title": "Uygulamaya giriş yapma",
    "questions": [
      "nasıl giriş yaparım",
      "giriş yapamıyorum",
      "hesabıma nasıl girerim",
      "kullanıcı adı ile giriş",
      "telefon ile giriş",
      "e-posta ile giriş",
      "giriş ekranı",
      "Uygulamaya nasıl giriş yaparım?"
    ],
    "answer": "1. Uygulamayı aç; giriş ekranı gelir.\n2. \"E-posta, telefon veya kullanıcı adı\" alanına sana verilen bilgiyi yaz.\n3. Şifreni gir ve \"Giriş Yap\"a dokun.\n\nHesabı kulüp yöneticin açar; hesabın yoksa yöneticine başvur. Uygulamadan kendi kendine kayıt olunmaz. Yeni bir kulüp kaydı için xnetic.net adresini ziyaret et."
  },
  {
    "id": "hesap-nasil-acilir",
    "module": "baslarken",
    "roles": "ACPSKX",
    "title": "Hesap nasıl açılır / kayıt olma",
    "questions": [
      "kayıt olmak istiyorum",
      "hesabım yok",
      "nasıl üye olurum",
      "hesap açma",
      "yeni kullanıcı",
      "kulüp kaydı"
    ],
    "answer": "Veli, sporcu ve antrenör hesaplarını uygulamadan kendin açamazsın — hesabı kulübünün yöneticisi (ya da yetkili antrenör) sana açar ve geçici bir şifre verir.\n\nYeni bir kulüp kurmak istiyorsan xnetic.net adresinden \"Kulüp Oluştur\" adımını kullan; bunun için uygulamadan değil web sitesinden başvurulur."
  },
  {
    "id": "sifremi-unuttum",
    "module": "baslarken",
    "roles": "ACPSKX",
    "title": "Şifremi unuttum",
    "questions": [
      "şifremi unuttum",
      "şifremi hatırlamıyorum",
      "şifre sıfırlama",
      "giriş şifremi kaybettim",
      "parolamı unuttum",
      "şifre yenileme",
      "Şifremi unuttum ne yapmalıyım?"
    ],
    "answer": "1. Giriş ekranında \"Şifremi Unuttum\"a dokun.\n2. Hesabına kayıtlı e-postanı, telefonunu ya da kullanıcı adını yaz ve gönder.\n\n• E-posta yazdıysan: adresine bir sıfırlama linki gelir. Linke dokununca uygulama açılır ve yeni şifreni belirlersin.\n• Telefon ya da kullanıcı adı yazdıysan: kulüp yöneticine bildirim gider; yöneticin seninle iletişime geçip yeni bir geçici şifre verir."
  },
  {
    "id": "gecici-sifre",
    "module": "baslarken",
    "roles": "ACPSKX",
    "title": "Geçici şifreyle ilk giriş",
    "questions": [
      "geçici şifre",
      "ilk girişte şifre değiştir",
      "şifre belirle ve devam et",
      "yeni şifre belirlemem isteniyor",
      "hoş geldin şifre",
      "Geçici şifreyle ilk girişte ne olur?"
    ],
    "answer": "Sana geçici bir şifre verildiyse ilk girişte \"Hoş Geldin\" ekranı çıkar ve kendi şifreni belirlemen zorunlu olur.\n1. Yeni şifreni yaz (en az 6 karakter).\n2. Aynı şifreyi tekrar yaz.\n3. \"Şifreyi Belirle ve Devam Et\"e dokun.\nBundan sonra girişlerde bu yeni şifreni kullanırsın."
  },
  {
    "id": "onay-ekrani",
    "module": "baslarken",
    "roles": "ACPSK",
    "title": "İlk girişteki onay (KVKK) ekranı",
    "questions": [
      "kvkk onayı",
      "aydınlatma metni",
      "okudum kabul ediyorum",
      "onay ekranı",
      "gizlilik onayı",
      "kabul etmeden devam",
      "açık rıza"
    ],
    "answer": "İlk girişte uygulamayı kullanmadan önce üç metni okuyup onaylaman gerekir: KVKK Aydınlatma Metni ve Açık Rıza, Fotoğraf-Video Kullanım İzni ve Sorumluluk (ya da Görev) Beyanı.\n1. Metni sonuna kadar oku.\n2. \"Okudum, Kabul Ediyorum\"a dokun.\nOnayları kabul etmeden uygulama kullanılamaz; kabul etmek istemiyorsan \"Çıkış Yap\"a dokunabilirsin."
  },
  {
    "id": "onay-veli-cocuk",
    "module": "baslarken",
    "roles": "PS",
    "title": "Çocuğumun/sporcunun verisi için onay kimden alınır",
    "questions": [
      "veli onayı",
      "çocuk verisi rıza",
      "reşit değil sporcu onay",
      "kvkk çocuk"
    ],
    "answer": "Sporcunun kişisel verileri için açık rızayı velisi/vasisi verir; bu yüzden onay ekranındaki metinler veli hesabına gösterilir ve onay veli tarafından verilir. Verilerinin silinmesini istersen Profil → Hesabımı Sil ya da kulüp yönetimiyle iletişim yolunu kullanabilirsin."
  },
  {
    "id": "biyometrik-kilit",
    "module": "baslarken",
    "roles": "ACPSKX",
    "title": "Face ID / parmak izi kilidi",
    "questions": [
      "face id",
      "parmak izi",
      "uygulama kilidi",
      "biyometrik",
      "kilit ekranı",
      "neden face id soruyor",
      "Face ID neden soruyor?"
    ],
    "answer": "Telefonunda Face ID, parmak izi ya da ekran kilidi (PIN) kuruluysa, uygulamayı tamamen kapatıp yeniden açtığında kimliğini doğrulaman istenir. Bu, hesabını başkalarına karşı korur. Telefonunda hiçbir kilit kurulu değilse bu adım atlanır."
  },
  {
    "id": "abonelik-durumu",
    "module": "baslarken",
    "roles": "A",
    "title": "\"Hesabın İnceleniyor\" / abonelik ekranı",
    "questions": [
      "hesabın inceleniyor",
      "abonelik aktif değil",
      "aboneliğim bitti",
      "hesap onay bekliyor",
      "abonelik süresi doldu",
      "abonelik iptal"
    ],
    "answer": "• \"Hesabın İnceleniyor\": Kulübünün kaydı alındı; X-NETIC ekibi kontrolü tamamladığında hesap otomatik aktif olur (genelde birkaç saat).\n• \"Kulübünün Aboneliği Aktif Değil\": Abonelik dönemi bitmiş. Ekranın altındaki \"Destek ile İletişime Geç\" düğmesiyle X-NETIC destek ekibine ulaş.\n• \"Abonelik İptal Edildi\": Devam etmek için yine destek ile iletişime geç.\nBu durumdayken uygulamanın diğer bölümleri açılmaz."
  },
  {
    "id": "bakim-modu",
    "module": "baslarken",
    "roles": "ACPSKX",
    "title": "\"Bakım Çalışması\" ekranı",
    "questions": [
      "bakım çalışması",
      "uygulama bakımda",
      "bakım modu",
      "uygulama açılmıyor bakım",
      "Bakım modunu nasıl açarım?"
    ],
    "answer": "Platformda bakım yapılıyorsa Süper Admin dışındaki herkes \"Bakım Çalışması\" ekranını görür. Bir süre bekleyip uygulamayı yeniden aç; bakım bitince normal şekilde girersin."
  },
  {
    "id": "cikis-yapma",
    "module": "baslarken",
    "roles": "ACPSKX",
    "title": "Çıkış yapma",
    "questions": [
      "çıkış yap",
      "oturumu kapat",
      "hesaptan çık",
      "başka hesaba geç",
      "Nasıl çıkış yaparım?"
    ],
    "answer": "Alt menüden Profil'e gir ve en alttaki \"Çıkış Yap\"a dokun. Başka bir hesapla girmek için önce çıkış yap, sonra yeni bilgilerinle giriş yap."
  },
  {
    "id": "alt-menu",
    "module": "baslarken",
    "roles": "ACPSK",
    "title": "Alt menü ne işe yarar",
    "questions": [
      "alt menü",
      "sekmeler",
      "ana menü sosyal mağaza",
      "alt çubuk",
      "menüler nerede",
      "uygulamada nasıl gezinirim"
    ],
    "answer": "Ekranın altındaki menüde şunlar bulunur:\n• Ana Menü — rolüne özel kutucuklar ve duyurular\n• Sosyal — kulüp fotoğraf/video akışı\n• Mağaza — kulüp ürünleri\n• Ortadaki X-NETIC logosu — Asistan (bu ekran)\n• Etkinlik — etkinlik, turnuva ve kamplar\n• Mesajlar — mesajlaşma\n• Profil — kişisel bilgiler, ayarlar, çıkış\nSüper Admin'de menü farklıdır: Ana Menü, Mesajlar, Asistan, Sistem Ayarları ve Profil."
  },
  {
    "id": "gezinme-geri",
    "module": "baslarken",
    "roles": "ACPSKX",
    "title": "Önceki ekrana / Ana Sayfa'ya dönme",
    "questions": [
      "geri dön",
      "ana sayfaya dön",
      "geri butonu",
      "ana sayfa butonu",
      "ekranlar arasında nasıl gezinirim"
    ],
    "answer": "Ekranın sol üstündeki geri oku bir önceki ekrana, \"🏠 Ana Sayfa\" düğmesi doğrudan Ana Sayfa'ya götürür. Alt menüdeki \"Ana Menü\"ye dokunmak da seni başlangıca döndürür."
  },
  {
    "id": "anasayfa-yonetici",
    "module": "anasayfa",
    "roles": "A",
    "title": "Kulüp Yöneticisi Ana Sayfası",
    "questions": [
      "yönetici ana sayfa",
      "ana sayfada neler var",
      "ana sayfa kutucukları yönetici",
      "yönetici menüsü",
      "kutucuklar"
    ],
    "answer": "Ana Sayfa'da kulübünün özet sayıları (Aktif Sporcu, Branş, Antrenör, Salon), güncel duyuruların ve şu kutucuklar yer alır:\n• Sporcu Yönetimi — sporcular ve gruplar\n• Antrenörler — kadro ve atamalar\n• Takvim — antrenman ve müsabakalar\n• Finans — aidat ve giderler\n• Kulüp Yapısı — grup, branş, salon\n• Performans — fitness, ölçüm ve beslenme\nKutucuk listesini Profil → Kulüp Ayarları → Ana Sayfa Özellikleri'nden özelleştirebilirsin."
  },
  {
    "id": "anasayfa-koordinator",
    "module": "anasayfa",
    "roles": "K",
    "title": "Branş Koordinatörü Ana Sayfası",
    "questions": [
      "koordinatör ana sayfa",
      "koordinatör kutucukları",
      "koordinatör menüsü",
      "koordinatör neler görür"
    ],
    "answer": "Branş koordinatörü olarak Ana Sayfan otomatik olarak branşına açılır ve şu kutucukları içerir: Sporcu Yönetimi, Antrenörler, Antrenman-Maç Takvimi, Günün Programı, Kulüp Yapısı, Finans ve Performans. Hepsi yalnızca kendi branşınla sınırlıdır — sadece kendi gruplarını değil, branşın TÜM sporcularını ve aidatlarını görürsün."
  },
  {
    "id": "anasayfa-antrenor",
    "module": "anasayfa",
    "roles": "C",
    "title": "Antrenör Ana Sayfası",
    "questions": [
      "antrenör ana sayfa",
      "antrenör kutucukları",
      "antrenör menüsü",
      "antrenör neler görür"
    ],
    "answer": "Antrenör Ana Sayfası'nda dört kutucuk vardır:\n• Sporcularım — sana atanan gruplardaki sporcular\n• Günün Programı — yoklama alacağın gruplar\n• Antrenman Planla — antrenman oluşturma\n• Performans — fitness ve beslenme\nDuyurular da bu sayfada özet olarak görünür."
  },
  {
    "id": "anasayfa-veli",
    "module": "anasayfa",
    "roles": "P",
    "title": "Veli Ana Sayfası",
    "questions": [
      "veli ana sayfa",
      "veli kutucukları",
      "veli menüsü",
      "veli neler görür",
      "veli olarak ne yapabilirim"
    ],
    "answer": "Veli Ana Sayfası'nda dört kutucuk vardır:\n• Sporcum — çocuğunun profili (birden fazla çocuğun varsa önce seçersin)\n• Yoklama Durumu — çocuğunun antrenmana katılımı\n• Antrenman ve Müsabaka Takvimi\n• Aidat Öde — aidat durumu ve ödeme bildirimi\nAyrıca alt menüden Mağaza, Etkinlik, Mesajlar ve Sosyal'e ulaşırsın."
  },
  {
    "id": "anasayfa-sporcu",
    "module": "anasayfa",
    "roles": "S",
    "title": "Sporcu Ana Sayfası",
    "questions": [
      "sporcu ana sayfa",
      "sporcu kutucukları",
      "sporcu menüsü",
      "sporcu neler görür",
      "sporcu olarak ne yapabilirim"
    ],
    "answer": "Sporcu Ana Sayfası'nda şu kutucuklar bulunur:\n• Takvim — antrenman ve müsabakalar\n• Antrenman Katılım Durumu\n• Günlük Check-in — uyku, enerji, ruh hâli (müsabık sporcular ve kulüp açıksa)\n• Performans — ölçümlerin ve gelişimin\n• Beslenme — besinler, tarifler, rehber\nAlt menüden Sosyal, Mağaza (görüntüleme), Etkinlik ve Mesajlar'a da ulaşırsın."
  },
  {
    "id": "bildirim-zili",
    "module": "anasayfa",
    "roles": "ACPSK",
    "title": "Bildirimleri görme (zil simgesi)",
    "questions": [
      "bildirimler nerede",
      "zil ikonu",
      "bildirimlerim",
      "bildirim listesi",
      "bildirimi kaçırdım",
      "eski bildirimler",
      "Bildirimlerimi nerede görürüm?"
    ],
    "answer": "Ekranın üstündeki zil simgesine dokun; tüm bildirimlerini listeler. Bir bildirime dokunduğunda ilgili ekran doğrudan açılır (örneğin antrenman, ödeme, etkinlik ya da duyuru). Okunmamış bildirimler zilin üzerinde sayıyla görünür."
  },
  {
    "id": "bildirim-izni",
    "module": "anasayfa",
    "roles": "ACPSK",
    "title": "Anlık bildirim (push) gelmiyor",
    "questions": [
      "bildirim gelmiyor",
      "push bildirim",
      "bildirim izni",
      "telefonuma bildirim düşmüyor",
      "bildirimleri açma"
    ],
    "answer": "1. Telefonun Ayarlar → Bildirimler bölümünden X-NETIC için bildirimlere izin verildiğinden emin ol.\n2. Uygulamada giriş yapmış olman gerekir; bildirim, hesabına bağlı telefona gönderilir.\n3. Telefonun \"Rahatsız Etme\" modu açıksa bildirimler sessize düşer.\nBildirimler uygulamadaki zil listesinde her zaman görünür, telefona düşmese bile."
  },
  {
    "id": "ana-sayfa-ozellikleri",
    "module": "anasayfa",
    "roles": "A",
    "title": "Ana Sayfa kutucuklarını kapatma/açma",
    "questions": [
      "kutucuğu kapat",
      "ana sayfa özellikleri",
      "kullanmadığımız modülü gizle",
      "beslenme kutusunu kaldır",
      "başlığı gizle",
      "kutucukları gizlemek istiyorum",
      "kutucukları gizle",
      "kutucuk gizleme"
    ],
    "answer": "Kulübün kullanmadığı ana başlıkları gizleyebilirsin.\n1. Profil → Kulüp Ayarları → Ana Sayfa Özellikleri'ne gir.\n2. Kullanmadığın başlığı kapat (ör. Beslenme).\nKapatılan başlık Ana Sayfa'da hiç görünmez; istediğin zaman tekrar açabilirsin."
  },
  {
    "id": "duyuru-onizleme",
    "module": "anasayfa",
    "roles": "ACPSK",
    "title": "Ana Sayfa'daki duyuru önizlemesi",
    "questions": [
      "ana sayfadaki duyurular",
      "duyuru önizleme",
      "duyuru neden görünmüyor",
      "duyuru kaç gün görünür"
    ],
    "answer": "Ana Sayfa'da güncel duyuruların kısa bir önizlemesi görünür; \"Güncel duyuru yok\" yazıyorsa görüntülenecek duyuru yoktur. Önizlemede ve tam listede duyuruların ne kadar süre görüneceği kulüp ayarlarıyla belirlenir (Kulüp Ayarları → Gelişmiş Ayarlar → Duyurular; varsayılan önizleme 1 gün, liste 10 gün). Tüm duyurulara Profil → Duyurular'dan ulaşırsın."
  },
  {
    "id": "kisisel-bilgiler",
    "module": "profil",
    "roles": "ACPSKX",
    "title": "Kişisel bilgileri ve fotoğrafı güncelleme",
    "questions": [
      "profilimi güncelle",
      "fotoğrafımı değiştir",
      "adımı değiştir",
      "telefon numaramı güncelle",
      "kişisel bilgilerim",
      "adres ekle",
      "acil durum kişisi",
      "doğum tarihi",
      "Telefon numaramı nasıl güncellerim?",
      "Kişisel bilgilerimi nasıl güncellerim?"
    ],
    "answer": "1. Alt menüden Profil'e gir, \"Kişisel Bilgiler\"e dokun.\n2. Fotoğrafı değiştirmek için fotoğrafa dokun ve galerinden seç (izin istenirse ver).\n3. Ad Soyad, Telefon, Doğum Tarihi, Öğrenim Durumu, Adres ve Acil Durum Kişisi bilgilerini düzenle.\n4. \"Kaydet\"e dokun.\nNot: Veli hesaplarında profil fotoğrafı bulunmaz. Ad Soyad boş bırakılamaz."
  },
  {
    "id": "giris-bilgisi-degistir",
    "module": "profil",
    "roles": "ACPSKX",
    "title": "Giriş bilgisini (telefon/kullanıcı adı/e-posta) değiştirme",
    "questions": [
      "kullanıcı adımı değiştir",
      "giriş telefonumu değiştir",
      "e-postamı değiştir",
      "giriş bilgisi güncelle",
      "hangi bilgiyle giriş yapıyorum",
      "Giriş e-postamı nasıl değiştiririm?"
    ],
    "answer": "1. Profil → \"Giriş ve Şifre İşlemleri\"ne gir.\n2. Üstteki \"Giriş Bilgisi\" bölümünde şu an hangi bilgiyle girdiğini görürsün.\n3. Yeni telefon, kullanıcı adı ya da e-postanı yaz ve \"Giriş Bilgisini Güncelle\"ye dokun.\nBir sonraki girişte yeni bilginle giriş yaparsın."
  },
  {
    "id": "sifre-degistir",
    "module": "profil",
    "roles": "ACPSKX",
    "title": "Kendi şifreni değiştirme",
    "questions": [
      "şifremi değiştir",
      "şifre değiştirme",
      "yeni şifre belirle",
      "şifremi güncelle",
      "parolamı değiştir",
      "Şifremi nasıl değiştiririm?"
    ],
    "answer": "1. Profil → \"Giriş ve Şifre İşlemleri\"ne gir.\n2. \"Şifre Değiştir\" bölümüne mevcut şifreni yaz.\n3. Yeni şifreni (en az 6 karakter) iki kez gir.\n4. \"Şifreyi Değiştir\"e dokun.\nMevcut şifreni bilmiyorsan giriş ekranındaki \"Şifremi Unuttum\" akışını kullan."
  },
  {
    "id": "destek",
    "module": "profil",
    "roles": "ACPSKX",
    "title": "Yardım / Destek'ten bize ulaşma",
    "questions": [
      "destek al",
      "sorun bildir",
      "yardım istiyorum",
      "iletişim",
      "teknik destek",
      "hata bildirme",
      "mail gönder destek",
      "Sorun yaşarsam nereden yardım alırım?"
    ],
    "answer": "Profil → \"Yardım / Destek\"e gir, sorununu ya da isteğini yaz ve \"✉️ Mail Gönder\"e dokun. Telefonundaki mail uygulaması, destek adresine önceden hazırlanmış bir mailla açılır; göndermeden önce düzenleyebilirsin. Cevap, gönderdiğin mail adresine gelir. Telefonunda mail uygulaması yoksa uyarı çıkar."
  },
  {
    "id": "hesap-silme",
    "module": "profil",
    "roles": "ACPSK",
    "title": "Hesabımı silme talebi",
    "questions": [
      "hesabımı sil",
      "hesap silme",
      "verilerimi silmek istiyorum",
      "hesabımı kapat",
      "kvkk silme talebi"
    ],
    "answer": "1. Profil ekranının en altındaki \"Hesabımı Sil\"e dokun.\n2. Açıklamayı oku ve \"Talep Gönder\"e bas.\nTalebin kulüp yönetimine (kulüp yöneticiysen X-NETIC ekibine) iletilir; incelendikten sonra hesabın ve kişisel verilerin KVKK sürecine uygun şekilde kapatılır. Bu işlem geri alınamaz. Süper admin hesabı için bu özellik kullanılamaz."
  },
  {
    "id": "profil-koordinator-etiketi",
    "module": "profil",
    "roles": "K",
    "title": "Profildeki \"Branş Koordinatörü\" etiketi",
    "questions": [
      "koordinatör etiketi",
      "branşım kilitli",
      "branşımı değiştiremiyorum",
      "koordinatörüm ne demek"
    ],
    "answer": "Sen bir branşın koordinatörü olarak atandıysan profilinde \"🏷 Branş Koordinatörü — [branş]\" etiketi görünür. Koordinatörler kendi branşlarını değiştiremez; Ana Sayfa'n otomatik olarak o branşa açılır ve yalnızca o branşın sporcularını, antrenörlerini, gruplarını ve aidatlarını görürsün."
  },
  {
    "id": "duyurulari-gorme",
    "module": "duyuru",
    "roles": "ACPSKX",
    "title": "Duyuruları görme",
    "questions": [
      "duyurular nerede",
      "duyuruları görme",
      "kulüp duyuruları",
      "eski duyurular",
      "duyuru listesi"
    ],
    "answer": "Profil → \"Duyurular\"a gir; sana gönderilmiş tüm duyuruları listeler. Bir duyuruya dokununca içeriği ve varsa eki (\"📎 Ek Dosya\") açılır. Güncel duyurular Ana Sayfa'da da özet olarak görünür."
  },
  {
    "id": "duyuru-yapma",
    "module": "duyuru",
    "roles": "AK",
    "title": "Duyuru yayınlama",
    "questions": [
      "duyuru yap",
      "duyuru oluştur",
      "duyuru gönder",
      "toplu duyuru",
      "velilere duyuru",
      "duyuru nasıl atılır",
      "kime gönderilsin",
      "Duyuruyu nasıl yayınlarım?",
      "Branşıma duyuru nasıl gönderirim?"
    ],
    "answer": "1. Profil → Duyurular'a gir ve \"+ Duyuru Yap\"a dokun.\n2. Başlık ve İçerik yaz (ikisi de zorunlu).\n3. \"Kime Gönderilsin?\" bölümünden hedefi seç (birden fazla seçebilirsin): Tüm Kulüp, Antrenörler, Branşlar/Gruplar, ya da Veli/Sporcu seçimi.\n4. İstersen fotoğraf, video ya da belge ekle (dosya boyutu sınırlıdır).\n5. \"Yayınla\"ya dokun.\nSeçtiğin kişilere hem uygulama içi bildirim hem telefon bildirimi gider. Koordinatör olarak yalnızca kendi branşındaki gruplara gönderebilirsin."
  },
  {
    "id": "duyuru-kim-okudu",
    "module": "duyuru",
    "roles": "AK",
    "title": "Duyuruyu kimlerin okuduğunu görme / duyuru silme",
    "questions": [
      "duyuruyu kim okudu",
      "okuyanlar",
      "duyuru sil",
      "duyuru silme",
      "duyuru kime gitti"
    ],
    "answer": "Profil → Duyurular'dan duyuruya dokun. Detay ekranında \"Kime Gönderildi\" ve \"Okuyanlar\" listeleri görünür. Duyuruyu kaldırmak için aynı ekrandaki \"Duyuruyu Sil\"e dokun ve onayla; silinen duyuru kalıcı olarak kaybolur."
  },
  {
    "id": "duyuru-suresi-ayari",
    "module": "duyuru",
    "roles": "A",
    "title": "Duyuruların ne kadar süre görüneceğini ayarlama",
    "questions": [
      "duyuru süresi",
      "duyuru kaç gün kalsın",
      "duyuru görünürlük süresi"
    ],
    "answer": "Profil → Kulüp Ayarları → Gelişmiş Ayarlar → \"Duyurular\"a gir. İki süreyi ayrı ayrı belirlersin: Ana Sayfa önizlemesinde kaç gün görüneceği ve Duyurular listesinde kaç gün görüneceği. Kaydet'e bas."
  },
  {
    "id": "rozet-nedir",
    "module": "rozet",
    "roles": "ACPSKX",
    "title": "Rozetler nedir, nasıl kazanılır",
    "questions": [
      "rozet nasıl kazanılır",
      "rozetlerim",
      "rozet nedir",
      "ödüller",
      "rozet kazanma",
      "hangi rozetler var",
      "Rozetler nasıl kazanılır?"
    ],
    "answer": "Rozetler otomatik kazanılır; kimse elle vermez (Şampiyon rozeti hariç). Profil → \"Rozetlerim\"den kazandıklarını görürsün. Kazanım ölçütleri ve varsayılan eşikler (bronz / gümüş / altın):\n• Antrenman serisi: kesintisiz antrenman sayısı (5 / 10 / 20)\n• Grup fitness: tamamlanan grup fitness antrenmanı (5 / 10 / 20)\n• Bireysel fitness: bireysel çalışma yapılan gün (5 / 10 / 20)\n• Kulüp kıdemi: kulüpte geçen yıl (1 / 3 / 5)\n• Sosyal paylaşım: Sosyal Alan'da paylaşım sayısı (10 / 25 / 50)\n• Mağaza alışverişi: alınan ürün (5 / 10 / 20)\n• Mesajlaşma: mesajlaştığın farklı kişi (10 / 20 / 30)\n• Şampiyon: antrenörün/yöneticin tarafından elle verilir.\nRozet kazandığında bir sonraki girişinde kutlama penceresi çıkar."
  },
  {
    "id": "rozet-esik",
    "module": "rozet",
    "roles": "AK",
    "title": "Rozet eşiklerini değiştirme / Şampiyon rozeti verme",
    "questions": [
      "rozet ayarları",
      "rozet eşiği",
      "şampiyon rozeti ver",
      "rozet sayısını değiştir",
      "rozet kaç olsun",
      "Rozet eşiklerini nasıl değiştiririm?",
      "Şampiyon rozeti nasıl veririm?"
    ],
    "answer": "1. Profil → \"Rozet Ayarları\"na gir.\n2. Her rozet türü için üç eşik sayısını (bronz, gümüş, altın) yaz — sayılar küçükten büyüğe artmalı (ör. 5, 10, 20).\n3. Kaydet'e bas. \"Varsayılana Dön\" ile eski değerlere dönebilirsin.\nŞampiyon rozeti için aynı ekranda \"🏆 Rozeti Ver\"e dokunup bir sporcu seçersin; sporcu bir sonraki girişinde kutlanır. Kazanım hâlâ otomatiktir, sadece eşik sayıları kulübüne özel olur."
  },
  {
    "id": "mesaj-gonder",
    "module": "mesaj",
    "roles": "ACPSK",
    "title": "Mesaj gönderme / yeni sohbet",
    "questions": [
      "mesaj gönder",
      "yeni mesaj",
      "antrenöre mesaj",
      "mesajlaşma",
      "sohbet başlat",
      "mesaj nasıl atılır",
      "mesajlar nerede",
      "hocaya yazmak istiyorum",
      "antrenöre yazmak istiyorum",
      "hocaya mesaj",
      "Antrenöre nasıl mesaj atarım?",
      "Antrenörüme nasıl mesaj atarım?"
    ],
    "answer": "1. Alt menüden \"Mesajlar\"a gir.\n2. \"+ Yeni Mesaj\"a dokun; kişi listesinden birini seç (üstteki filtrelerle Antrenörler, Sporcular, Veliler'i ayırabilir, arama kutusuyla bulabilirsin).\n3. Mesajını yaz ve \"Gönder\"e dokun.\nMevcut sohbetlerin Mesajlar ekranında son mesaj ve okunmamış sayısıyla listelenir."
  },
  {
    "id": "mesaj-kimle",
    "module": "mesaj",
    "roles": "ACPSK",
    "title": "Kimlerle mesajlaşabilirim",
    "questions": [
      "kime mesaj atabilirim",
      "mesaj kısıtlaması",
      "veli veliye mesaj",
      "neden bu kişiye yazamıyorum",
      "mesajlaşabileceğim kimse yok",
      "mesaj kuralları",
      "Kimlerle mesajlaşabilirim?"
    ],
    "answer": "Mesajlaşma kuralları gizlilik için sınırlıdır:\n• Kulüp yöneticisi: kulübündeki herkesle ve süper adminle.\n• Antrenör/koordinatör: kulüp yöneticisi, aynı branştaki diğer antrenörler ve kendi gruplarındaki veli/sporcular.\n• Veli ve sporcu: çocuğunun/kendi grubunun antrenörleri ve branş koordinatörüyle. Sporcular ayrıca kendi gruplarındaki diğer sporcularla mesajlaşabilir (sadece ad soyad ve fotoğraf görünür).\n• Veliler birbirine yazamaz.\n\"Mesajlaşabileceğin kimse yok\" yazıyorsa henüz bir gruba atanmamışsın demektir."
  },
  {
    "id": "mesaj-okundu",
    "module": "mesaj",
    "roles": "ACPSK",
    "title": "Mesajı okuyup okumadığını anlama / okunmamış mesaj",
    "questions": [
      "okunmamış mesaj",
      "mesaj okundu mu",
      "mesaj rozeti",
      "yeni mesaj bildirimi"
    ],
    "answer": "Mesajlar sekmesinin üzerindeki sayı, toplam okunmamış mesajını gösterir. Bir sohbeti açtığında karşı taraftan gelen mesajlar okundu olarak işaretlenir."
  },
  {
    "id": "sosyal-genel",
    "module": "sosyal",
    "roles": "ACPSK",
    "title": "Sosyal Alan nedir",
    "questions": [
      "sosyal alan",
      "sosyal sekmesi",
      "fotoğraf akışı",
      "kulüp fotoğrafları",
      "sosyal ne işe yarar"
    ],
    "answer": "Sosyal Alan, kulüp içi fotoğraf/video akışıdır. Paylaşımlar günlere göre gruplanır. Fotoğraf ve videolar yüklendikten 2 hafta sonra otomatik olarak silinir. Sosyal paylaşım sayın rozet kazanmanı da sağlar."
  },
  {
    "id": "sosyal-paylas",
    "module": "sosyal",
    "roles": "ACSK",
    "title": "Fotoğraf/video paylaşma",
    "questions": [
      "fotoğraf paylaş",
      "video paylaş",
      "sosyal paylaşım",
      "nasıl paylaşım yaparım",
      "sosyal alana yükle",
      "Fotoğrafı nasıl paylaşırım?",
      "Sosyal alana fotoğraf nasıl paylaşırım?"
    ],
    "answer": "1. Alt menüden Sosyal'e gir ve \"+ Paylaş\"a dokun.\n2. \"+ Fotoğraf / Video Seç\" ile galeriden seç.\n3. Branşını seç ve istersen kısa bir not yaz.\n4. \"Paylaş\"a dokun.\nAntrenör ve yöneticilerin paylaşımı doğrudan yayınlanır. Sporcu paylaşımı ise branşın antrenörü/koordinatörü onayladıktan sonra akışta görünür (\"⏳ Onay Bekliyor\"). Veliler Sosyal Alan'da paylaşım yapamaz, yalnızca görüntüler."
  },
  {
    "id": "sosyal-onay",
    "module": "sosyal",
    "roles": "ACK",
    "title": "Sosyal paylaşımı onaylama / silme",
    "questions": [
      "paylaşımı onayla",
      "onay bekleyenler",
      "sosyal paylaşım sil",
      "paylaşım onayı",
      "paylaşımı kaldır",
      "Sporcu paylaşımlarını nasıl onaylarım?"
    ],
    "answer": "Sosyal ekranında \"Onay Bekleyenler\" sekmesinde sporcuların gönderdiği paylaşımlar listelenir. Bir paylaşıma dokunup \"✓ Onayla\" ile yayına alır ya da \"🗑 Sil\" ile kaldırırsın. Yayındaki herhangi bir paylaşımı da aynı şekilde silebilirsin."
  },
  {
    "id": "sosyal-onay-bekliyor",
    "module": "sosyal",
    "roles": "S",
    "title": "Paylaşımım neden görünmüyor (Onay Bekliyor)",
    "questions": [
      "paylaşımım görünmüyor",
      "onay bekliyor",
      "paylaşımım yayınlanmadı",
      "paylaşımım onaylanmadı",
      "Paylaşımım neden görünmüyor?"
    ],
    "answer": "Sporcu olarak yaptığın paylaşım, branşının antrenörü ya da koordinatörü onaylayana kadar \"⏳ Onay Bekliyor\" durumunda kalır ve akışta görünmez. Onaylanınca herkese görünür olur."
  },
  {
    "id": "sporcu-listesi",
    "module": "sporcu",
    "roles": "ACK",
    "title": "Sporcuları görüntüleme ve arama",
    "questions": [
      "sporcu listesi",
      "sporcuları görme",
      "sporcu ara",
      "sporcularım",
      "sporcu yönetimi nerede",
      "tüm sporcular",
      "sporcu bul",
      "Sporcularımı nerede görürüm?"
    ],
    "answer": "1. Ana Sayfa → \"Sporcu Yönetimi\" (antrenörde \"Sporcularım\") kutucuğuna dokun.\n2. Önce branşı, sonra (varsa) salonu ve grubu seç; grubun sporcuları listelenir.\n3. Tüm sporcuları tek listede görmek için \"📋 Tüm Sporcular\"a dokun; arama kutusundan ada göre, üstteki filtrelerden branş ve tipe (Tümü / Spor Okulu / 🏆 Müsabık) göre süzebilirsin.\nAntrenörler yalnızca kendilerine atanmış grupların sporcularını görür; koordinatör branşın tüm sporcularını, yönetici kulübün tamamını görür."
  },
  {
    "id": "sporcu-ekle",
    "module": "sporcu",
    "roles": "ACK",
    "title": "Yeni sporcu ekleme",
    "questions": [
      "yeni sporcu ekle",
      "sporcu kaydı",
      "sporcu nasıl eklenir",
      "sporcu oluştur",
      "öğrenci ekle",
      "üye ekle",
      "Yeni bir sporcu nasıl eklerim?",
      "Yeni sporcu nasıl eklerim?"
    ],
    "answer": "1. Ana Sayfa → Sporcu Yönetimi'ne gir ve \"+ Yeni Sporcu\"ya dokun.\n2. Zorunlu alanları doldur: Ad Soyad, Grup, Veli Adı Soyadı ve Veli Telefon.\n3. İstersen Doğum Tarihi, Cinsiyet, Boy, Kilo, Okul, Forma Bedeni, Forma Numarası, fotoğraf ve Durum bilgilerini de gir.\n4. İstersen aynı ekrandan Veli ve/veya Sporcu giriş hesabı aç ya da bağla (aşağıdaki \"hesap bağlama\" başlığına bak).\n5. İstersen Aylık Aidat ve İlk Ödeme Tarihi'ni girerek aidat planını da başlat.\n6. \"Kaydet\"e dokun.\nSporcu tipi (Spor Okulu/Müsabık) seçtiğin grubun tipine göre otomatik belirlenir."
  },
  {
    "id": "sporcu-duzenle-sil",
    "module": "sporcu",
    "roles": "ACK",
    "title": "Sporcu bilgisini düzenleme, pasife alma, silme",
    "questions": [
      "sporcu bilgisi düzenle",
      "sporcuyu sil",
      "sporcuyu pasif yap",
      "sporcu bilgilerini değiştir",
      "sporcu kaydı sil",
      "sporcu ayrıldı",
      "sporcunun boyunu kilosunu değiştir",
      "boy kilo değiştir",
      "sporcu boyunu güncelle"
    ],
    "answer": "• Düzenleme: Sporcuya dokun, profilindeki \"Düzenle\"ye bas, alanları güncelle ve Kaydet.\n• Pasife alma: Düzenleme ekranındaki \"Durum\" alanını Pasif yap; sporcu listede pasif görünür ve yoklamalarda çıkmaz.\n• Silme: Profildeki \"Sporcuyu Sil\"e dokun. DİKKAT: Sporcunun TÜM yoklama, aidat, sakatlık ve not geçmişi kalıcı olarak silinir ve geri alınamaz. Ayrılan sporcular için silmek yerine Pasif yapmak genellikle daha güvenlidir."
  },
  {
    "id": "sporcu-detay",
    "module": "sporcu",
    "roles": "ACK",
    "title": "Sporcu detay ekranında neler var",
    "questions": [
      "sporcu profili",
      "sporcu detayı",
      "devam yüzdesi",
      "profil tamamlanma",
      "sporcu profilinde ne görürüm",
      "son antrenmanlar sporcu"
    ],
    "answer": "Sporcunun profil ekranında şunlar bulunur:\n• Üstte fotoğraf, ad, grup, durum ve sporcu tipi; yaş, devam yüzdesi (ve müsabıksa forma numarası).\n• Hızlı düğmeler: Veli ara, Mesaj, Yoklama, Performans.\n• Profil tamamlanma çubuğu (eksik alan sayısı).\n• \"Bilgiler\" ve \"Veli\" sekmeleri: kategori, doğum tarihi, boy, kilo, okul, forma bedeni/numarası, veli adı ve telefonu.\n• \"Son 5 Antrenman\": grup, salon, katılım durumu ve tarih.\n• Koç Notları ve Sakatlık Geçmişi.\n• Düzenle, Ek Branşlar ve Gruplar, Kaydı Dondur, Sporcuyu Sil düğmeleri."
  },
  {
    "id": "sporcu-hesap-baglama",
    "module": "sporcu",
    "roles": "AK",
    "title": "Veli / sporcu giriş hesabı açma ve bağlama",
    "questions": [
      "veli hesabı aç",
      "sporcu hesabı aç",
      "hesap bağla",
      "veliye giriş ver",
      "veli giriş yapamıyor",
      "hesap oluştur",
      "geçici şifre ver",
      "bağlı hesap yok",
      "Veliye giriş hesabı nasıl açarım?"
    ],
    "answer": "Veli ya da sporcunun uygulamaya girebilmesi için bir giriş hesabı gerekir; sporcu kaydındaki veli adı/telefonu tek başına giriş vermez.\n1. Sporcu ekleme/düzenleme ekranında \"Veli Giriş Hesabı\" ve \"Sporcu Giriş Hesabı\" alanlarını bul.\n2. Yeni hesap için telefon numarası ya da kullanıcı adını gir ve hesabı oluştur; daha önce davet edilmiş bir hesabın varsa listeden seçip bağla.\n3. Ekranda çıkan geçici şifreyi KOPYALA ve kişiye (WhatsApp, SMS, telefonla) ilet — bu şifre bir daha gösterilmez.\n4. Kişi bu bilgiyle giriş yapar ve ilk girişte kendi şifresini belirler.\nBağlı hesap yoksa o veliye mesaj ya da uyarı bildirimi gönderilemez."
  },
  {
    "id": "sporcu-excel",
    "module": "sporcu",
    "roles": "ACK",
    "title": "Excel'den toplu sporcu aktarma",
    "questions": [
      "excelden aktar",
      "toplu sporcu ekle",
      "excel ile sporcu yükle",
      "sporcuları içe aktar",
      "şablon indir",
      "toplu kayıt",
      "Excel'den toplu sporcu nasıl aktarırım?"
    ],
    "answer": "1. Sporcu Yönetimi'nde \"Excelden Aktar\"a dokun.\n2. \"📥 Şablonu İndir\"e bas; şablondaki \"Adı Soyadı\" ve \"Branşı\" sütunlarını doldur.\n3. \"📤 Dosya Seç\" ile doldurduğun .xlsx dosyasını yükle; önizlemede eşleşmeyen branşlar uyarı olarak görünür.\n4. \"İçe Aktar\"a bas.\nBoy, kilo, veli bilgisi gibi diğer alanları sporcunun kendisi ya da yönetici sonradan tamamlar. Grup ataması içe aktarmada yapılmaz; koordinatör/yönetici Sporcu Yönetimi'nden sonradan atar."
  },
  {
    "id": "sporcu-tipi",
    "module": "sporcu",
    "roles": "AK",
    "title": "Sporcu tipi (Spor Okulu / Müsabık)",
    "questions": [
      "müsabık nedir",
      "spor okulu nedir",
      "sporcu tipi değiştir",
      "müsabık yap",
      "sporcu tipi neden değişmiyor",
      "forma numarası neden yok"
    ],
    "answer": "Sporcu tipi sporcuya tek tek değil GRUBA göre belirlenir: gruptaki herkes aynı tiptedir. Bir sporcunun tipini değiştirmek için Kulüp Yapısı → Gruplar'dan grubun tipini (Spor Okulu ya da 🏆 Müsabık) güncelle; gruptaki tüm sporcular otomatik güncellenir.\nMüsabık sporcular maç kadrolarına seçilebilir, Günlük Check-in doldurabilir ve forma numarası/bedeni alanları görünür. Spor Okulu sporcuları maç kadrosuna girmez."
  },
  {
    "id": "sporcu-ek-grup",
    "module": "sporcu",
    "roles": "AK",
    "title": "Sporcuyu ikinci bir branşa/gruba ekleme",
    "questions": [
      "ek branş",
      "ikinci grup",
      "birden fazla grupta",
      "başka gruba da ekle",
      "ek grup"
    ],
    "answer": "Sporcunun profilindeki \"Ek Branşlar ve Gruplar\"a dokun; sporcuyu ana grubuna ek olarak başka bir branş/gruba da bağlayabilirsin. Listede bu sporcular \"Ek Grup\" etiketiyle görünür."
  },
  {
    "id": "sakatlik",
    "module": "sporcu",
    "roles": "ACK",
    "title": "Sakatlık kaydı",
    "questions": [
      "sakatlık bildir",
      "sakatlık kaydı",
      "sporcu sakatlandı",
      "sakatlık geçmişi",
      "tahmini dönüş tarihi",
      "Sporcunun sakatlığını nasıl bildiririm?"
    ],
    "answer": "1. Sporcunun profilinde \"Sakatlık Geçmişi\"ne gir ve \"+ Bildir\"e dokun.\n2. Sakatlık Türü (ör. ayak bileği burkulması) ve Tarih'i gir; biliniyorsa Tahmini Dönüş Tarihi'ni ekle.\n3. Kaydet.\nGeçmiş kayıtlar ve tahmini dönüş tarihleri aynı ekranda listelenir."
  },
  {
    "id": "kocluk-notu",
    "module": "sporcu",
    "roles": "ACK",
    "title": "Sporcu için koç notu yazma",
    "questions": [
      "koç notu",
      "sporcu notu ekle",
      "not yaz sporcu",
      "antrenör notu",
      "Sporcu için koç notu nasıl yazarım?"
    ],
    "answer": "Sporcunun profilinde \"Koç Notları\"na gir, \"Yeni not yaz...\" alanına notunu yaz ve \"Ekle\"ye dokun. Bu notları sadece kulüp yöneticisi ve ilgili antrenörler görür; veli ve sporcu göremez."
  },
  {
    "id": "veli-ara",
    "module": "sporcu",
    "roles": "ACK",
    "title": "Veliyi arama / mesaj gönderme",
    "questions": [
      "veliyi ara",
      "veli telefonu",
      "veliye mesaj at",
      "veliye ulaş",
      "Veliye nasıl ulaşırım?"
    ],
    "answer": "Sporcunun profilinde \"Veli ara\" düğmesi kayıtlı veli telefonuna arama başlatır, \"Mesaj\" düğmesi uygulama içi sohbet açar. Sporcunun bağlı bir veli giriş hesabı yoksa mesaj gönderilemez (\"Veli hesabı yok\" uyarısı çıkar); önce hesabı bağla."
  },
  {
    "id": "cocugumun-profili",
    "module": "sporcum",
    "roles": "P",
    "title": "Çocuğumun profilini görme",
    "questions": [
      "çocuğumun profili",
      "sporcum ekranı",
      "çocuk seçimi",
      "Çocuğumun profilini nasıl görürüm?"
    ],
    "answer": "Ana Sayfa → \"Sporcum\"a dokun. Tek çocuğun varsa profili doğrudan açılır; birden fazla çocuğun varsa önce hangisini görmek istediğini seçersin.\n\"Bağlı bir sporcu bulunamadı\" görüyorsan çocuğun hesabına henüz bağlanmamışsın demektir; kulüp yöneticine haber ver, veli hesabını sporcuya o bağlar."
  },
  {
    "id": "sporcu-takibi",
    "module": "sporcum",
    "roles": "PS",
    "title": "\"Sporcu Takibi\" (gelişimini takip et)",
    "questions": [
      "sporcu takibi",
      "gelişimi takip et",
      "ölçümlerim",
      "günlük durum",
      "egzersiz geçmişi",
      "Gelişimimi nereden takip ederim?"
    ],
    "answer": "Sporcu profilindeki \"Sporcu Takibi\" bölümünden gelişimi görüntülersin:\n• Bireysel Programım — kendi yazdığın fitness programı (sporcu hesabında)\n• Ölçümler — hız, sıçrama, kuvvet ve dayanıklılık testi sonuçların ve önceki ölçüme göre değişim\n• Günlük Durum — Günlük Check-in geçmişin (uyku, enerji, yorgunluk)\n• Grup Programı — antrenörünün yayınladığı çalışma programı\n• Egzersiz Geçmişi — fitness/kuvvet antrenmanı geçmişi\n• Kayıt Dondurma — velinin başlatabildiği geçici dondurma\nBu bölümdeki ekranlar velilerde yalnızca görüntülemedir."
  },
  {
    "id": "yoklama-durumu",
    "module": "sporcum",
    "roles": "PS",
    "title": "Yoklama / katılım durumunu görme",
    "questions": [
      "yoklama durumu",
      "katılım durumu",
      "kaç antrenmana katıldı",
      "devamsızlık",
      "antrenmana geldi mi",
      "katılım yüzdesi",
      "Çocuğum antrenmana geldi mi nasıl görürüm?",
      "Kaç antrenmana katıldığımı nasıl görürüm?"
    ],
    "answer": "Ana Sayfa → \"Yoklama Durumu\" (sporcuda \"Antrenman Katılım Durumu\") ekranında her antrenman için Katıldı / Katılmadı durumunu ve toplam \"X/Y antrenmana katıldı\" bilgisini görürsün. Henüz yoklama girilmemişse \"Henüz yoklama kaydı yok\" yazar."
  },
  {
    "id": "takvim-veli-sporcu",
    "module": "sporcum",
    "roles": "PS",
    "title": "Antrenman ve müsabaka takvimini görme",
    "questions": [
      "takvim",
      "antrenman saatleri",
      "antrenman ne zaman",
      "müsabaka ne zaman",
      "haftalık program",
      "ders programı",
      "Antrenman saatlerini nereden görürüm?",
      "Antrenman ve maç takvimini nasıl görürüm?"
    ],
    "answer": "Ana Sayfa → \"Antrenman ve Müsabaka Takvimi\" (sporcuda \"Takvim\") ekranında aylık takvim açılır. Antrenman olan günlerde sarı, müsabaka olan günlerde kırmızı/mercan işaret görünür. Bir güne dokununca o günün antrenman/müsabakaları listelenir; birine dokunarak konuyu, program notlarını ve katılım durumunu görürsün. \"Bu gün antrenman yok\" yazıyorsa o gün için planlanmış bir şey yoktur."
  },
  {
    "id": "takvime-ekle-kullanici",
    "module": "sporcum",
    "roles": "PSACK",
    "title": "Antrenmanları telefonumun takvimine ekleme",
    "questions": [
      "takvimime ekle",
      "telefon takvimi",
      "takvime aktar",
      "takvim senkron",
      "antrenmanı telefonuma ekle",
      "Antrenmanları telefon takvimime nasıl eklerim?"
    ],
    "answer": "Takvim ekranındaki \"📅 Takvimime Ekle\" (yönetici/antrenörde \"📲 Takvimime Ekle\") düğmesine dokun. İlk seferde telefonunun takvimine erişim izni istenir; izin verince antrenman ve müsabakalar telefon takvimine eklenir. Bu, hatırlatıcılarını kullanmaz, sadece takvimine etkinlik yazar."
  },
  {
    "id": "gelemeyecegim",
    "module": "sporcum",
    "roles": "PS",
    "title": "\"Antrenmana gelemeyeceğim\" bildirimi",
    "questions": [
      "antrenmana gelemeyeceğim",
      "mazeret bildir",
      "izin bildirimi",
      "gelemeyeceğini antrenöre bildir",
      "bildirimi iptal et",
      "hasta olduğu için gelemeyecek",
      "Çocuğum antrenmana gelemeyecekse nasıl bildiririm?",
      "Antrenmana gelemeyeceğimi nasıl bildiririm?"
    ],
    "answer": "1. Takvimden ilgili antrenmanın detayına gir.\n2. \"Bu Antrenmana Katılamayacak mısın?\" (veli hesabında \"Çocuğun Bu Antrenmana Katılamayacak mı?\") bölümüne sebebi yaz (ör. hastayım, okul sınavım var).\n3. Gönder.\nAntrenörüne sebebiyle birlikte bildirim gider. Vazgeçersen aynı yerdeki \"Bildirimi İptal Et\" ile geri alabilirsin. Sebep yazmadan gönderilmez. Küçük sporcuların telefonu olmayabileceği için bunu veli de yapabilir."
  },
  {
    "id": "antrenman-detay-sporcu",
    "module": "sporcum",
    "roles": "PS",
    "title": "Antrenman detayında neler görünür",
    "questions": [
      "antrenman detayı",
      "antrenman konusu",
      "program notları",
      "antrenmana tıkla"
    ],
    "answer": "Takvimden bir antrenmana dokunduğunda: antrenmanın konusu, antrenörün program notları, senin katılım durumun, \"gelemeyeceğim\" bildirimi ve (sporcuysan) Algılanan Zorluk Derecesi kutusu görünür."
  },
  {
    "id": "takvim-yonetici",
    "module": "takvim",
    "roles": "ACK",
    "title": "Takvimi kullanma (antrenman/müsabaka)",
    "questions": [
      "takvim yönetici",
      "antrenman takvimi",
      "takvim filtre",
      "takvimde nasıl gezinirim",
      "takvim renkleri",
      "gün detayı"
    ],
    "answer": "Ana Sayfa → \"Takvim\" (antrenörde \"Antrenman Planla\") aylık takvimi açar. Sarı noktalar antrenmanı, kırmızı noktalar müsabakayı gösterir. Bir güne dokununca o günün etkinlikleri altta listelenir. Üstteki filtrelerle Tümü / Antrenman / Müsabaka ve branş/grup seçebilirsin. \"🏆 Sonuçlar\" biten müsabaka sonuçlarını, \"📲 Takvimime Ekle\" telefon takvimine aktarmayı sağlar."
  },
  {
    "id": "antrenman-ekle",
    "module": "takvim",
    "roles": "ACK",
    "title": "Tek seferlik antrenman oluşturma",
    "questions": [
      "antrenman ekle",
      "antrenman planla",
      "günlük antrenman planlama",
      "antrenman oluştur",
      "yeni antrenman",
      "antrenman nasıl eklenir",
      "Tek seferlik antrenman nasıl eklerim?",
      "Antrenman nasıl eklerim?"
    ],
    "answer": "1. Takvim'de antrenman eklemek istediğin güne dokun ve \"🗓 Antrenman Ekle\"yi seç (Antrenman Planla kutucuğunda \"🗓 Günlük Antrenman Planlama\").\n2. İstersen önce Salon'u seç; grup listesi o salona atanmış gruplarla sınırlanır.\n3. Grup, Tarih, Başlangıç ve Bitiş saatini (SS:DD biçiminde, ör. 18:00) gir. İstersen Konu ve Notlar ekle.\n4. Kaydet.\nSaat geçersizse (ör. 25:70) uyarı çıkar. Grubun veli ve sporcularına antrenman bildirimi gider."
  },
  {
    "id": "haftalik-plan",
    "module": "takvim",
    "roles": "ACK",
    "title": "Haftalık antrenman planı oluşturma",
    "questions": [
      "haftalık antrenman planlama",
      "haftalık program",
      "sabit haftalık program",
      "planı gönder",
      "toplu antrenman oluştur",
      "her hafta aynı gün antrenman",
      "Haftalık antrenman planı nasıl oluştururum?"
    ],
    "answer": "Aynı gün ve saatte tekrar eden antrenmanları tek seferde oluşturmak için:\n1. Antrenman Planla/Takvim'de \"📅 Haftalık Antrenman Planlama\"yı seç.\n2. Listede yalnızca \"Sabit Haftalık Program\"ı açık gruplar görünür (bu ayar Kulüp Yapısı → Gruplar → grup ayarlarından açılır).\n3. Gruba dokunup \"+ Gün Ekle\" ile gün, başlangıç/bitiş saati ve salonu ekle.\n4. \"Kaç haftalık oluşturulsun?\" değerini seç (varsayılan 4, en fazla 20).\n5. \"📤 Planı Gönder\"e bas.\nSeçtiğin hafta sayısı kadar antrenman kaydı otomatik oluşur. Aynı salon ve saatte çakışan antrenmanlar atlanır ve sonuçta listelenir."
  },
  {
    "id": "antrenman-sil",
    "module": "takvim",
    "roles": "ACK",
    "title": "Antrenmanı silme veya düzenleme",
    "questions": [
      "antrenmanı sil",
      "antrenman düzenle",
      "antrenman saatini değiştir",
      "yanlış antrenman oluşturdum",
      "antrenman iptal"
    ],
    "answer": "Takvimde o günü açıp antrenmana dokunarak formunu aç; saat, salon, konu ve notları düzenleyip Kaydet'le. Tamamen kaldırmak için formdaki \"Antrenmanı Sil\"e dokun ya da takvimde (geçmiş) antrenmanı silme seçeneğini kullan. DİKKAT: Silinen antrenmanın yoklama ve fotoğraf kayıtları da silinir, geri alınamaz."
  },
  {
    "id": "yoklama-alma",
    "module": "takvim",
    "roles": "ACK",
    "title": "Yoklama alma (Günün Programı)",
    "questions": [
      "yoklama al",
      "yoklama nasıl alınır",
      "günün programı",
      "sporcuları işaretle",
      "geldi gelmedi işaretle",
      "hepsini geldi işaretle",
      "yoklamayı kaydet",
      "Yoklama nasıl alınır?"
    ],
    "answer": "1. Ana Sayfa → \"Günün Programı\"na dokun; bugün antrenmanı olan gruplar listelenir.\n2. Grubu seç.\n3. Her sporcu için Geldi / Gelmedi / İzinli durumunu seç. Herkes geldiyse \"✓ Hepsini Geldi İşaretle\" işini hızlandırır.\n4. \"Yoklamayı Kaydet\"e dokun.\n5. Antrenman bitince \"Antrenmanı Tamamlandı Olarak İşaretle\"ye bas.\nYoklama, antrenman başlamadan 15 dakika önce açılır ve başladıktan 15 dakika sonra kapanır (bu süreleri yönetici ayarlayabilir). Zamanı gelmediyse \"Henüz zamanı değil\" uyarısı çıkar."
  },
  {
    "id": "yoklama-zaman-penceresi",
    "module": "takvim",
    "roles": "ACK",
    "title": "Yoklama neden açılmıyor / \"Henüz zamanı değil\"",
    "questions": [
      "yoklama açılmıyor",
      "henüz zamanı değil",
      "yoklama kapalı",
      "yoklama süresi",
      "yoklama penceresi",
      "yoklama zamanı geçti",
      "yoklama ekranı kilitli",
      "yoklama ekranı açılmıyor",
      "Yoklama neden açılmıyor?"
    ],
    "answer": "Yoklama ekranı sadece belirli bir zaman aralığında açıktır: antrenman başlangıcından (varsayılan) 15 dakika ÖNCE açılır ve başlangıçtan 15 dakika SONRA kapanır. \"Antrenmanı Tamamlandı\" işaretleme ise bitişe 10 dakika kala açılır. Antrenman bitişinden 15 dakika sonra hâlâ işaretlenmemişse uygulama açıldığında otomatik \"Tamamlandı\" yapılır. Bu süreler kulübe göre değiştirilebilir: Profil → Kulüp Ayarları → Gelişmiş Ayarlar → Yoklama & Antrenman (yönetici)."
  },
  {
    "id": "yoklama-durum-cesitleri",
    "module": "takvim",
    "roles": "ACK",
    "title": "Yoklama durumları ve mazeretler",
    "questions": [
      "geç kaldı",
      "raporlu",
      "izinli",
      "mazeret",
      "gelemeyeceğim bildirimi gördüm",
      "yoklama durumları",
      "oturum listesi",
      "Geç kaldı ve raporlu ne demek?"
    ],
    "answer": "Takvimden bir antrenmanı açtığında sporcu listesi (Oturum Listesi) şu durumlarla işaretlenebilir: Geldi, Gelmedi, Geç Kaldı, Raporlu, İzinli. Veli/sporcu \"gelemeyeceğim\" bildirimi yaptıysa bildirimi ve mazeret sebebini bu ekranda görürsün; izinli sayıp saymayacağına sen karar verirsin. \"X/Y yoklaması girilmiş\" satırı kaç sporcunun işaretlendiğini gösterir."
  },
  {
    "id": "antrenman-ayarlari",
    "module": "takvim",
    "roles": "A",
    "title": "Yoklama pencerelerini ayarlama",
    "questions": [
      "yoklama süresini değiştir",
      "otomatik tamamla",
      "yoklama ayarları",
      "tamamlandı işaretleme süresi",
      "yoklama dakika ayarı",
      "Yoklama süresini nasıl değiştiririm?"
    ],
    "answer": "Profil → Kulüp Ayarları → Gelişmiş Ayarlar → \"Yoklama & Antrenman\"a gir ve dört süreyi düzenle:\n• Günün Programı antrenmandan kaç dakika önce açılsın\n• Antrenman başladıktan kaç dakika sonra kapansın\n• Antrenmanı Tamamlandı işaretleme bitişe kaç dakika kala açılsın\n• Bitişten kaç dakika sonra otomatik tamamlansın\nKaydet'e basınca tüm uygulama yeni değerleri kullanır."
  },
  {
    "id": "musabaka-ekle",
    "module": "musabaka",
    "roles": "ACK",
    "title": "Müsabaka (maç) ekleme ve kadro seçme",
    "questions": [
      "müsabaka ekle",
      "maç ekle",
      "maç oluştur",
      "kadro seç",
      "maç kadrosu",
      "rakip takım",
      "yeni maç",
      "Maç kadrosunu nasıl seçerim?"
    ],
    "answer": "1. Takvim'de maçın günü'ne dokun ve \"🏆 Müsabaka Ekle\"yi seç.\n2. Grup, Rakip Takım, Tarih ve Saat'i gir; istersen Konum ve Açıklama ekle.\n3. Kaydet.\n4. Müsabaka kaydedildikten sonra açılan kadro bölümünden maça çıkacak sporcuları seç.\nKadroya sadece Müsabık tipindeki sporcular seçilebilir; Spor Okulu sporcuları maç kadrosuna girmez. Bir sporcu aynı güne iki maça eklenmek istenirse uyarı çıkar. Kaydedince grubun velilerine, sporcularına ve antrenörlerine bildirim gider."
  },
  {
    "id": "musabaka-sonuc",
    "module": "musabaka",
    "roles": "ACK",
    "title": "Müsabaka sonucu girme",
    "questions": [
      "maç sonucu gir",
      "skor gir",
      "sonuç kaydet",
      "müsabaka sonucu",
      "bireysel sonuç",
      "sonuç açıklaması",
      "Maç sonucunu nasıl girerim?"
    ],
    "answer": "1. Takvimde biten maça dokun ve sonuç ekranını aç.\n2. Bizim Skor ve Rakip Skor'u gir; istersen Sonuç Açıklaması ekle. Bireysel branşlarda (Yüzme, Atletizm vb.) skor yerine sonuç açıklaması yazılır (ör. \"Ali 1., Ayşe 3. oldu\").\n3. \"Sonucu Kaydet\"e dokun.\nSonuç kaydedilince grubun velilerine, antrenörlerine, koordinatörüne ve sporcularına otomatik bildirim gider."
  },
  {
    "id": "musabaka-sonuclari",
    "module": "musabaka",
    "roles": "ACKPS",
    "title": "Biten müsabaka sonuçlarını görme",
    "questions": [
      "maç sonuçları",
      "sonuçlar",
      "skorlar",
      "geçmiş maçlar",
      "maç sonucunu görme"
    ],
    "answer": "Takvim ekranındaki \"🏆 Sonuçlar\" düğmesi biten müsabakaları ve skorlarını listeler; branşa göre filtreleyebilirsin. Veli ve sporcular sonucu bildirimden ve takvimden görür."
  },
  {
    "id": "musabaka-sil",
    "module": "musabaka",
    "roles": "ACK",
    "title": "Müsabakayı silme / düzenleme",
    "questions": [
      "maçı sil",
      "müsabakayı iptal et",
      "maç bilgisini değiştir",
      "maç saatini düzenle"
    ],
    "answer": "Takvimde maça dokunup form ekranını aç; bilgileri düzenleyip Kaydet'le ya da alttaki \"Müsabakayı Sil\"e dokunup onayla. Silme geri alınamaz."
  },
  {
    "id": "kayit-dondurma",
    "module": "sporcu",
    "roles": "ACKP",
    "title": "Kayıt dondurma",
    "questions": [
      "kayıt dondur",
      "üyeliği dondur",
      "aidat dondur",
      "geçici ara ver",
      "sporcu kaydını dondurmak",
      "dondurma süresi",
      "Sporcunun kaydını nasıl dondururum?",
      "Kaydı geçici olarak nasıl dondururum?"
    ],
    "answer": "Sporcunun kaydını geçici olarak dondurmak için:\n• Veli: Sporcu profilindeki Sporcu Takibi bölümünden \"Kayıt Dondurma\"ya gir.\n• Yönetici/antrenör: Sporcu profilindeki \"Kaydı Dondur\"a dokun.\n1. Başlangıç ve Bitiş tarihini seç. En az 1 ay, en fazla 3 ay dondurulabilir.\n2. İstersen not (sebep) yaz.\n3. \"Dondurmayı Kaydet\"e dokun.\nKayıt yapılınca admin, grubun antrenörü ve veli/sporcu hesabına bildirim gider. Şu an dondurulmuşsa ekranın üstünde \"🧊 Şu An Dondurulmuş\" görünür; geçmiş dondurmalar alt listede durur ve silinebilir. Kulüp bu özelliği kapatmışsa \"Kayıt Dondurma\" hiçbir kullanıcıda görünmez."
  },
  {
    "id": "kayit-dondurma-ayar",
    "module": "ayar",
    "roles": "A",
    "title": "Kayıt Dondurma'yı kulüpte açma/kapatma",
    "questions": [
      "kayıt dondurma kapat",
      "dondurma özelliği",
      "kayıt dondurma ayarı",
      "dondurmayı devre dışı bırak",
      "Kayıt dondurma özelliğini nasıl kapatırım?"
    ],
    "answer": "Profil → Kulüp Ayarları → Gelişmiş Ayarlar → \"Kayıt Dondurma\"ya gir ve anahtarla aç ya da kapat; anlık kaydedilir. Kapatınca yeni dondurma başlatılamaz ve \"Kayıt Dondurma\" kutucukları hiçbir kullanıcıda görünmez; daha önce oluşturulmuş dondurmalar geçerliliğini korur."
  },
  {
    "id": "checkin-doldurma",
    "module": "takip",
    "roles": "S",
    "title": "Günlük Check-in doldurma",
    "questions": [
      "günlük check-in",
      "wellness",
      "uyku kaydı",
      "enerji seviyesi",
      "ruh hali",
      "check-in nasıl doldurulur",
      "check-in yapamıyorum",
      "check-in pasif",
      "Günlük check-in nasıl doldurulur?"
    ],
    "answer": "1. Ana Sayfa → \"Günlük Check-in\"e dokun.\n2. Uyku süresini (saat), uyku kalitesini, kas ağrısı/yorgunluğu, enerji seviyeni ve stres/ruh hâlini (1-5) seç. İstersen dinlenme kalp atış hızını da yaz.\n3. \"Kaydet\"e dokun.\nBu resmi bir test değil, kişisel bir günlüktür; antrenörün trendleri görüp erken uyarı alması için her gün 30 saniyede doldurman yeterli.\nNotlar: Check-in yalnızca Müsabık sporcular içindir. Kulübün belirlediği saat aralığında doldurulabilir (varsayılan 06:00-12:00); aralık dışında form pasiftir, sadece geçmiş kayıtlarını görürsün. Kulüp bu özelliği kapattıysa ekran \"Günlük Check-in Kapalı\" der."
  },
  {
    "id": "checkin-takip",
    "module": "takip",
    "roles": "ACK",
    "title": "Sporcuların check-in durumunu izleme",
    "questions": [
      "check-in kimler doldurdu",
      "wellness takibi",
      "sporcu uyku takibi",
      "kim check-in yaptı",
      "yorgunluk takibi",
      "erken uyarı",
      "Sporcuların check-in durumunu nasıl görürüm?"
    ],
    "answer": "Fitness (Performans) bölümündeki \"Wellness Check-in\"e gir. Seçtiğin tarihte hangi müsabık sporcuların check-in yaptığını (ve yapmadığını) görürsün; branş, grup ve ada göre filtreleyebilirsin. Bir sporcuya dokununca uyku süresi, uyku kalitesi, yorgunluk, enerji, ruh hâli ve varsa kalp atış hızı (bpm) kayıtlarını görürsün."
  },
  {
    "id": "checkin-ayar",
    "module": "takip",
    "roles": "A",
    "title": "Günlük Check-in'i açma/kapatma ve saatini ayarlama",
    "questions": [
      "check-in kapat",
      "check-in saati",
      "check-in ayarı",
      "wellness ayarı",
      "check-in açılış saati",
      "check-in kapanış saati",
      "Günlük check-in'i nasıl kapatırım?"
    ],
    "answer": "Profil → Kulüp Ayarları → Gelişmiş Ayarlar → \"Günlük Check-in\"e gir.\n• Anahtarla özelliği tamamen açıp kapatırsın (varsayılan: açık).\n• Açıkken \"Kaç saatte açılsın (0-23)\" ve \"Kaç saatte kapansın (1-24)\" değerlerini yazarsın (varsayılan 06:00-12:00).\n• Kaydet'e bas.\nKapatırsan Ana Sayfa'daki check-in kutucuğu kaybolur, ekran açılmaz ve günlük hatırlatma bildirimi gönderilmez."
  },
  {
    "id": "rpe-doldurma",
    "module": "takip",
    "roles": "S",
    "title": "Antrenman zorluk derecesini (RPE) girme",
    "questions": [
      "zorluk derecesi",
      "algılanan zorluk",
      "rpe",
      "antrenman nasıl geçti",
      "antrenman zorluğu puanla",
      "zorluk bildirimi",
      "Antrenman zorluk derecesini nasıl girerim?"
    ],
    "answer": "Antrenman bittiği anda sana \"Antrenman Nasıl Geçti?\" bildirimi gider.\n1. Bildirime dokun (ya da Takvim → o antrenmanın detayına gir).\n2. \"Algılanan Zorluk Derecesi\" kutusundan 1-10 arası puanla: \"Bu antrenman sana ne kadar zor geldi?\"\nDeğerlendirme antrenman bittiği anda açılır ve kulübün belirlediği süre (varsayılan 60 dakika) boyunca açık kalır; süre dolunca artık giriş yapılamaz. Antrenmana \"gelmedi\" olarak işaretlendiysen bu kutu görünmez. Zorluk derecesini yalnızca sporcu hesabı girebilir, veli giremez. Kulüp bu özelliği kapatmışsa bildirim gitmez ve kutu görünmez."
  },
  {
    "id": "rpe-ayar",
    "module": "takip",
    "roles": "A",
    "title": "Zorluk derecesini açma/kapatma ve süresini ayarlama",
    "questions": [
      "zorluk derecesi kapat",
      "rpe ayarı",
      "zorluk süresi",
      "zorluk bildirimi kapat",
      "antrenman zorluk derecesi ayarı",
      "rpe kaç dakika açık",
      "Zorluk derecesi süresini nasıl ayarlarım?"
    ],
    "answer": "Profil → Kulüp Ayarları → Gelişmiş Ayarlar → \"Antrenman Zorluk Derecesi\"ne gir (bu, Günlük Check-in'den ayrı bir kutudur).\n• Anahtarla özelliği açıp kapatırsın (varsayılan: açık).\n• Açıkken \"Antrenman bitiminden sonra kaç dakika açık kalsın\" değerini yazarsın (5-720 dakika, varsayılan 60).\n• Kaydet'e bas.\nKapatırsan sporculara bildirim gitmez ve antrenman detayındaki değerlendirme kutusu görünmez."
  },
  {
    "id": "antrenor-liste",
    "module": "antrenor",
    "roles": "AK",
    "title": "Antrenörleri görüntüleme ve arama",
    "questions": [
      "antrenör listesi",
      "antrenörler nerede",
      "antrenör ara",
      "antrenör atamaları",
      "kim koordinatör",
      "salon yetkilisi kim"
    ],
    "answer": "Ana Sayfa → \"Antrenörler\" kutucuğu (ekranda \"Antrenör Atamaları\") kadronu listeler. Üstteki filtrelerden branşa ve salona göre süzebilir, arama kutusundan ada göre bulabilirsin. Kartlarda \"★ KOORDİNATÖR\" ve \"🏟 SALON YETKİLİSİ\" etiketleri, branş/kademe ve sorumlu olduğu gruplar görünür. Koordinatör yalnızca kendi branşının kadrosunu görür."
  },
  {
    "id": "antrenor-ekle",
    "module": "antrenor",
    "roles": "A",
    "title": "Yeni antrenör hesabı açma",
    "questions": [
      "antrenör ekle",
      "yeni antrenör",
      "antrenöre hesap aç",
      "antrenör kaydı",
      "antrenör nasıl eklenir",
      "antrenör oluştur"
    ],
    "answer": "1. Ana Sayfa → Antrenörler'e gir ve yeni hesap ekleme düğmesine dokun.\n2. Antrenörün telefon numarasını, kullanıcı adını ya da e-postasını gir ve rolü \"Antrenör\" seç.\n3. \"Hesap Oluştur\"a dokun; ekranda bir geçici şifre çıkar.\n4. Geçici şifreyi KOPYALA ve antrenöre WhatsApp/SMS ile ilet — bir daha görüntülenmez.\nAntrenör bu bilgiyle giriş yapar ve ilk girişte kendi şifresini belirler. Ardından profilini açıp bilgilerini, branşını ve gruplarını tamamlarsın."
  },
  {
    "id": "antrenor-duzenle",
    "module": "antrenor",
    "roles": "AK",
    "title": "Antrenör bilgilerini düzenleme / kulüpten çıkarma",
    "questions": [
      "antrenör bilgisi düzenle",
      "antrenörü kulüpten çıkar",
      "antrenör ayrıldı",
      "antrenör profili",
      "antrenör telefonu"
    ],
    "answer": "Antrenörler listesinden kişiye dokun; profilinde \"Düzenle\" ile ad soyad, e-posta, telefon, doğum tarihi, öğrenim, cinsiyet, adres, acil durum kişisi ve fotoğrafı güncelleyebilirsin.\nAntrenör ayrılırsa düzenleme ekranındaki \"Antrenörü Kulüpten Çıkar\"ı kullan: tüm grup atamaları kaldırılır ve giriş kapanır; hesap tamamen silinmez, istersen ileride tekrar aktifleştirebilirsin."
  },
  {
    "id": "antrenor-gruba-ata",
    "module": "antrenor",
    "roles": "AK",
    "title": "Antrenörü gruba atama (baş / yardımcı)",
    "questions": [
      "antrenör ata",
      "gruba antrenör ata",
      "baş antrenör",
      "yardımcı antrenör",
      "antrenör görevlendir",
      "grup antrenörü değiştir",
      "Antrenörü gruba nasıl atarım?"
    ],
    "answer": "Antrenörler ekranındaki genel görünümde tüm gruplar ve görevli antrenörleri listelenir; bir gruba dokunarak ata ya da değiştir. Her grubun bir \"Baş Antrenör\"ü ve sınırlı sayıda \"Yardımcı\"sı olabilir (varsayılan en fazla 2; Gelişmiş Ayarlar → Antrenör Yönetimi'nden değişir). Bir antrenör yalnızca uzmanlığı (branşı) olan branşların gruplarına atanabilir; bu yüzden önce antrenörün profilinde \"Branş ve Belge İşlemleri\"nden branşını ekle."
  },
  {
    "id": "antrenor-brans-kademe",
    "module": "antrenor",
    "roles": "AK",
    "title": "Antrenörün branşı, kademesi ve belge bilgisi",
    "questions": [
      "antrenör branşı",
      "kademe",
      "antrenör belge numarası",
      "deneyim yılı",
      "kulübe başlama tarihi",
      "branş ata antrenör"
    ],
    "answer": "Antrenör profilinde \"Branş ve Belge İşlemleri\"ne gir. Burada antrenörün uzman olduğu her branşı ayrı ayrı ekler, her biri için Kademe, Belge/lisans numarası, Deneyim yılı ve Kulübe başlama tarihini girersin. Bir antrenör birden fazla branşta uzman olabilir; görevlendirme yalnızca uzman olduğu branşların gruplarında yapılabilir."
  },
  {
    "id": "koordinator-ata",
    "module": "antrenor",
    "roles": "A",
    "title": "Branş koordinatörü atama",
    "questions": [
      "koordinatör ata",
      "branş koordinatörü nasıl olunur",
      "koordinatör değiştir",
      "koordinatör yetkisi",
      "koordinatör nedir",
      "Branş koordinatörü nasıl atanır?"
    ],
    "answer": "1. Antrenörün profilinden \"Branş ve Belge İşlemleri\"ne gir.\n2. İlgili branşta \"Branş Koordinatörlüğü\" bölümünü aç ve antrenörü koordinatör yap. O branşın zaten bir koordinatörü varsa \"Koordinatörü değiştir\" onayı çıkar.\nKoordinatör, kendi branşında yönetici gibi çalışır: sadece kendi grupları değil branşın TÜM sporcularını, antrenörlerini, gruplarını, salonlarını ve aidatlarını görür/yönetir; duyuru ve rozet ayarı yapabilir. Ana Sayfası otomatik o branşa açılır ve branşını değiştiremez."
  },
  {
    "id": "salon-yetkilisi",
    "module": "antrenor",
    "roles": "AK",
    "title": "Salon yetkilisi atama",
    "questions": [
      "salon yetkilisi",
      "salon yetkisi",
      "salon sorumlusu",
      "salon adına antrenman planla",
      "Salon yetkilisi nasıl atanır?"
    ],
    "answer": "Antrenör profilindeki \"Salon Yetkisi\" bölümünde ilgili salonları işaretle. İşaretlenen salonlar için o antrenör, kendi branşındaki tüm gruplar adına antrenman planı oluşturabilir. Antrenör kartında \"🏟 SALON YETKİLİSİ\" etiketi görünür."
  },
  {
    "id": "antrenor-izin",
    "module": "antrenor",
    "roles": "AK",
    "title": "Antrenör izni ekleme",
    "questions": [
      "antrenör izni",
      "izin ekle",
      "yıllık izin",
      "antrenör izinli",
      "izin kaydı"
    ],
    "answer": "Antrenör profilinde \"İzin İşlemleri\"ne gir, Başlangıç ve Bitiş tarihini seç, istersen Neden yaz (ör. Yıllık izin) ve \"+ İzin Ekle\"ye dokun. Geçmiş izinler aynı ekranda listelenir ve silinebilir. Bitiş tarihi başlangıçtan önce olamaz."
  },
  {
    "id": "antrenor-odeme-plani",
    "module": "finans",
    "roles": "A",
    "title": "Antrenör maaş/ödeme planı oluşturma",
    "questions": [
      "antrenör maaşı",
      "antrenör ödemesi",
      "ödeme planı antrenör",
      "antrenöre maaş tanımla",
      "aylık antrenör ücreti",
      "Antrenör maaş planı nasıl oluşturulur?"
    ],
    "answer": "1. Ana Sayfa → Finans → \"Antrenör Ödemeleri\"ne gir.\n2. \"+ Ödeme Planı\"na dokun.\n3. Antrenörü seç, Aylık Tutar'ı (₺) ve ayın kaçında ödeneceğini (1-31) gir.\n4. Kaydet.\nİlk ödeme kaydı bir sonraki ay için oluşturulur (bu ay için kayıt açılmaz); sonraki her ay kaydı otomatik eklenmeye devam eder. Ödemeler listesinde bir kayda dokunarak \"Ödendi\" olarak işaretleyebilir, geri \"Bekliyor\"a alabilir ya da silebilirsin."
  },
  {
    "id": "antrenor-odeme-filtre",
    "module": "finans",
    "roles": "A",
    "title": "Antrenör ödemelerini antrenöre göre filtreleme",
    "questions": [
      "antrenör seç ödemeler",
      "tek antrenörün ödemeleri",
      "antrenör ödeme toplamı",
      "antrenör bazlı ödeme"
    ],
    "answer": "Antrenör Ödemeleri ekranında üstteki \"Antrenör\" açılır listesine dokun ve bir antrenör seç. Liste ve yukarıdaki Bekleyen/Ödenen toplamlar yalnızca o kişiyi gösterir; \"Tüm Antrenörler\" ile tekrar hepsini görürsün. Durum filtresi (Tümü / Bekleyen / Ödendi) seçtiğin antrenör üzerinde çalışır."
  },
  {
    "id": "antrenor-avans",
    "module": "finans",
    "roles": "A",
    "title": "Antrenöre avans verme",
    "questions": [
      "avans ver",
      "antrenör avansı",
      "avans kesintisi",
      "maaş avansı",
      "avans nasıl kesilir",
      "Antrenöre avans nasıl veririm?"
    ],
    "answer": "1. Antrenör Ödemeleri'nde \"+ Avans Ver\"e dokun.\n2. Antrenörü seç; Avans Tutarı (₺) ve Tarih gir; istersen not yaz (ör. Nakit elden verildi).\n3. \"Avansı Kaydet\"e bas.\nAvans tutarı otomatik olarak antrenörün sıradaki (en yakın vadeli) bekleyen ödemesinden düşülür; ekranda kesinti sonrası ödeme tutarını görürsün. Antrenörün bekleyen ödemesi yoksa avans kesintisiz kaydedilir."
  },
  {
    "id": "yapi-genel",
    "module": "yapi",
    "roles": "AK",
    "title": "Kulüp Yapısı nedir (branş, grup, salon)",
    "questions": [
      "kulüp yapısı",
      "branş grup salon",
      "kulübü nasıl kurarım",
      "yapı nasıl kurulur",
      "önce ne yapmalıyım"
    ],
    "answer": "Ana Sayfa → \"Kulüp Yapısı\" üç bölümden oluşur: Branşlar (voleybol, basketbol vb.), Gruplar (yaş grupları/takımlar) ve Salonlar (antrenman ve maç salonları). Önerilen kurulum sırası: 1) Branşları ekle, 2) Salonları ekle ve branşlara bağla, 3) Grupları oluştur, 4) Antrenörleri branşlarına ve gruplarına ata, 5) Sporcuları gruplara ekle. Kulüp tek branşla çalışıyorsa branş eklemene gerek yoktur."
  },
  {
    "id": "brans-ekle",
    "module": "yapi",
    "roles": "AK",
    "title": "Branş ekleme / düzenleme / silme",
    "questions": [
      "branş ekle",
      "yeni branş",
      "branş sil",
      "bireysel branş",
      "yüzme branşı",
      "branş düzenle"
    ],
    "answer": "Kulüp Yapısı → Branşlar'da \"Ekle\"ye dokun, branş adını yaz (ör. Basketbol) ve Kaydet. Yüzme, Atletizm gibi bireysel sporlar için \"Bireysel branş\" kutusunu işaretle: bu branşlarda müsabaka sonucu skor yerine sonuç açıklaması olarak girilir. Bir branşı düzenlemek için \"Düzenle\", kaldırmak için \"Branşı sil\"e dokun; silmeden önce bağlı grup sayısı gösterilir."
  },
  {
    "id": "grup-ekle",
    "module": "yapi",
    "roles": "AK",
    "title": "Grup oluşturma / düzenleme / silme",
    "questions": [
      "grup ekle",
      "yeni grup",
      "grup oluştur",
      "u14 grubu",
      "grup sil",
      "grup tipi",
      "grup ayarları",
      "sabit haftalık program aç"
    ],
    "answer": "1. Kulüp Yapısı → Gruplar'da \"+ Ekle\"ye dokun.\n2. Grup Adı (ör. U14 Kız Grubu), Branş ve Sporcu Tipi'ni (Spor Okulu / 🏆 Müsabık) seç.\n3. İstersen \"Sabit Haftalık Program\"ı Açık yap: bu grubun antrenmanları haftalık şablondan otomatik üretilebilir (Takvim → Haftalık Program).\n4. İstersen grubun genelde antrenman yaptığı Ana Salon'u seç.\n5. Kaydet.\nSporcu tipi gruba aittir: gruba eklenen her sporcu bu tipte işlenir. Grubu silersen gruba bağlı TÜM antrenman kayıtları da silinir; işlem geri alınamaz."
  },
  {
    "id": "salon-ekle",
    "module": "yapi",
    "roles": "AK",
    "title": "Salon ekleme / düzenleme",
    "questions": [
      "salon ekle",
      "yeni salon",
      "salon oluştur",
      "salon sil",
      "salon kapasitesi",
      "salon adres"
    ],
    "answer": "Kulüp Yapısı → Salonlar'da \"+ Ekle\"ye dokun. Salon Adı (zorunlu), Adres, Kapasite ve salonda yapılan Branşları gir; Kaydet. Salon eklemeden önce branşların tanımlı olması gerekir (\"Henüz branş eklenmemiş\" uyarısı çıkarsa önce branşı ekle). Salonu silmek için düzenleme ekranındaki \"Salonu Sil\"i kullan."
  },
  {
    "id": "ayar-genel",
    "module": "ayar",
    "roles": "A",
    "title": "Kulüp Ayarları'nda neler var",
    "questions": [
      "kulüp ayarları",
      "ayarlar nerede",
      "kulüp ayarlarına nasıl girerim",
      "yönetici ayarları"
    ],
    "answer": "Profil → \"Kulüp Ayarları\" (yalnızca kulüp yöneticisi) şu bölümleri içerir:\n• Ana Sayfa Özellikleri — kullanılacak ana başlıkları seç\n• Kulüp Adı ve Logosu — giriş ve Ana Sayfa'da görünür\n• Banka Bilgileri — havale/EFT için IBAN\n• Kullanıcılar — hesapları yönet, şifre sıfırla\n• Kulüp Bilgilerini Dışa Aktar — sporcu, antrenör, grup verilerini Excel'e al\n• Gelişmiş Ayarlar — zaman pencereleri, limitler, özellik aç/kapat"
  },
  {
    "id": "logo-isim",
    "module": "ayar",
    "roles": "A",
    "title": "Kulüp adı ve logosunu değiştirme",
    "questions": [
      "kulüp logosu",
      "logo yükle",
      "kulüp adını değiştir",
      "logo değiştir",
      "kulüp fotoğrafı"
    ],
    "answer": "Profil → Kulüp Ayarları → \"Kulüp Adı ve Logosu\"na gir; adı düzenle ve logo için görsel seç (galeri izni istenirse ver). Kaydedince ad ve logo giriş ekranında ve Ana Sayfa'da görünür."
  },
  {
    "id": "banka-bilgisi",
    "module": "ayar",
    "roles": "A",
    "title": "Banka (IBAN) bilgisini girme",
    "questions": [
      "iban gir",
      "banka bilgisi",
      "havale eft bilgisi",
      "hesap sahibi",
      "kulüp iban",
      "velilere iban göster",
      "banka bilgisi girilmemiş",
      "Velilere gösterilecek IBAN'ı nereye girerim?"
    ],
    "answer": "Profil → Kulüp Ayarları → \"Banka Bilgileri\"ne gir; Hesap Sahibi ve IBAN'ı yaz ve kaydet. Bu bilgi velilere aidat, mağaza ve etkinlik ödemelerinde Havale/EFT seçeneğinde gösterilir. Girmezsen velilerde \"Kulübün banka bilgisi henüz girilmemiş\" uyarısı çıkar."
  },
  {
    "id": "kullanicilar",
    "module": "ayar",
    "roles": "A",
    "title": "Kullanıcıları yönetme (şifre sıfırlama, devre dışı bırakma)",
    "questions": [
      "kullanıcı listesi",
      "şifre sıfırla",
      "kullanıcının şifresini sıfırla",
      "hesabı devre dışı bırak",
      "hesap silme talebi",
      "şifre sıfırlama talebi",
      "geçici şifre üret",
      "kullanıcıyı engelle",
      "Bir kullanıcının şifresini nasıl sıfırlarım?"
    ],
    "answer": "Profil → Kulüp Ayarları → \"Kullanıcılar\"a gir; hesaplar role göre gruplanmış (Veli, Sporcu, Antrenör vb.), arama kutusuyla bulabilirsin.\n• Şifre sıfırlama: Kişinin yanındaki \"Şifreyi Sıfırla\"ya dokun ve onayla. Ekranda yeni geçici şifre çıkar; KOPYALAYIP kişiye ilet — bir daha görüntülenmez. Kişi ilk girişte şifresini değiştirmek zorundadır.\n• Hesabı devre dışı bırakma: \"Hesabı Devre Dışı Bırak\" girişi tamamen kapatır (kalıcı veri silme KVKK sürecine göre ayrıca yapılır).\n• \"Bekleyen Talepler\": Şifremi unuttum diyen (🔔) ya da hesap silme talep eden (🗑) kişiler burada en üstte görünür."
  },
  {
    "id": "disa-aktar",
    "module": "ayar",
    "roles": "A",
    "title": "Kulüp verilerini Excel'e aktarma",
    "questions": [
      "excel'e aktar",
      "verileri dışa aktar",
      "sporcu listesi excel",
      "kulüp bilgilerini indir",
      "yedek al"
    ],
    "answer": "Profil → Kulüp Ayarları → \"Kulüp Bilgilerini Dışa Aktar\"a gir; sporcu, antrenör ve grup verilerini Excel dosyası olarak alırsın. Dosya oluşunca telefonunun paylaşım menüsüyle kaydedebilir ya da gönderebilirsin."
  },
  {
    "id": "ayar-finans",
    "module": "ayar",
    "roles": "A",
    "title": "Aidat ve finans ayarları",
    "questions": [
      "aidat planı kaç ay",
      "gecikme günü",
      "finansal dönem başlangıcı",
      "vadesi geçen kaç gün sonra gecikmiş",
      "aidat ayarı"
    ],
    "answer": "Profil → Kulüp Ayarları → Gelişmiş Ayarlar → \"Aidat & Finans\"ta üç değer vardır:\n• Önümüzdeki kaç ay otomatik oluşturulsun (varsayılan 3): bir sporcuya aidat planı bağlanınca bu kadar ay ileriye ödeme kaydı hazırlanır.\n• Vadesi geçen ödeme kaç gün sonra \"Gecikmiş\" sayılsın: 0 = vade geçer geçmez; 3 yaparsan 3 gün beklenir.\n• Finansal dönem başlangıç günü: Finansal Dökümanlarım'daki varsayılan tarih aralığı her ay bu günden bugüne hesaplanır (1 = takvim ayı)."
  },
  {
    "id": "ayar-antrenor-limiti",
    "module": "ayar",
    "roles": "A",
    "title": "Yardımcı antrenör limiti",
    "questions": [
      "yardımcı antrenör limiti",
      "gruba kaç yardımcı antrenör",
      "antrenör yönetimi ayarı",
      "yardımcı antrenör sayısını artırmak istiyorum",
      "yardımcı antrenör sayısını artır",
      "gruba daha fazla yardımcı antrenör"
    ],
    "answer": "Profil → Kulüp Ayarları → Gelişmiş Ayarlar → \"Antrenör Yönetimi\"nde \"Grup Başına Yardımcı Antrenör Limiti\"ni yaz (varsayılan 2). Bir gruba bu sayıdan fazla yardımcı antrenör atanamaz."
  },
  {
    "id": "finans-genel",
    "module": "finans",
    "roles": "AK",
    "title": "Finans ekranı nasıl kullanılır",
    "questions": [
      "finans ekranı",
      "aidat takibi",
      "tahsil edilen bekleyen vadesi geçmiş",
      "kulüp finansı",
      "finans nerede"
    ],
    "answer": "Ana Sayfa → \"Finans\" kutucuğunda üstte \"Aidat Gelirleri\" kartı vardır: Tahsil Edilen, Bekleyen ve Vadesi Geçmiş toplamlar. Bu kutulara dokununca ilgili aidat listesi açılır. Altındaki düğmeler: \"+ Gelir\", \"+ Gider\", \"Antrenör Ödemeleri\" (yönetici), \"+ Aidat Planı\", \"📄 Finansal Dökümanlarımı Listele\" ve \"⚙️ Sabit Aidat Ücreti\". Aşağıda branş filtresi, sporcu arama ve grup kartları bulunur; bir gruba, sonra sporcuya dokunarak o sporcunun ödemelerine ulaşırsın. Koordinatör yalnızca kendi branşının aidatlarını görür."
  },
  {
    "id": "aidat-plani",
    "module": "finans",
    "roles": "AK",
    "title": "Sporcuya aidat planı oluşturma",
    "questions": [
      "aidat planı oluştur",
      "aidat ekle",
      "aylık aidat tanımla",
      "aidat nasıl tanımlanır",
      "ilk ödeme tarihi",
      "aidat başlat",
      "Sporcuya aidat planı nasıl oluşturulur?"
    ],
    "answer": "1. Finans → \"+ Aidat Planı\"na dokun (ya da sporcu eklerken Aylık Aidat ve İlk Ödeme Tarihi'ni gir).\n2. Sporcuyu seç, Aylık Tutar (₺) ve İlk Ödeme Tarihi'ni gir.\n3. Kaydet.\nGirdiğin tutar ve tarih her ay otomatik tekrarlanan bir plan oluşturur; önümüzdeki 3 ay için ödeme kaydı hemen hazırlanır, zaman geçtikçe yeni aylar kendiliğinden eklenir (ay sayısı Aidat & Finans ayarından değişir)."
  },
  {
    "id": "sabit-aidat",
    "module": "finans",
    "roles": "AK",
    "title": "Branş bazlı sabit aidat ücreti",
    "questions": [
      "sabit aidat",
      "aidat ücretini güncelle",
      "tüm sporcuların aidatını değiştir",
      "branş aidatı",
      "aidat zammı",
      "Branş aidat ücretini nasıl güncellerim?"
    ],
    "answer": "Finans → \"⚙️ Sabit Aidat Ücreti\"ne gir. Her branş için ayrı ücret belirlersin; bir branşın ücretini \"Güncelle\"yince YALNIZCA o branştaki sporcuların aidat planları güncellenir ve içinde bulunduğun ay HARİÇ, henüz ödenmemiş gelecek aylardaki tutarlar da yeni değere çekilir. Diğer branşlara ve ödenmiş kayıtlara dokunulmaz. İşlem onay ister."
  },
  {
    "id": "odendi-isaretle",
    "module": "finans",
    "roles": "AK",
    "title": "Aidatı ödendi olarak işaretleme, uyarı gönderme, dekont/makbuz",
    "questions": [
      "ödendi işaretle",
      "aidat tahsil et",
      "ödeme onayla",
      "uyarı gönder",
      "dekontu gör",
      "makbuz",
      "veli ödediğini bildirdi",
      "erken ödendi",
      "veliler ödeme yapınca ne olur",
      "veli ödeme yaptı ne olur",
      "Aidatı ödendi olarak nasıl işaretlerim?"
    ],
    "answer": "Finans'ta bir sporcunun ödemelerine gir; \"Yaklaşan Ödemeler\" ve \"Geçmiş Ödemeler\" listelenir.\n• Veli ödemeyi bildirdiyse kartta \"💬 Veli … ile ödediğini bildirdi\" görünür; varsa \"📎 Dekontu Gör\"den dekontu incele, parayı kontrol edip \"Ödendi İşaretle\"ye dokun ve onayla.\n• Vadesi geçmiş ödeme için \"🔔 Uyarı Gönder\" veliye bildirim yollar (bağlı veli hesabı yoksa gönderilemez).\n• Ödenen kayıtta \"🧾 Makbuz Görüntüle\" makbuzu açar; \"Makbuzu PDF Olarak Paylaş\"la gönderebilirsin.\n• Vadesinden önce ödenenler \"🔵 Erken Ödendi\" etiketi alır.\nAyrıca vadesi geçen aidatlar için velilere 3 günde bir otomatik \"Aidat Hatırlatması\" bildirimi gider."
  },
  {
    "id": "gelir-gider",
    "module": "finans",
    "roles": "AK",
    "title": "Gelir ve gider kaydetme",
    "questions": [
      "gider ekle",
      "gelir ekle",
      "kira gideri",
      "forma satışı geliri",
      "malzeme gideri",
      "aidat dışı gelir"
    ],
    "answer": "• Finans → \"+ Gelir\": Aidat dışındaki gelirler (forma/tişört satışı, malzeme satışı vb.) için Açıklama, Tutar (₺) ve Tarih gir, \"Geliri Kaydet\".\n• Finans → \"+ Gider\": Salon kirası, malzeme alımı gibi giderler için Açıklama, Tutar ve Tarih gir, \"Gideri Kaydet\".\nKayıtlar \"Finansal Dökümanlarım\"da görünür. Mağazadan teslim edilen siparişler ve onaylanan ücretli etkinlik kayıtları da gelir olarak buraya işlenir."
  },
  {
    "id": "finansal-dokuman",
    "module": "finans",
    "roles": "AK",
    "title": "Finansal Dökümanlarım / Excel'e aktarma",
    "questions": [
      "finansal dökümanlarım",
      "gelir gider raporu",
      "tarih aralığı rapor",
      "excel'e aktar finans",
      "toplam gelir gider",
      "rapor al",
      "Gelir gider raporunu Excel'e nasıl aktarırım?"
    ],
    "answer": "Finans → \"📄 Finansal Dökümanlarımı Listele\"de aidat gelirleri, diğer gelirler, giderler ve antrenör ödemeleri tek listede toplanır. Üstten Başlangıç ve Bitiş tarihini seç (varsayılan aralık finansal dönem ayarına göre gelir), arama kutusundan sporcu/antrenör/açıklama ara; Gelir, Gider ve Toplam özetini görürsün. \"📥 Excel'e Aktar\" ile filtrelenmiş kayıtları dosya olarak paylaşırsın. Gelir/gider satırlarını silebilirsin."
  },
  {
    "id": "veli-aidat-ode",
    "module": "finans",
    "roles": "P",
    "title": "Aidat ödeme ve ödeme bildirimi (veli)",
    "questions": [
      "aidat öde",
      "aidatımı nasıl öderim",
      "havale eft ile öde",
      "dekont ekle",
      "ödedim bildir",
      "elden ödeme",
      "ödeme yöntemi",
      "aidat nereden ödenir",
      "Aidatı nasıl öderim?"
    ],
    "answer": "1. Ana Sayfa → \"Aidat Öde\"ye dokun; \"Yaklaşan Ödemeler\" ve \"Geçmiş Ödemeler\" listelenir.\n2. Ödemek istediğin aidata dokun ve yöntemi seç:\n   • Havale/EFT: Kulübün Hesap Sahibi ve IBAN bilgisi görünür (dokunarak kopyalayabilirsin). Parayı gönder, istersen \"📎 Dekont Ekle\" ile dekontun fotoğrafını ekle ve \"Ödedim, Bildir\"e bas.\n   • Elden Ödeme: Tutarı antrenörüne ya da yönetime teslim edersin; yine \"Ödedim, Bildir\"e bas.\n   • Online Ödeme (kartla): Yakında eklenecek.\n3. Bildirimin kulüp yönetimine iletilir; ödeme kontrol edildikten sonra durumu \"Ödendi\" olarak güncellenir.\nÖdenen aidatlarda \"🧾 Makbuz Görüntüle\" ile makbuzu açıp PDF olarak paylaşabilirsin."
  },
  {
    "id": "performans-genel",
    "module": "performans",
    "roles": "ACK",
    "title": "Performans bölümü nedir",
    "questions": [
      "performans nedir",
      "performans hub",
      "performans kutucuğu",
      "performansta neler var",
      "fitness ölçüm beslenme"
    ],
    "answer": "Ana Sayfa → \"Performans\" üç bölüm içerir:\n• Fitness — Check-in ve çalışma takibi (egzersizler, programlar, günlük check-in izleme)\n• Performans Ölçümleri — hız, sıçrama, kuvvet ve dayanıklılık testleri\n• Beslenme — besinler, sporcu tarifleri ve beslenme rehberi\nTestler ve egzersizler hazır bir kütüphaneden gelir; ayrıca kulübüne özel test/hareket ekleyebilirsin."
  },
  {
    "id": "olcum-kaydet",
    "module": "performans",
    "roles": "ACK",
    "title": "Sporcunun performans ölçümünü kaydetme",
    "questions": [
      "ölçüm kaydet",
      "test sonucu gir",
      "sürat testi gir",
      "performans ölçümü",
      "sıçrama testi",
      "ölçüm nasıl girilir",
      "sporcunun ölçümünü kaydet",
      "Performans ölçümü nasıl kaydederim?"
    ],
    "answer": "1. Ana Sayfa → Performans → \"Performans Ölçümleri\"ne gir.\n2. Bir kategori seç (Antropometrik, Sürat, Çeviklik, Sıçrama, Kuvvet, Dayanıklılık, Esneklik, Denge/Koordinasyon).\n3. Kolaydan zora sıralı testlerden birini seç; \"Nasıl Yapılır?\" açıklamasını okuyabilirsin.\n4. Sporcuyu seç, ölçüm değerini (testin birimiyle: sn, cm, kg vb.) ve Tarih'i gir; istersen not ekle.\n5. Kaydet.\nTestin altında sporcunun geçmiş ölçümleri listelenir; yanlış kaydı silebilirsin."
  },
  {
    "id": "olcum-toplu",
    "module": "performans",
    "roles": "ACK",
    "title": "Test grubuyla toplu ölçüm girme",
    "questions": [
      "test grubu",
      "toplu ölçüm",
      "tüm gruba sürat testi",
      "test grubu oluştur",
      "hızlı ölçüm girişi",
      "sporcu listesiyle ölçüm",
      "Test grubuyla toplu ölçüm nasıl girilir?"
    ],
    "answer": "Bir grup sporcuyu aynı testlerden geçirdiysen hepsini tek ekranda gir:\n1. Performans Ölçümleri'nde \"+ Test Grubu Ekle\"ye dokun.\n2. Grup Adı ver (ör. 13 Eylül Sürat Testi), \"👥 Gruptan Ekle\" ya da \"+ Sporcu Ekle\" ile sporcuları, \"✓ Testleri Seç\" ile testleri seç.\n3. \"Test Grubunu Oluştur\"a bas.\n4. Grubu açıp bir sporcunun testine dokun, altında açılan alana ölçümü yaz; \"Sonraki ›\" ile devam et.\n5. Sarı \"Kaydet\"e basınca girdiğin tüm ölçümler kaydedilir. Her sporcunun \"Son ölçüm\" değeri altında gösterilir.\nSporcuyu gruptan \"Çıkar\"abilir, test grubunu silebilirsin."
  },
  {
    "id": "ozel-test",
    "module": "performans",
    "roles": "AK",
    "title": "Kulübe özel test ekleme / düzenleme",
    "questions": [
      "yeni test ekle",
      "özel test",
      "test düzenle",
      "test sil",
      "hangi değer daha iyi",
      "test birimi",
      "kendi testimi oluştur"
    ],
    "answer": "Performans Ölçümleri'nde \"+ Test Ekle\"ye dokun ve şunları gir: Kategori, Testin Adı, Birim (ör. sn, cm, kg), isteğe bağlı Ekipman, \"Hangi Değer Daha İyi?\" (Yüksek değer iyi: mesafe, tekrar, kuvvet / Düşük değer iyi: süre, düşme sayısı), \"Nasıl Yapılır?\" açıklaması ve istersen video linki ya da dosyası. \"Hangi Değer Daha İyi?\" seçimi, ölçüm ekranındaki artış/azalışın yeşil (iyileşme) mi kırmızı (kötüleşme) mi görüneceğini belirler. Bir testi düzenlemek/silmek için kategori listesinde testin yanındaki ✏️ ve silme düğmelerini kullan."
  },
  {
    "id": "olcum-gorme",
    "module": "performans",
    "roles": "PS",
    "title": "Kendi/çocuğumun ölçümlerini ve gelişimini görme",
    "questions": [
      "ölçümlerimi gör",
      "gelişimim",
      "test sonuçlarım",
      "performansım",
      "ölçüm grafiği",
      "önceki ölçüme göre",
      "yeşil kırmızı ok",
      "ölçümlerim iyileşti mi",
      "gelişim ölçümlerim",
      "iyileştim mi",
      "Çocuğumun test sonuçlarını nereden görürüm?",
      "Test sonuçlarımı nereden görürüm?"
    ],
    "answer": "Ana Sayfa → \"Performans\" (sporcuda) ya da Sporcu Takibi → \"Ölçümler\" (veli/sporcu) ekranında kategori kategori tüm test sonuçlarını görürsün. Her ölçümün yanında önceki ölçüme göre değişim yüzdesi ve ok gösterilir: yeşil = iyileşme, kırmızı = kötüleşme (bir testte düşük değer iyiyse, örneğin sürat, düşüş yeşil görünür). Henüz ölçüm yoksa \"Henüz kaydedilmiş bir ölçüm yok\" yazar. Bu ekranlar yalnızca görüntülemedir; ölçümleri antrenör girer."
  },
  {
    "id": "olcum-goruntule-yonetici",
    "module": "performans",
    "roles": "ACK",
    "title": "Bir sporcunun tüm ölçümlerini görüntüleme",
    "questions": [
      "sporcunun ölçümlerini gör",
      "ölçümler butonu",
      "sporcu performansı",
      "gelişim takibi sporcu"
    ],
    "answer": "Performans Ölçümleri ekranındaki \"📊 Ölçümler\" düğmesine dokun, bir sporcu seç; sporcunun tüm ölçümlerini kategori ve değişim yüzdesiyle görürsün. Sporcu profilindeki \"Performans\" hızlı düğmesi de aynı bilgiye götürür."
  },
  {
    "id": "fitness-genel",
    "module": "fitness",
    "roles": "ACK",
    "title": "Fitness bölümü nedir",
    "questions": [
      "fitness nedir",
      "fitness ekranı",
      "egzersizler",
      "fitness neler var",
      "kuvvet antrenmanı takibi"
    ],
    "answer": "Performans → \"Fitness\" ekranında üç bölüm vardır:\n• Wellness Check-in — sporcuların günlük uyku/enerji/ruh hâli takibi\n• Egzersizler — göğüs, sırt, bacak, kol, omuz, karın hareketleri; sporcunun kaldırdığı ağırlık/tekrar kaydı\n• Program Oluştur — fitness grupları, grup programları ve sporcuların bireysel programları\nFitness grupları ve programları müsabık sporcular içindir."
  },
  {
    "id": "fitness-egzersiz-kaydet",
    "module": "fitness",
    "roles": "ACK",
    "title": "Sporcunun egzersiz ağırlığını/tekrarını kaydetme",
    "questions": [
      "egzersiz kaydet",
      "ağırlık kaydet",
      "kaç kilo kaldırdı",
      "set tekrar gir",
      "fitness kaydı",
      "hareket geçmişi",
      "Sporcunun kaldırdığı ağırlığı nasıl kaydederim?"
    ],
    "answer": "1. Fitness → \"Egzersizler\"e gir ve bir bölge seç (Göğüs, Sırt, Bacak, Kol, Omuz, Karın).\n2. Hareketi seç; \"Nasıl Yapılır?\" açıklaması ve varsa video görünür.\n3. Sporcuyu seç; Ağırlık (kg), Set Sayısı, Tekrar Sayısı ve Tarih'i gir, istersen not ekle. (Vücut ağırlığıyla yapılan hareketlerde ağırlık isteğe bağlıdır; tekrar sayısı zorunludur.)\n4. Kaydet.\nHareketin altında sporcunun geçmiş kayıtları listelenir; yanlışı silebilirsin."
  },
  {
    "id": "fitness-hareket-ekle",
    "module": "fitness",
    "roles": "AK",
    "title": "Kulübe özel egzersiz ekleme / genel hareketleri gizleme",
    "questions": [
      "egzersiz ekle",
      "yeni hareket ekle",
      "hareketleri yönet",
      "hareket gizle",
      "özel egzersiz",
      "hareket videosu ekle"
    ],
    "answer": "• Yeni hareket: Egzersizler ekranında \"+ Egzersiz Ekle\"ye dokun; Bölge, Hareketin Adı, kısa Açıklama ve istersen video linki (YouTube, Vimeo) ya da dosya ekle.\n• Düzenleme/silme: Bir bölgeyi açıp hareketin yanındaki ✏️ Düzenle / 🗑 Sil düğmelerini kullan.\n• Gizleme: \"🎚 Hareketleri Yönet\" ile hazır (genel) hareketlerden kulübünle ilgisiz olanları kapat; sadece senin kulübünde görünmez olur, başka kulüplerden ya da genel listeden hiçbir şey silinmez ve istediğin an tekrar açabilirsin."
  },
  {
    "id": "fitness-grubu",
    "module": "fitness",
    "roles": "ACK",
    "title": "Fitness grubu oluşturma",
    "questions": [
      "fitness grubu oluştur",
      "fitness grubu",
      "il takımı adayları grubu",
      "özel fitness grubu",
      "Fitness grubu nasıl oluşturulur?"
    ],
    "answer": "Bir branştaki müsabık sporculardan istediklerini seçerek özel bir fitness grubu kurabilirsin:\n1. Fitness → Program Oluştur → \"Fitness Grubu Oluştur\" (ya da Fitness Grupları'nda \"+ Fitness Grubu Ekle\").\n2. Grup Adı ver (ör. İl Takımı Adayları) ve Branşı seç (oluşturulduktan sonra branş değiştirilemez).\n3. Listedeki müsabık sporculardan en az birini seç (arama kutusuyla bulabilirsin).\n4. Kaydet.\nFitness grubunu silmek için grubu açıp \"Fitness Grubunu Sil\"i kullan."
  },
  {
    "id": "fitness-grup-programi",
    "module": "fitness",
    "roles": "ACK",
    "title": "Fitness grup programı oluşturup yayınlama",
    "questions": [
      "fitness programı oluştur",
      "gruba program yayınla",
      "çalışma programı hazırla",
      "program gönder",
      "haftalık kuvvet programı",
      "Fitness programını nasıl yayınlarım?"
    ],
    "answer": "1. Fitness → Program Oluştur → \"Gruba Program Oluştur\"a dokun.\n2. Program Adı yaz (ör. Haftalık Kuvvet Programı) ve hangi Fitness Grubuna sergileneceğini seç (yoksa \"+ Fitness Grubu Oluştur\").\n3. Hareket ekle: Bölge, Hareket, Set ve Tekrar sayısını seç ve \"+ Programa Ekle\"; istediğin kadar hareket ekle.\n4. \"Programı Tamamla\"ya, ardından \"Gönder ve Sergile\"ye dokun.\nProgram yayınlanır ve gruptaki herkese bildirim gider. Sporcuların programı tamamlayıp tamamlamadığını program detayında \"Tamamlayanlar\" listesinden görürsün. Programı silebilirsin."
  },
  {
    "id": "fitness-bireysel-inceleme",
    "module": "fitness",
    "roles": "ACK",
    "title": "Sporcuların bireysel fitness programlarını inceleme",
    "questions": [
      "bireysel program incele",
      "sporcunun programı",
      "sporcunun yazdığı program",
      "bireysel fitness"
    ],
    "answer": "Fitness → Program Oluştur → \"Bireysel Program Oluştur\"a gir ve \"Sporcu Seç\"; sporcuların kendi yazdığı bireysel fitness programlarını ve girdikleri set/ağırlık/tekrar kayıtlarını inceleyebilirsin."
  },
  {
    "id": "fitness-sporcu-bireysel",
    "module": "fitness",
    "roles": "S",
    "title": "Bireysel fitness programı oluşturma (sporcu)",
    "questions": [
      "bireysel programım",
      "kendi programımı oluştur",
      "bireysel fitness programı yaz",
      "yeni program",
      "hareket ekle program",
      "Bireysel fitness programı nasıl oluşturulur?"
    ],
    "answer": "1. Sporcu profilinde Sporcu Takibi → \"Bireysel Programım\"a gir.\n2. \"+ Yeni Program\"a dokun; Program Adı yaz (ör. Yaz Kuvvet Programım).\n3. Bölge ve hareket seçip Set ve Tekrar sayısı girerek \"+ Programa Ekle\"; istediğin kadar hareket ekle ve \"Programı Tamamla\"ya bas.\n4. Programı açıp her hareket için set set ağırlık ve tekrarlarını yaz ve \"Kaydet\"e bas.\nBireysel çalışma yaptığın günler \"Bireysel fitness\" rozetine sayılır."
  },
  {
    "id": "fitness-sporcu-grup-programi",
    "module": "fitness",
    "roles": "PS",
    "title": "Antrenörün yayınladığı grup programını görme ve tamamlama",
    "questions": [
      "grup programı",
      "antrenmanı tamamladım",
      "program tamamla",
      "fitness programım",
      "programı nasıl tamamlarım",
      "zorluk derecesi süre gir",
      "Antrenörün yayınladığı programı nasıl tamamlarım?"
    ],
    "answer": "Sporcu Takibi → \"Grup Programı\"na gir. Antrenörün yayınladığı programda hareketler ve hedef set×tekrar görünür.\nAntrenmanı yapınca \"Antrenmanı Tamamladım\"a dokun; istersen set bazlı ağırlık/tekrarını, Zorluk Derecesi'ni (1-10), Süre'yi (dakika) ve bir not gir, tekrar \"✓ Antrenmanı Tamamladım\"a bas. Tamamladığın programlar \"Tamamlanan Grup Programları\"nda listelenir; tamamlayanları antrenör de görür. Henüz program yayınlanmadıysa \"Henüz Program Yok\" yazar."
  },
  {
    "id": "beslenme-genel",
    "module": "beslenme",
    "roles": "ACKS",
    "title": "Beslenme bölümü",
    "questions": [
      "beslenme",
      "besin değerleri",
      "tarifler",
      "beslenme rehberi",
      "ne yemeliyim",
      "sporcu beslenmesi",
      "beslenme önerileri",
      "Beslenme önerilerini nereden görürüm?"
    ],
    "answer": "Ana Sayfa → Beslenme (sporcuda doğrudan kutucuk; yönetici/antrenörde Performans → Beslenme) üç bölüm içerir; buradaki bilgiler bilimsel makalelere ve büyük sağlık kuruluşlarına dayanır ve her içerikte kaynakça belirtilir:\n• Besinler — Karbonhidratlar, Proteinler, Yağlar, Vitaminler kategorilerinde besinler; kalori, protein/karbonhidrat/yağ değerleri, \"Nerede Bulunur\" ve \"Sporcuya Faydası\"\n• Sporcu Tarifleri — kategori kategori pratik ve besleyici tarifler (malzemeler ve yapılışı)\n• Beslenme Rehberi — Müsabaka/Antrenman/Normal Gün Beslenmesi, Genç Sporcu Beslenmesi, Protein, Su ve Sıvı, Kahvaltı, Kemik Sağlığı, Uyku ve Beslenme gibi kaynaklı yazılar"
  },
  {
    "id": "beslenme-icerik-ekle",
    "module": "beslenme",
    "roles": "AK",
    "title": "Besin, tarif ve rehber yazısı ekleme",
    "questions": [
      "besin ekle",
      "tarif ekle",
      "yazı ekle",
      "beslenme rehberi yazı ekle",
      "kaynakça ekle",
      "pdf yazı yükle",
      "beslenme içeriği"
    ],
    "answer": "• Besin: Beslenme → Besinler → bir kategori → \"+ Ekle\"; Besin Adı (zorunlu), kısa açıklama, nerede bulunur, kalori, protein, karbonhidrat, yağ, sporcuya faydası ve Kaynakça gir.\n• Tarif: Sporcu Tarifleri → bir kategori → \"+ Tarif Ekle\"; Tarif Adı (zorunlu), kısa açıklama, malzemeler, yapılışı ve kaynakça yaz.\n• Rehber yazısı: Beslenme Rehberi sayfasına gir ve en üstteki \"+ Yazı Ekle\"ye dokun; Başlık (zorunlu), İçerik metni ya da bir PDF (ikisinden biri zorunlu) ve Kaynakça gir. Eklediğin yazı sayfanın en üstünde, konu kutucuklarının yukarısında görünür; en yeni yazı en üstte durur ve her yazıya dört marka renginden biri otomatik verilir.\nHer içeriğin bilimsel bir kaynağa dayandığından ve Kaynakça alanına eklendiğinden emin ol. İçeriği düzenlemek/silmek için detay ekranındaki ✎ Düzenle ve silme seçeneklerini kullan."
  },
  {
    "id": "beslenme-rehber-yazisi",
    "module": "beslenme",
    "roles": "ACKS",
    "title": "Beslenme Rehberi yazılarını okuma",
    "questions": [
      "beslenme yazısı",
      "rehber yazısı",
      "kaynakça",
      "makale",
      "beslenme rehberinde yazı",
      "en yeni yazı"
    ],
    "answer": "Beslenme → \"Beslenme Rehberi\"ne gir. Sayfanın en üstünde kulübünün eklediği yazılar (en yeni en üstte, renkli kutular), altında konu kutucukları görünür. Bir yazıya ya da konuya dokununca içerik açılır; PDF olarak yayınlanmış yazılar PDF olarak görüntülenir. Yazının sonunda \"Kaynakça\" bölümü yer alır."
  },
  {
    "id": "etkinlik-gorme",
    "module": "etkinlik",
    "roles": "ACPSK",
    "title": "Etkinlik, turnuva ve kampları görme",
    "questions": [
      "etkinlikler",
      "turnuva",
      "kamp",
      "etkinlik sekmesi",
      "yayınlanmış etkinlikler",
      "etkinliğe bak",
      "Etkinlikleri nerede görürüm?"
    ],
    "answer": "Alt menüdeki \"Etkinlik\" sekmesi kulübün yayınladığı etkinlik, turnuva ve kampları listeler (görsel, tarih, ücret). Birine dokununca tarih, konum, ücret, kontenjan ve son kayıt tarihi görünür. Tarihi geçmiş etkinliklerde \"Sona erdi\" etiketi görünür ve kayıt kapalıdır."
  },
  {
    "id": "etkinlik-kayit",
    "module": "etkinlik",
    "roles": "P",
    "title": "Etkinliğe kayıt olma (veli)",
    "questions": [
      "etkinliğe kayıt ol",
      "turnuvaya kayıt",
      "kampa kayıt",
      "etkinlik ödemesi",
      "katıl butonu",
      "kayıt yaptıramıyorum",
      "etkinlik kaydı nasıl yapılır",
      "Etkinliğe nasıl kayıt yaptırırım?"
    ],
    "answer": "Etkinliğe yalnızca veli kayıt yapar; sporcu etkinliği görüntüler (\"Etkinliğe kayıt velin tarafından yapılır\").\n1. Etkinlik sekmesinde etkinliğe dokun ve \"Katıl\"a bas.\n2. Kaydedeceğin sporcuyu seç, istersen not yaz.\n3. Etkinlik ücretliyse ödeme yöntemini seç: Havale/EFT (IBAN görünür, istersen dekont fotoğrafı ekle) ya da Elden Ödeme.\n4. \"Kaydı Onayla\"ya dokun.\nKaydın kulüp yönetimine iletilir; ödeme kontrol edildikten sonra durumu güncellenir (Beklemede → Onaylandı/Reddedildi). Etkinlik sona ermişse, son kayıt tarihi geçmişse ya da kontenjan dolmuşsa kayıt yapılamaz."
  },
  {
    "id": "etkinlik-kayitlarim",
    "module": "etkinlik",
    "roles": "P",
    "title": "Etkinlik kayıtlarımı görme / iptal etme",
    "questions": [
      "kayıtlarım",
      "etkinlik kaydımı iptal et",
      "kayıt durumum",
      "onaylandı mı",
      "Etkinlik kaydımı nasıl iptal ederim?"
    ],
    "answer": "Etkinlik sekmesindeki \"📋 Kayıtlarım\"a dokun; tüm etkinlik kayıtların ve durumları (Beklemede, Onaylandı, Reddedildi, İptal) listelenir. Beklemede olan bir kaydı \"İptal\"e dokunup onaylayarak iptal edebilirsin."
  },
  {
    "id": "etkinlik-olustur",
    "module": "etkinlik",
    "roles": "AK",
    "title": "Etkinlik / turnuva / kamp oluşturma ve yayınlama",
    "questions": [
      "etkinlik oluştur",
      "turnuva oluştur",
      "kamp oluştur",
      "etkinlik yayınla",
      "banner ekle",
      "kontenjan belirle",
      "etkinlik ücreti",
      "yeni etkinlik",
      "Etkinlik nasıl oluşturulur?",
      "Etkinlik nasıl oluştururum?"
    ],
    "answer": "1. Etkinlik sekmesinde \"+ Etkinlik Oluştur\"a dokun.\n2. Türü seç (Etkinlik / Turnuva / Kamp); Başlık, Açıklama, Branş (ya da Kulüp Geneli), Konum, Başlangıç Tarihi'ni gir. İsteğe bağlı: Bitiş Tarihi, Ücret (0 = ücretsiz), Kontenjan, Son Kayıt Tarihi ve Banner görseli.\n3. Kaydet — etkinlik önce \"Taslak\" olur.\n4. Etkinliğin detayında \"Yayınla\"ya dokun; yayınlanınca veliler görür ve bildirim alır.\nBitiş tarihi (yoksa başlangıç tarihi) bugünden önce olan bir etkinlik oluşturulamaz. Yayındaki etkinliği \"Etkinliği İptal Et\" ile iptal edebilir, taslakları ya da iptalleri silebilirsin."
  },
  {
    "id": "etkinlik-kayit-yonet",
    "module": "etkinlik",
    "roles": "AK",
    "title": "Etkinlik kayıtlarını onaylama / reddetme",
    "questions": [
      "etkinlik kayıtlarını gör",
      "kaydı onayla",
      "kaydı reddet",
      "dekontu görüntüle",
      "kim kayıt oldu",
      "bekleyen kayıt"
    ],
    "answer": "Etkinliğin detayında \"Kayıtlar\"a dokun; kayıt olan sporcular, ödeme yöntemleri ve durumları listelenir. Ücretli kayıtlarda \"Dekontu Görüntüle\" ile dekontu incele; kaydı \"Onayla\" ya da \"Reddet\". Karar veliye bildirim olarak gider; onaylanan ücretli kayıtlar gelir olarak Finans'a işlenir. Etkinlik listesinde bekleyen kayıt sayısı görünür."
  },
  {
    "id": "magaza-siparis",
    "module": "magaza",
    "roles": "P",
    "title": "Mağazadan ürün sipariş etme (veli)",
    "questions": [
      "mağazadan ürün al",
      "forma sipariş",
      "sipariş ver",
      "satın al",
      "beden seç",
      "sipariş nasıl verilir",
      "ürün alma",
      "Mağazadan forma nasıl sipariş ederim?"
    ],
    "answer": "1. Alt menüden \"Mağaza\"ya gir ve bir ürüne dokun (kategoriye göre filtreleyebilirsin).\n2. \"Satın Al\"a bas; Renk ve Beden seç, istersen not yaz (ör. hangi sporcu için).\n3. Ödeme yöntemini seç: Havale/EFT (kulübün IBAN'ı görünür) ya da Elden Ödeme.\n4. \"Siparişi Onayla\"ya dokun.\nSiparişin kulüp yönetimine iletilir; ödeme kontrol edildikten sonra durumu güncellenir. Siparişlerini Mağaza ekranındaki \"📦 Siparişlerim\"den takip edersin (Bekliyor → Onaylandı → Teslim Edildi). Sporcu hesabı mağazayı yalnızca görüntüler, sipariş veremez; sipariş yalnızca veli hesabıyla verilir."
  },
  {
    "id": "magaza-urun-ekle",
    "module": "magaza",
    "roles": "AK",
    "title": "Mağazaya ürün ekleme / düzenleme",
    "questions": [
      "ürün ekle",
      "mağazaya ürün koy",
      "stok gir",
      "ürün fotoğrafı",
      "beden renk seçenekleri",
      "ürün fiyatı",
      "mağaza yönetimi",
      "ürün sil",
      "Mağazaya ürün nasıl eklerim?"
    ],
    "answer": "1. Mağaza sekmesinde \"+ Ürün Ekle\"ye dokun.\n2. En fazla 5 fotoğraf ekle; Başlık (zorunlu), Açıklama, Fiyat (₺, zorunlu), Kategori ve Cinsiyet (Kadın/Erkek/Unisex) gir.\n3. Renk ve beden seçeneklerini ekle ve her seçenek için stok adedini yaz (tüm seçenekler için geçerli bir stok gerekir).\n4. Kaydet.\n\"📊 Stok\" tüm ürünlerin toplam stokunu gösterir. Ürünü düzenlemek ya da silmek için mağaza yönetim listesinden ürüne dokun."
  },
  {
    "id": "magaza-siparis-yonet",
    "module": "magaza",
    "roles": "AK",
    "title": "Mağaza siparişlerini yönetme",
    "questions": [
      "siparişleri gör",
      "siparişi onayla",
      "teslim edildi işaretle",
      "siparişi iptal et",
      "sipariş takibi",
      "stok düşüyor mu"
    ],
    "answer": "Mağaza sekmesinde \"📦 Siparişler\"e gir; siparişleri duruma göre süz (Tümü, Bekliyor, Onaylandı, Teslim Edildi, İptal). Bir siparişte \"Onayla\", \"Teslim Edildi Olarak İşaretle\" ya da \"İptal Et\" seçenekleri bulunur. Sipariş verildiğinde ilgili seçeneğin stoku otomatik düşer. Teslim edilen siparişler gelir olarak Finans'a işlenir."
  },
  {
    "id": "magaza-sporcu",
    "module": "magaza",
    "roles": "S",
    "title": "Sporcu mağazayı kullanabilir mi",
    "questions": [
      "sporcu sipariş verebilir mi",
      "mağazayı görüyorum ama alamıyorum",
      "satın al butonu yok",
      "Mağazadan neden sipariş veremiyorum?"
    ],
    "answer": "Sporcu hesabı mağazayı yalnızca görüntüler; sipariş vermek için veli hesabı gerekir. Ürünlerin fiyat, renk ve bedenlerine bakabilir, isteğini velinle paylaşabilirsin."
  },
  {
    "id": "sa-genel",
    "module": "sa",
    "roles": "X",
    "title": "Süper Admin Ana Sayfası",
    "questions": [
      "süper admin",
      "süper admin neler yapar",
      "platform yönetimi",
      "süper admin kutucukları",
      "Süper Admin ana sayfasında neler var?"
    ],
    "answer": "Süper Admin Ana Sayfası'nda şu kutucuklar bulunur: Kulüpler, Abonelikler, Finans (X-NETIC'in kendi gelir/gideri), Ekranlar (rol önizlemeleri), Duyurular (kulüp yöneticilerine), Egzersiz Kütüphanesi ve Performans Testleri Kütüphanesi (tüm kulüplerde görünen ortak içerikler). Alt menüde Ana Menü, Mesajlar, Asistan, Sistem Ayarları ve Profil vardır. Süper Admin hiçbir kulübün veli, sporcu ya da antrenör verisine erişemez."
  },
  {
    "id": "sa-kulupler",
    "module": "sa",
    "roles": "X",
    "title": "Kulüpleri görme ve silme",
    "questions": [
      "kulüpleri gör",
      "kulüp listesi",
      "kulüp sil",
      "kulüp kalıcı sil",
      "kulüp katılım tarihi",
      "toplam kulüp",
      "Bir kulübü nasıl silerim?"
    ],
    "answer": "Ana Sayfa → \"Kulüpler\" platformdaki tüm kulüpleri (katılım tarihi ve abonelik durumuyla) listeler. Bir kulübü tamamen kaldırmak için \"Kulübü Kalıcı Olarak Sil\"i kullan; onay için kulüp adını tam yazman gerekir. DİKKAT: Kulübün tüm sporcu, antrenör, ödeme ve dosya verisi kalıcı olarak silinir, geri alınamaz."
  },
  {
    "id": "sa-abonelik",
    "module": "sa",
    "roles": "X",
    "title": "Abonelikleri yönetme ve onaylama",
    "questions": [
      "abonelik onayla",
      "abonelik durumu değiştir",
      "havale onay",
      "abonelik planı",
      "ödeme onayı kulüp",
      "abonelik iptal",
      "Kulüp aboneliğini nasıl onaylarım?"
    ],
    "answer": "Ana Sayfa → \"Abonelikler\"de kulüp kartlarına dokun; Durum (Onay Bekliyor, Aktif, Test Ödemesi, Ödeme Gecikti, İptal Edildi), Plan (Aylık/Yıllık) ve Tutar'ı (₺) düzenleyip Kaydet'le. Yeni kaydolan kulüp \"Onay Bekliyor\" durumunda başlar; havaleyi kontrol edince \"Aktif\" yaparsın ve kulübün uygulaması kısıtsız açılır. Abonelik kaydı olmayan kulübe kart üzerinden yeni kayıt oluşturabilirsin."
  },
  {
    "id": "sa-finans-rapor",
    "module": "sa",
    "roles": "X",
    "title": "X-NETIC finans ve platform raporu",
    "questions": [
      "süper admin finans",
      "platform geliri",
      "toplam kulüp aktif abonelik",
      "tamamlanan gelir",
      "gelir gider kaydı platform",
      "X-NETIC gelir gider kaydı nasıl tutulur?"
    ],
    "answer": "• Finans: X-NETIC'in kendi işletme gelir/gider muhasebesidir (kulüplerin finansıyla ilgisi yok). \"Yeni Kayıt Ekle\" ile Gelir ya da Gider için Açıklama, Tutar, Kategori ve Tarih gir; kayıtlar aşağıda listelenir ve silinebilir.\n• Rapor: Toplam Kulüp, Aktif Abonelik ve Tamamlanan Gelir sayılarını gösterir; gelir yalnızca gerçekten tamamlanmış ödemeleri sayar."
  },
  {
    "id": "sa-duyuru",
    "module": "sa",
    "roles": "X",
    "title": "Kulüp yöneticilerine duyuru gönderme",
    "questions": [
      "süper admin duyuru",
      "tüm kulüplere duyuru",
      "yöneticilere mesaj",
      "platform duyurusu",
      "Tüm kulüp yöneticilerine duyuru nasıl gönderirim?"
    ],
    "answer": "Ana Sayfa → \"Duyurular\"da Başlık ve Mesaj yaz, istersen fotoğraf/video/belge ekle ve \"Kulüp Yöneticilerine Gönder\"e dokun. Bu duyuru SADECE kulüp yöneticilerine gider; gizlilik gereği hiçbir kulübün veli/sporcu/antrenör verisine erişim gerekmez, kapsam bilerek böyle sınırlıdır."
  },
  {
    "id": "sa-kutuphane",
    "module": "sa",
    "roles": "X",
    "title": "Egzersiz ve performans testi kütüphaneleri",
    "questions": [
      "egzersiz kütüphanesi",
      "performans testleri kütüphanesi",
      "global test ekle",
      "tüm kulüplerde görünen hareket",
      "ortak içerik",
      "Ortak egzersiz ve test kütüphanesini nasıl yönetirim?"
    ],
    "answer": "Ana Sayfa'daki \"Egzersiz Kütüphanesi\" ve \"Performans Testleri Kütüphanesi\", tüm kulüplerde görünen ortak hareket ve testleri yönetir. Kategori açıp \"+ Egzersiz Ekle\" / \"+ Test Ekle\" ile yeni içerik ekler, mevcut olanı düzenler ya da silersin. Kayıtlar \"🌐 Global (Platform)\" etiketiyle görünür; kulüplerin kendi eklediği özel içerikler kendi kulüplerine aittir."
  },
  {
    "id": "sa-sistem-ayarlari",
    "module": "sa",
    "roles": "X",
    "title": "Sistem Ayarları (fiyat, bakım modu, destek bilgisi)",
    "questions": [
      "sistem ayarları",
      "abonelik fiyatı değiştir",
      "bakım modunu aç",
      "bakım mesajı",
      "destek e-postası",
      "destek telefonu",
      "abonelik ödeme hesabı",
      "Abonelik fiyatını nasıl değiştiririm?"
    ],
    "answer": "Alt menüdeki \"Sistem Ayarları\" platformdaki TÜM kulüpleri etkiler:\n• Abonelik Fiyatları — Aylık ve Yıllık fiyat (Kulüp Oluştur ekranındaki plan fiyatları buradan gelir)\n• Bakım Modu — açıkken Süper Admin dışındaki herkes bakım mesajını görür ve yeni kulüp oluşturma kapanır; Bakım Mesajı'nı yaz\n• Destek İletişim Bilgileri — destek e-postası ve telefonu\n• Abonelik Ödeme Hesabı (Havale/EFT) — hesap sahibi ve IBAN; kulüp oluşturma sayfasında ve onay bekleyen yöneticilere gösterilir\nDeğişiklikten sonra Kaydet'e bas."
  },
  {
    "id": "sa-ekranlar",
    "module": "sa",
    "roles": "X",
    "title": "Rol önizlemeleri (Ekranlar)",
    "questions": [
      "rol önizleme",
      "ekranlar",
      "veli ekranını gör",
      "hangi rol ne görür",
      "ana sayfa önizleme",
      "Bir rolün ana sayfasını nasıl önizlerim?"
    ],
    "answer": "Ana Sayfa → \"Ekranlar\"da bir rol seç (Kulüp Yöneticisi, Branş Koordinatörü, Antrenör, Veli, Sporcu); o rolün Ana Sayfa kutucuk düzenini önizlersin. Bu yalnızca bir önizlemedir, gerçek sporcu/veli/kulüp verisi göstermez ve kutucuklar çalışmaz."
  },
  {
    "id": "sa-mesaj",
    "module": "sa",
    "roles": "X",
    "title": "Süper Admin mesajlaşması",
    "questions": [
      "süper admin mesaj",
      "kulüp yöneticisine mesaj",
      "yöneticilerle mesajlaş",
      "süper admin kime yazabilir",
      "Kulüp yöneticisine nasıl mesaj atarım?"
    ],
    "answer": "Alt menüdeki \"Mesajlar\"dan yalnızca kulüp yöneticileriyle mesajlaşabilirsin. Gizlilik gereği Süper Admin, kulüplerin veli, sporcu ve antrenörleriyle yazışamaz. \"+ Yeni Mesaj\"la bir kulüp yöneticisi seçip sohbet başlatırsın."
  },
  {
    "id": "roller-ozet",
    "module": "sss",
    "roles": "ACPSKX",
    "title": "Roller ne yapabilir (Yönetici, Koordinatör, Antrenör, Veli, Sporcu)",
    "questions": [
      "roller nedir",
      "hangi rol ne yapar",
      "koordinatör ile antrenör farkı",
      "yetkilerim neler",
      "veli ne görür",
      "yönetici yetkileri",
      "rol farkları",
      "Hangi rol ne yapabilir?"
    ],
    "answer": "• Kulüp Yöneticisi: Kulübün tamamını yönetir — sporcular, antrenörler, gruplar/branşlar/salonlar, finans, duyurular, kulüp ayarları, kullanıcı hesapları.\n• Branş Koordinatörü: Bir branşın sorumlusu olan antrenördür. Kendi branşında yönetici gibi çalışır (tüm sporcular, antrenörler, gruplar, salonlar, aidatlar, duyuru, rozet ayarı, mağaza/etkinlik yönetimi) ama diğer branşlara ve kulüp ayarlarına erişemez.\n• Antrenör: Yalnızca kendisine atanan grupların sporcularını görür; yoklama alır, antrenman planlar, ölçüm ve fitness girişi yapar, müsabaka sonucu girer.\n• Veli: Kendi çocuklarının profilini, yoklamasını, takvimini, ölçümlerini görür; aidat ödeme bildirimi yapar, mağazadan sipariş verir, etkinliklere kayıt yaptırır, \"gelemeyecek\" bildirimi gönderir.\n• Sporcu: Kendi profilini, takvimini, ölçümlerini görür; check-in ve zorluk derecesi girer, bireysel fitness programı yazar, paylaşım yapar (onaya tabi).\n• Süper Admin: Platformu yönetir; hiçbir kulübün üye verisine erişemez.\nHerkes yalnızca kendisini ilgilendiren veriyi görür; kulüpler birbirinden tamamen ayrıdır."
  },
  {
    "id": "gizlilik-kim-gorur",
    "module": "sss",
    "roles": "ACPSKX",
    "title": "Kişisel bilgilerimi kimler görebilir",
    "questions": [
      "verilerimi kim görür",
      "gizlilik",
      "kişisel bilgiler güvende mi",
      "başka veliler görebilir mi",
      "telefonumu kim görür",
      "veri güvenliği"
    ],
    "answer": "Veriler role göre kısıtlıdır ve kulüpler birbirini göremez:\n• Veli, yalnızca kendi çocuğunun bilgilerini görür; başka velilerin ya da sporcuların bilgilerini göremez.\n• Sporcular birbirlerinin sadece ad soyad ve fotoğrafını görebilir (mesajlaşma için), telefon/adres gibi bilgileri göremez.\n• Antrenör, yalnızca atandığı grupların sporcu/veli bilgilerini görür.\n• Koordinatör kendi branşını, yönetici kendi kulübünü görür.\n• Koç notlarını sadece yönetici ve antrenörler görür.\n• Süper Admin kulüplerin üye verisine erişemez.\nDetaylı bilgi için xnetic.net/kvkk adresindeki aydınlatma metnine bak."
  },
  {
    "id": "sporcu-gorunmuyor",
    "module": "sss",
    "roles": "PS",
    "title": "\"Bağlı bir sporcu bulunamadı\" hatası",
    "questions": [
      "bağlı bir sporcu bulunamadı",
      "sporcum görünmüyor",
      "çocuğumu göremiyorum",
      "hesabım sporcuya bağlı değil",
      "\"Bağlı bir sporcu bulunamadı\" hatası ne demek?"
    ],
    "answer": "Bu, hesabının henüz bir sporcuya bağlanmadığı anlamına gelir. Sporcu kaydı açılmış olsa bile hesabın o sporcuya bağlanması yönetici (ya da koordinatör) tarafından yapılır. Kulüp yöneticine haber ver: sporcu kaydında \"Veli Giriş Hesabı\" / \"Sporcu Giriş Hesabı\" alanında senin hesabını bağlaması gerekir."
  },
  {
    "id": "foto-izin",
    "module": "sss",
    "roles": "ACPSK",
    "title": "Fotoğraf/galeri yüklenmiyor (izin)",
    "questions": [
      "fotoğraf seçemiyorum",
      "galeri izni",
      "izin gerekli",
      "fotoğraf yüklenmiyor",
      "galeriye erişim",
      "video seçemiyorum"
    ],
    "answer": "Fotoğraf ya da video seçerken \"İzin gerekli\" uyarısı çıkıyorsa telefonunun Ayarlar → X-NETIC → Fotoğraflar bölümünden galeri erişimine izin ver, sonra tekrar dene. Uygulama kameranı ve mikrofonunu kullanmaz; yalnızca galerinden seçtiğin dosyalara erişir."
  },
  {
    "id": "dosya-buyuk",
    "module": "sss",
    "roles": "AKC",
    "title": "\"Dosya çok büyük\" hatası",
    "questions": [
      "dosya çok büyük",
      "ek yüklenmiyor",
      "duyuru eki boyutu",
      "video çok büyük",
      "dosya boyutu sınırı",
      "yükleme hatası"
    ],
    "answer": "Duyuru ekleri en fazla 1 MB olabilir; daha büyük dosyalarda \"Dosya çok büyük\" uyarısı çıkar. Fotoğrafı küçültüp tekrar dene ya da ağır videoları paylaşmak yerine kısa bir sürüm/bağlantı kullan. Sosyal Alan ve etkinlik görselleri seçildiğinde uygulama tarafından otomatik küçültülür."
  },
  {
    "id": "baglanti-sorunu",
    "module": "sss",
    "roles": "ACPSKX",
    "title": "Veriler yüklenmiyor / bağlantı sorunu",
    "questions": [
      "veriler yüklenmiyor",
      "internet yok hatası",
      "ekran boş",
      "yüklenemedi hatası",
      "uygulama yavaş",
      "bağlantı hatası",
      "sayfa açılmıyor"
    ],
    "answer": "1. İnternet bağlantını (Wi-Fi ya da mobil veri) kontrol et.\n2. Listeyi aşağı çekerek yenile.\n3. Uygulamayı tamamen kapatıp yeniden aç.\n4. Sorun sürerse ve \"Bakım Çalışması\" ekranı çıkmıyorsa Profil → Yardım / Destek'ten bize yaz."
  },
  {
    "id": "islem-geri-alinamaz",
    "module": "sss",
    "roles": "AKC",
    "title": "Yanlışlıkla sildim, geri alabilir miyim",
    "questions": [
      "yanlışlıkla sildim",
      "silineni geri al",
      "geri alma",
      "silme geri alınamaz",
      "veriyi kurtar"
    ],
    "answer": "Silme işlemleri (sporcu, antrenman, grup, müsabaka, gelir/gider, duyuru vb.) genellikle KALICIDIR ve geri alınamaz; bu yüzden silmeden önce onay sorulur. Sporcu silmek yerine Pasif yapmak, antrenörü silmek yerine \"Kulüpten Çıkar\"mak geri dönülebilir seçeneklerdir. Kritik bir veriyi yanlışlıkla sildiysen Profil → Yardım / Destek'ten destek ekibine yaz."
  },
  {
    "id": "asistan-nedir",
    "module": "sss",
    "roles": "ACPSKX",
    "title": "Asistan ne işe yarar",
    "questions": [
      "asistan nedir",
      "asistan ne yapar",
      "yapay zeka mısın",
      "sen kimsin",
      "nasıl soru sorulur",
      "asistan yardım",
      "kılavuz"
    ],
    "answer": "Ben X-NETIC Asistanı: uygulamanın kullanma kılavuzuyum. Uygulamadaki her özelliğin nasıl kullanıldığını rolüne göre (yönetici, koordinatör, antrenör, veli, sporcu ya da süper admin) adım adım anlatırım. Kendi cümlenle sorabilirsin (ör. \"yoklama nasıl alınır\"), sağ üstteki \"💡 Örnek Sorular\"dan hazır bir soru seçebilir ya da \"📖 Kılavuz\"dan başlıkları tek tek gezebilirsin.\nNot: Gerçek bir yapay zeka değilim ve kulübünün kendi verilerini (ör. \"bu ay kaç sporcu geldi\") okuyup yorumlayamam; onlar için ilgili ekrana bakman gerekir. Cevabı bulamazsam en yakın başlıkları önerir, yine olmazsa Profil → Yardım / Destek'i gösteririm."
  },
  {
    "id": "hangi-ekranda",
    "module": "sss",
    "roles": "ACPSKX",
    "title": "Bir özelliği hangi ekranda bulurum",
    "questions": [
      "nerede bulurum",
      "hangi ekranda",
      "özellik nerede",
      "menüde göremiyorum",
      "bu özellik yok",
      "kutucuk görünmüyor",
      "neden göremiyorum"
    ],
    "answer": "Bir özelliği göremiyorsan üç olası sebep vardır: 1) Rolünde o özellik yoktur (ör. veli, sporcu ekranlarında yönetim düğmeleri görünmez). 2) Kulübün o özelliği kapatmıştır (Ana Sayfa Özellikleri, Günlük Check-in, Zorluk Derecesi, Kayıt Dondurma ayarlarından). 3) Henüz veri yoktur (ör. bir gruba atanmadıysan sporcu listesi boş görünür). Sorduğun özelliğin adını yaz, hangi rolde nereden ulaşıldığını söyleyeyim."
  },
  {
    "id": "veli-hesap-cikis",
    "module": "sss",
    "roles": "P",
    "title": "Birden fazla çocuğum var, hepsi tek hesapta mı",
    "questions": [
      "iki çocuğum var",
      "birden fazla çocuk",
      "kardeş",
      "ikinci çocuğu ekle",
      "tek hesapla birden fazla sporcu",
      "Birden fazla çocuğum var, hepsi tek hesapta mı?"
    ],
    "answer": "Evet. Aynı veli hesabına birden fazla sporcu bağlanabilir. Ana Sayfa → \"Sporcum\"a girdiğinde önce çocuklarının listesi gelir, sonra hangisinin profilini görmek istediğini seçersin. Yeni bir çocuğun bağlanması için kulüp yöneticinden onu senin veli hesabına bağlamasını iste."
  },
  {
    "id": "hesap-kilitlendi",
    "module": "sss",
    "roles": "ACPSKX",
    "title": "Şifreyi çok yanlış girdim / hesabım açılmıyor",
    "questions": [
      "hesabım kilitlendi",
      "giriş yapamıyorum şifre yanlış",
      "hesap devre dışı",
      "giriş reddedildi",
      "şifre kabul etmiyor",
      "şifrem yanlış diyor",
      "giriş yapamıyorum şifrem yanlış diyor",
      "şifre yanlış diyor"
    ],
    "answer": "1. Kullanıcı adı/telefon/e-postayı ve şifreyi doğru yazdığından emin ol (büyük-küçük harf önemli).\n2. Hâlâ giremiyorsan giriş ekranında \"Şifremi Unuttum\"u kullan.\n3. Hesabın devre dışı bırakılmış olabilir (ör. hesap silme talebinden sonra); kulüp yöneticinle iletişime geç."
  }
];

// "💡 Örnek Sorular" — her rol için 20 soru. id: MANUAL_ENTRIES girişi.
export const SAMPLE_QUESTIONS: Record<Audience, { id: string; q: string }[]> = {
  "A": [
    {
      "id": "sporcu-ekle",
      "q": "Yeni bir sporcu nasıl eklerim?"
    },
    {
      "id": "sporcu-hesap-baglama",
      "q": "Veliye giriş hesabı nasıl açarım?"
    },
    {
      "id": "sporcu-excel",
      "q": "Excel'den toplu sporcu nasıl aktarırım?"
    },
    {
      "id": "antrenor-gruba-ata",
      "q": "Antrenörü gruba nasıl atarım?"
    },
    {
      "id": "koordinator-ata",
      "q": "Branş koordinatörü nasıl atanır?"
    },
    {
      "id": "antrenman-ayarlari",
      "q": "Yoklama süresini nasıl değiştiririm?"
    },
    {
      "id": "aidat-plani",
      "q": "Sporcuya aidat planı nasıl oluşturulur?"
    },
    {
      "id": "kullanicilar",
      "q": "Bir kullanıcının şifresini nasıl sıfırlarım?"
    },
    {
      "id": "duyuru-yapma",
      "q": "Duyuruyu nasıl yayınlarım?"
    },
    {
      "id": "antrenor-avans",
      "q": "Antrenöre avans nasıl veririm?"
    },
    {
      "id": "antrenor-odeme-plani",
      "q": "Antrenör maaş planı nasıl oluşturulur?"
    },
    {
      "id": "banka-bilgisi",
      "q": "Velilere gösterilecek IBAN'ı nereye girerim?"
    },
    {
      "id": "etkinlik-olustur",
      "q": "Etkinlik nasıl oluşturulur?"
    },
    {
      "id": "magaza-urun-ekle",
      "q": "Mağazaya ürün nasıl eklerim?"
    },
    {
      "id": "checkin-ayar",
      "q": "Günlük check-in'i nasıl kapatırım?"
    },
    {
      "id": "rpe-ayar",
      "q": "Zorluk derecesi süresini nasıl ayarlarım?"
    },
    {
      "id": "kayit-dondurma-ayar",
      "q": "Kayıt dondurma özelliğini nasıl kapatırım?"
    },
    {
      "id": "sabit-aidat",
      "q": "Branş aidat ücretini nasıl güncellerim?"
    },
    {
      "id": "finansal-dokuman",
      "q": "Gelir gider raporunu Excel'e nasıl aktarırım?"
    },
    {
      "id": "rozet-esik",
      "q": "Rozet eşiklerini nasıl değiştiririm?"
    }
  ],
  "K": [
    {
      "id": "sporcu-ekle",
      "q": "Yeni bir sporcu nasıl eklerim?"
    },
    {
      "id": "sporcu-hesap-baglama",
      "q": "Veliye giriş hesabı nasıl açarım?"
    },
    {
      "id": "yoklama-alma",
      "q": "Yoklama nasıl alınır?"
    },
    {
      "id": "haftalik-plan",
      "q": "Haftalık antrenman planı nasıl oluştururum?"
    },
    {
      "id": "antrenman-ekle",
      "q": "Tek seferlik antrenman nasıl eklerim?"
    },
    {
      "id": "musabaka-ekle",
      "q": "Maç kadrosunu nasıl seçerim?"
    },
    {
      "id": "musabaka-sonuc",
      "q": "Maç sonucunu nasıl girerim?"
    },
    {
      "id": "antrenor-gruba-ata",
      "q": "Antrenörü gruba nasıl atarım?"
    },
    {
      "id": "salon-yetkilisi",
      "q": "Salon yetkilisi nasıl atanır?"
    },
    {
      "id": "aidat-plani",
      "q": "Sporcuya aidat planı nasıl oluşturulur?"
    },
    {
      "id": "odendi-isaretle",
      "q": "Aidatı ödendi olarak nasıl işaretlerim?"
    },
    {
      "id": "duyuru-yapma",
      "q": "Branşıma duyuru nasıl gönderirim?"
    },
    {
      "id": "rozet-esik",
      "q": "Şampiyon rozeti nasıl veririm?"
    },
    {
      "id": "olcum-toplu",
      "q": "Test grubuyla toplu ölçüm nasıl girilir?"
    },
    {
      "id": "fitness-grup-programi",
      "q": "Fitness programını nasıl yayınlarım?"
    },
    {
      "id": "etkinlik-olustur",
      "q": "Etkinlik nasıl oluştururum?"
    },
    {
      "id": "magaza-urun-ekle",
      "q": "Mağazaya ürün nasıl eklerim?"
    },
    {
      "id": "sosyal-onay",
      "q": "Sporcu paylaşımlarını nasıl onaylarım?"
    },
    {
      "id": "checkin-takip",
      "q": "Sporcuların check-in durumunu nasıl görürüm?"
    },
    {
      "id": "sifre-degistir",
      "q": "Şifremi nasıl değiştiririm?"
    }
  ],
  "C": [
    {
      "id": "yoklama-alma",
      "q": "Yoklama nasıl alınır?"
    },
    {
      "id": "yoklama-zaman-penceresi",
      "q": "Yoklama neden açılmıyor?"
    },
    {
      "id": "antrenman-ekle",
      "q": "Antrenman nasıl eklerim?"
    },
    {
      "id": "haftalik-plan",
      "q": "Haftalık antrenman planı nasıl oluştururum?"
    },
    {
      "id": "musabaka-ekle",
      "q": "Maç kadrosunu nasıl seçerim?"
    },
    {
      "id": "musabaka-sonuc",
      "q": "Maç sonucunu nasıl girerim?"
    },
    {
      "id": "sporcu-listesi",
      "q": "Sporcularımı nerede görürüm?"
    },
    {
      "id": "sporcu-ekle",
      "q": "Yeni sporcu nasıl eklerim?"
    },
    {
      "id": "sakatlik",
      "q": "Sporcunun sakatlığını nasıl bildiririm?"
    },
    {
      "id": "kocluk-notu",
      "q": "Sporcu için koç notu nasıl yazarım?"
    },
    {
      "id": "olcum-kaydet",
      "q": "Performans ölçümü nasıl kaydederim?"
    },
    {
      "id": "olcum-toplu",
      "q": "Test grubuyla toplu ölçüm nasıl girilir?"
    },
    {
      "id": "fitness-egzersiz-kaydet",
      "q": "Sporcunun kaldırdığı ağırlığı nasıl kaydederim?"
    },
    {
      "id": "fitness-grup-programi",
      "q": "Fitness programını nasıl yayınlarım?"
    },
    {
      "id": "fitness-grubu",
      "q": "Fitness grubu nasıl oluşturulur?"
    },
    {
      "id": "checkin-takip",
      "q": "Sporcuların check-in durumunu nasıl görürüm?"
    },
    {
      "id": "veli-ara",
      "q": "Veliye nasıl ulaşırım?"
    },
    {
      "id": "yoklama-durum-cesitleri",
      "q": "Geç kaldı ve raporlu ne demek?"
    },
    {
      "id": "kayit-dondurma",
      "q": "Sporcunun kaydını nasıl dondururum?"
    },
    {
      "id": "sosyal-paylas",
      "q": "Fotoğrafı nasıl paylaşırım?"
    }
  ],
  "P": [
    {
      "id": "cocugumun-profili",
      "q": "Çocuğumun profilini nasıl görürüm?"
    },
    {
      "id": "veli-hesap-cikis",
      "q": "Birden fazla çocuğum var, hepsi tek hesapta mı?"
    },
    {
      "id": "yoklama-durumu",
      "q": "Çocuğum antrenmana geldi mi nasıl görürüm?"
    },
    {
      "id": "takvim-veli-sporcu",
      "q": "Antrenman saatlerini nereden görürüm?"
    },
    {
      "id": "gelemeyecegim",
      "q": "Çocuğum antrenmana gelemeyecekse nasıl bildiririm?"
    },
    {
      "id": "veli-aidat-ode",
      "q": "Aidatı nasıl öderim?"
    },
    {
      "id": "magaza-siparis",
      "q": "Mağazadan forma nasıl sipariş ederim?"
    },
    {
      "id": "etkinlik-kayit",
      "q": "Etkinliğe nasıl kayıt yaptırırım?"
    },
    {
      "id": "etkinlik-kayitlarim",
      "q": "Etkinlik kaydımı nasıl iptal ederim?"
    },
    {
      "id": "kayit-dondurma",
      "q": "Kaydı geçici olarak nasıl dondururum?"
    },
    {
      "id": "olcum-gorme",
      "q": "Çocuğumun test sonuçlarını nereden görürüm?"
    },
    {
      "id": "mesaj-gonder",
      "q": "Antrenöre nasıl mesaj atarım?"
    },
    {
      "id": "mesaj-kimle",
      "q": "Kimlerle mesajlaşabilirim?"
    },
    {
      "id": "bildirim-zili",
      "q": "Bildirimlerimi nerede görürüm?"
    },
    {
      "id": "sifre-degistir",
      "q": "Şifremi nasıl değiştiririm?"
    },
    {
      "id": "sifremi-unuttum",
      "q": "Şifremi unuttum ne yapmalıyım?"
    },
    {
      "id": "kisisel-bilgiler",
      "q": "Telefon numaramı nasıl güncellerim?"
    },
    {
      "id": "rozet-nedir",
      "q": "Rozetler nasıl kazanılır?"
    },
    {
      "id": "destek",
      "q": "Sorun yaşarsam nereden yardım alırım?"
    },
    {
      "id": "sporcu-gorunmuyor",
      "q": "\"Bağlı bir sporcu bulunamadı\" hatası ne demek?"
    }
  ],
  "S": [
    {
      "id": "sporcu-takibi",
      "q": "Gelişimimi nereden takip ederim?"
    },
    {
      "id": "yoklama-durumu",
      "q": "Kaç antrenmana katıldığımı nasıl görürüm?"
    },
    {
      "id": "takvim-veli-sporcu",
      "q": "Antrenman ve maç takvimini nasıl görürüm?"
    },
    {
      "id": "gelemeyecegim",
      "q": "Antrenmana gelemeyeceğimi nasıl bildiririm?"
    },
    {
      "id": "checkin-doldurma",
      "q": "Günlük check-in nasıl doldurulur?"
    },
    {
      "id": "rpe-doldurma",
      "q": "Antrenman zorluk derecesini nasıl girerim?"
    },
    {
      "id": "olcum-gorme",
      "q": "Test sonuçlarımı nereden görürüm?"
    },
    {
      "id": "fitness-sporcu-bireysel",
      "q": "Bireysel fitness programı nasıl oluşturulur?"
    },
    {
      "id": "fitness-sporcu-grup-programi",
      "q": "Antrenörün yayınladığı programı nasıl tamamlarım?"
    },
    {
      "id": "beslenme-genel",
      "q": "Beslenme önerilerini nereden görürüm?"
    },
    {
      "id": "rozet-nedir",
      "q": "Rozetler nasıl kazanılır?"
    },
    {
      "id": "sosyal-paylas",
      "q": "Sosyal alana fotoğraf nasıl paylaşırım?"
    },
    {
      "id": "sosyal-onay-bekliyor",
      "q": "Paylaşımım neden görünmüyor?"
    },
    {
      "id": "mesaj-gonder",
      "q": "Antrenörüme nasıl mesaj atarım?"
    },
    {
      "id": "mesaj-kimle",
      "q": "Kimlerle mesajlaşabilirim?"
    },
    {
      "id": "bildirim-zili",
      "q": "Bildirimlerimi nerede görürüm?"
    },
    {
      "id": "takvime-ekle-kullanici",
      "q": "Antrenmanları telefon takvimime nasıl eklerim?"
    },
    {
      "id": "magaza-sporcu",
      "q": "Mağazadan neden sipariş veremiyorum?"
    },
    {
      "id": "etkinlik-gorme",
      "q": "Etkinlikleri nerede görürüm?"
    },
    {
      "id": "sifre-degistir",
      "q": "Şifremi nasıl değiştiririm?"
    }
  ],
  "X": [
    {
      "id": "sa-genel",
      "q": "Süper Admin ana sayfasında neler var?"
    },
    {
      "id": "sa-kulupler",
      "q": "Bir kulübü nasıl silerim?"
    },
    {
      "id": "sa-abonelik",
      "q": "Kulüp aboneliğini nasıl onaylarım?"
    },
    {
      "id": "sa-finans-rapor",
      "q": "X-NETIC gelir gider kaydı nasıl tutulur?"
    },
    {
      "id": "sa-duyuru",
      "q": "Tüm kulüp yöneticilerine duyuru nasıl gönderirim?"
    },
    {
      "id": "sa-kutuphane",
      "q": "Ortak egzersiz ve test kütüphanesini nasıl yönetirim?"
    },
    {
      "id": "sa-sistem-ayarlari",
      "q": "Abonelik fiyatını nasıl değiştiririm?"
    },
    {
      "id": "sa-ekranlar",
      "q": "Bir rolün ana sayfasını nasıl önizlerim?"
    },
    {
      "id": "sa-mesaj",
      "q": "Kulüp yöneticisine nasıl mesaj atarım?"
    },
    {
      "id": "giris-yapma",
      "q": "Uygulamaya nasıl giriş yaparım?"
    },
    {
      "id": "sifremi-unuttum",
      "q": "Şifremi unuttum ne yapmalıyım?"
    },
    {
      "id": "gecici-sifre",
      "q": "Geçici şifreyle ilk girişte ne olur?"
    },
    {
      "id": "biyometrik-kilit",
      "q": "Face ID neden soruyor?"
    },
    {
      "id": "bakim-modu",
      "q": "Bakım modunu nasıl açarım?"
    },
    {
      "id": "cikis-yapma",
      "q": "Nasıl çıkış yaparım?"
    },
    {
      "id": "kisisel-bilgiler",
      "q": "Kişisel bilgilerimi nasıl güncellerim?"
    },
    {
      "id": "giris-bilgisi-degistir",
      "q": "Giriş e-postamı nasıl değiştiririm?"
    },
    {
      "id": "sifre-degistir",
      "q": "Şifremi nasıl değiştiririm?"
    },
    {
      "id": "destek",
      "q": "Sorun yaşarsam nereden yardım alırım?"
    },
    {
      "id": "roller-ozet",
      "q": "Hangi rol ne yapabilir?"
    }
  ]
};

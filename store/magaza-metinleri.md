# X-NETIC — Mağaza Metinleri ve Form Cevapları

App Store Connect ve Google Play Console'a kopyalanacak metinler. Yayıncı: bireysel hesap (şirket yok).

## Temel bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı | X-NETIC |
| Paket adı / Bundle ID | `club.xnetic.app` |
| Ana dil | Türkçe |
| Kategori (ana) | İş / Business (Play: İş; alternatif Spor) |
| Kategori (ikincil, Apple) | Spor |
| Destek e-postası | destek@xnetic.net |
| Destek / Pazarlama URL | https://xnetic.net |
| Gizlilik Politikası URL | https://xnetic.net/kvkk |
| Hesap silme URL (Play zorunlu) | https://xnetic.net/kvkk#hesap-silme |

## Apple

**Alt başlık (30 karakter):** `Spor Kulübü Yönetim Sistemi`

**Anahtar kelimeler (100 karakter, virgülle):**
`spor kulübü,yoklama,aidat,antrenör,sporcu,veli,antrenman,müsabaka,takvim,performans,kulüp yönetimi`

**Promosyon metni (170 karakter):**
`Spor kulübünün yoklama, aidat, antrenman ve veli iletişimi tek uygulamada. Kulübünü kolayca yönet, sporcuların gelişimini takip et.`

## Kısa açıklama (Google Play, 80 karakter)

`Spor kulüpleri için yoklama, aidat, takvim ve veli iletişimi tek uygulamada.`

## Uzun açıklama (her iki mağaza)

```
X-NETIC, spor kulüplerinin günlük işleyişini tek bir uygulamada toplar. Kulüp yöneticisi, antrenör, veli ve sporcu — herkes yalnızca kendisini ilgilendiren bilgiyi görür.

KULÜP YÖNETİCİLERİ VE ANTRENÖRLER İÇİN
• Yoklama: Antrenman günü tek dokunuşla yoklama al, devamsızlıkları takip et.
• Takvim: Antrenman ve müsabakaları planla; haftalık programı otomatik oluştur.
• Sporcu ve grup yönetimi: Branş, grup, salon ve sporcuları düzenle; Excel'den toplu aktar.
• Aidat ve finans: Aidat planlarını yönet, ödemeleri takip et, gelir-gider raporunu al.
• Antrenör kadrosu: Atamalar, izinler, maaş planı ve avanslar.
• Performans: Sürat, sıçrama, kuvvet gibi testlerle sporcunun gelişimini ölç; fitness programları yayınla.
• Duyurular ve mesajlaşma: Doğru kişilere anında bildirim gönder.

VELİLER İÇİN
• Çocuğunun antrenman takvimini, yoklamasını ve gelişimini gör.
• Antrenmana gelemeyeceğini tek dokunuşla antrenöre bildir.
• Aidat ödeme bildirimi yap, makbuzuna ulaş.
• Kulüp mağazasından ürün sipariş et, etkinliklere kayıt yaptır.

SPORCULAR İÇİN
• Takvim, ölçüm sonuçları ve gelişim grafiği.
• Günlük check-in ve antrenman zorluk değerlendirmesi.
• Bireysel fitness programı, beslenme rehberi ve rozetler.

ASİSTAN
Uygulamanın içindeki Asistan, kullanma kılavuzu olarak her özelliğin nasıl kullanıldığını rolüne göre adım adım anlatır.

GİZLİLİK VE GÜVENLİK
• Kulüpler birbirinden tamamen ayrıdır; veriler rol bazında sınırlandırılır.
• Çocukların verileri veli onayıyla işlenir; KVKK'ya uygun aydınlatma metni uygulama içinde sunulur.
• Face ID / parmak izi ile uygulama kilidi.

Not: X-NETIC bir kulüp yönetim yazılımıdır. Hesaplar kulüp yöneticisi tarafından açılır; yeni kulüp kaydı için xnetic.net adresini ziyaret edin.
```

## Yaş derecelendirmesi (öneri)

- Şiddet, cinsellik, kumar, alkol/uyuşturucu, korku: **Yok**
- Kullanıcı tarafından oluşturulan içerik (mesaj, fotoğraf paylaşımı): **Var** — kapalı kulüp topluluğu, antrenör/yönetici onayı ve silme yetkisi mevcut
- Apple önerisi: **4+ / 9+**; uygulama hedef kitlesi yönetici ve veliler olduğu için "Çocuklara yönelik (Kids)" kategorisi **seçilmez**
- Google Play hedef kitle: **18+ (yetişkinler)**; sporcu hesaplarını çocuklar da kullanabildiği için "Aile Politikası" sorularında bu durumu dürüstçe belirt

## Apple — Gizlilik Beslenme Etiketleri ("App Privacy")

**Takip (Tracking): HAYIR** — reklam SDK'sı, üçüncü taraf analitik, IDFA yok.

Toplanan veriler (hepsi "Uygulama İşlevselliği" amaçlı, kullanıcıya bağlı, takip için KULLANILMAZ):

| Veri türü | Ayrıntı |
|---|---|
| İletişim bilgisi | Ad, e-posta, telefon, adres |
| Kullanıcı içeriği | Fotoğraflar/videolar, mesajlar, duyurular, sosyal paylaşımlar |
| Sağlık ve fitness | Performans ölçümleri, günlük check-in (uyku, enerji), sakatlık kayıtları, fitness verisi |
| Tanımlayıcılar | Kullanıcı kimliği, cihaz push token'ı |
| Satın alma | Mağaza siparişleri (uygulama içi ödeme YOK; havale/elden) |
| Finansal bilgi | Aidat ödeme kayıtları (kart bilgisi TOPLANMAZ) |
| Tanılama | Çökme kayıtları (Sentry) |
| Konum | Toplanmaz |
| Diğer | Doğum tarihi |

## Google Play — Veri Güvenliği Formu

- Veri toplanıyor: **Evet**
- Veri paylaşımı (üçüncü taraflarla): **Hayır** (Supabase, Expo, Sentry, Resend hizmet sağlayıcıdır; satılmaz/reklam için paylaşılmaz)
- Aktarımda şifreleme: **Evet (HTTPS)**
- Veri silme talebi: **Evet** — uygulama içinden (Profil → Hesabımı Sil) ve URL ile
- Toplanan veri türleri: Ad, e-posta, telefon, adres, doğum tarihi; fotoğraf/video; mesajlar; sağlık ve fitness bilgileri; kullanıcı kimliği/cihaz kimliği; satın alma geçmişi; çökme günlükleri
- Uygulama izinleri gerekçesi:
  - **Fotoğraflar/Depolama:** profil, ürün ve paylaşım fotoğrafı seçmek için
  - **Takvim (okuma/yazma):** antrenman ve müsabakaları kullanıcının takvimine eklemek için
  - **Biyometrik:** uygulama kilidi için
  - **Bildirimler:** duyuru ve hatırlatmalar için

## Apple — İnceleme notları (App Review Information)

> ⚠️ Kullanıcı adı/şifreleri son adımda demo hesap oluşturulunca doldurulacak.

```
X-NETIC bir spor kulübü yönetim uygulamasıdır. Hesaplar kulüp yöneticisi tarafından açıldığı için uygulama içinde kayıt ekranı yoktur; aşağıdaki hazır demo hesaplarla giriş yapabilirsiniz (kullanıcı adı alanına yazın):

Kulüp Yöneticisi : [KULLANICI ADI] / [ŞİFRE]
Antrenör         : [KULLANICI ADI] / [ŞİFRE]
Veli             : [KULLANICI ADI] / [ŞİFRE]
Sporcu           : [KULLANICI ADI] / [ŞİFRE]

Giriş ekranında bot koruması (Cloudflare Turnstile) vardır; gerçek bir kullanıcı olarak geçilir.

Ödeme: Uygulama içinde dijital ürün/abonelik satışı YOKTUR. Kulüp abonelikleri xnetic.net üzerinden kurumlar arası (B2B) yapılır; uygulama içinde fiyat, ödeme bağlantısı ya da satın alma yönlendirmesi bulunmaz. Aidat/mağaza/etkinlik ödemeleri kulübün kendi gerçek dünya hizmetleri içindir (havale/EFT veya elden); kart ile ödeme alınmaz.

Kullanıcı içeriği: Mesajlaşma ve sosyal paylaşım yalnızca aynı kulübün üyeleri arasındadır (kapalı topluluk). Sporcu paylaşımları antrenör/yönetici onayından geçer; yönetici içeriği silebilir ve hesabı devre dışı bırakabilir. Destek: destek@xnetic.net

Hesap silme: Profil → "Hesabımı Sil" talep gönderir; kulüp yönetimi/X-NETIC ekibi 30 gün içinde işler. Ayrıca https://xnetic.net/kvkk sayfasında anlatılmıştır.

Kamera/mikrofon kullanılmaz. Galeri (fotoğraf seçimi), takvim (etkinlik ekleme) ve Face ID (uygulama kilidi) kullanılır.
```

## Google Play — İçerik notları

- Kullanıcı hesabı gerektiriyor: **Evet** → "Uygulama erişim talimatları" bölümüne yukarıdaki demo hesapları gir.
- Reklam içeriyor: **Hayır**
- Sağlık uygulaması beyanı: Tıbbi cihaz/teşhis değil; performans ve günlük takip amaçlı.

## Bireysel hesabın sonuçları

- **Apple:** "Satıcı" adı olarak kişisel adın gösterilir (şirket adı değil). Adres ve telefon Apple'a verilir; herkese görünmez.
- **Google Play:** Yeni bireysel geliştirici hesaplarında üretime çıkmadan önce **en az 12 test kullanıcısıyla 14 gün kesintisiz kapalı test** zorunludur. Ayrıca AB'de ticari (trader) beyanı yapılıyorsa iletişim bilgileri mağaza sayfasında herkese görünür.
- **KDV/vergi:** Uygulama içi satış olmadığı için mağaza ödemesi yok; vergi formları sadece hesap açılışında istenir.

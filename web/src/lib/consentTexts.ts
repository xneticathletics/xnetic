// Kulüp Oluştur akışında (CreateClubPage.tsx) kulübü kuran kişi, kulübün
// ilk "club_admin"ı oluyor — mobildeki src/lib/consentTexts.ts'teki
// "staff" (personel) metinleriyle birebir aynı, sadece bu tek dosyada
// (mobil/web ayrı proje, ortak paylaşılamıyor — bu projenin genel deseni).
//
// NOT: Bu metinler genel bir taslak olarak hazırlanmıştır, yürürlüğe
// koymadan önce bir hukuk danışmanına onaylatılması önerilir.
export type ConsentSection = { title: string; body: (clubName: string) => string };

export const CLUB_ADMIN_CONSENT_SECTIONS: ConsentSection[] = [
  {
    title: "KVKK Aydınlatma Metni ve Açık Rıza Beyanı",
    body: (clubName) => `KİŞİSEL VERİLERİN KORUNMASI KANUNU KAPSAMINDA PERSONEL AYDINLATMA METNİ VE TAAHHÜDÜ

1. Veri Sorumlusu
${clubName} ("Kulüp"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca "Veri Sorumlusu" sıfatıyla, kulüp yöneticisi olarak sizin kişisel verilerinizi aşağıda açıklanan kapsamda işlemektedir.

2. İşlenen Kişisel Verileriniz
Kulüp; ad-soyad, iletişim bilgileri (telefon, e-posta), fotoğraf, görev bilgisi ile varsa ödeme bilgilerinizi işlemektedir.

3. İşlenme Amaçları
Verileriniz; hesabınızın oluşturulması ve kulüp yönetim panelinin kullandırılması, iletişimin sağlanması, abonelik/ödeme süreçlerinin yönetilmesi, yasal yükümlülüklerin yerine getirilmesi ve platform faaliyetlerinin planlanması amaçlarıyla işlenmektedir.

4. KVKK Madde 11 Kapsamındaki Haklarınız
KVKK'nın 11. maddesi uyarınca kişisel verinizin işlenip işlenmediğini öğrenme, buna ilişkin bilgi talep etme, düzeltilmesini/silinmesini isteme ve kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme haklarına sahipsiniz.

5. Sporcu/Veli Verilerine Erişiminiz Hakkında Önemli Not
Kulüp admini olarak, kulübünüze kaydettiğiniz sporcu ve velilere ait kişisel veriye — ve antrenörleriniz aracılığıyla sağlık verisi gibi özel nitelikli kişisel veriye — erişebilirsiniz. Bu verilerin KVKK'ya uygun şekilde, yalnızca kulüp yönetimi amacınızla sınırlı olarak kullanılması ve yetkisiz üçüncü kişilere aktarılmaması sizin sorumluluğunuzdadır.

6. Beyan
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; kendi kişisel verilerimin yukarıda belirtilen amaç ve kapsamla işlenmesine açık rızam olduğunu ve kulüp adına erişeceğim sporcu/veli verilerini KVKK'ya uygun şekilde koruyacağımı beyan ve taahhüt ederim.`,
  },
  {
    title: "Sporcu Sağlık Verilerine Erişim — Gizlilik Taahhüdü",
    body: (clubName) => `SPORCU SAĞLIK VERİLERİNE ERİŞİM — GİZLİLİK TAAHHÜDÜ

${clubName} yönetimi sırasında, kulübünüze kayıtlı sporculara ait kan grubu, sakatlık geçmişi, alerji, kronik rahatsızlık ve ilaç kullanımı gibi özel nitelikli sağlık verilerine erişebilirsiniz. Bu veriler KVKK'nın 6. maddesi uyarınca özel nitelikli kişisel veri olup, sporcunun/velisinin açık rızasıyla ve sınırlı amaçlarla toplanmıştır.

Bu verilere yalnızca; sporcuya olası bir sağlık sorununda doğru müdahale edilebilmesi, antrenman programının planlanması ve sakatlık takibi amaçlarıyla erişebilir, bu amaçlar dışında kullanamaz, acil durum dışında hiçbir üçüncü kişi veya kurumla paylaşamazsınız.

Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; erişebileceğim sporcu sağlık verilerini yukarıdaki ilkelere uygun şekilde, gizlilik içinde kullanacağımı beyan ve taahhüt ederim.`,
  },
  {
    title: "Fotoğraf ve Video Kullanım İzni",
    body: (clubName) => `FOTOĞRAF VE VİDEO KULLANIM İZNİ

${clubName} tarafından düzenlenen etkinlikler sırasında görevli olarak yer aldığınız fotoğraf ve videolar; kulübün sosyal medya hesapları, internet sitesi, tanıtım materyalleri ve bu uygulama içindeki paylaşımlarda kullanılabilir. Bu izni istediğiniz zaman kulüp yönetim panelinden geri alabilirsiniz.

Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; görüntü ve seslerimin belirtilen amaç ve kapsamla kullanılmasına izin verdiğimi beyan ederim.`,
  },
  {
    title: "Görev ve Kurallara Uyum Beyanı",
    body: (clubName) => `GÖREV VE KURALLARA UYUM BEYANI

${clubName} kulüp yöneticisi olarak, platformun kullanım şartlarına ve kulüp üyelerinin (sporcu, veli, antrenör) kişisel verilerinin korunmasına ilişkin yükümlülüklere uyacağımı kabul ederim. Kulüp adına platforma girdiğim/kaydettiğim tüm bilgilerin doğruluğundan sorumlu olduğumu beyan ederim.`,
  },
];

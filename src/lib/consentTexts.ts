import type { ConsentType } from "./api/consents";

export type ConsentText = {
  type: ConsentType;
  title: string;
  summary: string;
  body: (clubName: string) => string;
};

// NOT: Bu metinler 6698 sayılı KVKK'nın standart aydınlatma metni
// yapısına (veri sorumlusunun kimliği, işlenen veri, işleme amacı,
// aktarım, toplama yöntemi/hukuki sebep, ilgili kişinin hakları) uygun
// genel bir taslak olarak hazırlanmıştır. Kulübün gerçek veri işleme
// süreçlerine göre (ör. hangi hizmet sağlayıcılarla veri paylaşıldığı)
// güncellenmesi ve yürürlüğe koymadan önce bir hukuk danışmanına
// onaylatılması önerilir.
export const CONSENT_TEXTS: ConsentText[] = [
  {
    type: "kvkk",
    title: "KVKK Aydınlatma Metni ve Açık Rıza Beyanı",
    summary: "Kişisel verilerinizin ve çocuğunuzun kişisel verilerinin nasıl işlendiğine dair bilgilendirme.",
    body: (clubName) => `KİŞİSEL VERİLERİN KORUNMASI KANUNU KAPSAMINDA AYDINLATMA METNİ VE AÇIK RIZA BEYANI

1. Veri Sorumlusu
${clubName} ("Kulüp"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca "Veri Sorumlusu" sıfatıyla, sizin ve velisi/vasisi olduğunuz sporcunun kişisel verilerini aşağıda açıklanan kapsamda işlemektedir.

2. İşlenen Kişisel Veriler
Kulüp; ad-soyad, T.C. kimlik bilgisi (varsa), doğum tarihi, iletişim bilgileri (telefon, e-posta, adres), fotoğraf, veli/iletişim bilgileri, spor branşı ve grup bilgisi, antrenman/müsabaka katılım (yoklama) kayıtları, performans ve ölçüm verileri, aidat ve ödeme bilgileri ile bu Aydınlatma Metni'nden ayrı olarak açık rızanız alınan sağlık verisi ve fotoğraf/video kullanım verilerini işlemektedir.

3. Kişisel Verilerin İşlenme Amaçları
Kişisel verileriniz; sporcu kaydının oluşturulması ve üyelik süreçlerinin yürütülmesi, antrenman/müsabaka programının planlanması ve yoklamanın tutulması, aidat/ödeme süreçlerinin yönetilmesi, veli-antrenör-kulüp arasında iletişimin sağlanması, kulüp içi duyuru ve bilgilendirmelerin iletilmesi, yasal yükümlülüklerin yerine getirilmesi ve kulüp faaliyetlerinin planlanması/geliştirilmesi amaçlarıyla işlenmektedir.

4. Kişisel Verilerin Aktarılması
Kişisel verileriniz; yalnızca yukarıdaki amaçların gerçekleştirilmesiyle sınırlı olarak, kulüp yöneticileri, ilgili branş antrenörleri ve koordinatörü, hizmet aldığımız teknoloji/altyapı sağlayıcıları (uygulamanın çalıştığı sunucu/veritabanı hizmeti dahil) ve yasal olarak bilgi vermekle yükümlü olduğumuz resmi kurum ve kuruluşlarla, KVKK'da öngörülen şartlara uygun olarak paylaşılabilecektir. Verileriniz kulübün ticari amaçlarla üçüncü taraflarla paylaşılmaz veya satılmaz.

5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi
Kişisel verileriniz, bu mobil uygulama üzerinden doğrudan sizin tarafınızdan girilmesi ya da kulüp yetkilileri tarafından kaydedilmesi suretiyle, elektronik ortamda toplanmaktadır. Verileriniz; bir sözleşmenin (üyelik/hizmet ilişkisi) kurulması ve ifası, kulübün hukuki yükümlülüklerini yerine getirmesi ve KVKK madde 5'te belirtilen diğer hukuki sebeplere dayanılarak işlenmekte; kanunda açık rıza aranan hâllerde ise ayrıca açık rızanız alınmaktadır.

6. KVKK Madde 11 Kapsamındaki Haklarınız
KVKK'nın 11. maddesi uyarınca; kişisel verinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, KVKK'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme, düzeltme/silme işlemlerinin verinin aktarıldığı üçüncü kişilere bildirilmesini isteme, işlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz. Bu haklarınızı kullanmak için kulüp yönetimiyle iletişime geçebilirsiniz.

7. Açık Rıza Beyanı
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; kendime ve/veya velisi/vasisi olduğum sporcuya ait kişisel verilerin, yukarıda belirtilen amaçlarla ve kapsamla ${clubName} tarafından işlenmesine ve gerektiğinde ilgili taraflarla paylaşılmasına açık rızam olduğunu beyan ederim.`,
  },
  {
    type: "saglik",
    title: "Sağlık Verisi İşleme İzni",
    summary: "Kan grubu, sakatlık geçmişi gibi özel nitelikli sağlık verilerinin işlenmesine izin.",
    body: (clubName) => `SAĞLIK VERİLERİNİN İŞLENMESİNE İLİŞKİN AÇIK RIZA METNİ

KVKK'nın 6. maddesi uyarınca sağlık verileri "özel nitelikli kişisel veri" kategorisinde yer almakta olup, ancak açık rızanızın bulunması hâlinde işlenebilmektedir.

1. İşlenen Sağlık Verileri
${clubName}, velisi/vasisi olduğunuz sporcunun kan grubu, geçmiş/mevcut sakatlık ve tedavi bilgileri, bilinen alerjileri, kronik rahatsızlıkları ve varsa kullandığı düzenli ilaçlar ile antrenman/müsabaka sırasında sağlık durumuna dair kaydedilen diğer bilgileri işleyebilir.

2. İşleme Amacı
Bu veriler yalnızca; olası bir sağlık sorunu veya kaza anında sporcuya doğru ve hızlı müdahale edilebilmesi, antrenörlerin sporcunun fiziksel kapasitesine uygun bir program planlayabilmesi, sakatlık geçmişinin takip edilerek tekrarlayan sakatlıkların önlenmesi ve gerekli hâllerde sağlık kuruluşlarına doğru bilgi aktarılabilmesi amaçlarıyla işlenir. Bu veriler kulübün ticari amaçlarla kullanılmaz, reklam/pazarlama faaliyetlerinde değerlendirilmez.

3. Erişim ve Paylaşım
Sağlık verilerine yalnızca ilgili sporcunun antrenörleri, branş koordinatörü ve kulüp yönetimi, yukarıdaki amaçlarla sınırlı olarak erişebilir. Bu veriler, acil bir sağlık durumunda müdahale edecek sağlık personeli/kurumu dışında üçüncü kişilerle paylaşılmaz.

4. Rıza ve Geri Alma Hakkı
Bu verilerin işlenmesine ilişkin rızanızı istediğiniz zaman, kulüp yönetimine yazılı olarak bildirerek geri alabilirsiniz; ancak bu durumda kulübün, sporcunun sağlık durumuna dair bilgi sahibi olamaması nedeniyle bazı hizmetleri (ör. sakatlık geçmişi takibi) sunamayabileceğini kabul edersiniz.

5. Açık Rıza Beyanı
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; velisi/vasisi olduğum sporcuya ait sağlık verilerinin, yukarıda belirtilen amaç ve kapsamla ${clubName} tarafından işlenmesine açık rızam olduğunu beyan ederim.`,
  },
  {
    type: "foto_video",
    title: "Fotoğraf ve Video Kullanım İzni",
    summary: "Antrenman/müsabaka fotoğraf-videolarının kulüp tanıtımında kullanılmasına izin.",
    body: (clubName) => `FOTOĞRAF VE VİDEO KULLANIM İZNİ

1. Kapsam
${clubName} tarafından düzenlenen antrenman, müsabaka, tören ve kulüp etkinlikleri sırasında, velisi/vasisi olduğunuz sporcunun yer aldığı fotoğraf ve videolar çekilebilir.

2. Kullanım Amaçları
Bu görsel ve işitsel içerikler; kulübün sosyal medya hesapları, internet sitesi, tanıtım/afiş/broşür gibi basılı-dijital materyalleri, bu mobil uygulama içindeki grup/etkinlik paylaşımları ve kulüp arşivi oluşturma amaçlarıyla kullanılabilir. Bu içerikler kulübün amaçları dışında, üçüncü kişi/kurumların ticari reklam faaliyetlerinde kullanılmaz.

3. İtiraz ve Geri Alma Hakkı
Bu izni istediğiniz zaman kulüp yönetimine bildirerek geri alabilirsiniz; bu durumda, daha önce paylaşılmış içerikler makul bir süre içinde kaldırılır, ancak halihazırda üçüncü kişilerce paylaşılmış/kaydedilmiş içerikler üzerinde kulübün kontrolü sınırlı olabilir.

4. Onay/Ret
Bu izni vermemeniz durumunda sporcu kulüp faaliyetlerine katılmaya devam edebilir; ancak bu tercihinizi belirtmek için kulüp yönetimiyle ayrıca iletişime geçmeniz ve sporcunun görsellerde yer almaması için makul tedbirlerin alınmasını talep etmeniz gerekir.

5. Beyan
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; velisi/vasisi olduğum sporcunun görüntü ve seslerinin, yukarıda belirtilen amaç ve kapsamla ${clubName} tarafından kullanılmasına izin verdiğimi beyan ederim.`,
  },
  {
    type: "sorumluluk",
    title: "Sorumluluk Beyanı",
    summary: "Sporun getirdiği fiziksel risklerin kabulü ve kulübün sorumluluk sınırına dair beyan.",
    body: (clubName) => `SPORCU KATILIM VE SORUMLULUK BEYANI

1. Riskin Kabulü
Her türlü sportif faaliyetin, doğası gereği düşme, çarpışma, burkulma, kas-eklem yaralanmaları gibi fiziksel riskler taşıdığını biliyor ve velisi/vasisi olduğum sporcunun ${clubName} bünyesindeki antrenman, müsabaka ve etkinliklere bu riskleri kabul ederek katıldığını beyan ederim.

2. Sağlık Beyanı
Velisi/vasisi olduğum sporcunun bilgim dahilinde, sportif faaliyete katılımına engel teşkil edecek bilinen bir sağlık sorunu bulunmadığını; varsa bu tür durumları (Sağlık Verisi İşleme İzni kapsamında) kulübe eksiksiz bildirdiğimi beyan ederim. Sporcunun sağlık durumunda meydana gelecek değişiklikleri kulüp yönetimine bildirmeyi taahhüt ederim.

3. Kulübün Sorumluluğu
${clubName}, antrenörleri aracılığıyla gerekli özeni göstererek güvenli bir antrenman ortamı sağlamayı taahhüt eder. Buna rağmen, sporun doğasından kaynaklanan ve makul özenin gösterilmesine rağmen önlenemeyen kaza/yaralanmalardan kulübün sorumlu tutulamayacağını kabul ederim. Bu beyan, kulübün kusurundan kaynaklanan sorumluluğunu ortadan kaldırmaz.

4. Sigorta
Kulübün sporculara yönelik ayrı bir spor kazaları sigortası bulunmuyorsa (bu husus kulüp yönetiminden ayrıca teyit edilmelidir), olası bir kaza/yaralanma durumunda tedavi giderlerinin veli/vasi tarafından karşılanacağını, genel sağlık sigortası kapsamının bu duruma dahil olup olmadığını kendi sorumluluğumda takip edeceğimi kabul ederim.

5. Acil Durum
Acil bir sağlık durumunda, kendime derhal ulaşılamaması hâlinde, sporcuya en yakın sağlık kuruluşunda gerekli ilk müdahalenin/tedavinin yapılmasına onay verdiğimi beyan ederim.

6. Beyan
Yukarıdaki maddeleri okuduğumu, anladığımı ve velisi/vasisi olduğum sporcu adına kabul ettiğimi beyan ederim.`,
  },
];

export function getConsentText(type: ConsentType): ConsentText {
  const found = CONSENT_TEXTS.find((c) => c.type === type);
  if (!found) throw new Error(`Bilinmeyen onay türü: ${type}`);
  return found;
}

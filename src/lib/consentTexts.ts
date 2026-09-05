import type { ConsentType } from "./api/consents";
import type { UserRole } from "../context/AuthContext";

export type ConsentText = {
  type: ConsentType;
  title: string;
  summary: string;
  body: (clubName: string) => string;
};

// Onay metinleri artık role göre farklılaşıyor — veli/vasi (kendisi ve
// çocuğu için rıza veriyor), sporcu (kendi hesabıyla giren, reşit sporcu —
// kendisi için rıza veriyor) ve personel (antrenör/kulüp admini — hem kendi
// verisi işleniyor hem de görevi gereği sporcuların verisine erişiyor,
// bu yüzden metinleri bir gizlilik/erişim taahhüdü şeklinde). super_admin
// bu ekranı hiç görmüyor (bkz. RootNavigator.tsx).
export type ConsentRoleBucket = "parent" | "athlete" | "staff";

export function roleToConsentBucket(role: UserRole): ConsentRoleBucket {
  if (role === "parent") return "parent";
  if (role === "athlete") return "athlete";
  return "staff"; // coach, club_admin
}

// NOT: Bu metinler 6698 sayılı KVKK'nın standart aydınlatma metni
// yapısına (veri sorumlusunun kimliği, işlenen veri, işleme amacı,
// aktarım, toplama yöntemi/hukuki sebep, ilgili kişinin hakları) uygun
// genel bir taslak olarak hazırlanmıştır. Kulübün gerçek veri işleme
// süreçlerine göre (ör. hangi hizmet sağlayıcılarla veri paylaşıldığı)
// güncellenmesi ve yürürlüğe koymadan önce bir hukuk danışmanına
// onaylatılması önerilir. Personel (antrenör/kulüp admini) metinleri bu
// oturumda ilk kez eklendi — bunlar için TEMPLATE dahi değil, sıfırdan
// yazılmış taslaktır; hukuki incelemesi ayrıca gereklidir.
const KVKK_BY_BUCKET: Record<ConsentRoleBucket, (clubName: string) => string> = {
  parent: (clubName) => `KİŞİSEL VERİLERİN KORUNMASI KANUNU KAPSAMINDA AYDINLATMA METNİ VE AÇIK RIZA BEYANI

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

  athlete: (clubName) => `KİŞİSEL VERİLERİN KORUNMASI KANUNU KAPSAMINDA AYDINLATMA METNİ VE AÇIK RIZA BEYANI

1. Veri Sorumlusu
${clubName} ("Kulüp"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca "Veri Sorumlusu" sıfatıyla, kişisel verilerinizi aşağıda açıklanan kapsamda işlemektedir.

2. İşlenen Kişisel Veriler
Kulüp; ad-soyad, T.C. kimlik bilgisi (varsa), doğum tarihi, iletişim bilgileri (telefon, e-posta, adres), fotoğraf, spor branşı ve grup bilgisi, antrenman/müsabaka katılım (yoklama) kayıtları, performans ve ölçüm verileri, aidat ve ödeme bilgileri ile bu Aydınlatma Metni'nden ayrı olarak açık rızanız alınan sağlık verisi ve fotoğraf/video kullanım verilerini işlemektedir.

3. Kişisel Verilerin İşlenme Amaçları
Kişisel verileriniz; sporcu kaydının oluşturulması ve üyelik süreçlerinin yürütülmesi, antrenman/müsabaka programının planlanması ve yoklamanın tutulması, aidat/ödeme süreçlerinin yönetilmesi, antrenör-kulüp arasında iletişimin sağlanması, kulüp içi duyuru ve bilgilendirmelerin iletilmesi, yasal yükümlülüklerin yerine getirilmesi ve kulüp faaliyetlerinin planlanması/geliştirilmesi amaçlarıyla işlenmektedir.

4. Kişisel Verilerin Aktarılması
Kişisel verileriniz; yalnızca yukarıdaki amaçların gerçekleştirilmesiyle sınırlı olarak, kulüp yöneticileri, ilgili branş antrenörleri ve koordinatörü, hizmet aldığımız teknoloji/altyapı sağlayıcıları (uygulamanın çalıştığı sunucu/veritabanı hizmeti dahil) ve yasal olarak bilgi vermekle yükümlü olduğumuz resmi kurum ve kuruluşlarla, KVKK'da öngörülen şartlara uygun olarak paylaşılabilecektir. Verileriniz kulübün ticari amaçlarla üçüncü taraflarla paylaşılmaz veya satılmaz.

5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi
Kişisel verileriniz, bu mobil uygulama üzerinden doğrudan sizin tarafınızdan girilmesi ya da kulüp yetkilileri tarafından kaydedilmesi suretiyle, elektronik ortamda toplanmaktadır. Verileriniz; bir sözleşmenin (üyelik/hizmet ilişkisi) kurulması ve ifası, kulübün hukuki yükümlülüklerini yerine getirmesi ve KVKK madde 5'te belirtilen diğer hukuki sebeplere dayanılarak işlenmekte; kanunda açık rıza aranan hâllerde ise ayrıca açık rızanız alınmaktadır.

6. KVKK Madde 11 Kapsamındaki Haklarınız
KVKK'nın 11. maddesi uyarınca; kişisel verinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, KVKK'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme, düzeltme/silme işlemlerinin verinin aktarıldığı üçüncü kişilere bildirilmesini isteme, işlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz. Bu haklarınızı kullanmak için kulüp yönetimiyle iletişime geçebilirsiniz.

7. Açık Rıza Beyanı
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; kendime ait kişisel verilerin, yukarıda belirtilen amaçlarla ve kapsamla ${clubName} tarafından işlenmesine ve gerektiğinde ilgili taraflarla paylaşılmasına açık rızam olduğunu beyan ederim.`,

  staff: (clubName) => `KİŞİSEL VERİLERİN KORUNMASI KANUNU KAPSAMINDA PERSONEL AYDINLATMA METNİ VE TAAHHÜDÜ

1. Veri Sorumlusu
${clubName} ("Kulüp"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca "Veri Sorumlusu" sıfatıyla, kulüp bünyesinde görev yapan personel (antrenör/kulüp yöneticisi) olarak sizin kişisel verilerinizi aşağıda açıklanan kapsamda işlemektedir.

2. İşlenen Kişisel Verileriniz
Kulüp; ad-soyad, T.C. kimlik bilgisi (varsa), iletişim bilgileri (telefon, e-posta), fotoğraf, görev/branş bilgisi ile varsa ücret/hakediş ve ödeme bilgilerinizi işlemektedir.

3. İşlenme Amaçları
Verileriniz; görevlendirme ve kulüp içi organizasyonun yürütülmesi, iletişimin sağlanması, varsa ücret/hakediş süreçlerinin yönetilmesi, yasal yükümlülüklerin yerine getirilmesi ve kulüp faaliyetlerinin planlanması amaçlarıyla işlenmektedir. Veri toplamanın yöntemi ve hukuki sebebi, hizmet ilişkisinin kurulması/ifası ile KVKK madde 5'te belirtilen diğer hukuki sebeplerdir.

4. KVKK Madde 11 Kapsamındaki Haklarınız
KVKK'nın 11. maddesi uyarınca kişisel verinizin işlenip işlenmediğini öğrenme, buna ilişkin bilgi talep etme, düzeltilmesini/silinmesini isteme ve kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme haklarına sahipsiniz; bu haklarınızı kulüp yönetimiyle iletişime geçerek kullanabilirsiniz.

5. Sporcu Verilerine Erişiminiz Hakkında Önemli Not
Görevinizi ifa ederken sporculara ve velilerine ait kişisel veriye (iletişim bilgisi) ve — yalnızca antrenörlük görevi gerektiriyorsa — sağlık verisi gibi özel nitelikli kişisel veriye erişebilirsiniz. Bu verilerin KVKK'ya uygun şekilde, yalnızca görev amacınızla sınırlı olarak kullanılması ve hiçbir şekilde kulüp dışına, yetkisiz üçüncü kişilere aktarılmaması veya kişisel/ticari amaçla kullanılmaması zorunludur.

6. Beyan
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; kendi kişisel verilerimin yukarıda belirtilen amaç ve kapsamla ${clubName} tarafından işlenmesine açık rızam olduğunu ve görevim gereği erişebileceğim sporcu/veli verilerini yukarıdaki ilkelere uygun şekilde koruyacağımı beyan ve taahhüt ederim.`,
};

const SAGLIK_BY_BUCKET: Record<ConsentRoleBucket, (clubName: string) => string> = {
  parent: (clubName) => `SAĞLIK VERİLERİNİN İŞLENMESİNE İLİŞKİN AÇIK RIZA METNİ

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

  athlete: (clubName) => `SAĞLIK VERİLERİNİN İŞLENMESİNE İLİŞKİN AÇIK RIZA METNİ

KVKK'nın 6. maddesi uyarınca sağlık verileri "özel nitelikli kişisel veri" kategorisinde yer almakta olup, ancak açık rızanızın bulunması hâlinde işlenebilmektedir.

1. İşlenen Sağlık Verileri
${clubName}, kan grubunuzu, geçmiş/mevcut sakatlık ve tedavi bilgilerinizi, bilinen alerjilerinizi, kronik rahatsızlıklarınızı ve varsa kullandığınız düzenli ilaçlar ile antrenman/müsabaka sırasında sağlık durumunuza dair kaydedilen diğer bilgileri işleyebilir.

2. İşleme Amacı
Bu veriler yalnızca; olası bir sağlık sorunu veya kaza anında size doğru ve hızlı müdahale edilebilmesi, antrenörlerin fiziksel kapasitenize uygun bir program planlayabilmesi, sakatlık geçmişinizin takip edilerek tekrarlayan sakatlıkların önlenmesi ve gerekli hâllerde sağlık kuruluşlarına doğru bilgi aktarılabilmesi amaçlarıyla işlenir. Bu veriler kulübün ticari amaçlarla kullanılmaz, reklam/pazarlama faaliyetlerinde değerlendirilmez.

3. Erişim ve Paylaşım
Sağlık verilerinize yalnızca antrenörleriniz, branş koordinatörü ve kulüp yönetimi, yukarıdaki amaçlarla sınırlı olarak erişebilir. Bu veriler, acil bir sağlık durumunda müdahale edecek sağlık personeli/kurumu dışında üçüncü kişilerle paylaşılmaz.

4. Rıza ve Geri Alma Hakkı
Bu verilerin işlenmesine ilişkin rızanızı istediğiniz zaman, kulüp yönetimine yazılı olarak bildirerek geri alabilirsiniz; ancak bu durumda kulübün, sağlık durumunuza dair bilgi sahibi olamaması nedeniyle bazı hizmetleri (ör. sakatlık geçmişi takibi) sunamayabileceğini kabul edersiniz.

5. Açık Rıza Beyanı
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; kendime ait sağlık verilerinin, yukarıda belirtilen amaç ve kapsamla ${clubName} tarafından işlenmesine açık rızam olduğunu beyan ederim.`,

  staff: (clubName) => `SPORCU SAĞLIK VERİLERİNE ERİŞİM — GİZLİLİK TAAHHÜDÜ

Görevinizi (antrenörlük/kulüp yönetimi) ifa ederken, ${clubName} bünyesindeki sporculara ait kan grubu, sakatlık geçmişi, alerji, kronik rahatsızlık ve ilaç kullanımı gibi özel nitelikli sağlık verilerine erişebilirsiniz. Bu veriler KVKK'nın 6. maddesi uyarınca özel nitelikli kişisel veri olup, sporcunun/velisinin açık rızasıyla ve sınırlı amaçlarla toplanmıştır.

1. Kullanım Sınırı
Bu verilere yalnızca; sporcuya olası bir sağlık sorununda doğru müdahale edilebilmesi, antrenman programının sporcunun sağlık durumuna uygun planlanması ve sakatlık takibi amaçlarıyla erişebilir, bu amaçlar dışında kullanamazsınız.

2. Paylaşım Yasağı
Erişebildiğiniz sağlık verilerini, acil bir sağlık durumunda müdahale edecek sağlık personeli/kurumu dışında hiçbir üçüncü kişi veya kurumla paylaşamaz, sosyal medyada veya kulüp dışında hiçbir şekilde ifşa edemezsiniz.

3. Beyan
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; görevim gereği erişebileceğim sporcu sağlık verilerini yukarıdaki ilkelere uygun şekilde, gizlilik içinde ve yalnızca belirtilen amaçlarla kullanacağımı beyan ve taahhüt ederim.`,
};

const FOTO_VIDEO_BY_BUCKET: Record<ConsentRoleBucket, (clubName: string) => string> = {
  parent: (clubName) => `FOTOĞRAF VE VİDEO KULLANIM İZNİ

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

  athlete: (clubName) => `FOTOĞRAF VE VİDEO KULLANIM İZNİ

1. Kapsam
${clubName} tarafından düzenlenen antrenman, müsabaka, tören ve kulüp etkinlikleri sırasında, yer aldığınız fotoğraf ve videolar çekilebilir.

2. Kullanım Amaçları
Bu görsel ve işitsel içerikler; kulübün sosyal medya hesapları, internet sitesi, tanıtım/afiş/broşür gibi basılı-dijital materyalleri, bu mobil uygulama içindeki grup/etkinlik paylaşımları ve kulüp arşivi oluşturma amaçlarıyla kullanılabilir. Bu içerikler kulübün amaçları dışında, üçüncü kişi/kurumların ticari reklam faaliyetlerinde kullanılmaz.

3. İtiraz ve Geri Alma Hakkı
Bu izni istediğiniz zaman kulüp yönetimine bildirerek geri alabilirsiniz; bu durumda, daha önce paylaşılmış içerikler makul bir süre içinde kaldırılır, ancak halihazırda üçüncü kişilerce paylaşılmış/kaydedilmiş içerikler üzerinde kulübün kontrolü sınırlı olabilir.

4. Onay/Ret
Bu izni vermemeniz durumunda kulüp faaliyetlerine katılmaya devam edebilirsiniz; ancak bu tercihinizi belirtmek için kulüp yönetimiyle ayrıca iletişime geçmeniz ve görsellerde yer almamanız için makul tedbirlerin alınmasını talep etmeniz gerekir.

5. Beyan
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; görüntü ve seslerimin, yukarıda belirtilen amaç ve kapsamla ${clubName} tarafından kullanılmasına izin verdiğimi beyan ederim.`,

  staff: (clubName) => `FOTOĞRAF VE VİDEO KULLANIM İZNİ (PERSONEL)

1. Kapsam
${clubName} tarafından düzenlenen antrenman, müsabaka, tören ve kulüp etkinlikleri sırasında, görevli olarak yer aldığınız fotoğraf ve videolar çekilebilir.

2. Kullanım Amaçları
Bu görsel ve işitsel içerikler; kulübün sosyal medya hesapları, internet sitesi, tanıtım/afiş/broşür gibi basılı-dijital materyalleri, bu mobil uygulama içindeki grup/etkinlik paylaşımları ve kulüp arşivi oluşturma amaçlarıyla (ör. antrenör tanıtım bilgisi) kullanılabilir.

3. İtiraz ve Geri Alma Hakkı
Bu izni istediğiniz zaman kulüp yönetimine bildirerek geri alabilirsiniz; bu durumda daha önce paylaşılmış içerikler makul bir süre içinde kaldırılır.

4. Beyan
Yukarıdaki bilgilendirmeyi okuduğumu ve anladığımı; görüntü ve seslerimin, yukarıda belirtilen amaç ve kapsamla ${clubName} tarafından kullanılmasına izin verdiğimi beyan ederim.`,
};

const SORUMLULUK_BY_BUCKET: Record<ConsentRoleBucket, (clubName: string) => string> = {
  parent: (clubName) => `SPORCU KATILIM VE SORUMLULUK BEYANI

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

  athlete: (clubName) => `SPORCU KATILIM VE SORUMLULUK BEYANI

1. Riskin Kabulü
Her türlü sportif faaliyetin, doğası gereği düşme, çarpışma, burkulma, kas-eklem yaralanmaları gibi fiziksel riskler taşıdığını biliyor ve ${clubName} bünyesindeki antrenman, müsabaka ve etkinliklere bu riskleri kabul ederek katıldığımı beyan ederim.

2. Sağlık Beyanı
Sportif faaliyete katılımıma engel teşkil edecek bilinen bir sağlık sorunum bulunmadığını; varsa bu tür durumları (Sağlık Verisi İşleme İzni kapsamında) kulübe eksiksiz bildirdiğimi beyan ederim. Sağlık durumumda meydana gelecek değişiklikleri kulüp yönetimine bildirmeyi taahhüt ederim.

3. Kulübün Sorumluluğu
${clubName}, antrenörleri aracılığıyla gerekli özeni göstererek güvenli bir antrenman ortamı sağlamayı taahhüt eder. Buna rağmen, sporun doğasından kaynaklanan ve makul özenin gösterilmesine rağmen önlenemeyen kaza/yaralanmalardan kulübün sorumlu tutulamayacağını kabul ederim. Bu beyan, kulübün kusurundan kaynaklanan sorumluluğunu ortadan kaldırmaz.

4. Sigorta
Kulübün sporculara yönelik ayrı bir spor kazaları sigortası bulunmuyorsa (bu husus kulüp yönetiminden ayrıca teyit edilmelidir), olası bir kaza/yaralanma durumunda tedavi giderlerinin tarafımca karşılanacağını, genel sağlık sigortası kapsamının bu duruma dahil olup olmadığını kendi sorumluluğumda takip edeceğimi kabul ederim.

5. Acil Durum
Acil bir sağlık durumunda, kendime derhal ulaşılamaması hâlinde, en yakın sağlık kuruluşunda gerekli ilk müdahalenin/tedavinin yapılmasına onay verdiğimi beyan ederim.

6. Beyan
Yukarıdaki maddeleri okuduğumu, anladığımı ve kendi adıma kabul ettiğimi beyan ederim.`,

  staff: (clubName) => `GÖREV VE KURALLARA UYUM BEYANI

1. Kapsam
${clubName} bünyesinde antrenörlük/yöneticilik görevimi ifa ederken, kulübün belirlediği güvenlik kurallarına, çalışma düzenine ve sporcuların güvenliğini önceleyen uygulamalara uyacağımı kabul ederim.

2. Riskin Farkında Olma
Antrenörlük görevim sırasında (fiziksel demonstrasyon, saha içi müdahale vb.) doğabilecek fiziksel risklerin farkında olduğumu ve kulübün gerekli özeni göstererek güvenli bir çalışma ortamı sağlamaya çalıştığını, buna rağmen sporun doğasından kaynaklanan ve makul özene rağmen önlenemeyen kaza/yaralanmalardan kulübün sorumlu tutulamayacağını kabul ederim.

3. Beyan
Yukarıdaki maddeleri okuduğumu, anladığımı ve kabul ettiğimi beyan ederim.`,
};

// NOT: Bu metinler 6698 sayılı KVKK'nın standart aydınlatma metni
// yapısına (veri sorumlusunun kimliği, işlenen veri, işleme amacı,
// aktarım, toplama yöntemi/hukuki sebep, ilgili kişinin hakları) uygun
// genel bir taslak olarak hazırlanmıştır. Kulübün gerçek veri işleme
// süreçlerine göre (ör. hangi hizmet sağlayıcılarla veri paylaşıldığı)
// güncellenmesi ve yürürlüğe koymadan önce bir hukuk danışmanına
// onaylatılması önerilir.
const TITLES_AND_SUMMARIES: Record<Exclude<ConsentType, "saglik">, { title: string; summary: (bucket: ConsentRoleBucket) => string }> = {
  kvkk: {
    title: "KVKK Aydınlatma Metni ve Açık Rıza Beyanı",
    summary: (bucket) =>
      bucket === "parent"
        ? "Kişisel verilerinizin ve çocuğunuzun kişisel verilerinin nasıl işlendiğine dair bilgilendirme."
        : "Kişisel verilerinizin nasıl işlendiğine dair bilgilendirme.",
  },
  foto_video: {
    title: "Fotoğraf ve Video Kullanım İzni",
    summary: () => "Antrenman/müsabaka fotoğraf-videolarının kulüp tanıtımında kullanılmasına izin.",
  },
  sorumluluk: {
    title: "Sorumluluk Beyanı",
    summary: (bucket) =>
      bucket === "staff"
        ? "Görev sırasındaki kurallara uyum ve risklerin kabulüne dair beyan."
        : "Sporun getirdiği fiziksel risklerin kabulü ve kulübün sorumluluk sınırına dair beyan.",
  },
};

const SAGLIK_TITLE_SUMMARY: Record<ConsentRoleBucket, { title: string; summary: string }> = {
  parent: { title: "Sağlık Verisi İşleme İzni", summary: "Kan grubu, sakatlık geçmişi gibi özel nitelikli sağlık verilerinin işlenmesine izin." },
  athlete: { title: "Sağlık Verisi İşleme İzni", summary: "Kan grubu, sakatlık geçmişi gibi özel nitelikli sağlık verilerinizin işlenmesine izin." },
  staff: { title: "Sporcu Sağlık Verilerine Erişim — Gizlilik Taahhüdü", summary: "Görev gereği erişilen sporcu sağlık verilerinin gizli tutulacağına dair taahhüt." },
};

// role parametresi eklendi — metin artık kim okuyorsa ona göre (veli/
// sporcu/personel) değişiyor. ConsentScreen.tsx bunu useAuth()'tan geçiyor.
export function getConsentText(type: ConsentType, role: UserRole): ConsentText {
  const bucket = roleToConsentBucket(role);

  if (type === "saglik") {
    const { title, summary } = SAGLIK_TITLE_SUMMARY[bucket];
    return { type, title, summary, body: SAGLIK_BY_BUCKET[bucket] };
  }
  if (type === "kvkk") {
    return { type, title: TITLES_AND_SUMMARIES.kvkk.title, summary: TITLES_AND_SUMMARIES.kvkk.summary(bucket), body: KVKK_BY_BUCKET[bucket] };
  }
  if (type === "foto_video") {
    return { type, title: TITLES_AND_SUMMARIES.foto_video.title, summary: TITLES_AND_SUMMARIES.foto_video.summary(bucket), body: FOTO_VIDEO_BY_BUCKET[bucket] };
  }
  return { type, title: TITLES_AND_SUMMARIES.sorumluluk.title, summary: TITLES_AND_SUMMARIES.sorumluluk.summary(bucket), body: SORUMLULUK_BY_BUCKET[bucket] };
}

export type ServiceDetail = {
  slug: string;
  icon: string;
  eyebrow: string;
  title: string;
  color: string;
  desc: string;
  intro: string;
  points: string[];
  seoTitle: string;
  seoDescription: string;
  image?: string;
  video?: string;
};

// image/video alanı boş bırakılırsa otomatik olarak ikon temelli bir
// görsel yer tutucusu gösterilir — gerçek ekran görüntüsü/video geldikçe
// buraya dosya yolu eklemek yeterli, bileşenlerin geri kalanına dokunmaya
// gerek yok. Bu dosya hem ana sayfadaki Özellikler bölümünün hem de
// /hizmet/<slug> altındaki tekil detay sayfalarının tek veri kaynağıdır.
export const SERVICES: ServiceDetail[] = [
  {
    slug: "sporcu-yonetimi",
    icon: "👥",
    eyebrow: "Sporcu & Veli Yönetimi",
    title: "Her sporcunun tek, canlı bir profili",
    color: "text-yellow",
    desc: "Kağıt formlar ve dağınık Excel tabloları yerine — her sporcunun fotoğrafı, branşı, grubu, veli bilgisi ve gelişim geçmişi tek bir profilde.",
    intro:
      "Bir spor kulübünde en çok zaman kaybettiren şey, aynı sporcu bilgisinin beş farklı yerde (kağıt form, WhatsApp, Excel, veli mesajları) dağınık durmasıdır. X-NETIC'te her sporcu tek bir canlı profile sahiptir: branşı, grubu, velisi, sağlık notu ve gelişim geçmişi bu profilde birleşir, antrenör sahada telefonundan aynı bilgiye anında ulaşır.",
    points: [
      "Sporcuya birden fazla branş/grup bağlama (ana branş + ek branşlar)",
      "Veli ve sporcunun kendi giriş hesabını tek ekrandan açma",
      "Sağlık notu, sakatlık kaydı ve antrenör notları — sadece yetkili personel görür",
      "Kayıt dondurma talebi ve onayı uygulama içinden",
    ],
    seoTitle: "Sporcu ve Veli Yönetimi Yazılımı | X-NETIC",
    seoDescription:
      "Spor kulübün için sporcu profili, veli bilgisi, sağlık notu ve branş/grup yönetimini tek platformda birleştir. X-NETIC ile sporcu yönetimini dijitalleştir.",
  },
  {
    slug: "antrenman-yoklama",
    icon: "📅",
    eyebrow: "Takvim & Yoklama",
    title: "Antrenman ve müsabakalar tek takvimde",
    color: "text-teal",
    desc: "Haftalık antrenman planından maç gününe kadar her şey tek takvimde — yoklama tek dokunuşla alınır, telefonun kendi takvimine de senkronlanabilir.",
    intro:
      "Kağıt yoklama listeleri kayboluyor, WhatsApp'tan gelen mazeretler unutuluyor. X-NETIC'te antrenman ve müsabaka takvimi tek ekranda toplanır, yoklama saha kenarından tek dokunuşla alınır ve devamsızlık geçmişi otomatik olarak sporcu profiline işlenir.",
    points: [
      "Antrenman/maç oluşturma, sonuç ve kadro girişi",
      "Tek dokunuşla yoklama: geldi / gelmedi / geç kaldı / raporlu",
      "Veli ve sporcudan önceden mazeret bildirimi",
      "\"Takvimime Ekle\" ile telefonun kendi takvim uygulamasına senkron",
    ],
    seoTitle: "Antrenman Takvimi ve Yoklama Sistemi | X-NETIC",
    seoDescription:
      "Antrenman ve müsabaka takvimini tek ekranda topla, yoklamayı tek dokunuşla al. X-NETIC ile spor kulübünde dijital yoklama ve takvim yönetimi.",
  },
  {
    slug: "performans-takibi",
    icon: "⏱️",
    eyebrow: "Performans Ölçümleri",
    title: "Gelişimi sayılarla, zaman içinde göster",
    color: "text-coral",
    desc: "Sprint, sıçrama, dayanıklılık, kuvvet — kulübüne özel test kataloğu oluştur, her ölçümü kaydet, sporcunun ve velinin gelişim grafiğini görmesini sağla.",
    intro:
      "Sporcunun gelişimini sadece gözle takip etmek yeterli değildir — rakamlarla, zaman içindeki grafikle görmek gerekir. X-NETIC'te kulübüne özel test kataloğu oluşturur, her ölçümü kaydeder ve sporcu ile velisinin gelişimi kendi profilinden takip etmesini sağlarsın.",
    points: [
      "Kulübe özel test tanımlama, hazır test kütüphanesinden seçme",
      "Video destekli ölçüm kaydı",
      "Sporcu bazında zaman içinde gelişim karşılaştırması",
      "Antrenör ve admin için branş/grup bazlı toplu görünüm",
    ],
    seoTitle: "Sporcu Performans Takip Sistemi | X-NETIC",
    seoDescription:
      "Sprint, sıçrama, dayanıklılık testleriyle sporcu gelişimini zaman içinde ölç ve grafikle göster. X-NETIC performans takip modülüyle veriye dayalı antrenörlük.",
  },
  {
    slug: "fitness-programlari",
    icon: "💪",
    eyebrow: "Fitness",
    title: "Video destekli egzersiz kütüphanesi ve programlar",
    color: "text-violet",
    desc: "Görsel/video destekli, kategorilere ayrılmış bir egzersiz kütüphanesinden sporcuya ya da tüm gruba özel antrenman programı hazırla, tamamlanma durumunu takip et.",
    intro:
      "Bir antrenman programını sadece kağıda yazıp sporcuya söylemek, kimin gerçekten uyguladığını takip etmeyi imkansız kılar. X-NETIC'te video destekli egzersiz kütüphanesinden sporcuya veya tüm gruba özel bir program oluşturur, sporcu check-in yaptıkça tamamlanma oranını otomatik görürsün.",
    points: [
      "Kategorilere ayrılmış, video destekli egzersiz kütüphanesi",
      "Kulübe özel hareket ekleme, istemediklerini gizleme",
      "Sporcuya veya gruba özel program atama",
      "Sporcu check-in yaptıkça tamamlanma takibi otomatik güncellenir",
    ],
    seoTitle: "Fitness Programı ve Egzersiz Takip Yazılımı | X-NETIC",
    seoDescription:
      "Video destekli egzersiz kütüphanesinden sporcuya veya gruba özel fitness programı oluştur, tamamlanma oranını otomatik takip et. X-NETIC ile dijital antrenman programı.",
  },
  {
    slug: "beslenme-takibi",
    icon: "🥗",
    eyebrow: "Beslenme",
    title: "Besin, tarif ve rehber içerikleri tek yerde",
    color: "text-teal",
    desc: "Sporcularına ve velilere; besin değerleri, tarifler ve PDF destekli rehber yazılarıyla beslenme konusunda doğru bilgiye anında erişim sağla.",
    intro:
      "Sporcuların ve velilerin en çok sorduğu sorulardan biri doğru beslenmedir. X-NETIC'te kulübüne özel besin, tarif ve rehber içerikleri tek bir yerde toplanır; veli ve sporcu bu bilgiye WhatsApp'ta arama yapmadan, doğrudan uygulama içinden ulaşır.",
    points: [
      "Kategorilere ayrılmış besin ve tarif veritabanı",
      "Kulübe özel içerik ekleme (yazı ve/veya PDF)",
      "Veli ve sporcu için ayrı, sade bir görünüm",
    ],
    seoTitle: "Sporcu Beslenme Takibi ve Rehberi | X-NETIC",
    seoDescription:
      "Kulübüne özel besin, tarif ve beslenme rehberi içeriklerini sporcu ve velilerle tek uygulamadan paylaş. X-NETIC beslenme modülü.",
  },
  {
    slug: "aidat-takip",
    icon: "💰",
    eyebrow: "Finans & Aidat",
    title: "Aidat takibi artık unutulmuyor",
    color: "text-yellow",
    desc: "Aidat planı bir kere kurulur, her ay otomatik oluşur. Gecikmiş ödemeler için hatırlatma artık elle gönderilmek zorunda değil — sistem kendi kendine takip ediyor.",
    intro:
      "Aidat takibinin en büyük sorunu unutulan hatırlatmalar ve elle tutulan Excel tablolarıdır. X-NETIC'te aidat planı bir kez kurulur, her ay otomatik oluşur; gecikmiş ödemeler için hatırlatma bildirimi sistem tarafından kendiliğinden gönderilir, veli banka dekontunu doğrudan uygulamadan yükler.",
    points: [
      "Sporcu başına otomatik tekrarlayan aidat planı",
      "Vadesi geçen ödemeler için OTOMATİK, günlük hatırlatma bildirimi",
      "Veli, Havale/EFT ile öderken banka dekontu/makbuz fotoğrafını ekleyebiliyor",
      "Gelir-gider takibi, antrenör hakedişleri ve finansal raporlar",
    ],
    seoTitle: "Kulüp Aidat Takip ve Tahsilat Sistemi | X-NETIC",
    seoDescription:
      "Aidat planını bir kez kur, her ay otomatik oluşsun. Gecikmiş ödemeler için otomatik hatırlatma bildirimi. X-NETIC ile spor kulübünde aidat takibi.",
  },
  {
    slug: "kulup-magazasi",
    icon: "🛍️",
    eyebrow: "Kulüp Mağazası",
    title: "Forma ve ekipman satışını da uygulama içinden yönet",
    color: "text-coral",
    desc: "Kulüp formaları, ekipman ve diğer ürünler için renk/beden seçenekli bir mini mağaza — sipariş ve stok takibi dahil.",
    intro:
      "Forma ve ekipman siparişlerini WhatsApp'tan takip etmek, hangi bedenin kimde kaldığını unutmak demektir. X-NETIC'in kulüp mağazası modülüyle renk/beden varyantlı ürünlerini listeler, veli ve sporcu doğrudan uygulama içinden sipariş verir, sen de tüm siparişleri tek ekrandan onaylarsın.",
    points: [
      "Ürün, varyant (renk/beden) ve stok yönetimi",
      "Veli/sporcu için uygulama içinden sipariş verme",
      "Gelen siparişleri tek ekrandan onaylama/takip",
    ],
    seoTitle: "Kulüp Mağazası ve Forma Sipariş Sistemi | X-NETIC",
    seoDescription:
      "Forma ve ekipman siparişlerini renk/beden varyantlarıyla uygulama içinden al, stok ve sipariş takibini tek ekrandan yönet. X-NETIC kulüp mağazası.",
  },
  {
    slug: "duyuru-mesajlasma",
    icon: "📣",
    eyebrow: "Duyuru, Mesaj & Bildirim",
    title: "Doğru bilgi, doğru kişiye, anında",
    color: "text-violet",
    desc: "WhatsApp gruplarının yerini alan; kulüp geneline ya da tek bir gruba özel duyurular, kulüp içi birebir mesajlaşma ve rol bazlı bildirim tercihleri.",
    intro:
      "WhatsApp grupları büyüdükçe önemli duyurular kayboluyor, kimin okuyup kimin okumadığı belli olmuyor. X-NETIC'te kulüp geneline ya da tek bir gruba özel duyuru paylaşır, kim okudu kim okumadı görürsün; kulüp içi birebir mesajlaşma da rol bazlı sınırlarla güvenle çalışır.",
    points: [
      "Kulüp geneline veya seçili gruba özel duyuru (fotoğraf/belge ekli)",
      "Kim okudu, kim okumadı takibi",
      "Kulüp içi birebir mesajlaşma (rol bazlı, kimin kime yazabileceği sınırlı)",
      "Herkes kendi bildirim tercihlerini kendi belirler",
    ],
    seoTitle: "Kulüp İçi Duyuru, Mesajlaşma ve Bildirim | X-NETIC",
    seoDescription:
      "WhatsApp gruplarının yerini alan; okundu takipli duyuru, rol bazlı mesajlaşma ve bildirim sistemi. X-NETIC ile kulüp içi iletişimi dijitalleştir.",
  },
  {
    slug: "kulup-yapisi-antrenorler",
    icon: "🏛️",
    eyebrow: "Kulüp Yapısı & Antrenörler",
    title: "Branş, grup, salon — kulübünün gerçek yapısı",
    color: "text-teal",
    desc: "Branşlarını, gruplarını ve antrenman salonlarını tanımla; antrenörleri branşlara ata, branş koordinatörü belirleyerek yetkiyi doğru kişiye devret.",
    intro:
      "Kulübün büyüdükçe branş, grup ve antrenör sayısı da artar; bunu tek kişinin yönetmesi imkansızlaşır. X-NETIC'te branşlarını ve gruplarını tanımlar, antrenörlerini atar, branş koordinatörü belirleyerek o branşın günlük yönetimini güvenle devredersin.",
    points: [
      "Sınırsız branş, grup ve salon tanımlama",
      "Antrenör davet etme, branş/grup atama",
      "Branş koordinatörlüğü — o branşın yönetim yetkisini devretme",
      "Antrenör izin kayıtları ve avans/hakediş takibi",
    ],
    seoTitle: "Kulüp Yapısı, Branş ve Antrenör Yönetimi | X-NETIC",
    seoDescription:
      "Branş, grup ve salonlarını tanımla, antrenör ata, branş koordinatörüyle yönetimi devret. X-NETIC ile kulüp yapısını dijital olarak organize et.",
  },
  {
    slug: "veri-guvenligi",
    icon: "🔐",
    eyebrow: "Güvenlik & Gizlilik",
    title: "Herkes sadece kendisini ilgilendireni görür",
    color: "text-yellow",
    desc: "Satır bazlı erişim kontrolüyle her rol (admin, koordinatör, antrenör, veli, sporcu) sadece görmesi gereken veriye erişir — sağlık notları ve finansal veriler dahil.",
    intro:
      "Bir spor kulübünde sağlık notları, sakatlık kayıtları ve finansal veriler gibi hassas bilgiler bulunur. X-NETIC'te satır bazlı erişim kontrolüyle her rol yalnızca görmesi gereken veriye erişir; veli sadece kendi çocuğunun, antrenör sadece kendi grubunun bilgisini görebilir, tüm süreç KVKK'ya uygun açık rıza akışıyla yürütülür.",
    points: [
      "KVKK'ya uygun açık rıza akışı",
      "Veli sadece kendi çocuğunun, antrenör sadece kendi grubunun verisini görür",
      "Hassas veriler (sağlık notu, sakatlık kaydı) sadece yetkili personelde",
      "Uygulama içinden hesap silme talebi",
    ],
    seoTitle: "Spor Kulübü Veri Güvenliği ve KVKK Uyumu | X-NETIC",
    seoDescription:
      "Satır bazlı erişim kontrolüyle her rol sadece kendi verisini görür. Sağlık ve finansal veriler korumalı, KVKK uyumlu açık rıza akışı. X-NETIC güvenlik yaklaşımı.",
  },
];

export function getServiceBySlug(slug: string): ServiceDetail | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

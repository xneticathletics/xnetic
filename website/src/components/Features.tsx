type FeatureDetail = {
  icon: string;
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
  color: string;
  image?: string;
  video?: string;
};

// image/video alanı boş bırakılırsa otomatik olarak ikon temelli bir
// görsel yer tutucusu gösterilir — gerçek ekran görüntüsü/video geldikçe
// buraya dosya yolu eklemek yeterli, bileşenin geri kalanına dokunmaya
// gerek yok.
const FEATURES: FeatureDetail[] = [
  {
    icon: "👥",
    eyebrow: "Sporcu & Veli Yönetimi",
    title: "Her sporcunun tek, canlı bir profili",
    color: "text-yellow",
    desc: "Kağıt formlar ve dağınık Excel tabloları yerine — her sporcunun fotoğrafı, branşı, grubu, veli bilgisi ve gelişim geçmişi tek bir profilde.",
    points: [
      "Sporcuya birden fazla branş/grup bağlama (ana branş + ek branşlar)",
      "Veli ve sporcunun kendi giriş hesabını tek ekrandan açma",
      "Sağlık notu, sakatlık kaydı ve antrenör notları — sadece yetkili personel görür",
      "Kayıt dondurma talebi ve onayı uygulama içinden",
    ],
  },
  {
    icon: "📅",
    eyebrow: "Takvim & Yoklama",
    title: "Antrenman ve müsabakalar tek takvimde",
    color: "text-teal",
    desc: "Haftalık antrenman planından maç gününe kadar her şey tek takvimde — yoklama tek dokunuşla alınır, telefonun kendi takvimine de senkronlanabilir.",
    points: [
      "Antrenman/maç oluşturma, sonuç ve kadro girişi",
      "Tek dokunuşla yoklama: geldi / gelmedi / geç kaldı / raporlu",
      "Veli ve sporcudan önceden mazeret bildirimi",
      "\"Takvimime Ekle\" ile telefonun kendi takvim uygulamasına senkron",
    ],
  },
  {
    icon: "⏱️",
    eyebrow: "Performans Ölçümleri",
    title: "Gelişimi sayılarla, zaman içinde göster",
    color: "text-coral",
    desc: "Sprint, sıçrama, dayanıklılık, kuvvet — kulübüne özel test kataloğu oluştur, her ölçümü kaydet, sporcunun ve velinin gelişim grafiğini görmesini sağla.",
    points: [
      "Kulübe özel test tanımlama, hazır test kütüphanesinden seçme",
      "Video destekli ölçüm kaydı",
      "Sporcu bazında zaman içinde gelişim karşılaştırması",
      "Antrenör ve admin için branş/grup bazlı toplu görünüm",
    ],
  },
  {
    icon: "💪",
    eyebrow: "Fitness",
    title: "Video destekli egzersiz kütüphanesi ve programlar",
    color: "text-violet",
    desc: "Görsel/video destekli, kategorilere ayrılmış bir egzersiz kütüphanesinden sporcuya ya da tüm gruba özel antrenman programı hazırla, tamamlanma durumunu takip et.",
    points: [
      "Kategorilere ayrılmış, video destekli egzersiz kütüphanesi",
      "Kulübe özel hareket ekleme, istemediklerini gizleme",
      "Sporcuya veya gruba özel program atama",
      "Sporcu check-in yaptıkça tamamlanma takibi otomatik güncellenir",
    ],
  },
  {
    icon: "🥗",
    eyebrow: "Beslenme",
    title: "Besin, tarif ve rehber içerikleri tek yerde",
    color: "text-teal",
    desc: "Sporcularına ve velilere; besin değerleri, tarifler ve PDF destekli rehber yazılarıyla beslenme konusunda doğru bilgiye anında erişim sağla.",
    points: [
      "Kategorilere ayrılmış besin ve tarif veritabanı",
      "Kulübe özel içerik ekleme (yazı ve/veya PDF)",
      "Veli ve sporcu için ayrı, sade bir görünüm",
    ],
  },
  {
    icon: "💰",
    eyebrow: "Finans & Aidat",
    title: "Aidat takibi artık unutulmuyor",
    color: "text-yellow",
    desc: "Aidat planı bir kere kurulur, her ay otomatik oluşur. Gecikmiş ödemeler için hatırlatma artık elle gönderilmek zorunda değil — sistem kendi kendine takip ediyor.",
    points: [
      "Sporcu başına otomatik tekrarlayan aidat planı",
      "Vadesi geçen ödemeler için OTOMATİK, günlük hatırlatma bildirimi",
      "Veli, Havale/EFT ile öderken banka dekontu/makbuz fotoğrafını ekleyebiliyor",
      "Gelir-gider takibi, antrenör hakedişleri ve finansal raporlar",
    ],
  },
  {
    icon: "🛍️",
    eyebrow: "Kulüp Mağazası",
    title: "Forma ve ekipman satışını da uygulama içinden yönet",
    color: "text-coral",
    desc: "Kulüp formaları, ekipman ve diğer ürünler için renk/beden seçenekli bir mini mağaza — sipariş ve stok takibi dahil.",
    points: [
      "Ürün, varyant (renk/beden) ve stok yönetimi",
      "Veli/sporcu için uygulama içinden sipariş verme",
      "Gelen siparişleri tek ekrandan onaylama/takip",
    ],
  },
  {
    icon: "📣",
    eyebrow: "Duyuru, Mesaj & Bildirim",
    title: "Doğru bilgi, doğru kişiye, anında",
    color: "text-violet",
    desc: "WhatsApp gruplarının yerini alan; kulüp geneline ya da tek bir gruba özel duyurular, kulüp içi birebir mesajlaşma ve rol bazlı bildirim tercihleri.",
    points: [
      "Kulüp geneline veya seçili gruba özel duyuru (fotoğraf/belge ekli)",
      "Kim okudu, kim okumadı takibi",
      "Kulüp içi birebir mesajlaşma (rol bazlı, kimin kime yazabileceği sınırlı)",
      "Herkes kendi bildirim tercihlerini kendi belirler",
    ],
  },
  {
    icon: "🏛️",
    eyebrow: "Kulüp Yapısı & Antrenörler",
    title: "Branş, grup, salon — kulübünün gerçek yapısı",
    color: "text-teal",
    desc: "Branşlarını, gruplarını ve antrenman salonlarını tanımla; antrenörleri branşlara ata, branş koordinatörü belirleyerek yetkiyi doğru kişiye devret.",
    points: [
      "Sınırsız branş, grup ve salon tanımlama",
      "Antrenör davet etme, branş/grup atama",
      "Branş koordinatörlüğü — o branşın yönetim yetkisini devretme",
      "Antrenör izin kayıtları ve avans/hakediş takibi",
    ],
  },
  {
    icon: "🔐",
    eyebrow: "Güvenlik & Gizlilik",
    title: "Herkes sadece kendisini ilgilendireni görür",
    color: "text-yellow",
    desc: "Satır bazlı erişim kontrolüyle her rol (admin, koordinatör, antrenör, veli, sporcu) sadece görmesi gereken veriye erişir — sağlık notları ve finansal veriler dahil.",
    points: [
      "KVKK'ya uygun açık rıza akışı",
      "Veli sadece kendi çocuğunun, antrenör sadece kendi grubunun verisini görür",
      "Hassas veriler (sağlık notu, sakatlık kaydı) sadece yetkili personelde",
      "Uygulama içinden hesap silme talebi",
    ],
  },
];

function FeatureVisual({ feature }: { feature: FeatureDetail }) {
  if (feature.video) {
    return (
      <video
        src={feature.video}
        controls
        preload="none"
        className="aspect-[4/3] w-full rounded-2xl border border-line bg-surface object-cover"
      />
    );
  }
  if (feature.image) {
    return (
      <img
        src={feature.image}
        alt={feature.title}
        className="aspect-[4/3] w-full rounded-2xl border border-line bg-surface object-cover"
        loading="lazy"
      />
    );
  }
  // Görsel henüz eklenmediyse ikon temelli bir yer tutucu — sayfa boş
  // görünmesin, ama gerçek görsel geldiğinde yukarıdaki dallardan biri
  // devreye girip burayı otomatik değiştirecek.
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-line bg-surface">
      <span className="text-6xl opacity-40">{feature.icon}</span>
    </div>
  );
}

export default function Features() {
  return (
    <section id="ozellikler" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-teal">Özellikler</span>
        <h2 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">
          Kulübünü yönetmek için gereken her şey
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Ayrı ayrı tablolar, WhatsApp grupları ve kağıt yoklama listeleri yerine —
          tek bir sistemde, herkes için doğru görünüm.
        </p>
      </div>

      <div className="space-y-20">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            <div>
              <div className="mb-3 text-3xl">{f.icon}</div>
              <span className={`text-xs font-bold uppercase tracking-widest ${f.color}`}>{f.eyebrow}</span>
              <h3 className="mt-2 text-2xl font-extrabold text-ink">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.desc}</p>
              <ul className="mt-5 space-y-2.5">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm leading-relaxed text-muted">
                    <span className={`mt-0.5 shrink-0 ${f.color}`}>›</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <FeatureVisual feature={f} />
          </div>
        ))}
      </div>
    </section>
  );
}

type Feature = { icon: string; title: string; desc: string };

const FEATURES: Feature[] = [
  { icon: "🏋️", title: "Fitness & Antrenman", desc: "Kategorilere ayrılmış egzersiz kütüphanesi, kulübe özel hareketler ve sporculara özel antrenman programları." },
  { icon: "📊", title: "Performans Testleri", desc: "Sprint, sıçrama, dayanıklılık gibi test kataloglarıyla ölçüm al, sporcunun gelişimini zaman içinde karşılaştır." },
  { icon: "💰", title: "Finans & Ödemeler", desc: "Aidat planları, gelir-gider takibi, antrenör hakedişleri ve finansal belgeler tek yerde." },
  { icon: "🗓️", title: "Takvim & Yoklama", desc: "Antrenman ve maç takvimi, tek dokunuşla yoklama alma, devamsızlık ve mazeret takibi." },
  { icon: "🥗", title: "Beslenme", desc: "Besin veritabanı, tarifler ve makale kütüphanesiyle sporcularına ve velilere beslenme rehberliği sun." },
  { icon: "🛍️", title: "Kulüp Mağazası", desc: "Forma ve ekipman satışlarını, stok durumunu ve siparişleri kulüp içinden yönet." },
  { icon: "📢", title: "Duyurular & Bildirimler", desc: "Kulüp genelinde ya da gruba özel duyurular; antrenör, veli ve sporculara anında bildirim." },
  { icon: "🔐", title: "Rol Bazlı Erişim", desc: "Kulüp admini, antrenör, veli ve sporcu — herkes sadece kendisini ilgilendiren veriyi görür." },
];

export default function Features() {
  return (
    <section id="ozellikler" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-teal">Özellikler</span>
        <h2 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">
          Kulübünü yönetmek için gereken her şey
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Ayrı ayrı tablolar, WhatsApp grupları ve kağıt yoklama listeleri yerine —
          tek bir sistemde, herkes için doğru görünüm.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-surface p-6 transition hover:border-muted">
            <div className="mb-3 text-3xl">{f.icon}</div>
            <h3 className="text-base font-extrabold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function About() {
  return (
    <section id="hakkimizda" className="mx-auto max-w-3xl px-5 py-20">
      <div className="mb-10 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-teal">Hakkımızda</span>
        <h2 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">İsmimiz bir tesadüf değil.</h2>
      </div>

      <div className="space-y-5 text-base leading-relaxed text-muted">
        <p>
          X-NETIC, iki kelimenin kesiştiği yerde doğdu: <span className="font-semibold text-yellow">genetik</span> —
          bir sporcunun doğuştan taşıdığı, henüz açığa çıkmamış potansiyel — ve{" "}
          <span className="font-semibold text-teal">kinetik</span> — o potansiyelin sahada, pistte, kulvarda
          harekete ve sonuca dönüştüğü an. Logomuzdaki X'in ortasından geçen sarmal da tam olarak bunu anlatıyor:
          içeride taşınanla dışarıda gösterilenin aynı çizgide buluşması.
        </p>
        <p>
          Kendimizi bir uygulama değil, bir sistem olarak tanımlıyoruz. Kulüp yöneticisi, antrenör, veli ve sporcu —
          dördü de aynı ağın farklı noktalarında duruyor, her biri kendi ihtiyacına göre şekillenmiş bir görünümle.
          Bir antrenmanın yoklaması, bir sporcunun performans geçmişi, bir velinin aldığı bildirim — hepsi bu tek
          ağın üzerinden akıyor.
        </p>
        <p>
          Bu ağ sabit değil. Bugün bir kulüp katıldığında sistemin tamamı biraz daha zenginleşiyor; yarın katılacak
          kulüp de aynısını yapacak. X-NETIC'i bugün gördüğünüz hâliyle değil, her geçen gün büyüyen bir ağın en
          erken hâli olarak düşünün.
        </p>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "1", title: "Kaydol ve Öde", desc: "Kulübün için bir plan seç, güvenli ödemeni xnetic.net üzerinden tamamla." },
  { n: "2", title: "Kulübünü Kur", desc: "Sporcularını, gruplarını ve antrenörlerini ekle; onlar da kendi hesaplarına giriş yapsın." },
  { n: "3", title: "Yönet ve Büyü", desc: "Web panelinden yönet, antrenörlerin ve velilerin mobil uygulamayla takipte kalsın." },
];

export default function HowItWorks() {
  return (
    <section id="nasil-calisir" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-teal">Nasıl Çalışır</span>
        <h2 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">Üç adımda hazır</h2>
      </div>

      <div className="grid gap-8 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow text-lg font-extrabold text-bg">
              {s.n}
            </div>
            <h3 className="text-base font-extrabold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

import { useState } from "react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Antrenörlerim ve velilerim ayrı bir uygulama mı indirmeli?",
    a: "Hayır — kulübün için oluşturduğun hesaplarla aynı X-NETIC mobil uygulamasına giriş yaparlar; her rol kendi ekranını görür.",
  },
  {
    q: "Ödemeyi nereden yapıyorum?",
    a: "Kulüp kaydı ve ödeme bu site üzerinden (web) yapılır. Kurulum tamamlandıktan sonra mobil uygulamaya sadece giriş yaparsın.",
  },
  {
    q: "Aylık ve yıllık plan arasında sonradan geçiş yapabilir miyim?",
    a: "Evet, kulüp yöneticisi olarak istediğin zaman planını değiştirebilirsin.",
  },
  {
    q: "Verilerim ve sporcularımın bilgileri güvende mi?",
    a: "Evet — her kulübün verisi birbirinden izole tutulur, sadece kendi kulübündeki yetkili kullanıcılar erişebilir.",
  },
  {
    q: "Mobil uygulama hangi cihazlarda çalışıyor?",
    a: "iOS ve Android üzerinde çalışır. Kulüp yönetimi ise bu web panelinden yapılır.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="sss" className="mx-auto max-w-3xl px-5 py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-teal">SSS</span>
        <h2 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">Sık Sorulan Sorular</h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="rounded-xl border border-line bg-surface">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold text-ink"
              >
                {item.q}
                <span className="ml-4 text-muted">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

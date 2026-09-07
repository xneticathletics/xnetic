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
  {
    q: "Sporcu ya da antrenör sayısına göre ek ücret var mı?",
    a: "Hayır — fiyat sabit, kulübün büyüklüğü fark etmeksizin sınırsız sporcu, antrenör ve veli ekleyebilirsin.",
  },
  {
    q: "Mevcut sporcu listemi Excel'den nasıl aktarırım?",
    a: "Sporcu Yönetimi'ndeki toplu aktarma özelliğiyle Excel/CSV dosyandan tüm sporcularını tek seferde içeri aktarabilirsin — tek tek elle girmene gerek yok.",
  },
  {
    q: "Aidatları kredi kartıyla tahsil edebiliyor muyum?",
    a: "Şu an Havale/EFT ve elden ödeme destekleniyor; kartla online ödeme (iyzico entegrasyonu) yakında ekleniyor.",
  },
  {
    q: "Birden fazla branşımız var, hepsini tek hesaptan mı yönetiyoruz?",
    a: "Evet — sınırsız branş, grup ve salon tanımlayabilir, hepsini tek kulüp hesabından yönetebilirsin.",
  },
  {
    q: "Bazı antrenörlere diğerlerinden daha fazla yetki verebilir miyim?",
    a: "Evet — bir antrenörü branş koordinatörü yaparak, o branşın sporcu/grup/finans yönetim yetkisini ona devredebilirsin.",
  },
  {
    q: "Kulübümüzün logosunu ve adını uygulamaya ekleyebilir miyiz?",
    a: "Evet — Kulüp Ayarları'ndan logonu ve kulüp adını yükleyebilirsin, giriş ekranında ve Ana Sayfa'da hemen görünür.",
  },
  {
    q: "Sporcularımızın sağlık/sakatlık bilgilerini kimler görebiliyor?",
    a: "Sadece yetkili personel (kulüp admini, branş koordinatörü ve ilgili antrenör) — bu bilgiler veli ve sporcu hesaplarına gösterilmez.",
  },
  {
    q: "İnternet bağlantısı olmadan kullanılabiliyor mu?",
    a: "Hayır, uygulama ve web paneli internet bağlantısı gerektirir — tüm veriler anlık olarak sunucudan senkronize edilir.",
  },
  {
    q: "Teknik bir sorun yaşarsak ya da yardıma ihtiyacımız olursa ne yapmalıyız?",
    a: "Uygulama içindeki Profil → Yardım/Destek ekranından ya da destek@xnetic.net adresinden bize ulaşabilirsin.",
  },
  {
    q: "KVKK'ya uygun mu, velilerden ayrıca onay almamız gerekiyor mu?",
    a: "Evet — uygulama, ilk girişte her kullanıcıdan (veli, antrenör, admin) KVKK aydınlatma metni ve açık rıza onayı alır, ayrıca kağıt üzerinde bir şey yapmana gerek kalmaz.",
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

import type { PlatformSettings } from "../lib/platformSettings";

// xnetic.net/kvkk — sitenin tek statik alt sayfası. Ziyaretçiye genel bir
// KVKK Aydınlatma Metni/Gizlilik Politikası sunar; kulübe kayıtlı gerçek
// kullanıcılar (veli/sporcu/antrenör/kulüp admini) için DETAYLI ve role
// göre farklılaşan asıl aydınlatma metinleri uygulama içinde (ilk girişte)
// gösteriliyor — bkz. src/lib/consentTexts.ts (mobil) ve
// web/src/lib/consentTexts.ts (kulüp admini kaydı).
//
// NOT: Bu metin genel bir taslak olarak hazırlanmıştır, yürürlüğe koymadan
// önce bir hukuk danışmanına onaylatılması önerilir.
export default function KvkkPage({ settings }: { settings: PlatformSettings | null }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="border-b border-line/80 bg-bg/85 px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-mark.png" alt="X-NETIC" className="h-10 w-10 drop-shadow-lg" />
            <span className="text-base font-extrabold tracking-tight text-ink">X-NETIC Spor Sistemleri</span>
          </a>
          <a href="/" className="text-sm font-semibold text-muted hover:text-ink">← Ana Sayfa</a>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="mb-2 text-2xl font-extrabold text-ink">KVKK Aydınlatma Metni ve Gizlilik Politikası</h1>
        <p className="mb-8 text-sm text-muted">Son güncelleme: {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long" })}</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="mb-2 text-base font-bold text-ink">1. Bu Sayfa Neyi Kapsar?</h2>
            <p>
              Bu sayfa, xnetic.net tanıtım sitesini ziyaret eden herkes için genel bir bilgilendirmedir. Bu site
              üzerinden herhangi bir form doldurmuyor, kişisel veri girmiyorsunuz — site yalnızca X-NETIC ürününü
              tanıtır ve giriş/kulüp oluşturma sayfalarına yönlendirir.
            </p>
            <p className="mt-2">
              X-NETIC uygulamasına (mobil uygulama ve yönetim paneli) bir kulüp üyesi (veli, sporcu, antrenör, kulüp
              yöneticisi) olarak kaydolduğunuzda, kişisel verilerinizin nasıl işlendiğine dair <strong>size özel,
              rolünüze göre hazırlanmış detaylı KVKK Aydınlatma Metni ve Açık Rıza Beyanı</strong> uygulama içinde ilk
              girişinizde ayrıca gösterilir ve onayınız istenir. Aşağıdaki metin bunun yerine geçmez, genel bir özet
              niteliğindedir.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">2. Veri Sorumlusu</h2>
            <p>
              X-NETIC platformunda, platformu kullanan her spor kulübü kendi üyelerinin (sporcu, veli, antrenör)
              kişisel verileri bakımından 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca "Veri
              Sorumlusu" sıfatını taşır. X-NETIC Spor Sistemleri, kulüplere bu veri işleme sürecini yürütebilecekleri
              teknik altyapıyı (yazılım) sağlayan hizmet sağlayıcı konumundadır.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">3. Bu Sitede Toplanan Veri</h2>
            <p>
              xnetic.net şu anda çerez tabanlı takip/analitik araçları veya iletişim formu kullanmamaktadır. Sitede
              yalnızca teknik olarak gerekli olan (sayfayı görüntülemenizi sağlayan) standart sunucu günlükleri
              tutulabilir.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">4. Uygulama İçinde İşlenen Veriler</h2>
            <p>
              Bir kulübe kaydolduğunuzda kulüp; ad-soyad, iletişim bilgileri, doğum tarihi, fotoğraf, spor branşı ve
              grup bilgisi, antrenman/müsabaka katılım kayıtları, performans/ölçüm verileri, aidat ve ödeme bilgileri
              ile ayrıca açık rızanız alınan sağlık verisi ve fotoğraf/video kullanım verilerini işleyebilir. Bu
              verilerin işlenme amaçları, aktarımı ve haklarınız, uygulama içindeki role özel Aydınlatma Metni'nde
              tam olarak açıklanır.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">5. KVKK Madde 11 Kapsamındaki Haklarınız</h2>
            <p>
              KVKK'nın 11. maddesi uyarınca kişisel verinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin
              bilgi talep etme, düzeltilmesini veya silinmesini isteme ve kanuna aykırı işleme nedeniyle uğradığınız
              zararın giderilmesini talep etme haklarına sahipsiniz. Bir kulübün üyesiyseniz bu haklarınızı önce
              kulüp yönetiminden (veri sorumlunuz), platformla ilgili genel sorularınız için ise bizden
              talep edebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">6. İletişim</h2>
            <p>
              {settings?.supportEmail || settings?.supportPhone ? (
                <>
                  {settings.supportEmail && (
                    <>
                      E-posta: <a href={`mailto:${settings.supportEmail}`} className="font-semibold text-teal hover:underline">{settings.supportEmail}</a>
                      <br />
                    </>
                  )}
                  {settings.supportPhone && (
                    <>
                      Telefon: <a href={`tel:${settings.supportPhone}`} className="font-semibold text-teal hover:underline">{settings.supportPhone}</a>
                    </>
                  )}
                </>
              ) : (
                "İletişim bilgileri için lütfen kullandığınız kulübün yönetimiyle iletişime geçin."
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

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
              ile ayrıca açık rızanız alınan fotoğraf/video kullanım verilerini işleyebilir. Bu
              verilerin işlenme amaçları, aktarımı ve haklarınız, uygulama içindeki role özel Aydınlatma Metni'nde
              tam olarak açıklanır.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">5. Çocukların Kişisel Verileri</h2>
            <p>
              X-NETIC'i kullanan kulüplerin sporcularının önemli bir bölümü 18 yaşın altındadır. 18 yaşından küçük bir
              sporcunun kişisel verileri, yalnızca velisi/vasisi tarafından verilen açık rızaya dayanılarak işlenir;
              uygulamadaki aydınlatma ve açık rıza metinleri veli/vasi hesabına gösterilir ve onay veli/vasi tarafından
              verilir. Çocuğa ait bir sporcu giriş hesabı, yalnızca kulüp yöneticisi veya velinin talebiyle oluşturulur
              ve bu hesap üzerinden reklam, profilleme veya pazarlama amaçlı hiçbir veri işlenmez. Velisi olduğunuz
              sporcunun verilerinin silinmesini her zaman talep edebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">6. Verilerin Saklandığı Yer ve Yurt Dışına Aktarım</h2>
            <p>
              X-NETIC'in veritabanı ve dosya depolama altyapısı, hizmet sağlayıcımız Supabase üzerinden Almanya
              (Frankfurt) bölgesindeki sunucularda barındırılmaktadır. Bu nedenle kişisel verileriniz, KVKK anlamında
              yurt dışında (Avrupa Birliği/Almanya) işlenmekte ve saklanmaktadır. Ayrıca mobil bildirimlerin
              iletilmesi için Expo, hata kayıtları için Sentry, e-posta gönderimi için Resend ve bot koruması için
              Cloudflare Turnstile hizmetlerinden yararlanılmaktadır. Bu aktarımlar yalnızca hizmetin sunulabilmesi
              amacıyla ve KVKK'nın öngördüğü şartlara uygun olarak yapılır; verileriniz ticari amaçla üçüncü
              taraflara satılmaz veya devredilmez.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">7. Saklama Süresi</h2>
            <p>
              Kişisel veriler, kulüp üyeliğiniz devam ettiği sürece ve ilgili mevzuatın öngördüğü zamanaşımı/saklama
              süreleri boyunca saklanır. Üyelik sona erdiğinde veya silme talebiniz işleme alındığında veriler, yasal
              saklama yükümlülüğü bulunmayan kısımlar bakımından silinir ya da anonim hale getirilir.
            </p>
          </section>

          <section id="hesap-silme">
            <h2 className="mb-2 text-base font-bold text-ink">8. Hesap ve Veri Silme Talebi</h2>
            <p>
              Hesabınızın ve kişisel verilerinizin silinmesini iki şekilde talep edebilirsiniz:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Mobil uygulamada <strong>Profil → Hesabımı Sil</strong> adımını kullanarak. Talep, kulübünüzün
                yöneticisine (kulüp yöneticisiyseniz X-NETIC ekibine) iletilir ve hesabınız erişime kapatılır.
              </li>
              <li>
                Aşağıdaki iletişim adresine, hesabınıza kayıtlı ad-soyad ve telefon/e-posta bilgisiyle bir silme talebi
                göndererek.
              </li>
            </ul>
            <p className="mt-2">
              Talebiniz en geç 30 gün içinde sonuçlandırılır. Silme sonrasında; aidat/ödeme kayıtları gibi yasal
              saklama yükümlülüğüne tabi veriler, mevzuatta öngörülen süre boyunca yalnızca bu amaçla saklanmaya
              devam edebilir. Kulübe kayıtlı bir sporcu/veli iseniz veri sorumlusu kulübünüz olduğundan, talebinizin
              kulüp kayıtlarına da yansıtılması için öncelikle kulüp yönetimiyle iletişime geçmeniz önerilir.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">9. KVKK Madde 11 Kapsamındaki Haklarınız</h2>
            <p>
              KVKK'nın 11. maddesi uyarınca kişisel verinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin
              bilgi talep etme, düzeltilmesini veya silinmesini isteme ve kanuna aykırı işleme nedeniyle uğradığınız
              zararın giderilmesini talep etme haklarına sahipsiniz. Bir kulübün üyesiyseniz bu haklarınızı önce
              kulüp yönetiminden (veri sorumlunuz), platformla ilgili genel sorularınız için ise bizden
              talep edebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-ink">10. İletişim</h2>
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

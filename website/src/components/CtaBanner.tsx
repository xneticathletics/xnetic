const APP_URL = import.meta.env.VITE_APP_URL as string;

export default function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="rounded-3xl border border-line bg-surface px-8 py-14 text-center">
        <h2 className="text-2xl font-extrabold text-ink md:text-3xl">Kulübünü dijitalleştirmeye hazır mısın?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Dakikalar içinde kaydol, kulübünü kur, antrenörlerini ve velilerini davet et.
        </p>
        <a
          href={`${APP_URL}/kulup-olustur`}
          className="mt-6 inline-block rounded-lg bg-yellow px-7 py-3 text-sm font-bold text-bg transition hover:brightness-95"
        >
          Kulübünü Oluştur
        </a>
      </div>
    </section>
  );
}

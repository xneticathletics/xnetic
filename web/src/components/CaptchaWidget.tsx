import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Mobildeki CaptchaModal.tsx'in web karşılığı — burada gerçek bir tarayıcı
// olduğu için WebView'e hiç gerek yok, Cloudflare Turnstile script'i
// doğrudan sayfaya (index.html) eklendi, bu bileşen sadece widget'ı
// render edip onSuccess ile token'ı yukarı taşıyor.
//
// Supabase Auth'un CAPTCHA koruması (Authentication → Attack Protection)
// açık olduğu için signInWithPassword çağıran HER yer (LoginPage,
// AccountPage'deki mevcut şifre doğrulama, CreateClubPage'in otomatik
// girişi) bu bileşeni kullanmalı — birini atlarsak sadece o akış kırılır.
const SITE_KEY = "0x4AAAAAAEqiHSj1HJUkLV8K";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: string;
          size?: "normal" | "compact" | "flexible";
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

// Bir sayfada captcha token'ı BİRDEN FAZLA korumalı işlem için gerekiyorsa
// (ör. CreateClubPage: önce create-club edge fonksiyonu, sonra otomatik
// signInWithPassword) — Turnstile token'ları TEK KULLANIMLIK, aynı token'ı
// ikinci bir doğrulamaya göndermek Cloudflare'dan "timeout-or-duplicate"
// hatası döndürür. Bu yüzden widget'ı programatik olarak resetleyip TAZE
// bir token almak için dışarıya bir ref API'si açıyoruz.
export type CaptchaWidgetHandle = { reset: () => void };

export default forwardRef<CaptchaWidgetHandle, { onToken: (token: string) => void }>(function CaptchaWidget(
  { onToken },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => window.turnstile?.reset(widgetIdRef.current ?? undefined),
  }));

  useEffect(() => {
    let cancelled = false;

    const tryRender = () => {
      if (cancelled || !containerRef.current) return;
      if (!window.turnstile) {
        // Script henüz yüklenmediyse kısa aralıklarla tekrar dener.
        setTimeout(tryRender, 150);
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        // "normal" boyutu sabit 300px genişlikte, esnemiyor — dar telefon
        // ekranlarında (ör. 375px genişlikli bir cihazda formun kendi
        // padding'i düşüldüğünde kalan alan 300px'in altına iniyor) widget
        // konteynerinden taşıp yatay kaymaya/kırpılmaya yol açıyordu.
        // "flexible" konteyner genişliğine göre daralıp genişliyor.
        size: "flexible",
        callback: (token) => onToken(token),
        "expired-callback": () => window.turnstile?.reset(widgetIdRef.current ?? undefined),
      });
    };

    tryRender();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="w-full" />;
});

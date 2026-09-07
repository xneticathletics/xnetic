import { useEffect, useRef } from "react";

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
        options: { sitekey: string; theme?: string; callback: (token: string) => void; "expired-callback"?: () => void }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function CaptchaWidget({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

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

  return <div ref={containerRef} />;
}

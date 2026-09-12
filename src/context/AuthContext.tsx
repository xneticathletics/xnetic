import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import * as Sentry from "@sentry/react-native";
import { logBoot } from "../lib/bootLog";
import { supabase } from "../lib/supabase";
import { resetCurrentUserCache } from "../lib/api/currentUser";
import { resolveLoginEmail } from "../lib/loginIdentifier";
import { registerForPushNotificationsAsync } from "../lib/push";

export type UserRole =
  | "super_admin"
  | "club_admin"
  | "coach"
  | "parent"
  | "athlete";

type AuthState = {
  session: Session | null;
  role: UserRole | null;
  clubId: string | null;
  loading: boolean;
  // true: uygulama açılırken zaten cihazda kayıtlı bir oturum vardı (tam
  // kapatılıp tekrar açılmış demek) — BiometricLockGate SADECE bu durumda
  // ilk açılışta kilit gösteriyor. false/null: bu oturum interaktif bir
  // signIn() ile (kullanıcı az önce şifresini girerek) başladı, aynı anda
  // ayrıca biyometrik istemeye gerek yok.
  initialSessionWasRestored: boolean | null;
  // Bir kere okunup sıfırlanan bir bayrak: son oturum değişikliği az önce
  // BAŞARILI bir signIn() (şifreyle interaktif giriş) çağrısından mı geldi?
  // BiometricLockGate, şifreyle az önce giriş yapan birine hemen ardından
  // ayrıca Face ID/parmak izi sormamak için bunu kullanıyor (Face ID
  // reddedilip oturum kapatıldıktan sonra tekrar şifreyle giriş yapıldığında
  // da geçerli — sadece uygulamanın İLK açılışına özel değil).
  consumeJustSignedIn: () => boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// Supabase Auth'un İngilizce/teknik hata mesajlarını, giriş ekranında
// kullanıcının anlayacağı Türkçe uyarılara çevirir. Eşleşme bulunamazsa
// (beklenmeyen/teknik bir hata) kullanıcıya ham İngilizce metin yerine
// genel, anlaşılır bir mesaj gösterilir.
function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Giriş bilgisi veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.";
  }
  if (lower.includes("email not confirmed")) {
    return "Hesabınız henüz onaylanmamış. Lütfen kulüp yöneticinizle iletişime geçin.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }
  if (lower.includes("too many requests") || lower.includes("rate limit")) {
    return "Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.";
  }
  return "Giriş yapılamadı. Giriş bilginizi ve şifrenizi kontrol edip tekrar deneyin.";
}

// JWT payload'ını çözer. Supabase Auth Hook, custom_access_token_hook ile
// club_id ve role claim'lerini access token'a ekler (bkz. supabase/002_auth_claims_hook.sql).
function decodeJwtPayload(accessToken: string): Record<string, unknown> {
  try {
    const base64 = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialSessionWasRestoredRef = useRef<boolean | null>(null);
  const justSignedInRef = useRef(false);
  const consumeJustSignedIn = useCallback(() => {
    const v = justSignedInRef.current;
    justSignedInRef.current = false;
    return v;
  }, []);

  useEffect(() => {
    // Sadece .catch() eklemek yetmedi (bir cihazda hâlâ süresiz takılı
    // kalınıyordu) — demek ki bu çağrı bazen REDDEDİLMİYOR, hiç
    // SONUÇLANMIYOR (ör. SecureStore/Keychain native köprüsünde bir
    // kilitlenme). Ne .then ne .catch hiç tetiklenmeyen bir promise'a
    // karşı tek gerçek çözüm bir zaman aşımı yarışı: 5 saniyede
    // sonuçlanmazsa "oturum yok" varsayıp devam ediyoruz. Bu, gerçek
    // neden ne olursa olsun uygulamanın süresiz açılış ekranında
    // kilitli kalmasını KESİN olarak engelliyor.
    logBoot("AuthContext: getSession() çağrılıyor");
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      logBoot("AuthContext: getSession() 5sn'de sonuçlanmadı, ZAMAN AŞIMI");
      Sentry.captureMessage("getSession() 5sn içinde hiç sonuçlanmadı, oturumsuz devam edildi.");
      initialSessionWasRestoredRef.current = false;
      setSession(null);
      setLoading(false);
    }, 5000);

    supabase.auth.getSession()
      .then(({ data }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        logBoot(`AuthContext: getSession() sonuçlandı (session=${!!data.session})`);
        initialSessionWasRestoredRef.current = !!data.session;
        setSession(data.session);
        setLoading(false);
      })
      .catch((e) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        logBoot(`AuthContext: getSession() REDDEDİLDİ: ${e?.message ?? e}`);
        Sentry.captureException(e);
        initialSessionWasRestoredRef.current = false;
        setSession(null);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Her oturum değişikliğinde (giriş/çıkış/hesap değişimi) önbelleklenen
      // uygulama kullanıcı id'sini temizle — yoksa bir önceki hesabın id'si
      // yanlışlıkla kullanılmaya devam edebilir (bkz. currentUser.ts).
      resetCurrentUserCache();
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Giriş yapıldığında ve (uygulama yeniden açılıp) mevcut oturum geri
  // yüklendiğinde push token'ı kaydet — session referansı token yenilenince
  // de değiştiği için sadece kullanıcı id'si değişince tetikleniyor.
  useEffect(() => {
    if (session?.user?.id) registerForPushNotificationsAsync();
  }, [session?.user?.id]);

  const claims = useMemo(
    () => (session?.access_token ? decodeJwtPayload(session.access_token) : {}),
    [session?.access_token]
  );

  const value: AuthState = {
    session,
    role: (claims.app_role as UserRole) ?? null,
    clubId: (claims.club_id as string) ?? null,
    loading,
    initialSessionWasRestored: initialSessionWasRestoredRef.current,
    consumeJustSignedIn,
    signIn: async (email, password, captchaToken) => {
      if (!email.trim() || !password) {
        return { error: "Giriş bilgisi ve şifre alanlarını doldurmalısınız." };
      }
      let loginEmail: string;
      try {
        loginEmail = resolveLoginEmail(email);
      } catch (e: any) {
        return { error: e.message ?? "Geçersiz giriş bilgisi." };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      if (!error) justSignedInRef.current = true;
      return { error: error ? translateAuthError(error.message) : null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}

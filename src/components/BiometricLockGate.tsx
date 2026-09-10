import React, { useCallback, useEffect, useRef, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../screens/SplashScreen";

// Sadece admin/antrenör/süper admin için — veli/sporcu hesabı her zaman
// açık kalıyor (kullanıcının kararı: "veli sporcunun hesabı hep açık
// kalabilir"). Oturum artık cihazda kalıcı (bkz. supabase.ts) — bu
// bileşen o kalıcılığın karşılığında admin/antrenör tarafına eklenen
// tek güvenlik katmanı.
const GATED_ROLES = new Set(["club_admin", "coach", "super_admin"]);

export default function BiometricLockGate({ children }: { children: React.ReactNode }) {
  const { session, role, loading, initialSessionWasRestored, consumeJustSignedIn } = useAuth();
  const needsGate = !loading && !!session && !!role && GATED_ROLES.has(role);

  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(false);
  // İlk açılışta (uygulama tam kapatılıp tekrar açıldığında) sadece
  // ZATEN kayıtlı bir oturum varsa kilit gösteriyoruz — az önce şifreyle
  // interaktif giriş yapan birine hemen ardından ayrıca Face ID sormuyoruz.
  const coldStartHandledRef = useRef(false);
  // attemptUnlock'un kendi içindeki koruma — aynı render turunda iki ayrı
  // effect'in (ilk açılış + yeniden kilitleme) aynı anda ikinci bir Face
  // ID istemi açmasını engelliyor.
  const isAuthenticatingRef = useRef(false);

  const attemptUnlock = useCallback(async () => {
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;
    setChecking(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        // Cihazda Face ID/parmak izi/PIN kurulu değil — burada kullanıcıyı
        // dışarıda bırakmak anlamsız (zaten cihazın kendisi kilitsiz),
        // sadece geçişe izin veriyoruz.
        setUnlocked(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Devam etmek için kimliğini doğrula",
        cancelLabel: "Vazgeç",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setUnlocked(true);
      } else {
        // Tanımadı / reddetti / vazgeçti — "Tekrar Dene" ekranında
        // bekletmek yerine doğrudan normal giriş sayfasına düşürüyoruz:
        // oturumu kapatıyoruz, session null olunca RootNavigator zaten
        // Login ekranını gösteriyor.
        await supabase.auth.signOut().catch(() => {});
      }
    } catch {
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setChecking(false);
      isAuthenticatingRef.current = false;
    }
  }, []);

  // İlk açılış: sadece ZATEN kayıtlı bir oturum geri yüklendiyse kilitle.
  useEffect(() => {
    if (coldStartHandledRef.current) return;
    if (loading) return;
    coldStartHandledRef.current = true;
    if (needsGate && initialSessionWasRestored) attemptUnlock();
    else if (needsGate) setUnlocked(true);
  }, [loading, needsGate, initialSessionWasRestored, attemptUnlock]);

  // Kullanıcı kararı: kilit SADECE uygulama tam kapatılıp tekrar
  // açıldığında (yukarıdaki ilk açılış efekti) devreye girsin — kısa süreli
  // arka plana atılma (başka bir uygulamaya geçiş, bildirim, kontrol
  // merkezi vb.) tekrar Face ID sormasın. Eskiden AppState "background" →
  // "active" geçişinde de yeniden kilitleniyordu; bu, normal kullanım
  // sırasında (ör. bir bildirime dokunup geri dönmek) gereksiz ve
  // rahatsız edici sıklıkta Face ID istemine yol açıyordu.

  // Kilit tekrar devreye girdiğinde (ilk açılış efekti unlocked'ı false
  // bıraktığında) otomatik olarak biyometrik istemi aç — AMA bu oturum az
  // önce şifreyle interaktif signIn()'den geldiyse (örn. Face ID
  // reddedilip oturum kapandıktan sonra şifreyle tekrar giriş
  // yapıldığında) hiç sormadan direkt içeri alıyoruz — kullanıcı zaten o
  // an kimliğini şifreyle kanıtladı, ayrıca Face ID istemek gereksiz.
  useEffect(() => {
    if (!needsGate || unlocked || checking || !coldStartHandledRef.current) return;
    if (consumeJustSignedIn()) {
      setUnlocked(true);
      return;
    }
    attemptUnlock();
  }, [needsGate, unlocked, checking, attemptUnlock, consumeJustSignedIn]);

  if (!needsGate || unlocked) return <>{children}</>;

  // Face ID/Touch ID kontrolü sürerken ayrı bir "Kilitli" yazılı ekran
  // GÖSTERMİYORUZ — kullanıcı isteği: uygulama açılışındaki logo ekranından
  // (SplashScreen, RootNavigator'da da aynısı kullanılıyor) kesintisiz
  // devam ediyormuş gibi hissettirsin. Tanımama/reddetme durumunda zaten
  // attemptUnlock oturumu kapatıp normal giriş ekranına düşürüyor, bu
  // yüzden burada ayrıca bir "Tekrar Dene" ekranına da gerek yok.
  return <SplashScreen />;
}

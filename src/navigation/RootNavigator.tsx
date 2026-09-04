import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/tokens";
import LoginScreen from "../screens/LoginScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import SplashScreen from "../screens/SplashScreen";
import ForcePasswordChangeScreen from "../screens/ForcePasswordChangeScreen";
import CoachOnboardingScreen from "../screens/CoachOnboardingScreen";
import ConsentScreen from "../screens/ConsentScreen";
import MaintenanceScreen from "../screens/MaintenanceScreen";
import SubscriptionPendingScreen from "../screens/SubscriptionPendingScreen";
import { getMyOnboardingStatus, getMyMustChangePassword } from "../lib/api/currentUser";
import { hasAllRequiredConsents } from "../lib/api/consents";
import { parseRecoveryUrl, startRecoverySession } from "../lib/api/passwordReset";
import { getPlatformSettings } from "../lib/api/platformSettings";
import { getMySubscriptionStatus, BLOCKED_SUBSCRIPTION_STATUSES, type ClubSubscriptionStatus } from "../lib/api/subscriptionStatus";
import RoleTabs from "../navigation/RoleTabs";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.surface, border: colors.line },
};

// Expo Go, native (JS öncesi) splash ekranını özelleştirmemize izin
// vermiyor (SDK 52+ sınırlaması — sadece uygulama ikonunu gösteriyor).
// Bu yüzden JS içindeki SplashScreen'in en az bu kadar görünür kalmasını
// sağlıyoruz; yoksa Supabase oturum kontrolü çok hızlı bitince göz açıp
// kapayana kadar geçip gidiyordu.
const MIN_SPLASH_MS = 1200;

export default function RootNavigator() {
  const { session, loading, role } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  // Şifremi Unuttum linkine dokununca uygulama DOĞRUDAN açılır (harici
  // bir web sayfası yok) — bu bayrak true olunca, oturum durumu ne
  // olursa olsun Yeni Şifre Belirle ekranı gösterilir.
  const [isRecovering, setIsRecovering] = useState(false);
  // null = henüz kontrol edilmedi. Sıra: önce şifre değiştirme
  // (TÜM roller), sonra — sadece Antrenör'de — bilgi tamamlama.
  const [mustChangePassword, setMustChangePassword] = useState<boolean | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  // Sadece Veli rolünde: şifre değişimi + (varsa) onboarding bitince,
  // KVKK/sağlık/foto-video/sorumluluk onayları tamamlanmış mı kontrol edilir.
  const [consentsDone, setConsentsDone] = useState<boolean | null>(null);
  // Süper Admin, Sistem Ayarları'ndan bakım modunu açtığında Süper Admin
  // dışındaki tüm roller bu bayrakla App'e hiç girmeden MaintenanceScreen'e
  // yönlendirilir — kontrolü diğer gate'lerden (şifre/onboarding/onay) önce yapıyoruz.
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  // Sadece Kulüp Admini'nde: kulübün abonelik ödemesi onay bekliyorsa/gecikmişse/
  // iptal edilmişse App'e hiç girmeden bir bilgilendirme ekranı gösterilir.
  // subscriptionChecked: ilk sorgu dönene kadar false — bu olmadan
  // stillChecking, kontrol bitmeden Ana Sayfa'yı bir anlığına render ederdi.
  const [subscription, setSubscription] = useState<ClubSubscriptionStatus | null>(null);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  // Şifre değiştirme işlemi (supabase.auth.updateUser) oturumu tazeliyor,
  // bu da AŞAĞIDAKİ [session, role] efektini TEKRAR tetikleyip sunucudan
  // must_change_password'ü YENİDEN sorguluyordu — bu ikinci sorgu, bizim
  // az önce yaptığımız DB güncellemesinden ÖNCE başladığı için hâlâ eski
  // (true) değeri okuyup handlePasswordChanged'ın doğru "false"unu
  // eziyordu. Kullanıcı "Devam Et"e bastığında ekranın kendini tekrar
  // gösterdiği bug buydu. Yerel onaydan sonra bu efekti tamamen atlıyoruz.
  const passwordConfirmedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // Şifre sıfırlama e-postasındaki linke dokununca uygulama bu URL ile
  // açılır (hem uygulama kapalıyken hem açıkken çalışsın diye iki yolu
  // da dinliyoruz).
  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = parseRecoveryUrl(url);
      if (!parsed) return;
      startRecoverySession(parsed.accessToken, parsed.refreshToken)
        .then(() => setIsRecovering(true))
        .catch(() => {});
    };

    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!session || !role) {
      setMustChangePassword(null);
      setOnboardingDone(null);
      passwordConfirmedRef.current = false;
      return;
    }
    if (passwordConfirmedRef.current) return;
    let cancelled = false;
    getMyMustChangePassword()
      // Bu sorgu başladıktan SONRA (ama sonuçlanmadan ÖNCE) şifre yerel
      // olarak onaylanmış olabilir — handlePasswordChanged'in senkron
      // ref güncellemesi bu durumda da geçerli olsun diye, sonuç
      // geldiğinde ref'i TEKRAR kontrol ediyoruz, sadece başlangıçta değil.
      .then((must) => { if (!cancelled && !passwordConfirmedRef.current) setMustChangePassword(must); })
      .catch(() => { if (!cancelled && !passwordConfirmedRef.current) setMustChangePassword(false); });
    return () => { cancelled = true; };
  }, [session, role]);

  useEffect(() => {
    if (!session || !role || role === "super_admin") {
      setMaintenanceMode(false);
      return;
    }
    let cancelled = false;
    const checkMaintenance = () => {
      getPlatformSettings()
        .then((s) => {
          if (cancelled) return;
          setMaintenanceMode(s.maintenanceMode);
          setMaintenanceMessage(s.maintenanceMessage);
        })
        .catch(() => {});
    };
    checkMaintenance();
    // Oturum zaten açıkken Süper Admin bakım modunu açarsa, uygulama arka
    // planda/önde kalmaya devam ettiği sürece bunu fark etmiyordu — uygulama
    // her öne geldiğinde de tekrar kontrol ediyoruz.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") checkMaintenance();
    });
    return () => { cancelled = true; subscription.remove(); };
  }, [session, role]);

  useEffect(() => {
    if (!session || role !== "club_admin") {
      setSubscription(null);
      setSubscriptionChecked(false);
      return;
    }
    let cancelled = false;
    const checkSubscription = () => {
      getMySubscriptionStatus()
        .then((s) => { if (!cancelled) setSubscription(s); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setSubscriptionChecked(true); });
    };
    checkSubscription();
    // Süper Admin onayı verdiğinde uygulamanın açık kalıp kalmadığından
    // bağımsız olarak yakalansın diye, uygulama her öne geldiğinde tekrar kontrol ediyoruz.
    const subscriptionListener = AppState.addEventListener("change", (state) => {
      if (state === "active") checkSubscription();
    });
    return () => { cancelled = true; subscriptionListener.remove(); };
  }, [session, role]);

  useEffect(() => {
    // Şifre değiştirme adımı bitmeden onboarding kontrolünü hiç başlatma.
    if (!session || !role || mustChangePassword !== false) {
      if (mustChangePassword !== false) setOnboardingDone(null);
      return;
    }
    if (role !== "coach") {
      setOnboardingDone(true);
      return;
    }
    let cancelled = false;
    getMyOnboardingStatus()
      .then((done) => { if (!cancelled) setOnboardingDone(done); })
      .catch(() => { if (!cancelled) setOnboardingDone(true); });
    return () => { cancelled = true; };
  }, [session, role, mustChangePassword]);

  useEffect(() => {
    // Şifre değiştirme VE (varsa) onboarding bitmeden onay kontrolünü hiç başlatma.
    if (!session || !role || mustChangePassword !== false || onboardingDone !== true) {
      if (!(mustChangePassword === false && onboardingDone === true)) setConsentsDone(null);
      return;
    }
    if (role !== "parent") {
      setConsentsDone(true);
      return;
    }
    let cancelled = false;
    hasAllRequiredConsents()
      .then((done) => { if (!cancelled) setConsentsDone(done); })
      .catch(() => { if (!cancelled) setConsentsDone(true); });
    return () => { cancelled = true; };
  }, [session, role, mustChangePassword, onboardingDone]);

  // Normal bir girişten sonra bu bayrağı sıfırla — yoksa çıkış yapılıp
  // login'e dönüldüğünde yanlışlıkla kaldığı adımda açılabilirdi.
  useEffect(() => {
    if (session) {
      setShowForgotPassword(false);
    }
  }, [session]);

  const handlePasswordChanged = useCallback(() => {
    passwordConfirmedRef.current = true;
    setMustChangePassword(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingDone(true);
  }, []);

  const handleConsentsComplete = useCallback(() => {
    setConsentsDone(true);
  }, []);

  if (loading || !minTimeElapsed) {
    return <SplashScreen />;
  }

  const stillChecking =
    !isRecovering &&
    session && role && (
      mustChangePassword === null ||
      (mustChangePassword === false && role === "club_admin" && !subscriptionChecked) ||
      (mustChangePassword === false && onboardingDone === null) ||
      (mustChangePassword === false && onboardingDone === true && consentsDone === null)
    );

  if (stillChecking) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isRecovering ? (
          <Stack.Screen name="ResetPassword">
            {() => <ResetPasswordScreen onDone={() => setIsRecovering(false)} />}
          </Stack.Screen>
        ) : !session || !role ? (
          showForgotPassword ? (
            <Stack.Screen name="ForgotPassword">
              {() => <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Login">
              {() => <LoginScreen onForgotPassword={() => setShowForgotPassword(true)} />}
            </Stack.Screen>
          )
        ) : maintenanceMode ? (
          <Stack.Screen name="Maintenance">
            {() => <MaintenanceScreen message={maintenanceMessage} />}
          </Stack.Screen>
        ) : mustChangePassword === true ? (
          <Stack.Screen name="ForcePasswordChange">
            {() => <ForcePasswordChangeScreen onComplete={handlePasswordChanged} />}
          </Stack.Screen>
        ) : role === "club_admin" && subscription && BLOCKED_SUBSCRIPTION_STATUSES.includes(subscription.status) ? (
          <Stack.Screen name="SubscriptionPending">
            {() => (
              <SubscriptionPendingScreen
                status={subscription.status}
                billingPeriod={subscription.billingPeriod}
                amountTry={subscription.amountTry}
              />
            )}
          </Stack.Screen>
        ) : onboardingDone === false ? (
          <Stack.Screen name="Onboarding">
            {() => <CoachOnboardingScreen onComplete={handleOnboardingComplete} />}
          </Stack.Screen>
        ) : consentsDone === false ? (
          <Stack.Screen name="Consent">
            {() => <ConsentScreen onComplete={handleConsentsComplete} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="App">{() => <RoleTabs role={role} />}</Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

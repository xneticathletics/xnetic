import React, { useEffect } from "react";
import { AppState, Keyboard, Text, TextInput, View } from "react-native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { BranchSelectProvider } from "./src/context/BranchSelectContext";
import { ClubSettingsProvider } from "./src/context/ClubSettingsContext";
import RootNavigator from "./src/navigation/RootNavigator";
import ErrorBoundary from "./src/components/ErrorBoundary";
import NotificationResponseHandler from "./src/components/NotificationResponseHandler";
import BiometricLockGate from "./src/components/BiometricLockGate";
import { useDeviceOrientationLock } from "./src/hooks/useDeviceOrientationLock";
import { colors } from "./src/theme/tokens";

// Geliştirme sırasında kendi hatalarımız Sentry'yi kirletmesin diye sadece
// gerçek (production/preview) build'lerde etkin — dev modda __DEV__ true.
// Kaynak haritası (source map) otomatik yüklemesi henüz kurulu değil
// (organization/project slug + SENTRY_AUTH_TOKEN gerektiriyor) — şimdilik
// hata YAKALAMA çalışıyor, Sentry panelindeki stack trace'ler minified
// olacak. Kişisel veri gönderimini bilerek KAPALI tutuyoruz (sendDefaultPii
// varsayılanı zaten false) — KVKK incelemesi tamamlanmadan IP/kullanıcı
// bilgisi gibi ek veri toplamaya başlamıyoruz.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  environment: __DEV__ ? "development" : "production",
  tracesSampleRate: 0.2,
});

// Daha modern bir görünüm için tüm uygulamaya tek bir değişken (variable)
// font uyguluyoruz. RN 0.81 + React 19'da Text artık defaultProps okumayan
// bir fonksiyon bileşeni — bu yüzden klasik "Text.defaultProps.style"
// numarası çalışmıyor. Bu projenin Babel ayarı JSX'i "automatic" runtime'a
// derliyor (React.createElement DEĞİL, react/jsx-runtime'daki jsx/jsxs —
// dev modda jsx-dev-runtime'daki jsxDEV) — bu yüzden asıl yamayı ORADA
// yapıyoruz. React.createElement'i de ayrıca yamalıyoruz çünkü bazı
// node_modules içindeki kütüphaneler (ör. eski/klasik runtime'la
// derlenmiş paketler) hâlâ onu doğrudan çağırabiliyor.
// Font gerçek bir "variable font" olduğu için var olan fontWeight
// değerleri (400/600/700/800...) aynen çalışmaya devam ediyor.
let fontPatched = false;
function patchDefaultFont(fontFamily: string) {
  if (fontPatched) return;
  fontPatched = true;

  const injectFont = (type: any, props: any) => {
    if ((type === Text || type === TextInput) && props) {
      return { ...props, style: [{ fontFamily }, props.style] };
    }
    return props;
  };

  const jsxRuntime = require("react/jsx-runtime");
  const origJsx = jsxRuntime.jsx;
  const origJsxs = jsxRuntime.jsxs;
  jsxRuntime.jsx = (type: any, props: any, key?: any) => origJsx(type, injectFont(type, props), key);
  jsxRuntime.jsxs = (type: any, props: any, key?: any) => origJsxs(type, injectFont(type, props), key);

  const jsxDevRuntime = require("react/jsx-dev-runtime");
  const origJsxDEV = jsxDevRuntime.jsxDEV;
  jsxDevRuntime.jsxDEV = (type: any, props: any, key?: any, isStaticChildren?: any, source?: any, self?: any) =>
    origJsxDEV(type, injectFont(type, props), key, isStaticChildren, source, self);

  const origCreateElement = React.createElement;
  // @ts-expect-error - kasıtlı global monkeypatch, imza React'in kendisiyle aynı
  React.createElement = function (type: any, props: any, ...children: any[]) {
    return origCreateElement(type, injectFont(type, props), ...children);
  };
}

// TEŞHİS AMAÇLI GEÇİCİ ANAHTAR: gerçek bir cihazda (yeni kayıt edilen bir
// iOS cihazı) uygulama açılışta süresiz siyah ekranda takılı kalıyor,
// 4sn'lik zaman aşımı güvenlik ağı (aşağıdaki commit'te eklendi) bile
// devreye giremedi — bu da sorunun "font yavaş yükleniyor" değil, font
// require()/useFonts çağrısının SENKRON olarak bir yerde patladığı ve
// App() hiç render tamamlayamadığı ihtimalini güçlendiriyor. Bunu kesin
// olarak ayırt etmek için özel fontu tamamen devre dışı bırakıp aynı
// build'i tekrar test ediyoruz — açılırsa suçlu font, açılmazsa başka bir
// yerde arıyoruz. Sorun çözülünce false'a çekilip normal font geri gelecek.
const DISABLE_CUSTOM_FONT_FOR_DIAGNOSIS = true;

function App() {
  const [fontsLoaded, fontError] = useFonts(
    DISABLE_CUSTOM_FONT_FOR_DIAGNOSIS ? {} : { Inter: require("./src/assets/fonts/Inter-Variable.ttf") }
  );

  const [fontTimedOut, setFontTimedOut] = React.useState(false);
  useEffect(() => {
    if (fontsLoaded || fontError) return;
    const timer = setTimeout(() => {
      Sentry.captureMessage("Font yükleme 4sn içinde tamamlanmadı, sistem fontuyla devam edildi.");
      setFontTimedOut(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  if (fontError) Sentry.captureException(fontError);

  const fontsReady = DISABLE_CUSTOM_FONT_FOR_DIAGNOSIS || fontsLoaded || !!fontError || fontTimedOut;

  if (!DISABLE_CUSTOM_FONT_FOR_DIAGNOSIS && fontsLoaded) patchDefaultFont("Inter");

  // Telefonda dikey kilit hâlâ aynen devam ediyor — sadece tablette
  // (masaüstünde/resepsiyonda yatay tutmak yaygın) serbest dönüşe izin
  // veriyoruz. bkz. useDeviceOrientationLock.ts.
  useDeviceOrientationLock();

  // Android'de klavye açıkken uygulama arka plana alınıp geri dönülünce,
  // native taraf klavye/layout durumunu doğru senkronlamıyor — ekran boş
  // görünüyor, sadece bir klavye olayı (ör. Enter'a basmak) düzeltiyordu.
  // Arka plana geçerken klavyeyi kapatarak bu bozuk durumun hiç
  // oluşmasını engelliyoruz.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") Keyboard.dismiss();
    });
    return () => subscription.remove();
  }, []);

  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BranchSelectProvider>
            <ClubSettingsProvider>
              <StatusBar style="light" />
              <NotificationResponseHandler />
              <BiometricLockGate>
                <RootNavigator />
              </BiometricLockGate>
            </ClubSettingsProvider>
          </BranchSelectProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);

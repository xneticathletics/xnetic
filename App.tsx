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

function App() {
  const [fontsLoaded] = useFonts({
    Inter: require("./src/assets/fonts/Inter-Variable.ttf"),
  });

  if (fontsLoaded) patchDefaultFont("Inter");

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

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BranchSelectProvider>
            <ClubSettingsProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </ClubSettingsProvider>
          </BranchSelectProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);

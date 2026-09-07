import { createNavigationContainerRef } from "@react-navigation/native";
import type { NotificationTarget } from "../lib/notificationNavigation";

// RootNavigator'daki <NavigationContainer> bu ref'i alır. Push bildirimine
// dokunulduğunda (uygulama arka planda/kapalıyken) hiçbir ekranın kendi
// navigation prop'una erişimimiz olmuyor — bu yüzden köke bağlı, global
// bir ref üzerinden yönlendiriyoruz (bkz. NotificationResponseHandler.tsx).
export const navigationRef = createNavigationContainerRef();

export function navigateFromRoot(target: NotificationTarget) {
  if (!navigationRef.isReady()) return;
  // Kök Stack.Navigator'daki tek gerçek ekran adı "App" (RoleTabs'ı
  // render eder) — oradan içeri, hedef sekmeye ve o sekmenin kendi
  // stack'indeki ekrana iniyoruz. React Navigation'ın "iç içe navigate"
  // deseni: navigate(dışTakipEkranı, { screen, params: { screen, params } }).
  (navigationRef.navigate as (...args: any[]) => void)("App", {
    screen: target.tab,
    params: { screen: target.screen, params: target.params },
  });
}

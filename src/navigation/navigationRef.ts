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
  //
  // Hedef ekran o sekmenin KENDİ başlangıç ekranından farklıysa (ör.
  // "Mağaza" sekmesinin başlangıcı ShopManage ama bildirim ShopOrders'a
  // gitmek istiyor), sekmeyi TEK bir iç içe navigate ile doğrudan o
  // ekranla kurmak native-stack v7'de bazen geri gitmeyi/sekme
  // değiştirmeyi tepkisiz bırakıyor (bkz. RoleTabs.tsx'teki "bilinen
  // kırılganlık" notu). Önce sekmeyi kendi başlangıç ekranıyla açıp,
  // hedefi BİR SONRAKİ adımda push ederek stack'in normal, iki adımlı
  // şekilde kurulmasını sağlıyoruz.
  const navigate = navigationRef.navigate as (...args: any[]) => void;
  navigate("App", { screen: target.tab });
  requestAnimationFrame(() => {
    navigate("App", { screen: target.tab, params: { screen: target.screen, params: target.params } });
  });
}

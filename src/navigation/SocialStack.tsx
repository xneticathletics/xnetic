import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import SocialFeedScreen from "../screens/SocialFeedScreen";
import SocialPostFormScreen from "../screens/SocialPostFormScreen";

export type SocialStackParamList = {
  SocialFeed: { initialTab?: "feed" | "pending" } | undefined;
  SocialPostForm: undefined;
};

const Stack = createNativeStackNavigator<SocialStackParamList>();

// "Sosyal" sekmesine basınca AÇILAN gerçek, bağımsız bir stack — daha
// önce bu ekranlar HomeStack'in İÇİNDE, "Ana Menü"ye push edilerek
// gösteriliyordu (bkz. RoleTabs.tsx'teki eski tabPress yönlendirmesi),
// bu yüzden native-stack'in push geçiş animasyonunu (sağdan kayma)
// kullanmak zorunda kalıyordu — Mesajlar/Profil'in aksine, ki onlar da
// tıpkı bunun gibi kendi bağımsız stack'lerine sahip GERÇEK sekmeler,
// bottom-tabs'ın sekme değişimi (native-stack'in push/pop'undan tamamen
// ayrı bir mekanizma) hiç animasyon kullanmadığı için direkt açılıyorlar.
// Bu stack'i ayırmak animation'a HİÇ dokunmadan aynı "direkt açılma"
// davranışını verir — animation'ı özelleştirmek daha önce (HomeStack
// içindeyken) iki kez geri tuşunu bozmuştu, o riske hiç girilmiyor.
export default function SocialStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="SocialFeed" component={SocialFeedScreen} options={{ headerShown: false, title: "Sosyal" }} />
      <Stack.Screen name="SocialPostForm" component={SocialPostFormScreen} options={{ title: "Yeni Paylaşım" }} />
    </Stack.Navigator>
  );
}

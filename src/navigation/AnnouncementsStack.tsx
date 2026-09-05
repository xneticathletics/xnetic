import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import AnnouncementDetailScreen from "../screens/AnnouncementDetailScreen";

export type AnnouncementsStackParamList = {
  Announcements: undefined;
  AnnouncementDetail: { announcementId: string };
};

const Stack = createNativeStackNavigator<AnnouncementsStackParamList>();

// Antrenör/Veli/Sporcu'nun alt menüsündeki bağımsız "Duyurular" sekmesi —
// Kulüp Admini ve Süper Admin'in kendi ayarlar sekmesi (Kulüp/Sistem
// Ayarları) olduğu için bu üçü hariç herkeste Profil'in yanında görünür
// (bkz. RoleTabs.tsx). Duyurular ayrıca club_admin/super_admin'de
// Profil'in içinden (ProfileStack) de erişilebilir durumda kalıyor.
export default function AnnouncementsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: "Duyurular" }} />
      <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} options={{ title: "Duyuru" }} />
    </Stack.Navigator>
  );
}

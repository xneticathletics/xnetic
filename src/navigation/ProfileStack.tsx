import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import type { UserRole } from "../context/AuthContext";
import ProfileScreen from "../screens/ProfileScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import AnnouncementDetailScreen from "../screens/AnnouncementDetailScreen";
import AnnouncementFormScreen from "../screens/AnnouncementFormScreen";
import ProfileSettingsScreen from "../screens/ProfileSettingsScreen";

export type ProfileStackParamList = {
  Profile: undefined;
  Announcements: undefined;
  AnnouncementDetail: { announcementId: string };
  AnnouncementForm: undefined;
  ProfileSettings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack({ role }: { role: UserRole }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Profile" options={{ headerShown: false, title: "Profil" }}>
        {({ navigation }) => <ProfileScreen role={role} navigation={navigation} />}
      </Stack.Screen>
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: "Duyurular" }} />
      <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} options={{ title: "Duyuru" }} />
      <Stack.Screen name="AnnouncementForm" component={AnnouncementFormScreen} options={{ title: "Yeni Duyuru" }} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: "Profil Ayarları" }} />
    </Stack.Navigator>
  );
}

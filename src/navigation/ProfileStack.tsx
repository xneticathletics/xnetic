import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import type { UserRole } from "../context/AuthContext";
import ProfileScreen from "../screens/ProfileScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import AnnouncementDetailScreen from "../screens/AnnouncementDetailScreen";
import AnnouncementFormScreen from "../screens/AnnouncementFormScreen";
import PersonalInfoScreen from "../screens/PersonalInfoScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import SupportScreen from "../screens/SupportScreen";
import BadgesScreen from "../screens/BadgesScreen";
import BadgeTierSettingsScreen from "../screens/BadgeTierSettingsScreen";
import ContentReportsScreen from "../screens/ContentReportsScreen";
import ClubSettingsStack from "./ClubSettingsStack";

export type ProfileStackParamList = {
  Profile: undefined;
  Announcements: undefined;
  AnnouncementDetail: { announcementId: string };
  AnnouncementForm: undefined;
  PersonalInfo: undefined;
  ChangePassword: undefined;
  Support: undefined;
  Badges: undefined;
  BadgeTierSettings: undefined;
  ContentReports: undefined;
  ClubSettings: undefined;
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
      <Stack.Screen name="AnnouncementForm" component={AnnouncementFormScreen} options={{ title: "Yeni Duyuru", gestureEnabled: false }} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ title: "Kişisel Bilgiler" }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Giriş ve Şifre İşlemleri" }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: "Yardım / Destek" }} />
      <Stack.Screen name="Badges" component={BadgesScreen} options={{ title: "Rozetlerim" }} />
      <Stack.Screen name="BadgeTierSettings" component={BadgeTierSettingsScreen} options={{ title: "Rozet Ayarları" }} />
      <Stack.Screen name="ContentReports" component={ContentReportsScreen} options={{ title: "Şikayetler" }} />
      {role === "club_admin" && (
        <Stack.Screen name="ClubSettings" component={ClubSettingsStack} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

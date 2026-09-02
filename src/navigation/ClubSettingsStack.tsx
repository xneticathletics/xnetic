import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import ClubSettingsScreen from "../screens/ClubSettingsScreen";
import GroupsListScreen from "../screens/GroupsListScreen";
import GroupFormScreen from "../screens/GroupFormScreen";
import BranchesListScreen from "../screens/BranchesListScreen";
import VenuesListScreen from "../screens/VenuesListScreen";
import VenueFormScreen from "../screens/VenueFormScreen";
import ClubLogoScreen from "../screens/ClubLogoScreen";
import ClubBankInfoScreen from "../screens/ClubBankInfoScreen";
import UsersListScreen from "../screens/UsersListScreen";
import ClubExportScreen from "../screens/ClubExportScreen";
import HomeFeaturesScreen from "../screens/HomeFeaturesScreen";
import AdvancedSettingsScreen from "../screens/AdvancedSettingsScreen";
import AttendanceSettingsScreen from "../screens/AttendanceSettingsScreen";
import CoachSettingsScreen from "../screens/CoachSettingsScreen";
import FinanceSettingsScreen from "../screens/FinanceSettingsScreen";
import AnnouncementSettingsScreen from "../screens/AnnouncementSettingsScreen";

export type ClubSettingsStackParamList = {
  ClubSettingsHome: undefined;
  GroupsList: undefined;
  GroupForm: { groupId: string | undefined };
  BranchesList: undefined;
  VenuesList: undefined;
  VenueForm: { venueId: string | undefined };
  ClubLogo: undefined;
  ClubBankInfo: undefined;
  UsersList: undefined;
  ClubExport: undefined;
  HomeFeatures: undefined;
  AdvancedSettings: undefined;
  AttendanceSettings: undefined;
  CoachSettings: undefined;
  FinanceSettings: undefined;
  AnnouncementSettings: undefined;
};

const Stack = createNativeStackNavigator<ClubSettingsStackParamList>();

// "Kulüp Ayarları" — Ana Menü'nün altında bir alt sayfa değil, AI Asistan/
// Profil gibi kendi başına, ayrı bir üst seviye sekme. Bu yüzden kendi
// bağımsız stack'i var; kökü (ClubSettingsHome) tıpkı Ana Sayfa/Profil
// kökleri gibi headerShown:false — üstte "Ana Sayfa" düğmesi göstermiyor.
export default function ClubSettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="ClubSettingsHome" component={ClubSettingsScreen} options={{ headerShown: false, title: "Kulüp Ayarları" }} />
      <Stack.Screen name="GroupsList" component={GroupsListScreen} options={{ title: "Gruplar" }} />
      <Stack.Screen name="GroupForm" component={GroupFormScreen} />
      <Stack.Screen name="BranchesList" component={BranchesListScreen} options={{ title: "Branşlar" }} />
      <Stack.Screen name="VenuesList" component={VenuesListScreen} options={{ title: "Salonlar" }} />
      <Stack.Screen name="VenueForm" component={VenueFormScreen} />
      <Stack.Screen name="ClubLogo" component={ClubLogoScreen} options={{ title: "Kulüp Logosu" }} />
      <Stack.Screen name="ClubBankInfo" component={ClubBankInfoScreen} options={{ title: "Banka Bilgileri" }} />
      <Stack.Screen name="UsersList" component={UsersListScreen} options={{ title: "Kullanıcılar" }} />
      <Stack.Screen name="ClubExport" component={ClubExportScreen} options={{ title: "Kulüp Bilgilerini Dışa Aktar" }} />
      <Stack.Screen name="HomeFeatures" component={HomeFeaturesScreen} options={{ title: "Ana Sayfa Özellikleri" }} />
      <Stack.Screen name="AdvancedSettings" component={AdvancedSettingsScreen} options={{ title: "Gelişmiş Ayarlar" }} />
      <Stack.Screen name="AttendanceSettings" component={AttendanceSettingsScreen} options={{ title: "Yoklama & Antrenman" }} />
      <Stack.Screen name="CoachSettings" component={CoachSettingsScreen} options={{ title: "Antrenör Yönetimi" }} />
      <Stack.Screen name="FinanceSettings" component={FinanceSettingsScreen} options={{ title: "Aidat & Finans" }} />
      <Stack.Screen name="AnnouncementSettings" component={AnnouncementSettingsScreen} options={{ title: "Duyurular" }} />
    </Stack.Navigator>
  );
}

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import EventsListScreen from "../screens/EventsListScreen";
import EventDetailScreen from "../screens/EventDetailScreen";
import EventFormScreen from "../screens/EventFormScreen";
import EventsManageScreen from "../screens/EventsManageScreen";
import EventRegisterScreen from "../screens/EventRegisterScreen";
import EventRegistrationsScreen from "../screens/EventRegistrationsScreen";
import MyEventRegistrationsScreen from "../screens/MyEventRegistrationsScreen";

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId: string | undefined };
  EventsManage: undefined;
  EventRegister: { eventId: string };
  EventRegistrations: { eventId: string };
  MyEventRegistrations: undefined;
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

// "Etkinlik" sekmesine basınca açılan gerçek, bağımsız bir stack — bkz.
// SocialStack.tsx'teki aynı gerekçe. EventsList VE EventsManage İKİSİ de
// her zaman kayıtlı, başlangıç ekranı role'e göre EventsStack'e prop
// olarak geçiliyor.
export default function EventsStack({ initialRouteName }: { initialRouteName: "EventsList" | "EventsManage" }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="EventsList" component={EventsListScreen} options={{ headerShown: false, title: "Etkinlik/Turnuva/Kamp" }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Etkinlik" }} />
      <Stack.Screen name="EventForm" component={EventFormScreen} options={{ title: "Etkinlik" }} />
      <Stack.Screen name="EventsManage" component={EventsManageScreen} options={{ headerShown: false, title: "Etkinlik/Turnuva/Kamp" }} />
      <Stack.Screen name="EventRegister" component={EventRegisterScreen} options={{ title: "Kayıt Ol" }} />
      <Stack.Screen name="EventRegistrations" component={EventRegistrationsScreen} options={{ title: "Kayıtlar" }} />
      <Stack.Screen name="MyEventRegistrations" component={MyEventRegistrationsScreen} options={{ title: "Kayıtlarım" }} />
    </Stack.Navigator>
  );
}

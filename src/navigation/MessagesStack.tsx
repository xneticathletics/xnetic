import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import type { UserRole } from "../context/AuthContext";
import MessagesListScreen from "../screens/MessagesListScreen";
import NewMessageScreen from "../screens/NewMessageScreen";
import ChatScreen from "../screens/ChatScreen";

export type MessagesStackParamList = {
  MessagesList: undefined;
  NewMessage: undefined;
  Chat: { userId: string; userName: string };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export default function MessagesStack({ role }: { role: UserRole }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="MessagesList" options={{ headerShown: false, title: "Mesajlar" }}>
        {(props) => <MessagesListScreen {...props} role={role} />}
      </Stack.Screen>
      <Stack.Screen name="NewMessage" options={{ title: "Yeni Mesaj" }}>
        {(props) => <NewMessageScreen {...props} role={role} />}
      </Stack.Screen>
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

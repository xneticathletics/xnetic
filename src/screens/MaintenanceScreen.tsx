import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";

// Süper Admin, Sistem Ayarları'ndan bakım modunu açtığında Süper Admin
// dışındaki TÜM oturum açmış kullanıcılara bu ekran gösterilir (bkz.
// RootNavigator.tsx). Kulüp Oluştur akışı ise ayrıca kendi içinde
// (CreateClubScreen) aynı bayrağı kontrol edip oturumsuz kullanıcıları da kapsar.
export default function MaintenanceScreen({ message }: { message: string }) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.icon}>🚧</Text>
      <Text style={styles.title}>Bakım Çalışması</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", paddingHorizontal: spacing.lg },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800", marginBottom: spacing.sm },
  message: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: spacing.xl },
  button: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: spacing.xl,
  },
  buttonText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});

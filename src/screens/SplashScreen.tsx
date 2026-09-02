import React from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import { colors, spacing } from "../theme/tokens";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/xnetic-logo-large.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>X-NETIC</Text>
      <Text style={styles.subtitle}>SPOR SİSTEMLERİ</Text>
      <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 24,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.yellow,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 4,
    marginTop: 6,
  },
});

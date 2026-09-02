import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ComingSoon">;

export default function ComingSoonScreen({ route, navigation }: Props) {
  useHomeButton(navigation);
  const { title, description } = route.params;

  useEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🚧</Text>
        <Text style={styles.placeholderTitle}>Yakında</Text>
        <Text style={styles.placeholderText}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  placeholder: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginTop: spacing.xl,
  },
  placeholderIcon: { fontSize: 36, marginBottom: spacing.sm },
  placeholderTitle: { color: colors.yellow, fontSize: 16, fontWeight: "800", marginBottom: spacing.xs },
  placeholderText: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
});

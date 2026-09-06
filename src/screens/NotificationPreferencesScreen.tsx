import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Switch, ActivityIndicator, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import {
  NOTIFICATION_EVENT_TYPES, getMyMutedNotificationTypes, updateMyMutedNotificationTypes,
  type NotificationEventType,
} from "../lib/api/notifications";

// Admin, web'den rol bazında toplu olarak yönetiyor (Kulüp Ayarları →
// Bildirim Tercihleri) — bu ekran ise kişinin SADECE kendi hesabını
// etkileyen, kendi seçimi. HomeFeaturesScreen.tsx'teki aynı anlık-kaydetme
// (immediate save) deseni.
export default function NotificationPreferencesScreen() {
  const [muted, setMuted] = useState<NotificationEventType[] | null>(null);
  const [saving, setSaving] = useState<NotificationEventType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMyMutedNotificationTypes()
        .then(setMuted)
        .catch((e) => setError(e.message));
    }, [])
  );

  const handleToggle = async (key: NotificationEventType, nextEnabled: boolean) => {
    if (!muted) return;
    const next = nextEnabled ? muted.filter((k) => k !== key) : [...muted, key];
    setMuted(next);
    setSaving(key);
    setError(null);
    try {
      await updateMyMutedNotificationTypes(next);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
      setMuted(muted);
    } finally {
      setSaving(null);
    }
  };

  if (muted === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.infoBox}>
        İstemediğin bildirim türlerini kapatabilirsin — kapattığın türler sadece
        senin hesabına gelmeyi keser, uygulama içi bildirim ekranında da
        görünmez.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {NOTIFICATION_EVENT_TYPES.map((type) => {
        const enabled = !muted.includes(type.key);
        return (
          <View key={type.key} style={styles.row}>
            <Text style={styles.rowLabel}>{type.label}</Text>
            {saving === type.key ? (
              <ActivityIndicator color={colors.yellow} />
            ) : (
              <Switch
                value={enabled}
                onValueChange={(v) => handleToggle(type.key, v)}
                trackColor={{ false: colors.line, true: colors.tealSoft }}
                thumbColor={enabled ? colors.teal : colors.muted}
              />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowLabel: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "600" },
});

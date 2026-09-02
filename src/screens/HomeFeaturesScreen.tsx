import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { getClubSettings, updateClubSettings } from "../lib/api/clubSettings";
import { useClubSettings } from "../context/ClubSettingsContext";
import { useAuth } from "../context/AuthContext";
import { TILES_BY_ROLE } from "./HomeScreen";

// Ana Sayfa'daki (club_admin) ana başlıklardan hangilerinin kulüpte
// kullanılacağını seçmek için — ör. bir kulübün Beslenme/Fitness gibi
// bölümlere ihtiyacı yoksa kapatabilir, ihtiyaç oldukça tekrar açabilir.
const TOGGLEABLE_TILES = TILES_BY_ROLE.club_admin;

export default function HomeFeaturesScreen() {
  const { clubId } = useAuth();
  const { refresh } = useClubSettings();
  const [disabled, setDisabled] = useState<string[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!clubId) return;
      getClubSettings(clubId)
        .then((s) => setDisabled(s.disabled_home_tiles))
        .catch((e) => setError(e.message));
    }, [clubId])
  );

  const handleToggle = async (key: string, nextEnabled: boolean) => {
    if (!disabled || !clubId) return;
    const next = nextEnabled ? disabled.filter((k) => k !== key) : [...disabled, key];
    setDisabled(next);
    setSaving(key);
    setError(null);
    try {
      const current = await getClubSettings(clubId);
      await updateClubSettings(clubId, { ...current, disabled_home_tiles: next });
      await refresh();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
      setDisabled(disabled);
    } finally {
      setSaving(null);
    }
  };

  if (disabled === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.infoBox}>
        Kulübünün kullanmadığı ana başlıkları kapatabilirsin — ör. Beslenme'ye
        ihtiyacın yoksa kapat, ihtiyaç olduğunda tekrar aç. Kapatılan
        başlıklar Ana Sayfa'da hiç görünmez.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {TOGGLEABLE_TILES.map((tile) => {
        const enabled = !disabled.includes(tile.key);
        return (
          <View key={tile.key} style={styles.row}>
            <View style={styles.rowIcon}>
              <Text style={styles.rowIconText}>{tile.icon}</Text>
            </View>
            <Text style={styles.rowLabel}>{tile.label}</Text>
            {saving === tile.key ? (
              <ActivityIndicator color={colors.yellow} />
            ) : (
              <Switch
                value={enabled}
                onValueChange={(v) => handleToggle(tile.key, v)}
                trackColor={{ false: colors.line, true: colors.tealSoft }}
                thumbColor={enabled ? colors.teal : colors.muted}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
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
  rowIcon: {
    width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  rowIconText: { fontSize: 17 },
  rowLabel: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "600" },
});

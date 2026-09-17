import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listBadgeTemplates, setBadgeTemplateActive, METRIC_LABELS, type BadgeTemplate } from "../lib/api/badgeTemplates";
import type { ProfileStackParamList } from "../navigation/ProfileStack";

type Props = NativeStackScreenProps<ProfileStackParamList, "BadgeTemplates">;

// Admin/branş koordinatörünün kendi rozet şablonlarını yönettiği ekran —
// "Rozetlerim"in tam tersi, o kazanılan rozetleri gösterir, bu ise
// KAZANDIRILABİLECEK şablonları tanımlar/yönetir (bkz. ProfileScreen'deki
// giriş noktası, sadece club_admin/koordinatörde görünür).
export default function BadgeTemplatesScreen({ navigation }: Props) {
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      listBadgeTemplates()
        .then((rows) => { if (!cancelled) setTemplates(rows); })
        .catch((e) => Alert.alert("Hata", e.message ?? "Yüklenemedi", [{ text: "Tamam" }]))
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  const handleToggleActive = async (t: BadgeTemplate) => {
    try {
      await setBadgeTemplateActive(t.id, !t.active);
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Güncellenemedi", [{ text: "Tamam" }]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("BadgeTemplateForm")}>
        <Text style={styles.addButtonText}>+ Yeni Rozet</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
          ListEmptyComponent={<Text style={styles.empty}>Henüz özel bir rozet oluşturmadın.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.active && styles.cardInactive]}>
              <View style={styles.cardIconBadge}>
                {item.icon_url ? (
                  <Image source={{ uri: item.icon_url }} style={styles.cardIconImage} />
                ) : (
                  <Text style={styles.cardIconText}>🎖️</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>{METRIC_LABELS[item.metric_type] ?? item.metric_type}</Text>
                <Text style={styles.cardMeta}>{item.stages?.length ?? 0} aşama</Text>
              </View>
              <TouchableOpacity
                style={[styles.statusPill, item.active ? styles.statusActive : styles.statusInactive]}
                onPress={() => handleToggleActive(item)}
              >
                <Text style={[styles.statusPillText, { color: item.active ? colors.teal : colors.muted }]}>
                  {item.active ? "Aktif" : "Pasif"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  addButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14,
    alignItems: "center", marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md,
  },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardInactive: { opacity: 0.55 },
  cardIconBadge: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.yellowSoft,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  cardIconImage: { width: 44, height: 44 },
  cardIconText: { fontSize: 20 },
  cardName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  cardMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statusPill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 6, borderWidth: 1 },
  statusActive: { borderColor: colors.teal, backgroundColor: colors.tealSoft },
  statusInactive: { borderColor: colors.line, backgroundColor: colors.bg },
  statusPillText: { fontSize: 11, fontWeight: "700" },
});

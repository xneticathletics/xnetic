import React, { useState } from "react";
import { View, Text, Switch, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { useClubSettings } from "../context/ClubSettingsContext";
import { getClubSettings, updateClubSettings } from "../lib/api/clubSettings";

// Her kulüp Kayıt Dondurma'yı kullanmayabilir — açık/kapalı burada. Anlık
// kaydedilir (ayrı bir Kaydet düğmesi yok, HomeFeaturesScreen ile aynı desen).
export default function MembershipFreezeSettingsScreen() {
  const { clubId } = useAuth();
  const { settings, refresh } = useClubSettings();
  const [saving, setSaving] = useState(false);
  const enabled = settings.membership_freeze_enabled;

  const handleToggle = async (next: boolean) => {
    if (!clubId || saving) return;
    setSaving(true);
    try {
      // Sunucudaki güncel ayarı çekip sadece bu alanı değiştiriyoruz — diğer
      // ayarların eski değerleriyle ezilmemesi için.
      const current = await getClubSettings(clubId);
      await updateClubSettings(clubId, { ...current, membership_freeze_enabled: next });
      await refresh();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>🧊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Kayıt Dondurma</Text>
            <Text style={styles.status}>{enabled ? "Açık" : "Kapalı"}</Text>
          </View>
          {saving ? (
            <ActivityIndicator color={colors.yellow} />
          ) : (
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.line, true: colors.tealSoft }}
              thumbColor={enabled ? colors.teal : colors.muted}
            />
          )}
        </View>
      </View>

      <Text style={styles.infoBox}>
        Açıkken veliler sporcuları için, yöneticiler de sporcu profilinden kaydı geçici olarak dondurabilir.
        Kulübün bu özelliği kullanmıyorsa kapat; "Kayıt Dondurma" kutucukları hiçbir kullanıcıda görünmez.
        Kapatınca yeni dondurma başlatılamaz, halihazırda oluşturulmuş dondurmalar geçerliliğini korur.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconBadge: {
    width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.tealSoft,
  },
  iconText: { fontSize: 20 },
  title: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  status: { color: colors.muted, fontSize: 12, marginTop: 2 },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md,
  },
});

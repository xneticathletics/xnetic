import React, { useCallback, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { DEFAULT_BADGE_TIERS, BADGE_CATALOG, awardChampionBadge, revokeChampionBadge, getChampionBadge, type AutoBadgeType, type TierThresholds } from "../lib/api/badges";
import {
  AUTO_BADGE_TYPES, BADGE_TYPE_LABELS, BADGE_TYPE_UNITS,
  listBadgeTierSettings, saveBadgeTierSetting, resetBadgeTierSetting,
} from "../lib/api/badgeTierSettings";
import AthletePickerModal from "../components/AthletePickerModal";
import type { Athlete } from "../lib/api/athletes";

// Kullanıcı isteği: özel rozet şablonları yerine, MEVCUT 7 otomatik rozet
// kategorisinin eşik sayılarını (5-10-20 gibi) burada değiştirebilelim —
// kazanım mantığı (check_my_badges) hâlâ tamamen otomatik, sadece sayılar
// kulübe özel olabiliyor.
export default function BadgeTierSettingsScreen() {
  const [tiers, setTiers] = useState<Record<AutoBadgeType, TierThresholds> | null>(null);
  const [draft, setDraft] = useState<Record<AutoBadgeType, [string, string, string]> | null>(null);
  const [savingType, setSavingType] = useState<AutoBadgeType | null>(null);
  const [championAthlete, setChampionAthlete] = useState<Athlete | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [awardingChampion, setAwardingChampion] = useState(false);
  // Seçilen sporcunun ŞU AN şampiyon rozeti var mı — ekran buna göre
  // "Rozeti Ver" ya da "Rozeti Geri Al" gösteriyor. null = henüz bakılmadı.
  const [hasChampion, setHasChampion] = useState<boolean | null>(null);

  const selectChampionAthlete = (a: Athlete | null) => {
    setChampionAthlete(a);
    setHasChampion(null);
    if (!a) return;
    getChampionBadge(a.id)
      .then((b) => setHasChampion(!!b))
      .catch(() => setHasChampion(null));
  };

  const load = useCallback(() => {
    listBadgeTierSettings().then((rows) => {
      setTiers(rows);
      setDraft(
        Object.fromEntries(
          AUTO_BADGE_TYPES.map((t) => [t, rows[t].map(String) as [string, string, string]])
        ) as Record<AutoBadgeType, [string, string, string]>
      );
    }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!tiers || !draft) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  const handleChangeField = (type: AutoBadgeType, index: 0 | 1 | 2, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setDraft((prev) => {
      if (!prev) return prev;
      const next = [...prev[type]] as [string, string, string];
      next[index] = cleaned;
      return { ...prev, [type]: next };
    });
  };

  const handleSave = async (type: AutoBadgeType) => {
    const [a, b, c] = draft[type];
    const nums = [Number(a), Number(b), Number(c)] as TierThresholds;
    if (nums.some((n) => !Number.isFinite(n) || n <= 0) || nums[0] >= nums[1] || nums[1] >= nums[2]) {
      Alert.alert("Geçersiz değerler", "Üç sayı da pozitif olmalı ve küçükten büyüğe artmalı (ör. 5, 10, 20).", [{ text: "Tamam" }]);
      return;
    }
    setSavingType(type);
    try {
      await saveBadgeTierSetting(type, nums);
      setTiers((prev) => (prev ? { ...prev, [type]: nums } : prev));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setSavingType(null);
    }
  };

  const handleReset = async (type: AutoBadgeType) => {
    setSavingType(type);
    try {
      await resetBadgeTierSetting(type);
      const def = DEFAULT_BADGE_TIERS[type];
      setTiers((prev) => (prev ? { ...prev, [type]: def } : prev));
      setDraft((prev) => (prev ? { ...prev, [type]: def.map(String) as [string, string, string] } : prev));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Sıfırlanamadı", [{ text: "Tamam" }]);
    } finally {
      setSavingType(null);
    }
  };

  const handleAwardChampion = () => {
    if (!championAthlete) return;
    Alert.alert(
      "Şampiyon Rozeti Ver",
      `${championAthlete.full_name} adlı sporcuya Şampiyon rozeti vermek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Rozeti Ver",
          onPress: async () => {
            setAwardingChampion(true);
            try {
              await awardChampionBadge(championAthlete.id);
              Alert.alert("Verildi", "Şampiyon rozeti verildi — bir sonraki girişinde kutlanacak.", [{ text: "Tamam" }]);
              selectChampionAthlete(null);
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Rozet verilemedi", [{ text: "Tamam" }]);
            } finally {
              setAwardingChampion(false);
            }
          },
        },
      ]
    );
  };

  const handleRevokeChampion = () => {
    if (!championAthlete) return;
    Alert.alert(
      "Şampiyon Rozetini Geri Al",
      `${championAthlete.full_name} adlı sporcunun Şampiyon rozeti kaldırılacak. Emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Geri Al",
          style: "destructive",
          onPress: async () => {
            setAwardingChampion(true);
            try {
              await revokeChampionBadge(championAthlete.id);
              Alert.alert("Geri alındı", "Şampiyon rozeti kaldırıldı.", [{ text: "Tamam" }]);
              selectChampionAthlete(null);
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Rozet geri alınamadı", [{ text: "Tamam" }]);
            } finally {
              setAwardingChampion(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.infoBox}>
        Sporcuların hangi sayıya ulaşınca rozet kazanacağını buradan değiştirebilirsin.
        Kazanım hâlâ tamamen otomatik — sadece eşik sayıları kulübüne özel.
      </Text>

      {/* Şampiyon rozeti tek istisna — otomatik değil, elle veriliyor.
          Sporcu Profili'nden buraya taşındı (kullanıcı isteği), aynı yerde
          diğer rozet işlemleriyle birlikte olsun diye. */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{BADGE_CATALOG.sampiyon.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Şampiyon Rozeti</Text>
            <Text style={styles.cardSub}>Elle verilir; yanlış verilirse geri alınabilir</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.athletePickButton} onPress={() => setPickerVisible(true)}>
          <Text style={styles.athletePickButtonText}>
            {championAthlete ? championAthlete.full_name : "Sporcu Seç…"}
          </Text>
        </TouchableOpacity>
        {championAthlete && (
          <>
            {hasChampion !== null && (
              <Text style={styles.championState}>
                {hasChampion
                  ? "Bu sporcunun şu an Şampiyon rozeti var."
                  : "Bu sporcunun Şampiyon rozeti yok."}
              </Text>
            )}
            <View style={styles.actionRow}>
              <View style={{ flex: 1 }} />
              {hasChampion ? (
                <TouchableOpacity onPress={handleRevokeChampion} disabled={awardingChampion} style={styles.revokeButton}>
                  {awardingChampion ? (
                    <ActivityIndicator color={colors.coral} size="small" />
                  ) : (
                    <Text style={styles.revokeButtonText}>🗑 Rozeti Geri Al</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleAwardChampion} disabled={awardingChampion} style={styles.saveButton}>
                  {awardingChampion ? (
                    <ActivityIndicator color={colors.bg} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>🏆 Rozeti Ver</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      {AUTO_BADGE_TYPES.map((type) => {
        const isDefault = tiers[type].every((v, i) => v === DEFAULT_BADGE_TIERS[type][i]);
        const saving = savingType === type;
        return (
          <View key={type} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{BADGE_CATALOG[type].icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{BADGE_TYPE_LABELS[type]}</Text>
                <Text style={styles.cardSub}>{BADGE_TYPE_UNITS[type]}</Text>
              </View>
            </View>
            <View style={styles.inputRow}>
              {(["Bronz", "Gümüş", "Altın"] as const).map((label, i) => (
                <View key={label} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={draft[type][i]}
                    onChangeText={(v) => handleChangeField(type, i as 0 | 1 | 2, v)}
                    maxLength={4}
                  />
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              {!isDefault && (
                <TouchableOpacity onPress={() => handleReset(type)} disabled={saving} style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Varsayılana Dön</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => handleSave(type)} disabled={saving} style={styles.saveButton}>
                {saving ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <AthletePickerModal
        visible={pickerVisible}
        selectedId={championAthlete?.id ?? null}
        onSelect={selectChampionAthlete}
        onClose={() => setPickerVisible(false)}
      />
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
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  cardIcon: { fontSize: 24 },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  cardSub: { color: colors.muted, fontSize: 11, marginTop: 1 },
  athletePickButton: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 10, paddingHorizontal: spacing.md, backgroundColor: colors.bg,
  },
  athletePickButtonText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  inputRow: { flexDirection: "row", gap: spacing.sm },
  inputGroup: { flex: 1 },
  inputLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 8, paddingHorizontal: 10, color: colors.ink, fontSize: 15, fontWeight: "700",
    backgroundColor: colors.bg, textAlign: "center",
  },
  actionRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  resetButton: { paddingVertical: 6, paddingHorizontal: 4 },
  resetButtonText: { color: colors.muted, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
  saveButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md,
    paddingVertical: 8, paddingHorizontal: spacing.lg, minWidth: 80, alignItems: "center",
  },
  saveButtonText: { color: colors.bg, fontWeight: "800", fontSize: 13 },
  revokeButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md,
    paddingVertical: 8, paddingHorizontal: spacing.lg, minWidth: 80, alignItems: "center",
  },
  revokeButtonText: { color: colors.coral, fontWeight: "800", fontSize: 13 },
  championState: { color: colors.muted, fontSize: 12, marginTop: spacing.sm },
});

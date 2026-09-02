import React, { useCallback, useState, useRef } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listBranches, setBranchCoordinator, type Branch } from "../lib/api/branches";
import { getCoach, getCoachBranches, setCoachBranches, type Coach, type CoachBranchInfo } from "../lib/api/coaches";
import type { HomeStackParamList } from "../navigation/HomeStack";
import BirthDateInput from "../components/BirthDateInput";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachBranch">;

const LEVELS = [1, 2, 3, 4, 5];

export default function CoachBranchScreen({ route }: Props) {
  const { coachId, coachName } = route.params;

  const [coach, setCoach] = useState<Coach | null>(null);
  const [myBranches, setMyBranches] = useState<CoachBranchInfo[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchSaving, setBranchSaving] = useState(false);
  const [coordinatorSaving, setCoordinatorSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [c, cb, b] = await Promise.all([getCoach(coachId), getCoachBranches(coachId), listBranches()]);
      setCoach(c);
      setMyBranches(cb);
      setBranches(b);
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [coachId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const myCoordinatorBranch = branches.find((b) => b.coordinator_user_id === coachId) ?? null;

  // setCoachBranches önce TÜM branşları silip sonra yeniden ekliyor — bu
  // yüzden aynı anda iki kayıt isteği çakışırsa (ör. tarih girişi her tuş
  // vuruşunda onChange tetikliyor) "duplicate key" hatası çıkabiliyordu.
  // Bunu önlemek için istekleri bir kuyrukta SIRAYLA çalıştırıyoruz — yeni
  // bir kayıt, öncekinin sunucudaki işlemi bitmeden başlamıyor. Ekran
  // durumu (myBranches) ise her zaman hemen, senkron güncelleniyor — bu
  // sayede art arda gelen çağrılar bayat (stale) veri üzerinden değil,
  // en güncel değerler üzerinden kaydediyor.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistBranches = (next: CoachBranchInfo[]) => {
    setMyBranches(next);
    setBranchSaving(true);
    saveQueueRef.current = saveQueueRef.current
      .catch(() => {})
      .then(() =>
        setCoachBranches(
          coachId,
          next.map((b) => ({
            branch_id: b.branch_id, level: b.level,
            license_no: b.license_no, experience_years: b.experience_years, hire_date: b.hire_date,
          }))
        )
      )
      .catch((e: any) => {
        Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
      })
      .finally(() => setBranchSaving(false));
    return saveQueueRef.current;
  };

  const toggleMyBranch = async (branch: Branch) => {
    const exists = myBranches.find((b) => b.branch_id === branch.id);
    const next = exists
      ? myBranches.filter((b) => b.branch_id !== branch.id)
      : [
          ...myBranches,
          { branch_id: branch.id, branch_name: branch.name, level: 1, license_no: null, experience_years: null, hire_date: null },
        ];
    await persistBranches(next);
  };

  const setMyBranchLevel = async (branchId: string, level: number) => {
    await persistBranches(myBranches.map((b) => (b.branch_id === branchId ? { ...b, level } : b)));
  };

  // Belge no / deneyim yılı gibi metin alanları her tuş vuruşunda değil,
  // sadece odaktan çıkınca (onEndEditing) kaydedilir — aksi halde her
  // karakterde bir ağ isteği gider.
  const updateLocalBranchField = (branchId: string, patch: Partial<CoachBranchInfo>) => {
    setMyBranches((prev) => prev.map((b) => (b.branch_id === branchId ? { ...b, ...patch } : b)));
  };

  const handleSetCoordinator = async (branch: Branch | null) => {
    setCoordinatorSaving(true);
    try {
      // Önce bu antrenörün eski koordinatörlüğünü (varsa) temizle.
      if (myCoordinatorBranch && myCoordinatorBranch.id !== branch?.id) {
        await setBranchCoordinator(myCoordinatorBranch.id, null);
      }
      if (branch) {
        await setBranchCoordinator(branch.id, coachId);
      }
      setBranches(await listBranches());
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setCoordinatorSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.infoCard}>
        {coach?.photo_url ? (
          <Image source={{ uri: coach.photo_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{coachName.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.title}>{coachName}</Text>
      </View>

      <View style={styles.levelBox}>
        <Text style={styles.levelTitle}>Branşlar ve Kademeler</Text>
        <Text style={styles.hint}>
          Bir antrenör birden fazla branşta uzmanlaşabilir — her branş için ayrı kademe belirlenir.
          Görevlendirme yapılırken sadece uzman olduğu branşların gruplarında seçilebilir.
        </Text>
        <View style={styles.chipsRow}>
          {branches.map((b) => {
            const active = myBranches.some((mb) => mb.branch_id === b.id);
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleMyBranch(b)}
                disabled={branchSaving}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {active ? "✓ " : ""}{b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {branches.length === 0 && <Text style={styles.hint}>Henüz branş eklenmemiş.</Text>}

        {myBranches.map((mb) => (
          <View key={mb.branch_id} style={styles.branchLevelRow}>
            <Text style={styles.branchLevelName}>{mb.branch_name}</Text>
            <View style={styles.chipsRow}>
              {LEVELS.map((lvl) => {
                const active = mb.level === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.levelChip, active && styles.chipActive]}
                    onPress={() => setMyBranchLevel(mb.branch_id, lvl)}
                    disabled={branchSaving}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{lvl}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Belge Numarası</Text>
              <TextInput
                style={styles.fieldInput}
                value={mb.license_no ?? ""}
                onChangeText={(v) => updateLocalBranchField(mb.branch_id, { license_no: v })}
                onEndEditing={() => persistBranches(myBranches)}
                placeholder="Belge/lisans no"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Deneyim Yılı</Text>
              <TextInput
                style={styles.fieldInput}
                value={mb.experience_years != null ? String(mb.experience_years) : ""}
                onChangeText={(v) => updateLocalBranchField(mb.branch_id, { experience_years: v ? Number(v) : null })}
                onEndEditing={() => persistBranches(myBranches)}
                keyboardType="numeric"
                placeholder="Örn. 5"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Kulübe Başlama Tarihi ({mb.branch_name})</Text>
              <BirthDateInput
                value={mb.hire_date}
                onChange={(iso) => persistBranches(myBranches.map((b) => (b.branch_id === mb.branch_id ? { ...b, hire_date: iso } : b)))}
              />
            </View>
          </View>
        ))}
      </View>

      {branches.length > 1 && (
        <View style={styles.coordinatorBox}>
          <Text style={styles.levelTitle}>Branş Koordinatörlüğü</Text>
          <Text style={styles.hint}>
            Koordinatör olduğu branşta, sadece kendi grupları değil o branşın TÜM
            sporcularını ve aidatlarını görebilir — Ana Sayfa'sı otomatik o branşa açılır.
          </Text>
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.chip, !myCoordinatorBranch && styles.chipActive]}
              onPress={() => handleSetCoordinator(null)}
              disabled={coordinatorSaving}
            >
              <Text style={[styles.chipText, !myCoordinatorBranch && styles.chipTextActive]}>Yok</Text>
            </TouchableOpacity>
            {branches.map((b) => {
              const active = myCoordinatorBranch?.id === b.id;
              const takenByOther = !!b.coordinator_user_id && b.coordinator_user_id !== coachId;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    if (takenByOther) {
                      Alert.alert(
                        "Koordinatörü değiştir",
                        `${b.name} branşının koordinatörü şu an ${b.coordinator?.name ?? "başka bir antrenör"}. Bunu ${coachName} ile değiştirmek istiyor musun?`,
                        [
                          { text: "Vazgeç", style: "cancel" },
                          { text: "Değiştir", onPress: () => handleSetCoordinator(b) },
                        ]
                      );
                      return;
                    }
                    handleSetCoordinator(b);
                  }}
                  disabled={coordinatorSaving}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {b.name}{takenByOther ? ` (${b.coordinator?.name ?? "atanmış"})` : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md },
  infoCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.yellowSoft,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44, borderRadius: radius.full },
  avatarText: { color: colors.yellow, fontSize: 16, fontWeight: "800" },
  title: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  levelBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  levelTitle: { color: colors.ink, fontSize: 14, fontWeight: "700", marginBottom: spacing.sm },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: spacing.sm, lineHeight: 15 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  branchLevelRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line },
  branchLevelName: { color: colors.ink, fontSize: 13, fontWeight: "600", marginBottom: 6 },
  levelChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    width: 36, height: 36, alignItems: "center", justifyContent: "center",
  },
  fieldRow: { marginTop: spacing.sm },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  fieldInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    color: colors.ink, paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: 13,
  },
  coordinatorBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl,
  },
  chip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, minWidth: 70, alignItems: "center",
  },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: colors.bg },
});

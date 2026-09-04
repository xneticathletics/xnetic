import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import type { HomeStackParamList } from "../navigation/HomeStack";
import BranchPickerModal from "../components/BranchPickerModal";
import { getCurrentAppUserId } from "../lib/api/currentUser";
import {
  getFitnessGroup, createFitnessGroup, updateFitnessGroup,
  listMusabikAthletesForBranch, type MusabikAthlete,
} from "../lib/api/fitnessGroups";

type Props = NativeStackScreenProps<HomeStackParamList, "FitnessGroupForm">;

// Yeni/var olan bir fitness grubu — branş seçilince o branştaki TÜM müsabık
// (spor okulu değil) ve aktif sporcular listelenir, içlerinden istenenler
// işaretlenip kaydedilir. Düzenlemede branş değiştirilemez.
export default function FitnessGroupFormScreen({ route, navigation }: Props) {
  const fitnessGroupId = route.params?.fitnessGroupId;
  const isNew = !fitnessGroupId;

  const [name, setName] = useState("");
  const [branch, setBranch] = useState<string | null>(null);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  const [athletes, setAthletes] = useState<MusabikAthlete[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(!isNew);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isNew) return;
      let cancelled = false;
      setLoading(true);
      getFitnessGroup(fitnessGroupId!)
        .then((g) => {
          if (cancelled) return;
          setName(g.name);
          setBranch(g.branch);
          setSelectedIds(new Set(g.athleteIds));
        })
        .catch((e) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false));
      return () => { cancelled = true; };
    }, [fitnessGroupId, isNew])
  );

  useEffect(() => {
    if (!branch) {
      setAthletes([]);
      return;
    }
    setAthletesLoading(true);
    listMusabikAthletesForBranch(branch)
      .then(setAthletes)
      .catch((e) => setError(e.message))
      .finally(() => setAthletesLoading(false));
  }, [branch]);

  const toggleAthlete = (athleteId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(athleteId)) next.delete(athleteId);
      else next.add(athleteId);
      return next;
    });
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!name.trim()) return Alert.alert("Eksik bilgi", "Grup adı girmelisin.", [{ text: "Tamam" }]);
    if (!branch) return Alert.alert("Eksik bilgi", "Bir branş seçmelisin.", [{ text: "Tamam" }]);
    if (selectedIds.size === 0) return Alert.alert("Eksik bilgi", "En az bir sporcu seçmelisin.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const myUserId = await getCurrentAppUserId();
        await createFitnessGroup({ name: name.trim(), branch, athleteIds: Array.from(selectedIds), created_by: myUserId });
      } else {
        await updateFitnessGroup(fitnessGroupId!, { name: name.trim(), athleteIds: Array.from(selectedIds) });
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.label}>Grup Adı *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Örn. İl Takımı Adayları"
        placeholderTextColor={colors.muted}
      />

      <Text style={[styles.label, { marginTop: spacing.md }]}>Branş *</Text>
      <TouchableOpacity
        style={[styles.input, styles.pickerButton, !isNew && styles.pickerButtonDisabled]}
        onPress={() => isNew && setBranchPickerVisible(true)}
        disabled={!isNew}
      >
        <Text style={branch ? styles.pickerValue : styles.pickerPlaceholder}>{branch ?? "Branş seç"}</Text>
      </TouchableOpacity>
      {!isNew && <Text style={styles.hint}>Branş oluşturulduktan sonra değiştirilemez.</Text>}

      {branch && (
        <>
          <Text style={[styles.label, { marginTop: spacing.lg }]}>Müsabık Sporcular ({selectedIds.size} seçili)</Text>
          {athletesLoading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.sm }} />}
          {!athletesLoading && athletes.length === 0 && (
            <Text style={styles.empty}>Bu branşta müsabık tipinde aktif sporcu bulunamadı.</Text>
          )}
          {athletes.map((a) => {
            const selected = selectedIds.has(a.id);
            return (
              <TouchableOpacity key={a.id} style={styles.athleteRow} onPress={() => toggleAthlete(a.id)}>
                <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                  {selected && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.athleteName}>{a.full_name}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
      </TouchableOpacity>

      <BranchPickerModal
        visible={branchPickerVisible}
        selectedName={branch}
        onSelect={(b) => setBranch(b.name)}
        onClose={() => setBranchPickerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: "center", justifyContent: "center" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  pickerButton: { justifyContent: "center" },
  pickerButtonDisabled: { opacity: 0.6 },
  pickerValue: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  pickerPlaceholder: { color: colors.muted, fontSize: 14 },
  hint: { color: colors.muted, fontSize: 11, fontStyle: "italic", marginTop: 4 },
  empty: { color: colors.muted, fontSize: 12, fontStyle: "italic", marginTop: spacing.sm },
  athleteRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  checkboxMark: { color: colors.bg, fontWeight: "800", fontSize: 13 },
  athleteName: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  errorText: { color: colors.coral, marginTop: spacing.md, textAlign: "center" },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getGroup, createGroup, updateGroup, deleteGroup, type GroupInput } from "../lib/api/groups";
import type { Branch } from "../lib/api/branches";
import BranchPickerModal from "../components/BranchPickerModal";
import VenuePickerModal from "../components/VenuePickerModal";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
// Bu ekran hem ClubSettingsStack'ten hem de HomeStack'ten (Kulüp Yapısı)
// açılabiliyor — bkz. GroupsListScreen.tsx'teki aynı not.
type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params?: { groupId: string | undefined } };
};

const emptyForm: GroupInput = { name: "", branch: "", venue_id: null, athlete_type: "spor_okulu" };

export default function GroupFormScreen({ route, navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const groupId = route.params?.groupId;
  const isEdit = !!groupId;

  const [form, setForm] = useState<GroupInput>(emptyForm);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  const [venuePickerVisible, setVenuePickerVisible] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı grubu iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? "Grubu Düzenle" : "Yeni Grup" });
  }, [isEdit, navigation]);

  useEffect(() => {
    if (!groupId) return;
    getGroup(groupId)
      .then((g) => {
        setForm({ name: g.name, branch: g.branch, venue_id: g.venue_id, athlete_type: g.athlete_type });
        setVenueName(g.venues?.name ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.name.trim() || !form.branch.trim()) {
      Alert.alert("Eksik bilgi", "Grup adı ve branş zorunludur.", [{ text: "Tamam" }]);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && groupId) {
        await updateGroup(groupId, form);
      } else {
        await createGroup(form);
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!groupId) return;
    Alert.alert(
      "Grubu sil",
      "Bu grubu silersen, bu gruba bağlı TÜM antrenman kayıtları da silinir. Devam etmek istiyor musun?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
      <Field label="Grup Adı *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Örn. U14 Kız Grubu"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Branş *">
        <TouchableOpacity style={styles.input} onPress={() => setBranchPickerVisible(true)}>
          <Text style={{ color: form.branch ? colors.ink : colors.muted }}>{form.branch || "Branş seç"}</Text>
        </TouchableOpacity>
      </Field>

      <Field label="Sporcu Tipi *">
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.typeChip, form.athlete_type === "spor_okulu" && styles.typeChipActive]}
            onPress={() => setForm((f) => ({ ...f, athlete_type: "spor_okulu" }))}
          >
            <Text style={[styles.typeChipText, form.athlete_type === "spor_okulu" && styles.typeChipTextActive]}>
              Spor Okulu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeChip, form.athlete_type === "musabik" && styles.typeChipActiveMusabik]}
            onPress={() => setForm((f) => ({ ...f, athlete_type: "musabik" }))}
          >
            <Text style={[styles.typeChipText, form.athlete_type === "musabik" && styles.typeChipTextActive]}>
              🏆 Müsabık
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          Bu gruba eklenen her sporcu otomatik olarak bu tipte işlenir — gruptaki herkes aynı tip olur.
        </Text>
      </Field>

      <Field label="Ana Salon (isteğe bağlı)">
        <TouchableOpacity style={styles.input} onPress={() => setVenuePickerVisible(true)}>
          <Text style={{ color: venueName ? colors.ink : colors.muted }}>{venueName ?? "Salon seç"}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Bu grubun genelde antrenman yaptığı salon — Sporcu Yönetimi'nde salona göre gruplama için kullanılır.
        </Text>
      </Field>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Grubu Sil</Text>
        </TouchableOpacity>
      )}

      <BranchPickerModal
        visible={branchPickerVisible}
        selectedName={form.branch || null}
        onSelect={(b: Branch) => setForm((f) => ({ ...f, branch: b.name }))}
        onClose={() => setBranchPickerVisible(false)}
      />
      <VenuePickerModal
        visible={venuePickerVisible}
        selectedId={form.venue_id}
        onSelect={(v) => {
          setForm((f) => ({ ...f, venue_id: v.id }));
          setVenueName(v.name);
        }}
        onClose={() => setVenuePickerVisible(false)}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  row: { flexDirection: "row" },
  typeChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm,
  },
  typeChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  typeChipActiveMusabik: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  typeChipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  typeChipTextActive: { color: colors.bg },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  deleteButton: { alignItems: "center", paddingVertical: spacing.lg },
  deleteButtonText: { color: colors.coral, fontWeight: "700" },
});

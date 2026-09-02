import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getVenue, createVenue, updateVenue, deleteVenue, type VenueInput } from "../lib/api/venues";
import { listBranches, type Branch } from "../lib/api/branches";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
// Bu ekran hem ClubSettingsStack'ten hem de HomeStack'ten (Kulüp Yapısı)
// açılabiliyor — bkz. GroupsListScreen.tsx'teki aynı not.
type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params?: { venueId: string | undefined } };
};

const emptyForm: VenueInput = { name: "", address: null, capacity: null, branch_ids: [] };

export default function VenueFormScreen({ route, navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const venueId = route.params?.venueId;
  const isEdit = !!venueId;

  const [form, setForm] = useState<VenueInput>(emptyForm);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı salonu iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? "Salonu Düzenle" : "Yeni Salon" });
  }, [isEdit, navigation]);

  useEffect(() => {
    listBranches().then(setBranches).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!venueId) return;
    getVenue(venueId)
      .then((v) => setForm({ name: v.name, address: v.address, capacity: v.capacity, branch_ids: v.branch_ids ?? [] }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [venueId]);

  const toggleBranch = (branchId: string) => {
    setForm((f) => {
      const has = f.branch_ids.includes(branchId);
      return { ...f, branch_ids: has ? f.branch_ids.filter((id) => id !== branchId) : [...f.branch_ids, branchId] };
    });
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.name.trim()) {
      Alert.alert("Eksik bilgi", "Salon adı zorunludur.", [{ text: "Tamam" }]);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && venueId) {
        await updateVenue(venueId, form);
      } else {
        await createVenue(form);
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
    if (!venueId) return;
    Alert.alert("Salonu sil", "Bu salonu silmek istediğinden emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteVenue(venueId);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
          }
        },
      },
    ]);
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
      <Field label="Salon Adı *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Örn. Ana Salon"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Adres">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.address ?? ""}
          onChangeText={(v) => setForm((f) => ({ ...f, address: v || null }))}
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Kapasite">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.capacity?.toString() ?? ""}
          onChangeText={(v) => setForm((f) => ({ ...f, capacity: v ? Number(v) : null }))}
          keyboardType="numeric"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Branşlar">
        {branches.length === 0 ? (
          <Text style={styles.hint}>Henüz branş eklenmemiş. Kulüp Ayarları → Branşlar'dan ekleyebilirsin.</Text>
        ) : (
          <View style={styles.branchRow}>
            {branches.map((b) => {
              const active = form.branch_ids.includes(b.id);
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.branchChip, active && styles.branchChipActive]}
                  onPress={() => toggleBranch(b.id)}
                >
                  <Text style={[styles.branchChipText, active && styles.branchChipTextActive]}>{b.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Field>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Salonu Sil</Text>
        </TouchableOpacity>
      )}
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
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  hint: { color: colors.muted, fontSize: 12 },
  branchRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  branchChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, height: 38, justifyContent: "center",
  },
  branchChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  branchChipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  branchChipTextActive: { color: colors.bg },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  deleteButton: { alignItems: "center", paddingVertical: spacing.lg },
  deleteButtonText: { color: colors.coral, fontWeight: "700" },
});

import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { listBranches, createBranch, deleteBranch, updateBranch, type Branch } from "../lib/api/branches";
import { listGroups, type Group } from "../lib/api/groups";

export default function BranchesListScreen() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newName, setNewName] = useState("");
  const [newIsIndividual, setNewIsIndividual] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIsIndividual, setEditingIsIndividual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleAdd iki kez çalışıp aynı branşı iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [b, g] = await Promise.all([listBranches(), listGroups()]);
      setBranches(b);
      setGroups(g);
    } catch (e: any) {
      setError(e.message ?? "Branşlar yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  // Her branşta kaç grup olduğunu hızlıca bulmak için.
  const groupCountByBranch = useMemo(() => {
    const map: Record<string, number> = {};
    groups.forEach((g) => { map[g.branch] = (map[g.branch] ?? 0) + 1; });
    return map;
  }, [groups]);

  const handleAdd = async () => {
    if (savingRef.current) return;
    if (!newName.trim()) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await createBranch(newName.trim(), newIsIndividual);
      setNewName("");
      setNewIsIndividual(false);
      load();
    } catch (e: any) {
      setError(e.message ?? "Eklenemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const startEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setEditingName(branch.name);
    setEditingIsIndividual(branch.is_individual);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingIsIndividual(false);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateBranch(editingId, editingName.trim(), editingIsIndividual);
      cancelEdit();
      load();
    } catch (e: any) {
      setError(e.message ?? "Güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (branch: Branch) => {
    const groupCount = groupCountByBranch[branch.name] ?? 0;
    const groupWarning = groupCount > 0
      ? `\n\nBu branşa atanmış ${groupCount} grup var — silersen bu gruplar "branşsız" kalır, grupların kendisi silinmez.`
      : "";
    Alert.alert(
      "Branşı sil",
      `"${branch.name}" branşını silmek istediğinden emin misin?${groupWarning}`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBranch(branch.id);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Kulübünüzün çalıştığı spor branşları</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="Örn. Basketbol"
          placeholderTextColor={colors.muted}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={colors.bg} /> : <Text style={styles.addButtonText}>Ekle</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.individualToggle} onPress={() => setNewIsIndividual((v) => !v)}>
        <View style={[styles.checkbox, newIsIndividual && styles.checkboxChecked]}>
          {newIsIndividual && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.individualToggleText}>Bireysel branş (Yüzme, Atletizm vb. — skor yerine sonuç açıklaması girilir)</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.lg }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={branches}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              Henüz branş eklenmedi. Tek branşla çalışıyorsan buraya hiç dokunmana gerek yok.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const isEditing = editingId === item.id;
          const groupCount = groupCountByBranch[item.name] ?? 0;

          if (isEditing) {
            return (
              <View style={[styles.row, { flexDirection: "column", alignItems: "stretch" }]}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    style={styles.editInput}
                    value={editingName}
                    onChangeText={setEditingName}
                    autoFocus
                    placeholderTextColor={colors.muted}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={cancelEdit} style={{ marginRight: spacing.md }}>
                      <Text style={styles.cancelText}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveEdit} disabled={saving}>
                      {saving ? <ActivityIndicator size="small" color={colors.yellow} /> : <Text style={styles.saveText}>Kaydet</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.individualToggle} onPress={() => setEditingIsIndividual((v) => !v)}>
                  <View style={[styles.checkbox, editingIsIndividual && styles.checkboxChecked]}>
                    {editingIsIndividual && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.individualToggleText}>Bireysel branş</Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {groupCount} grup{item.coordinator?.name ? ` · Koordinatör: ${item.coordinator.name}` : ""}
                  {item.is_individual ? " · Bireysel" : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={() => startEdit(item)} style={{ marginRight: spacing.md }}>
                <Text style={styles.editText}>Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text style={styles.deleteText}>Sil</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.lg },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  inputRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingHorizontal: spacing.md, justifyContent: "center" },
  addButtonText: { color: colors.bg, fontWeight: "700" },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.md },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowName: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  rowMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  editText: { color: colors.teal, fontWeight: "700", fontSize: 13 },
  deleteText: { color: colors.coral, fontWeight: "700", fontSize: 13 },
  editInput: {
    flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.teal, borderRadius: radius.sm,
    color: colors.ink, paddingHorizontal: spacing.sm, paddingVertical: 8, marginRight: spacing.sm,
  },
  editActions: { flexDirection: "row", alignItems: "center" },
  cancelText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  saveText: { color: colors.yellow, fontWeight: "700", fontSize: 13 },
  individualToggle: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md, marginTop: spacing.xs },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  checkmark: { color: colors.bg, fontWeight: "800", fontSize: 12 },
  individualToggleText: { color: colors.muted, fontSize: 12, flex: 1 },
});

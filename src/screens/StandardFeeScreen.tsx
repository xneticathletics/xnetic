import React, { useCallback, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { listBranchesWithFees, updateBranchStandardFee, type BranchFee } from "../lib/api/branches";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

// Kulüp admininin HER BRANŞ için ayrı, sabit bir aidat ücreti belirlemesini
// sağlar — branşlar arası fiyat farkı olabildiği için (ör. Yüzme havuz
// kirası nedeniyle daha pahalı olabilir) tek bir kulüp geneli ücret yerine
// branş bazlı. Bir branşın ücretini değiştirdiğinde SADECE o branştaki
// sporcuların aktif aidat planı ve (bulunulan ay hariç) henüz ödenmemiş
// gelecek ay kayıtları otomatik güncellenir — bkz. lib/api/branches.ts
// updateBranchStandardFee. Sabit ücret ayarlanmamış bir branş, sporcu
// bazında serbest tutar (PaymentForm) modelini kullanmaya devam eder.
export default function StandardFeeScreen() {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [branches, setBranches] = useState<BranchFee[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await listBranchesWithFees();
      setBranches(all);
      setAmounts(Object.fromEntries(all.map((b) => [b.id, b.standard_fee_try != null ? String(b.standard_fee_try) : ""])));
    } catch (e: any) {
      setError(e.message ?? "Branşlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = (branch: BranchFee) => {
    if (savingId) return;
    const newFee = Number(amounts[branch.id]);
    if (!amounts[branch.id] || isNaN(newFee) || newFee <= 0) {
      Alert.alert("Eksik bilgi", "Geçerli bir tutar gir.", [{ text: "Tamam" }]);
      return;
    }

    Alert.alert(
      `${branch.name} — sabit aidat ücretini güncelle`,
      `Bu işlem SADECE ${branch.name} branşındaki sporcuların aidat planını ${newFee.toLocaleString("tr-TR")} ₺'ye günceller ve bulunduğumuz ay HARİÇ, henüz ödenmemiş gelecek aylardaki aidat tutarlarını da bu değere çeker. Diğer branşlara dokunulmaz. Devam edilsin mi?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Güncelle",
          style: "destructive",
          onPress: async () => {
            setSavingId(branch.id);
            try {
              const result = await updateBranchStandardFee(branch.id, newFee);
              setBranches((prev) => prev.map((b) => (b.id === branch.id ? { ...b, standard_fee_try: newFee } : b)));
              Alert.alert(
                "Güncellendi",
                `${result.plansUpdated} aidat planı ve ${result.paymentsUpdated} gelecek ay kaydı yeni tutara güncellendi.`,
                [{ text: "Tamam" }]
              );
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Güncellenemedi", [{ text: "Tamam" }]);
            } finally {
              setSavingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.hint}>
          Her branş için ayrı bir sabit aidat ücreti belirle — branşlar arası fiyat farkı olabilir.
          Bir branşın ücretini değiştirdiğinde sadece o branştaki sporcuların aidatları etkilenir.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {branches.length === 0 && !error && (
          <Text style={styles.hint}>Henüz branş eklenmemiş. Kulüp Yapısı'ndan branş ekleyebilirsin.</Text>
        )}

        {branches.map((branch) => (
          <View key={branch.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.branchName}>{branch.name}</Text>
              {branch.standard_fee_try != null && (
                <Text style={styles.currentValue}>{branch.standard_fee_try.toLocaleString("tr-TR")} ₺</Text>
              )}
            </View>
            <View style={styles.row}>
              <TextInput
                onFocus={handleFocus}
                style={[styles.input, { flex: 1 }]}
                value={amounts[branch.id] ?? ""}
                onChangeText={(v) => setAmounts((prev) => ({ ...prev, [branch.id]: v }))}
                keyboardType="decimal-pad"
                placeholder="Örn. 1500"
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity style={styles.button} onPress={() => handleSave(branch)} disabled={savingId === branch.id}>
                {savingId === branch.id ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={styles.buttonText}>Güncelle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: "center", justifyContent: "center" },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md, fontSize: 13 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  branchName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  currentValue: { color: colors.yellow, fontSize: 15, fontWeight: "800" },
  row: { flexDirection: "row", gap: spacing.sm },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  button: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingHorizontal: spacing.lg,
    alignItems: "center", justifyContent: "center",
  },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
});

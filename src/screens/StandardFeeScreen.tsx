import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { getStandardFee, updateStandardFee } from "../lib/api/paymentPlans";
import { useAuth } from "../context/AuthContext";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

// Kulüp admininin TÜM sporcular için sabit, tek bir aidat ücreti
// belirlemesini sağlar — bunu değiştirdiğinde tüm aktif aidat planları ve
// (bulunulan ay hariç) henüz ödenmemiş gelecek ay kayıtları otomatik
// güncellenir. Sporcu bazında farklı tutar isteyen kulüpler bu ekranı hiç
// kullanmadan eski (PaymentForm'daki serbest tutar) modeli kullanmaya
// devam edebilir — standard_fee_try set edilmemişse hiçbir şey değişmez.
export default function StandardFeeScreen() {
  const { clubId } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const [currentFee, setCurrentFee] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!clubId) return;
      let cancelled = false;
      setLoading(true);
      getStandardFee(clubId)
        .then((fee) => {
          if (cancelled) return;
          setCurrentFee(fee);
          setAmount(fee != null ? String(fee) : "");
        })
        .catch((e) => { if (!cancelled) setError(e.message ?? "Yüklenemedi"); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [clubId])
  );

  const handleSave = () => {
    if (savingRef.current || !clubId) return;
    const newFee = Number(amount);
    if (!amount || isNaN(newFee) || newFee <= 0) {
      Alert.alert("Eksik bilgi", "Geçerli bir tutar gir.", [{ text: "Tamam" }]);
      return;
    }

    Alert.alert(
      "Sabit aidat ücretini güncelle",
      `Bu işlem TÜM sporcuların aidat planını ${newFee.toLocaleString("tr-TR")} ₺'ye günceller ve bulunduğumuz ay HARİÇ, henüz ödenmemiş gelecek aylardaki aidat tutarlarını da bu değere çeker. Bu ayki ve geçmiş kayıtlar etkilenmez. Devam edilsin mi?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Güncelle",
          style: "destructive",
          onPress: async () => {
            savingRef.current = true;
            setSaving(true);
            setError(null);
            try {
              const result = await updateStandardFee(clubId, newFee);
              setCurrentFee(newFee);
              Alert.alert(
                "Güncellendi",
                `${result.plansUpdated} aidat planı ve ${result.paymentsUpdated} gelecek ay kaydı yeni tutara güncellendi.`,
                [{ text: "Tamam" }]
              );
            } catch (e: any) {
              setError(e.message ?? "Güncellenemedi");
            } finally {
              savingRef.current = false;
              setSaving(false);
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
          Tüm sporculara aynı, sabit bir aidat ücreti uygulamak için buradan tek bir tutar belirle.
          Bu tutarı değiştirdiğinde, bulunduğumuz ay hariç, henüz ödenmemiş gelecek aylardaki
          tüm aidatlar otomatik olarak güncellenir.
        </Text>

        {currentFee != null && (
          <View style={styles.currentBox}>
            <Text style={styles.currentLabel}>Şu anki sabit ücret</Text>
            <Text style={styles.currentValue}>{currentFee.toLocaleString("tr-TR")} ₺</Text>
          </View>
        )}

        <Text style={styles.label}>Aylık Tutar (₺)</Text>
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Örn. 1500"
          placeholderTextColor={colors.muted}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Sabit Ücreti Güncelle</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: "center", justifyContent: "center" },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: spacing.lg },
  currentBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  currentLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  currentValue: { color: colors.yellow, fontSize: 22, fontWeight: "800", marginTop: 4 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  error: { color: colors.coral, marginTop: spacing.md, fontSize: 13 },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getClubBankInfo, updateClubBankInfo } from "../lib/api/clubSettings";
import { useAuth } from "../context/AuthContext";
import type { ClubSettingsStackParamList } from "../navigation/ClubSettingsStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useCopyToast } from "../hooks/useCopyToast";

type Props = NativeStackScreenProps<ClubSettingsStackParamList, "ClubBankInfo">;

export default function ClubBankInfoScreen({}: Props) {
  const { clubId } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const { copy, copiedKey } = useCopyToast();
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışabiliyordu. Senkron bir
  // ref ile anında kilitliyoruz.
  const savingRef = useRef(false);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    getClubBankInfo(clubId)
      .then((b) => {
        setBankAccountName(b.bankAccountName ?? "");
        setBankIban(b.bankIban ?? "");
      })
      .finally(() => setLoading(false));
  }, [clubId]);

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!clubId) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await updateClubBankInfo(clubId, bankAccountName.trim(), bankIban.trim());
      Alert.alert("Kaydedildi", "Banka bilgisi güncellendi — Havale/EFT ile ödeme yapacak velilere gösterilecek.", [{ text: "Tamam" }]);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          Havale/EFT ile aidat ödemek isteyen velilere gösterilecek. Boş bırakırsan bu ödeme yöntemi velilere görünmez.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.lg }} />
        ) : (
          <>
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Hesap Sahibi</Text>
              <View style={styles.inputBox}>
                <TextInput
                  onFocus={handleFocus}
                  style={styles.inputInner}
                  value={bankAccountName}
                  onChangeText={setBankAccountName}
                  placeholder="Örn. X-NETIC Spor Kulübü Derneği"
                  placeholderTextColor={colors.muted}
                />
                <View style={styles.copyAnchor}>
                  {copiedKey === "name" && (
                    <View style={styles.copiedLabel} pointerEvents="none">
                      <Text style={styles.copiedLabelText} numberOfLines={1}>Kopyalandı</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.inlineCopyButton} onPress={() => copy("name", bankAccountName)}>
                    <Text style={styles.copyIcon}>📋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>IBAN</Text>
              <View style={styles.inputBox}>
                <TextInput
                  onFocus={handleFocus}
                  style={styles.inputInner}
                  value={bankIban}
                  onChangeText={setBankIban}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                />
                <View style={styles.copyAnchor}>
                  {copiedKey === "iban" && (
                    <View style={styles.copiedLabel} pointerEvents="none">
                      <Text style={styles.copiedLabelText} numberOfLines={1}>Kopyalandı</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.inlineCopyButton} onPress={() => copy("iban", bankIban)}>
                    <Text style={styles.copyIcon}>📋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  subtitle: { color: colors.muted, fontSize: 13, marginBottom: spacing.lg, lineHeight: 18 },
  fieldBlock: { marginBottom: spacing.md },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  inputBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingRight: 6,
  },
  inputInner: { flex: 1, color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12 },
  copyAnchor: { position: "relative" },
  inlineCopyButton: { padding: 8 },
  copyIcon: { fontSize: 16 },
  copiedLabel: {
    position: "absolute", bottom: "100%", right: 0, marginBottom: 6, width: 88,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.ink, borderRadius: radius.sm, paddingVertical: 4,
  },
  copiedLabelText: { color: colors.bg, fontSize: 11, fontWeight: "600" },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

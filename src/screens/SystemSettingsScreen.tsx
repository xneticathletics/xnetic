import React, { useCallback, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Switch,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme/tokens";
import { getPlatformSettings, updatePlatformSettings } from "../lib/api/platformSettings";

// Süper Admin'in alt menüsündeki bağımsız sekme — Ana Sayfa kutucuklarının
// arasından çıkarılıp Kulüp Admini'nin "Kulüp Ayarları" sekmesiyle aynı
// konuma (Ana Menü'nün yanına) taşındı.
export default function SystemSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      getPlatformSettings()
        .then((s) => {
          if (cancelled) return;
          setMonthlyPrice(String(s.monthlyPriceTry));
          setYearlyPrice(String(s.yearlyPriceTry));
          setMaintenanceMode(s.maintenanceMode);
          setMaintenanceMessage(s.maintenanceMessage);
          setSupportEmail(s.supportEmail ?? "");
          setSupportPhone(s.supportPhone ?? "");
        })
        .catch((e) => { if (!cancelled) setError(e.message ?? "Ayarlar yüklenemedi"); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  const handleSave = async () => {
    const monthly = Number(monthlyPrice.replace(",", "."));
    const yearly = Number(yearlyPrice.replace(",", "."));
    if (!monthlyPrice.trim() || Number.isNaN(monthly) || monthly <= 0) {
      return Alert.alert("Hatalı değer", "Aylık fiyat geçerli bir sayı olmalı.", [{ text: "Tamam" }]);
    }
    if (!yearlyPrice.trim() || Number.isNaN(yearly) || yearly <= 0) {
      return Alert.alert("Hatalı değer", "Yıllık fiyat geçerli bir sayı olmalı.", [{ text: "Tamam" }]);
    }
    if (!maintenanceMessage.trim()) {
      return Alert.alert("Eksik bilgi", "Bakım mesajı boş olamaz.", [{ text: "Tamam" }]);
    }

    setSaving(true);
    setError(null);
    try {
      await updatePlatformSettings({
        monthlyPriceTry: monthly,
        yearlyPriceTry: yearly,
        maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim(),
        supportEmail: supportEmail.trim() || null,
        supportPhone: supportPhone.trim() || null,
      });
      Alert.alert("Kaydedildi", "Sistem ayarları güncellendi.", [{ text: "Tamam" }]);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + spacing.lg }]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Sistem Ayarları</Text>
        <Text style={styles.subtitle}>
          Bu ekrandaki değişiklikler platformdaki TÜM kulüpleri etkiler.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonelik Fiyatları</Text>
          <Text style={styles.label}>Aylık Fiyat (₺)</Text>
          <TextInput
            style={styles.input}
            value={monthlyPrice}
            onChangeText={setMonthlyPrice}
            keyboardType="decimal-pad"
            placeholder="999"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>Yıllık Fiyat (₺)</Text>
          <TextInput
            style={styles.input}
            value={yearlyPrice}
            onChangeText={setYearlyPrice}
            keyboardType="decimal-pad"
            placeholder="9990"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.hint}>Kulüp Oluştur ekranındaki plan fiyatları buradan güncellenir.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Bakım Modu</Text>
              <Text style={styles.hint}>
                Açıkken Süper Admin dışındaki tüm kullanıcılar bakım mesajını görür,
                yeni kulüp oluşturma da kapanır.
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: colors.line, true: colors.coralSoft }}
              thumbColor={maintenanceMode ? colors.coral : colors.muted}
            />
          </View>
          <Text style={styles.label}>Bakım Mesajı</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={maintenanceMessage}
            onChangeText={setMaintenanceMessage}
            multiline
            placeholder="Uygulama şu anda bakımda..."
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek İletişim Bilgileri</Text>
          <Text style={styles.label}>Destek E-postası</Text>
          <TextInput
            style={styles.input}
            value={supportEmail}
            onChangeText={setSupportEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="destek@xnetic.com"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>Destek Telefonu</Text>
          <TextInput
            style={styles.input}
            value={supportPhone}
            onChangeText={setSupportPhone}
            keyboardType="phone-pad"
            placeholder="0212 000 00 00"
            placeholderTextColor={colors.muted}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Kaydet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.xs },
  subtitle: { color: colors.muted, fontSize: 13, marginBottom: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md, fontSize: 13 },
  section: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg,
  },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginBottom: spacing.sm },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  hint: { color: colors.muted, fontSize: 11, fontStyle: "italic", marginTop: spacing.xs },
  switchRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.sm },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

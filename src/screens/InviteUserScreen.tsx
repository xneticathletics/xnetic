import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { inviteUser, type InviteRole } from "../lib/api/inviteUser";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useCopyToast } from "../hooks/useCopyToast";
// Veli ve Sporcu hesapları artık Sporcu Yönetimi'nden (sporcu kaydına
// bağlı olarak) oluşturuluyor — bu ekran sadece Antrenörler → Antrenör
// Ekle'den, presetRole="coach" ile açılıyor. Yine de belirli bir stack'in
// ParamList'ine bağlanmak yerine sadece ihtiyaç duyduğu route.params
// şeklini bekliyor.
type Props = { route: { params?: { presetRole?: InviteRole } } };

const ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: "parent", label: "Veli" },
  { value: "athlete", label: "Sporcu" },
  { value: "coach", label: "Antrenör" },
];

export default function InviteUserScreen({ route }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const presetRole = route.params?.presetRole ?? null;
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<InviteRole | null>(presetRole);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleInvite iki kez çalışabiliyordu. Senkron
  // bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ identifier: string; tempPassword: string } | null>(null);
  const { copy, copiedKey } = useCopyToast();

  const handleInvite = async () => {
    if (savingRef.current) return;
    if (!identifier.trim() || !role) {
      Alert.alert("Eksik bilgi", "Telefon/kullanıcı adı ve rol zorunludur.", [{ text: "Tamam" }]);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const res = await inviteUser({ identifier: identifier.trim(), role });
      setResult({ identifier: res.identifier, tempPassword: res.tempPassword });
      setIdentifier("");
      setRole(presetRole);
    } catch (e: any) {
      setError(e.message ?? "Hesap oluşturulamadı");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={styles.infoBox}>
          {presetRole === "coach"
            ? "Antrenörün telefon numarasını ya da kullanıcı adını gir — bir geçici şifre üretilir."
            : "Telefon numarası, kullanıcı adı ya da e-posta ve rol girip hesap oluşturuyorsun — bir geçici şifre üretilir."}
          {" "}Bu şifreyi kişiye kendin (WhatsApp, SMS, telefonla vb.)
          iletmen gerekiyor. Kişi girdiğin bilgi ve geçici şifreyle
          uygulamaya giriş yapar, ilk girişte kendi şifresini belirlemesi
          zorunlu tutulur.
        </Text>

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>✓ Hesap Oluşturuldu</Text>
            <Text style={styles.resultLine}>Giriş Bilgisi: {result.identifier}</Text>
            <TouchableOpacity
              style={styles.passwordRow}
              onPress={() => copy("invite", result.tempPassword)}
              activeOpacity={0.7}
            >
              <Text selectable style={styles.passwordText}>{result.tempPassword}</Text>
              <Text style={styles.copyIcon}>{copiedKey === "invite" ? "✓" : "📋"}</Text>
            </TouchableOpacity>
            {copiedKey === "invite" && <Text style={styles.copiedText}>Kopyalandı</Text>}
            <Text style={styles.resultHint}>
              Metne basılı tutup ya da 📋 simgesine dokunup kopyalayabilirsin. Bu geçici
              şifreyi kişiye ilet — bir daha burada görüntülenmeyecek.
            </Text>
          </View>
        )}

        <Field label="Telefon veya Kullanıcı Adı *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            placeholder="05XX XXX XX XX ya da kullaniciadi"
            placeholderTextColor={colors.muted}
          />
        </Field>

        {!presetRole && (
          <Field label="Rol *">
            <View style={styles.roleGrid}>
              {ROLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.roleChip, role === opt.value && styles.roleChipActive]}
                  onPress={() => setRole(opt.value)}
                >
                  <Text style={[styles.roleChipText, role === opt.value && styles.roleChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleInvite} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Hesap Oluştur</Text>}
        </TouchableOpacity>
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
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  resultBox: {
    backgroundColor: colors.tealSoft, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  resultTitle: { color: colors.ink, fontSize: 15, fontWeight: "700", marginBottom: spacing.xs },
  resultLine: { color: colors.ink, fontSize: 13, marginBottom: spacing.sm },
  passwordRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.bg, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 12,
    marginBottom: spacing.xs,
  },
  passwordText: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: "800", letterSpacing: 2, textAlign: "center" },
  copyIcon: { fontSize: 18 },
  copiedText: { color: colors.teal, fontSize: 11, fontWeight: "700", marginBottom: spacing.xs },
  resultHint: { color: colors.muted, fontSize: 11 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8 },
  roleChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  roleChipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  roleChipTextActive: { color: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

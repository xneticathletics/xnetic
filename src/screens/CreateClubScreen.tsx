import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing } from "../theme/tokens";
import { createClub, type BillingPeriod } from "../lib/api/clubSignup";
import { uploadClubLogo } from "../lib/api/clubLogo";
import { useAuth } from "../context/AuthContext";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { formatPhoneNumber } from "../lib/phoneFormat";

type Step = "plan" | "payment" | "form";

const PLANS: { key: BillingPeriod; label: string; price: string; sub: string }[] = [
  { key: "monthly", label: "Aylık", price: "999 ₺ / ay", sub: "Her ay otomatik yenilenir" },
  { key: "yearly", label: "Yıllık", price: "9.990 ₺ / yıl", sub: "2 ay ücretsiz — en avantajlı" },
];

export default function CreateClubScreen({ onBack }: { onBack: () => void }) {
  const { signIn } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [step, setStep] = useState<Step>("plan");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod | null>(null);

  const [clubName, setClubName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = PLANS.find((p) => p.key === billingPeriod);

  const handlePickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setLogoUri(result.assets[0].uri);
  };

  const handleBackPress = () => {
    if (step === "payment") return setStep("plan");
    if (step === "form") return setStep("payment");
    onBack();
  };

  const handleSubmit = async () => {
    if (!billingPeriod) return;
    if (!clubName.trim()) return Alert.alert("Eksik bilgi", "Kulüp adını girmelisin.", [{ text: "Tamam" }]);
    if (!adminName.trim()) return Alert.alert("Eksik bilgi", "Adını soyadını girmelisin.", [{ text: "Tamam" }]);
    if (!email.trim()) return Alert.alert("Eksik bilgi", "E-posta adresini girmelisin.", [{ text: "Tamam" }]);
    if (password.length < 6) return Alert.alert("Eksik bilgi", "Şifre en az 6 karakter olmalı.", [{ text: "Tamam" }]);
    if (password !== passwordConfirm) return Alert.alert("Hata", "Şifreler eşleşmiyor.", [{ text: "Tamam" }]);

    setSubmitting(true);
    setError(null);
    try {
      const { clubId } = await createClub({
        clubName: clubName.trim(),
        adminName: adminName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        billingPeriod,
      });
      // Hesap oluşturulduktan hemen sonra aynı bilgilerle giriş yapılır —
      // RootNavigator, oturum gelince otomatik olarak Ana Sayfa'ya geçirir.
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) throw new Error(signInError);

      // Logo yükleme, hesap oluştuktan ve oturum açıldıktan SONRA yapılır —
      // depolama izinleri (RLS) sadece giriş yapmış club_admin'in kendi
      // club_id'sine yazmasına izin veriyor, kayıt sırasında henüz oturum yok.
      if (logoUri) {
        await uploadClubLogo(logoUri, clubId).catch(() => {
          // Logo yüklenemese bile hesap zaten kuruldu — sessizce geç,
          // admin daha sonra Kulüp Ayarları'ndan tekrar deneyebilir.
        });
      }
    } catch (e: any) {
      setError(e.message ?? "Kulüp oluşturulamadı");
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backLink} onPress={handleBackPress} disabled={submitting}>
          <Text style={styles.backLinkText}>‹ Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Kulüp Oluştur</Text>

        {step === "plan" && (
          <>
            <Text style={styles.subtitle}>Kulübün için bir plan seç.</Text>
            {PLANS.map((p) => {
              const active = billingPeriod === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.planCard, active && styles.planCardActive]}
                  onPress={() => setBillingPeriod(p.key)}
                >
                  <Text style={[styles.planLabel, active && styles.planLabelActive]}>{p.label}</Text>
                  <Text style={[styles.planPrice, active && styles.planLabelActive]}>{p.price}</Text>
                  <Text style={styles.planSub}>{p.sub}</Text>
                </TouchableOpacity>
              );
            })}
            <Text style={styles.priceNote}>Fiyatlar örnektir, ödeme adımından önce güncel fiyat gösterilecektir.</Text>
            <TouchableOpacity
              style={[styles.button, !billingPeriod && styles.buttonDisabled]}
              onPress={() => billingPeriod && setStep("payment")}
              disabled={!billingPeriod}
            >
              <Text style={styles.buttonText}>Devam Et</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "payment" && selectedPlan && (
          <>
            <Text style={styles.subtitle}>Ödeme</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Seçilen Plan</Text>
              <Text style={styles.summaryValue}>{selectedPlan.label} — {selectedPlan.price}</Text>
            </View>
            <Text style={styles.placeholderNote}>
              Ödeme entegrasyonu yakında eklenecek. Şimdilik bu adım bir test/geliştirme
              yer tutucusudur — gerçek bir ödeme alınmıyor.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => setStep("form")}>
              <Text style={styles.buttonText}>Ödemeyi Tamamla (Test)</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "form" && (
          <>
            <Text style={styles.subtitle}>Kulüp Bilgileri</Text>

            <Text style={styles.label}>Kulüp Logosu (isteğe bağlı)</Text>
            <TouchableOpacity style={styles.logoBox} onPress={handlePickLogo}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="contain" />
              ) : (
                <Text style={styles.logoPlaceholder}>Logo Seç</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Kulüp Adı *</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={clubName}
              onChangeText={setClubName}
              placeholder="Örn. Yıldız Spor Kulübü"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Adın Soyadın (Kulüp Admini) *</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={adminName}
              onChangeText={setAdminName}
              placeholder="Örn. Ahmet Yılmaz"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>E-posta *</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ornek@eposta.com"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Telefon</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={phone}
              onChangeText={(v) => setPhone(formatPhoneNumber(v))}
              keyboardType="phone-pad"
              placeholder="0532-123-45-67"
              placeholderTextColor={colors.muted}
              maxLength={14}
            />

            <Text style={styles.label}>Şifre *</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="En az 6 karakter"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Şifre (Tekrar) *</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              placeholder="Şifreni tekrar gir"
              placeholderTextColor={colors.muted}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Kulübü Oluştur ve Başla</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.xl },
  backLink: { marginBottom: spacing.lg },
  backLinkText: { color: colors.muted, fontWeight: "600", fontSize: 14 },
  title: { color: colors.ink, fontSize: 24, fontWeight: "700", marginBottom: spacing.xs },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: spacing.lg },
  planCard: {
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  planCardActive: { borderColor: colors.yellow },
  planLabel: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  planLabelActive: { color: colors.yellow },
  planPrice: { color: colors.ink, fontSize: 20, fontWeight: "700", marginTop: 4 },
  planSub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  priceNote: { color: colors.muted, fontSize: 11, fontStyle: "italic", marginBottom: spacing.lg },
  summaryCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg,
  },
  summaryLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  summaryValue: { color: colors.ink, fontSize: 16, fontWeight: "700", marginTop: 4 },
  placeholderNote: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: spacing.sm },
  logoBox: {
    width: 120, height: 120, alignSelf: "center", backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md, overflow: "hidden",
  },
  logoImage: { width: "100%", height: "100%" },
  logoPlaceholder: { color: colors.muted, fontSize: 12 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  errorText: { color: colors.coral, marginTop: spacing.md, textAlign: "center" },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

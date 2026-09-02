import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { REQUIRED_CONSENT_TYPES, getMyAcceptedConsentTypes, acceptConsent, type ConsentType } from "../lib/api/consents";
import { getConsentText } from "../lib/consentTexts";
import { getCurrentClubId } from "../lib/api/currentUser";
import { getClubName } from "../lib/api/clubSettings";

// Veli/sporcu ilk girişte (şifre değişiminden sonra) bu ekrandan geçer —
// KVKK, sağlık verisi, fotoğraf/video ve sorumluluk onaylarının HER
// BİRİNİ tek tek "Okudum, Kabul Ediyorum" ile onaylaması gerekir.
// ForcePasswordChangeScreen ile aynı desen: onComplete çağrılana kadar
// RootNavigator başka bir yere geçit vermez.
export default function ConsentScreen({ onComplete }: { onComplete: () => void }) {
  const { signOut } = useAuth();
  const [clubName, setClubName] = useState("Kulüp");
  const [accepted, setAccepted] = useState<ConsentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [acceptedTypes, clubId] = await Promise.all([getMyAcceptedConsentTypes(), getCurrentClubId()]);
        setAccepted(acceptedTypes);
        if (clubId) {
          const name = await getClubName(clubId);
          if (name) setClubName(name);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const remainingTypes = REQUIRED_CONSENT_TYPES.filter((t) => !accepted.includes(t));
  const currentType = remainingTypes[0];

  const handleAccept = async () => {
    if (savingRef.current || !currentType) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await acceptConsent(currentType);
      const next = [...accepted, currentType];
      setAccepted(next);
      if (REQUIRED_CONSENT_TYPES.every((t) => next.includes(t))) {
        onComplete();
      }
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (!currentType) {
    // Zaten hepsi onaylanmış (ör. çift render) — beklerken onComplete tetiklenir.
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  const text = getConsentText(currentType);
  const stepIndex = REQUIRED_CONSENT_TYPES.indexOf(currentType) + 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>{stepIndex}/{REQUIRED_CONSENT_TYPES.length}</Text>
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.summary}>{text.summary}</Text>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.bodyText}>{text.body(clubName)}</Text>
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.acceptButtonText}>Okudum, Kabul Ediyorum</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() =>
            Alert.alert("Çıkış yap", "Onayları kabul etmeden uygulamayı kullanamazsınız. Çıkış yapmak istediğinize emin misiniz?", [
              { text: "Vazgeç", style: "cancel" },
              { text: "Çıkış Yap", style: "destructive", onPress: signOut },
            ])
          }
        >
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  stepLabel: { color: colors.yellow, fontSize: 12, fontWeight: "800", marginBottom: 4 },
  title: { color: colors.ink, fontSize: 19, fontWeight: "800" },
  summary: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  bodyScroll: {
    flex: 1, marginHorizontal: spacing.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
  },
  bodyText: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  error: { color: colors.coral, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  footer: { padding: spacing.lg },
  acceptButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  acceptButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  signOutButton: { alignItems: "center", paddingVertical: spacing.md },
  signOutText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
});

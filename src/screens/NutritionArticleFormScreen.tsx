import React, { useCallback, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getNutritionArticle, createNutritionArticle, updateNutritionArticle, uploadNutritionArticlePdf } from "../lib/api/nutritionArticles";
import { getArticleCategory } from "../lib/nutritionCategories";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionArticleForm">;

export default function NutritionArticleFormScreen({ route, navigation }: Props) {
  const { articleId, category } = route.params;
  const meta = getArticleCategory(category);
  const { clubId } = useAuth();
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLocalUri, setPdfLocalUri] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı yazıyı iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!articleId) return;
      getNutritionArticle(articleId)
        .then((a) => {
          setTitle(a.title);
          setBody(a.body ?? "");
          setSource(a.source ?? "");
          setPdfUrl(a.pdf_url);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [articleId])
  );

  const handlePickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (result.canceled || !result.assets?.[0]) return;
    setPdfLocalUri(result.assets[0].uri);
    setPdfFileName(result.assets[0].name);
  };

  const handleRemovePdf = () => {
    setPdfUrl(null);
    setPdfLocalUri(null);
    setPdfFileName(null);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!title.trim()) return Alert.alert("Eksik bilgi", "Başlık zorunludur.", [{ text: "Tamam" }]);
    const hasPdf = !!(pdfUrl || pdfLocalUri);
    if (!body.trim() && !hasPdf) {
      return Alert.alert("Eksik bilgi", "İçerik metni gir ya da bir PDF yükle.", [{ text: "Tamam" }]);
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      let finalPdfUrl = pdfUrl;
      if (pdfLocalUri && clubId) {
        finalPdfUrl = await uploadNutritionArticlePdf(pdfLocalUri, clubId);
      }
      const input = {
        category,
        title: title.trim(),
        body: body.trim() || null,
        pdf_url: finalPdfUrl,
        source: source.trim() || null,
      };
      if (articleId) {
        await updateNutritionArticle(articleId, input);
      } else {
        await createNutritionArticle(input);
      }
      navigation.goBack();
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

  const displayedPdfName = pdfFileName ?? (pdfUrl ? pdfUrl.split("/").pop() : null);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <View style={[styles.categoryBadge, { backgroundColor: meta.soft }]}>
          <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
        </View>

        <Text style={styles.infoBox}>
          İçeriğin bilimsel bir makaleye veya büyük bir sağlık kuruluşuna
          dayandığından ve Kaynakça alanına eklendiğinden emin ol.
        </Text>

        <Field label="Başlık *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Örn. Antrenman Öncesi Beslenme"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="PDF (isteğe bağlı)">
          {displayedPdfName ? (
            <View style={styles.pdfRow}>
              <Text style={styles.pdfName} numberOfLines={1}>📄 {displayedPdfName}</Text>
              <TouchableOpacity onPress={handleRemovePdf}>
                <Text style={styles.pdfRemove}>Kaldır</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pdfPickButton} onPress={handlePickPdf}>
              <Text style={styles.pdfPickButtonText}>📎 PDF Seç</Text>
            </TouchableOpacity>
          )}
        </Field>

        <Field label="İçerik (PDF yoksa zorunlu)">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultilineTall]}
            value={body}
            onChangeText={setBody}
            placeholder="Yazının tam metni"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <Field label="Kaynakça">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={source}
            onChangeText={setSource}
            placeholder="Örn. World Health Organization, 2022"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
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
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  categoryBadge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.md },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },
  infoBox: {
    color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: "top" },
  inputMultilineTall: { minHeight: 160, textAlignVertical: "top" },
  pdfPickButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderStyle: "dashed",
    borderRadius: radius.md, paddingVertical: 14, alignItems: "center",
  },
  pdfPickButtonText: { color: colors.violet, fontWeight: "700", fontSize: 14 },
  pdfRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  pdfName: { color: colors.ink, fontSize: 13, flex: 1, marginRight: spacing.sm },
  pdfRemove: { color: colors.coral, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

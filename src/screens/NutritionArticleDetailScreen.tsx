import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getNutritionArticle, deleteNutritionArticle, type NutritionArticle } from "../lib/api/nutritionArticles";
import { getArticleCategory } from "../lib/nutritionCategories";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionArticleDetail">;

const PDF_VIEWER_HEIGHT = 520;

// Android'in WebView'ı PDF'i doğrudan (native olarak) gösteremiyor — Google'ın
// genel doküman görüntüleyicisine sararak açıyoruz. iOS'ta WKWebView PDF'i
// zaten native olarak render ediyor, doğrudan URL yeterli.
function pdfViewerUrl(pdfUrl: string): string {
  if (Platform.OS === "android") {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
  }
  return pdfUrl;
}

export default function NutritionArticleDetailScreen({ route, navigation }: Props) {
  const { articleId } = route.params;
  const { role } = useAuth();
  const { isLocked } = useBranchSelect();
  const isCoordinator = role === "coach" && isLocked;
  const [article, setArticle] = useState<NutritionArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getNutritionArticle(articleId)
        .then(setArticle)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [articleId])
  );

  const handleDelete = () => {
    if (!article) return;
    Alert.alert(
      "Yazıyı sil",
      `"${article.title}" yazısını silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNutritionArticle(article.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Yazı bulunamadı."}</Text>
      </View>
    );
  }

  const meta = getArticleCategory(article.category);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={[styles.categoryBadge, { backgroundColor: meta.soft }]}>
        <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
      </View>

      <Text style={styles.title}>{article.title}</Text>

      {!!article.body && <Text style={styles.body}>{article.body}</Text>}

      {!!article.pdf_url && (
        <View style={styles.pdfContainer}>
          <WebView source={{ uri: pdfViewerUrl(article.pdf_url) }} style={styles.pdfViewer} startInLoadingState renderLoading={() => (
            <View style={styles.pdfLoading}>
              <ActivityIndicator color={colors.yellow} />
            </View>
          )} />
        </View>
      )}

      {!!article.source && (
        <View style={styles.sourceBox}>
          <Text style={styles.sourceLabel}>Kaynakça</Text>
          <Text style={styles.sourceText}>{article.source}</Text>
        </View>
      )}

      {(role === "club_admin" || isCoordinator) && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("NutritionArticleForm", { articleId: article.id, category: article.category })}
          >
            <Text style={styles.editButtonText}>✎ Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  error: { color: colors.coral },
  categoryBadge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, marginBottom: spacing.sm },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800", marginBottom: spacing.md },
  body: { color: colors.ink, fontSize: 14, lineHeight: 21, marginBottom: spacing.lg },
  pdfContainer: {
    height: PDF_VIEWER_HEIGHT, borderRadius: radius.md, overflow: "hidden",
    borderWidth: 1, borderColor: colors.line, marginBottom: spacing.lg, backgroundColor: colors.surface,
  },
  pdfViewer: { flex: 1, backgroundColor: colors.surface },
  pdfLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  sourceBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  sourceLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  sourceText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  editButton: { flex: 1, backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  editButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  deleteButton: { flex: 1, borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 14 },
});

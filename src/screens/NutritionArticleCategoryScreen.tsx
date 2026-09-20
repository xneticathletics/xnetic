import React, { useCallback, useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listNutritionArticlesByCategory, type NutritionArticle } from "../lib/api/nutritionArticles";
import { getArticleCategory } from "../lib/nutritionCategories";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionArticleCategory">;

export default function NutritionArticleCategoryScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const meta = getArticleCategory(category);

  const [articles, setArticles] = useState<NutritionArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    navigation.setOptions({ title: meta.label });
  }, [meta.label, navigation]);

  const load = useCallback(async () => {
    try {
      setError(null);
      setArticles(await listNutritionArticlesByCategory(category));
    } catch (e: any) {
      setError(e.message ?? "Yazılar yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, [category]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={[styles.heroCard, { backgroundColor: meta.soft, borderColor: meta.color }]}>
        <Text style={styles.heroIcon}>{meta.icon}</Text>
        <Text style={[styles.heroTitle, { color: meta.color }]}>{meta.label}</Text>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz bir yazı eklenmedi.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("NutritionArticleDetail", { articleId: item.id })}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSnippet} numberOfLines={2}>
              {item.body || (item.pdf_url ? "📄 PDF olarak yayınlandı" : "")}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  heroCard: { borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: "center", marginBottom: spacing.md },
  heroIcon: { fontSize: 28, marginBottom: 2 },
  heroTitle: { fontSize: 15, fontWeight: "800", textAlign: "center" },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  cardSnippet: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
});

import React, { useCallback, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { ARTICLE_CATEGORIES, freeArticleColors } from "../lib/nutritionCategories";
import { listFreeNutritionArticles, type NutritionArticle } from "../lib/api/nutritionArticles";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "NutritionArticles">;

// "genel" (serbest yazılar) konu kutucukları arasında gösterilmez — onlar
// sayfanın en üstünde, en yeni en üstte olacak şekilde ayrı listelenir.
const TOPIC_CATEGORIES = ARTICLE_CATEGORIES.filter((c) => c.key !== "genel");

export default function NutritionArticlesScreen({ navigation }: Props) {
  const { role } = useAuth();
  // Branş Koordinatörü, Beslenme/Performans/Fitness sayfalarında Kulüp
  // Admini gibi yetkili — bkz. BranchSelectContext.tsx.
  const { isLocked } = useBranchSelect();
  const canAdd = role === "club_admin" || (role === "coach" && isLocked);

  const [articles, setArticles] = useState<NutritionArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setArticles(await listFreeNutritionArticles());
    } catch {
      // Liste yüklenemezse konu kutucukları yine de çalışsın — sayfayı bozma.
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
    >
      <Text style={styles.subtitle}>Güne göre beslenme önerileri — bilimsel kaynaklara dayanır.</Text>

      {canAdd && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("NutritionArticleForm", { articleId: undefined, category: "genel" })}
        >
          <Text style={styles.addButtonText}>+ Yazı Ekle</Text>
        </TouchableOpacity>
      )}

      {loading && articles.length === 0 && <ActivityIndicator color={colors.yellow} style={{ marginBottom: spacing.md }} />}

      {articles.length > 0 && (
        <View style={[styles.stack, { marginBottom: spacing.md }]}>
          {articles.map((a) => {
            const c = freeArticleColors(a.id);
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.tile, { borderColor: c.color, backgroundColor: c.soft }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("NutritionArticleDetail", { articleId: a.id })}
              >
                <Text style={styles.tileIcon}>📝</Text>
                <Text style={[styles.tileLabel, { color: c.color }]} numberOfLines={2}>{a.title}</Text>
                <Text style={styles.tileArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.stack}>
        {TOPIC_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tile, { borderColor: cat.color, backgroundColor: cat.soft }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("NutritionArticleCategory", { category: cat.key })}
          >
            <Text style={styles.tileIcon}>{cat.icon}</Text>
            <Text style={[styles.tileLabel, { color: cat.color }]}>{cat.label}</Text>
            <Text style={styles.tileArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: spacing.lg },
  addButton: {
    alignSelf: "flex-start", borderWidth: 1, borderColor: colors.yellow, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, marginBottom: spacing.md,
  },
  addButtonText: { color: colors.yellow, fontSize: 12, fontWeight: "700" },
  stack: { gap: spacing.sm },
  tile: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
  },
  tileIcon: { fontSize: 24 },
  tileLabel: { flex: 1, fontSize: 14, fontWeight: "800" },
  tileArrow: { color: colors.muted, fontSize: 20, fontWeight: "700" },
});

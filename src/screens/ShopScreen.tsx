import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listActiveProducts, type ShopProduct, type ShopGender } from "../lib/api/shop";
import { useAuth } from "../context/AuthContext";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "Shop">;

const GENDER_LABEL: Record<ShopGender, string> = { kadin: "Kadın", erkek: "Erkek", unisex: "Unisex" };

export default function ShopScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { role } = useAuth();

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<ShopGender | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setProducts(await listActiveProducts());
    } catch (e: any) {
      setError(e.message ?? "Ürünler yüklenemedi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, "tr")),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    if (genderFilter) list = list.filter((p) => p.gender === genderFilter);
    return list;
  }, [products, categoryFilter, genderFilter]);

  return (
    <View style={styles.container}>
      {role === "parent" && (
        <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("MyShopOrders")}>
          <Text style={styles.ordersButtonText}>📦 Siparişlerim</Text>
        </TouchableOpacity>
      )}

      {categories.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["__all__", ...categories]}
          keyExtractor={(c) => c}
          style={styles.filterRow}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = item === "__all__" ? !categoryFilter : categoryFilter === item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategoryFilter(item === "__all__" ? null : item)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item === "__all__" ? "Tümü" : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={(["__all__", "kadin", "erkek", "unisex"] as const)}
        keyExtractor={(g) => g}
        style={styles.filterRow}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => {
          const active = item === "__all__" ? !genderFilter : genderFilter === item;
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setGenderFilter(item === "__all__" ? null : item)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {item === "__all__" ? "Tümü" : GENDER_LABEL[item]}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filteredProducts}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {categoryFilter || genderFilter ? "Bu filtreye uyan ürün yok." : "Mağazada henüz ürün yok."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("ShopProductDetail", { productId: item.id })}
          >
            <View style={styles.cardImageWrap}>
              {item.photo_urls[0] ? (
                <Image source={{ uri: item.photo_urls[0] }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                  <Text style={{ fontSize: 36 }}>🛍️</Text>
                </View>
              )}
              {item.gender && (
                <View style={styles.genderBadge}>
                  <Text style={styles.genderBadgeText}>{GENDER_LABEL[item.gender]}</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardPrice}>{Number(item.price).toLocaleString("tr-TR")} ₺</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const CARD_GAP = spacing.md;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  ordersButton: {
    alignSelf: "flex-end", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8, marginBottom: spacing.md,
  },
  ordersButtonText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  filterRow: { flexGrow: 0, marginBottom: spacing.sm },
  filterChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  filterChipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  filterChipTextActive: { color: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, width: "100%" },
  gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  cardImageWrap: { width: "100%", aspectRatio: 1, backgroundColor: colors.bg },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  genderBadge: {
    position: "absolute", top: spacing.xs, left: spacing.xs,
    backgroundColor: "rgba(16,18,42,0.75)", borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  genderBadgeText: { color: colors.ink, fontSize: 10, fontWeight: "700" },
  cardBody: { padding: spacing.sm },
  cardTitle: { color: colors.ink, fontSize: 13, fontWeight: "700", lineHeight: 17, minHeight: 34 },
  cardPrice: { color: colors.yellow, fontSize: 15, fontWeight: "800", marginTop: 6 },
});

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
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("ShopProductDetail", { productId: item.id })}>
            {item.photo_urls[0] ? (
              <Image source={{ uri: item.photo_urls[0] }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 22 }}>🛍️</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.rowPrice}>{Number(item.price).toLocaleString("tr-TR")} ₺</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

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
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowPrice: { color: colors.yellow, fontSize: 14, fontWeight: "800", marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 18, fontWeight: "700" },
});

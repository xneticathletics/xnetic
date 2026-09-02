import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllProducts, listProductVariantsAdmin, updateVariantStock, type ShopProductAdmin, type ShopVariantAdmin } from "../lib/api/shop";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ShopStock">;

export default function ShopStockScreen({}: Props) {
  const [products, setProducts] = useState<ShopProductAdmin[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [variants, setVariants] = useState<Record<string, ShopVariantAdmin[]>>({});
  const [variantsLoading, setVariantsLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setProducts(await listAllProducts());
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

  const toggleExpand = async (productId: string) => {
    if (expanded === productId) {
      setExpanded(null);
      return;
    }
    setExpanded(productId);
    if (!variants[productId]) {
      setVariantsLoading(productId);
      try {
        const v = await listProductVariantsAdmin(productId);
        setVariants((prev) => ({ ...prev, [productId]: v }));
      } catch {
        // sessizce yut — açılan bölüm boş görünür, tekrar denenebilir
      } finally {
        setVariantsLoading(null);
      }
    }
  };

  const adjustStock = async (productId: string, variant: ShopVariantAdmin, delta: number) => {
    const newStock = Math.max(0, variant.stock + delta);
    setVariants((prev) => ({
      ...prev,
      [productId]: prev[productId].map((v) => (v.id === variant.id ? { ...v, stock: newStock } : v)),
    }));
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, totalStock: p.totalStock + (newStock - variant.stock) } : p))
    );
    try {
      await updateVariantStock(variant.id, newStock);
    } catch {
      load();
    }
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz ürün eklenmedi.</Text> : null}
        renderItem={({ item }) => {
          const isOpen = expanded === item.id;
          return (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.id)}>
                {item.photo_urls[0] ? (
                  <Image source={{ uri: item.photo_urls[0] }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Text style={{ fontSize: 16 }}>🛍️</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardSub}>Toplam stok: {item.totalStock}</Text>
                </View>
                <Text style={styles.chevron}>{isOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.variantList}>
                  {variantsLoading === item.id ? (
                    <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.sm }} />
                  ) : (
                    (variants[item.id] ?? []).map((v) => {
                      const label = [v.color, v.size].filter(Boolean).join(" / ") || "Genel";
                      return (
                        <View key={v.id} style={styles.variantRow}>
                          <Text style={styles.variantLabel}>{label}</Text>
                          <View style={styles.stepper}>
                            <TouchableOpacity style={styles.stepperButton} onPress={() => adjustStock(item.id, v, -1)}>
                              <Text style={styles.stepperButtonText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.stepperValue}>{v.stock}</Text>
                            <TouchableOpacity style={styles.stepperButton} onPress={() => adjustStock(item.id, v, 1)}>
                              <Text style={styles.stepperButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  error: { color: colors.coral, marginTop: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, marginBottom: spacing.sm, overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  cardSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 12 },
  variantList: { borderTopWidth: 1, borderTopColor: colors.line, padding: spacing.sm, gap: spacing.sm },
  variantRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  variantLabel: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepperButton: {
    width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  stepperButtonText: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  stepperValue: { color: colors.ink, fontSize: 14, fontWeight: "700", minWidth: 28, textAlign: "center" },
});

import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllProducts, updateProduct, deleteProduct, getPendingOrderCount, type ShopProductAdmin, type ShopGender } from "../lib/api/shop";

const GENDER_LABEL: Record<ShopGender, string> = { kadin: "Kadın", erkek: "Erkek", unisex: "Unisex" };
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ShopManage">;

export default function ShopManageScreen({ navigation }: Props) {
  useHomeButton(navigation);

  const [products, setProducts] = useState<ShopProductAdmin[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [allProducts, pending] = await Promise.all([listAllProducts(), getPendingOrderCount()]);
      setProducts(allProducts);
      setPendingCount(pending);
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

  const handleLongPress = (item: ShopProductAdmin) => {
    Alert.alert(item.title, undefined, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: item.is_active ? "Pasifleştir" : "Aktifleştir",
        onPress: async () => {
          try {
            await updateProduct(item.id, { is_active: !item.is_active });
            load();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "İşlem başarısız", [{ text: "Tamam" }]);
          }
        },
      },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          Alert.alert("Ürünü sil", `${item.title} kalıcı olarak silinecek. Emin misin?`, [
            { text: "Vazgeç", style: "cancel" },
            {
              text: "Sil",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteProduct(item.id);
                  load();
                } catch (e: any) {
                  Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.stockButton} onPress={() => navigation.navigate("ShopStock")}>
          <Text style={styles.stockButtonText}>📊 Stok</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("ShopOrders")}>
          <Text style={styles.ordersButtonText}>📦 Siparişler</Text>
          {pendingCount > 0 && (
            <View style={styles.ordersBadge}>
              <Text style={styles.ordersBadgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("ShopProductForm", { productId: undefined })}>
          <Text style={styles.addButtonText}>+ Ürün Ekle</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz ürün eklenmedi.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, !item.is_active && styles.rowInactive]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("ShopProductForm", { productId: item.id })}
            onLongPress={() => handleLongPress(item)}
          >
            {item.photo_urls[0] ? (
              <Image source={{ uri: item.photo_urls[0] }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 30 }}>🛍️</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.rowSub}>{Number(item.price).toLocaleString("tr-TR")} ₺</Text>
              {(item.category || item.gender) && (
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {[item.category, item.gender && GENDER_LABEL[item.gender]].filter(Boolean).join(" · ")}
                </Text>
              )}
              <View style={styles.badgeRow}>
                <Text style={[styles.badge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
                  {item.is_active ? "Aktif" : "Pasif"}
                </Text>
                <Text style={[styles.badge, item.totalStock > 0 ? styles.badgeStock : styles.badgeOutOfStock]}>
                  Stok: {item.totalStock}
                </Text>
              </View>
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
  header: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginBottom: spacing.md },
  stockButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  stockButtonText: { color: colors.teal, fontWeight: "700", fontSize: 12 },
  ordersButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.violet,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10, position: "relative",
  },
  ordersButtonText: { color: colors.violet, fontWeight: "700", fontSize: 12 },
  ordersBadge: {
    position: "absolute", top: -6, right: -6, backgroundColor: colors.coral,
    borderRadius: radius.full, minWidth: 16, height: 16, paddingHorizontal: 3,
    alignItems: "center", justifyContent: "center",
  },
  ordersBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  addButton: { backgroundColor: colors.violet, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  rowInactive: { opacity: 0.55 },
  thumb: { width: 84, height: 84, borderRadius: radius.md },
  thumbPlaceholder: { backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  rowSub: { color: colors.yellow, fontSize: 14, fontWeight: "800", marginTop: 2 },
  rowMeta: { color: colors.violet, fontSize: 11, marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: spacing.xs },
  badge: { fontSize: 10, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, overflow: "hidden" },
  badgeActive: { color: colors.bg, backgroundColor: colors.teal },
  badgeInactive: { color: colors.bg, backgroundColor: colors.muted },
  badgeStock: { color: colors.bg, backgroundColor: colors.violet },
  badgeOutOfStock: { color: colors.bg, backgroundColor: colors.coral },
  chevron: { color: colors.muted, fontSize: 20, fontWeight: "700" },
});

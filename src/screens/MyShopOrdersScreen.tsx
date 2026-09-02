import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listMyOrders, variantLabel, type ShopOrder, type ShopOrderStatus } from "../lib/api/shop";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "MyShopOrders">;

const STATUS_LABEL: Record<ShopOrderStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};
const STATUS_COLOR: Record<ShopOrderStatus, string> = {
  pending: colors.yellow,
  confirmed: colors.teal,
  delivered: colors.teal,
  cancelled: colors.coral,
};

export default function MyShopOrdersScreen({}: Props) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOrders(await listMyOrders());
    } catch (e: any) {
      setError(e.message ?? "Siparişler yüklenemedi");
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

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz siparişin yok.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {item.shop_products?.title ?? "Ürün"}
                {variantLabel(item.shop_product_variants) ? ` · ${variantLabel(item.shop_product_variants)}` : ""}
              </Text>
              <Text style={styles.rowSub}>
                {item.quantity} adet · {new Date(item.created_at).toLocaleDateString("tr-TR")}
              </Text>
              {!!item.note && <Text style={styles.rowNote}>{item.note}</Text>}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rowAmount}>{Number(item.total_price).toLocaleString("tr-TR")} ₺</Text>
              <Text style={[styles.badge, { color: STATUS_COLOR[item.status], borderColor: STATUS_COLOR[item.status] }]}>
                {STATUS_LABEL[item.status]}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowNote: { color: colors.muted, fontSize: 11, marginTop: 2, fontStyle: "italic" },
  rowAmount: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  badge: { fontSize: 10, fontWeight: "700", marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1, overflow: "hidden" },
});

import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { createOrder, listProductVariants, type ShopPaymentMethod, type ShopVariant } from "../lib/api/shop";
import { getClubBankInfo, type ClubBankInfo } from "../lib/api/clubSettings";
import { useAuth } from "../context/AuthContext";
import { useCopyToast } from "../hooks/useCopyToast";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ShopPurchase">;

const METHODS: { key: ShopPaymentMethod; icon: string; title: string; sub: string }[] = [
  { key: "havale", icon: "🏦", title: "Havale/EFT", sub: "Kulübün banka hesabına aktar" },
  { key: "elden", icon: "💵", title: "Elden Ödeme", sub: "Antrenörüne/yönetime elden öde" },
];

export default function ShopPurchaseScreen({ route, navigation }: Props) {
  const { clubId } = useAuth();
  const { productId, title, price } = route.params;

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<ShopPaymentMethod | null>(null);
  const [note, setNote] = useState("");
  const [bankInfo, setBankInfo] = useState<ClubBankInfo | null>(null);
  const [bankInfoLoading, setBankInfoLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [variants, setVariants] = useState<ShopVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { copy, copiedKey } = useCopyToast();

  useEffect(() => {
    if (!clubId) { setBankInfoLoading(false); return; }
    getClubBankInfo(clubId).then(setBankInfo).finally(() => setBankInfoLoading(false));
  }, [clubId]);

  useEffect(() => {
    listProductVariants(productId).then(setVariants).finally(() => setVariantsLoading(false));
  }, [productId]);

  const colorOptions = useMemo(() => [...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))], [variants]);
  const sizeOptions = useMemo(() => [...new Set(variants.map((v) => v.size).filter((s): s is string => !!s))], [variants]);
  const matchedVariant = useMemo(
    () => variants.find((v) => (v.color ?? null) === selectedColor && (v.size ?? null) === selectedSize) ?? null,
    [variants, selectedColor, selectedSize]
  );

  const total = price * quantity;

  const handleSubmit = async () => {
    if (!selected || !matchedVariant) return;
    setSending(true);
    try {
      await createOrder(
        {
          product_id: productId,
          variant_id: matchedVariant.id,
          quantity,
          payment_method: selected,
          note: note.trim() || null,
        },
        title
      );
      Alert.alert(
        "Sipariş Alındı",
        "Siparişin kulüp yönetimine iletildi. Ödemen kontrol edildikten sonra durumu güncellenecek.",
        [{ text: "Tamam", onPress: () => navigation.navigate("MyShopOrders") }]
      );
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Sipariş oluşturulamadı", [{ text: "Tamam" }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{title}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity((q) => q + 1)}>
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.summaryAmount}>{total.toLocaleString("tr-TR")} ₺</Text>
      </View>

      {variantsLoading ? (
        <ActivityIndicator color={colors.yellow} style={{ marginBottom: spacing.lg }} />
      ) : (
        <>
          {colorOptions.length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.label}>Renk *</Text>
              <View style={styles.optionRow}>
                {colorOptions.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.optionChip, selectedColor === c && styles.optionChipActive]}
                    onPress={() => setSelectedColor(c)}
                  >
                    <Text style={[styles.optionChipText, selectedColor === c && styles.optionChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {sizeOptions.length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.label}>Beden *</Text>
              <View style={styles.optionRow}>
                {sizeOptions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.optionChip, selectedSize === s && styles.optionChipActive]}
                    onPress={() => setSelectedSize(s)}
                  >
                    <Text style={[styles.optionChipText, selectedSize === s && styles.optionChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      <Text style={styles.label}>Not (isteğe bağlı)</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={note}
        onChangeText={setNote}
        placeholder="Örn. beden, hangi sporcu için vb."
        placeholderTextColor={colors.muted}
        multiline
      />

      <Text style={styles.sectionLabel}>Ödeme Yöntemi Seç</Text>
      {METHODS.map((m) => {
        const active = selected === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            style={[styles.methodCard, active && styles.methodCardActive]}
            onPress={() => setSelected(m.key)}
          >
            <Text style={styles.methodIcon}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>{m.title}</Text>
              <Text style={styles.methodSub}>{m.sub}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {selected === "havale" && (
        <View style={styles.detailBox}>
          {bankInfoLoading ? (
            <ActivityIndicator color={colors.yellow} />
          ) : bankInfo?.bankAccountName || bankInfo?.bankIban ? (
            <View style={{ alignSelf: "stretch", marginBottom: spacing.md }}>
              {bankInfo.bankAccountName && (
                <View style={styles.bankFieldBlock}>
                  <Text style={styles.bankFieldLabel}>Hesap Sahibi</Text>
                  <View style={styles.bankFieldRow}>
                    <Text style={styles.bankFieldValue}>{bankInfo.bankAccountName}</Text>
                    <View style={styles.copyAnchor}>
                      {copiedKey === "name" && (
                        <View style={styles.copiedLabel} pointerEvents="none">
                          <Text style={styles.copiedLabelText} numberOfLines={1}>Kopyalandı</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.copyButton} onPress={() => copy("name", bankInfo.bankAccountName!)}>
                        <Text style={styles.copyIcon}>📋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              {bankInfo.bankIban && (
                <View style={styles.bankFieldBlock}>
                  <Text style={styles.bankFieldLabel}>IBAN</Text>
                  <View style={styles.bankFieldRow}>
                    <Text style={styles.bankFieldValue}>{bankInfo.bankIban}</Text>
                    <View style={styles.copyAnchor}>
                      {copiedKey === "iban" && (
                        <View style={styles.copiedLabel} pointerEvents="none">
                          <Text style={styles.copiedLabelText} numberOfLines={1}>Kopyalandı</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.copyButton} onPress={() => copy("iban", bankInfo.bankIban!)}>
                        <Text style={styles.copyIcon}>📋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noInfoText}>Kulübün banka bilgisi henüz girilmemiş — yönetimle iletişime geç.</Text>
          )}
          <TouchableOpacity
            style={[styles.submitButton, !matchedVariant && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={sending || !matchedVariant}
          >
            {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.submitButtonText}>Siparişi Onayla</Text>}
          </TouchableOpacity>
        </View>
      )}

      {selected === "elden" && (
        <View style={styles.detailBox}>
          <Text style={styles.noInfoText}>Tutarı antrenörüne veya kulüp yönetimine elden teslim edebilirsin.</Text>
          <TouchableOpacity
            style={[styles.submitButton, !matchedVariant && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={sending || !matchedVariant}
          >
            {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.submitButtonText}>Siparişi Onayla</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  summaryCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.lg,
  },
  summaryLabel: { color: colors.ink, fontSize: 15, fontWeight: "700", marginBottom: spacing.sm },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  qtyButton: {
    width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  qtyButtonText: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  qtyValue: { color: colors.ink, fontSize: 16, fontWeight: "700", minWidth: 24, textAlign: "center" },
  summaryAmount: { color: colors.yellow, fontSize: 24, fontWeight: "800" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.lg,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: "top" },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: spacing.sm },
  methodCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  methodCardActive: { borderColor: colors.yellow },
  methodIcon: { fontSize: 26 },
  methodTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  methodSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  detailBox: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm, alignItems: "center",
  },
  bankFieldBlock: { marginBottom: spacing.sm },
  bankFieldLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  bankFieldRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  bankFieldValue: { color: colors.ink, fontSize: 14, fontWeight: "600", flex: 1 },
  copyAnchor: { position: "relative" },
  copyButton: { padding: 6 },
  copyIcon: { fontSize: 18 },
  copiedLabel: {
    position: "absolute", bottom: "100%", right: 0, marginBottom: 6, width: 88,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.ink, borderRadius: radius.sm, paddingVertical: 4,
  },
  copiedLabelText: { color: colors.bg, fontSize: 11, fontWeight: "600" },
  noInfoText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: spacing.md },
  submitButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: spacing.xl, alignItems: "center" },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.surface,
  },
  optionChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  optionChipText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  optionChipTextActive: { color: colors.bg },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getProductAdmin, createProduct, updateProduct, addProductPhoto, removeProductPhoto,
  listProductVariantsAdmin, saveProductVariants, type VariantCombo, type ShopGender,
} from "../lib/api/shop";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ShopProductForm">;

function comboKey(color: string | null, size: string | null) {
  return `${color ?? ""}|${size ?? ""}`;
}

function computeCombos(colors: string[], sizes: string[]): { color: string | null; size: string | null }[] {
  if (colors.length === 0 && sizes.length === 0) return [{ color: null, size: null }];
  if (colors.length === 0) return sizes.map((s) => ({ color: null, size: s }));
  if (sizes.length === 0) return colors.map((c) => ({ color: c, size: null }));
  return colors.flatMap((c) => sizes.map((s) => ({ color: c, size: s })));
}

const CATEGORY_OPTIONS = ["Forma", "Şort", "Eşofman", "Ayakkabı", "Çanta", "Aksesuar", "Diğer"];
const GENDER_OPTIONS: { value: ShopGender; label: string }[] = [
  { value: "kadin", label: "Kadın" },
  { value: "erkek", label: "Erkek" },
  { value: "unisex", label: "Unisex" },
];

export default function ShopProductFormScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const isNew = !productId;
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [gender, setGender] = useState<ShopGender | null>(null);
  // Ayakkabı kategorisinde "Beden" alanı anlamsız — "Numara" olarak
  // gösterip sayısal klavye açıyoruz, ayrı bir alan eklemeye gerek yok.
  const isShoeCategory = category === "Ayakkabı";
  const [photos, setPhotos] = useState<string[]>([]);
  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [variantStocks, setVariantStocks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı ürünü iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isNew) return;
      Promise.all([getProductAdmin(productId!), listProductVariantsAdmin(productId!)])
        .then(([p, variants]) => {
          setTitle(p.title);
          setDescription(p.description ?? "");
          setPrice(String(p.price));
          setCategory(p.category);
          setGender(p.gender);
          setPhotos(p.photo_urls);
          setColorOptions([...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))]);
          setSizes([...new Set(variants.map((v) => v.size).filter((s): s is string => !!s))]);
          setVariantStocks(Object.fromEntries(variants.map((v) => [comboKey(v.color, v.size), String(v.stock)])));
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [productId, isNew])
  );

  const combos = useMemo(() => computeCombos(colorOptions, sizes), [colorOptions, sizes]);

  // Renk/beden listesi değişince stok girdilerinin anahtarlarını senkronize
  // eder — yeni kombinasyonlar 0 ile başlar, kalanların girilen değeri korunur.
  useEffect(() => {
    setVariantStocks((prev) => {
      const next: Record<string, string> = {};
      for (const c of combos) {
        const k = comboKey(c.color, c.size);
        next[k] = prev[k] ?? "0";
      }
      return next;
    });
  }, [combos]);

  const addColor = () => {
    const v = colorInput.trim();
    if (!v || colorOptions.includes(v)) return;
    setColorOptions((prev) => [...prev, v]);
    setColorInput("");
  };
  const addSize = () => {
    const v = sizeInput.trim();
    if (!v || sizes.includes(v)) return;
    setSizes((prev) => [...prev, v]);
    setSizeInput("");
  };

  const displayPhotos = isNew ? localPhotos : photos;

  const pickPhoto = async () => {
    if (displayPhotos.length >= 5) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;

    if (isNew) {
      setLocalPhotos((prev) => [...prev, uri]);
      return;
    }
    setUploadingPhoto(true);
    try {
      const newUrls = await addProductPhoto(productId!, uri, photos);
      setPhotos(newUrls);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Fotoğraf yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async (url: string) => {
    if (isNew) {
      setLocalPhotos((prev) => prev.filter((u) => u !== url));
      return;
    }
    try {
      const newUrls = await removeProductPhoto(productId!, url, photos);
      setPhotos(newUrls);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Fotoğraf kaldırılamadı", [{ text: "Tamam" }]);
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    const trimmedTitle = title.trim();
    const parsedPrice = parseFloat(price.replace(",", "."));
    if (!trimmedTitle) return Alert.alert("Eksik bilgi", "Başlık zorunludur.", [{ text: "Tamam" }]);
    if (isNaN(parsedPrice) || parsedPrice < 0) return Alert.alert("Geçersiz fiyat", "Geçerli bir fiyat gir.", [{ text: "Tamam" }]);

    const variantCombos: VariantCombo[] = [];
    for (const c of combos) {
      const raw = variantStocks[comboKey(c.color, c.size)] ?? "0";
      const parsedStock = parseInt(raw, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return Alert.alert("Geçersiz stok", "Tüm seçenekler için geçerli bir stok adedi gir.", [{ text: "Tamam" }]);
      }
      variantCombos.push({ color: c.color, size: c.size, stock: parsedStock });
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const product = await createProduct({
          title: trimmedTitle, description: description.trim() || null, price: parsedPrice, category, gender,
        });
        let uploaded: string[] = [];
        for (const uri of localPhotos) {
          uploaded = await addProductPhoto(product.id, uri, uploaded);
        }
        await saveProductVariants(product.id, variantCombos);
      } else {
        await updateProduct(productId!, {
          title: trimmedTitle, description: description.trim() || null, price: parsedPrice, category, gender,
        });
        await saveProductVariants(productId!, variantCombos);
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Field label={`Fotoğraflar (${displayPhotos.length}/5)`}>
          <View style={styles.photoGrid}>
            {displayPhotos.map((url) => (
              <TouchableOpacity key={url} style={styles.photoSlot} onLongPress={() => removePhoto(url)}>
                <Image source={{ uri: url }} style={styles.photoImage} />
                <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(url)}>
                  <Text style={styles.photoRemoveText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {displayPhotos.length < 5 && (
              <TouchableOpacity style={[styles.photoSlot, styles.photoAdd]} onPress={pickPhoto} disabled={uploadingPhoto}>
                {uploadingPhoto ? <ActivityIndicator color={colors.yellow} /> : <Text style={styles.photoAddText}>+ Ekle</Text>}
              </TouchableOpacity>
            )}
          </View>
        </Field>

        <Field label="Başlık *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ürün başlığı"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Açıklama">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ürün açıklaması"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <Field label="Fiyat (₺) *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Kategori">
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.selectChip, category === c && styles.selectChipActive]}
                onPress={() => setCategory((prev) => (prev === c ? null : c))}
              >
                <Text style={[styles.selectChipText, category === c && styles.selectChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Cinsiyet">
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.selectChip, gender === g.value && styles.selectChipActive]}
                onPress={() => setGender((prev) => (prev === g.value ? null : g.value))}
              >
                <Text style={[styles.selectChipText, gender === g.value && styles.selectChipTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Renk Seçenekleri (varsa)">
          <View style={styles.chipInputRow}>
            <TextInput
              onFocus={handleFocus}
              style={[styles.input, { flex: 1 }]}
              value={colorInput}
              onChangeText={setColorInput}
              placeholder="Örn. Kırmızı"
              placeholderTextColor={colors.muted}
              onSubmitEditing={addColor}
            />
            <TouchableOpacity style={styles.chipAddButton} onPress={addColor}>
              <Text style={styles.chipAddButtonText}>+ Ekle</Text>
            </TouchableOpacity>
          </View>
          {colorOptions.length > 0 && (
            <View style={styles.chipRow}>
              {colorOptions.map((c) => (
                <TouchableOpacity key={c} style={styles.chip} onPress={() => setColorOptions((prev) => prev.filter((x) => x !== c))}>
                  <Text style={styles.chipText}>{c} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        <Field label={isShoeCategory ? "Numara Seçenekleri (varsa)" : "Beden Seçenekleri (varsa)"}>
          <View style={styles.chipInputRow}>
            <TextInput
              onFocus={handleFocus}
              style={[styles.input, { flex: 1 }]}
              value={sizeInput}
              onChangeText={setSizeInput}
              placeholder={isShoeCategory ? "Örn. 38" : "Örn. M"}
              placeholderTextColor={colors.muted}
              keyboardType={isShoeCategory ? "number-pad" : "default"}
              onSubmitEditing={addSize}
            />
            <TouchableOpacity style={styles.chipAddButton} onPress={addSize}>
              <Text style={styles.chipAddButtonText}>+ Ekle</Text>
            </TouchableOpacity>
          </View>
          {sizes.length > 0 && (
            <View style={styles.chipRow}>
              {sizes.map((s) => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => setSizes((prev) => prev.filter((x) => x !== s))}>
                  <Text style={styles.chipText}>{s} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        <Field label={combos.length > 1 ? "Stok (seçenek başına)" : "Stok Adedi *"}>
          {combos.map((c) => {
            const k = comboKey(c.color, c.size);
            const label = [c.color, c.size].filter(Boolean).join(" / ") || null;
            return (
              <View key={k} style={styles.variantStockRow}>
                {label && <Text style={styles.variantStockLabel}>{label}</Text>}
                <TextInput
                  onFocus={handleFocus}
                  style={[styles.input, styles.variantStockInput]}
                  value={variantStocks[k] ?? "0"}
                  onChangeText={(v) => setVariantStocks((prev) => ({ ...prev, [k]: v.replace(/[^0-9]/g, "") }))}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                />
              </View>
            );
          })}
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
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  inputMultiline: { minHeight: 84, textAlignVertical: "top" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoSlot: {
    width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, overflow: "hidden",
  },
  photoImage: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
  },
  photoRemoveText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  photoAdd: { alignItems: "center", justifyContent: "center" },
  photoAddText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  chipInputRow: { flexDirection: "row", gap: spacing.sm },
  chipAddButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.violet,
    borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center",
  },
  chipAddButtonText: { color: colors.violet, fontWeight: "700", fontSize: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  chip: { backgroundColor: colors.violet, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  selectChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  selectChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  selectChipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  selectChipTextActive: { color: colors.bg },
  variantStockRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  variantStockLabel: { color: colors.ink, fontSize: 13, fontWeight: "600", flex: 1 },
  variantStockInput: { width: 90, marginBottom: 0, textAlign: "center" },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

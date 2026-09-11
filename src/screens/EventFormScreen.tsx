import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getEvent, createEvent, updateEvent, addEventBanner, type EventInput, type EventType,
} from "../lib/api/events";
import BranchPickerModal from "../components/BranchPickerModal";
import DatePickerModal from "../components/DatePickerModal";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { Branch } from "../lib/api/branches";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "EventForm">;

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "etkinlik", label: "Etkinlik" },
  { value: "turnuva", label: "Turnuva" },
  { value: "kamp", label: "Kamp" },
];

const emptyForm: EventInput = {
  type: "etkinlik", title: "", description: null, branch: null, location: null,
  start_date: "", end_date: null, fee_try: 0, capacity: null, registration_deadline: null,
};

export default function EventFormScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const isNew = !eventId;
  const { scrollRef, handleFocus } = useKeyboardScroll();
  // Koordinatör kendi branşına kilitli oluşturur/düzenler — admin serbest
  // seçer veya "Kulüp Geneli" (branch=null) bırakabilir.
  const { selectedBranch, isLocked } = useBranchSelect();

  const [form, setForm] = useState<EventInput>(isLocked ? { ...emptyForm, branch: selectedBranch } : emptyForm);
  const [feeText, setFeeText] = useState("0");
  const [capacityText, setCapacityText] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [localBanner, setLocalBanner] = useState<string | null>(null);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState<"start_date" | "end_date" | "registration_deadline" | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: isNew ? "Yeni Etkinlik" : "Etkinliği Düzenle" });
  }, [isNew, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (isNew) return;
      getEvent(eventId!)
        .then((e) => {
          setForm({
            type: e.type, title: e.title, description: e.description, branch: e.branch, location: e.location,
            start_date: e.start_date, end_date: e.end_date, fee_try: e.fee_try, capacity: e.capacity,
            registration_deadline: e.registration_deadline,
          });
          setFeeText(String(e.fee_try));
          setCapacityText(e.capacity !== null ? String(e.capacity) : "");
          setBannerUrl(e.banner_url);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [eventId, isNew])
  );

  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const displayBanner = isNew ? localBanner : bannerUrl;

  const pickBanner = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;

    if (isNew) {
      setLocalBanner(uri);
      return;
    }
    setUploadingBanner(true);
    try {
      setBannerUrl(await addEventBanner(eventId!, uri));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Banner yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return Alert.alert("Eksik bilgi", "Başlık zorunludur.", [{ text: "Tamam" }]);
    if (!form.start_date) return Alert.alert("Eksik bilgi", "Başlangıç tarihi seçmelisiniz.", [{ text: "Tamam" }]);

    const parsedFee = parseFloat(feeText.replace(",", ".")) || 0;
    if (parsedFee < 0) return Alert.alert("Geçersiz ücret", "Ücret negatif olamaz.", [{ text: "Tamam" }]);
    const parsedCapacity = capacityText.trim() ? parseInt(capacityText, 10) : null;
    if (parsedCapacity !== null && (isNaN(parsedCapacity) || parsedCapacity <= 0)) {
      return Alert.alert("Geçersiz kontenjan", "Geçerli bir kontenjan adedi gir ya da boş bırak.", [{ text: "Tamam" }]);
    }

    const payload: EventInput = { ...form, title: trimmedTitle, fee_try: parsedFee, capacity: parsedCapacity };

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const created = await createEvent(payload);
        if (localBanner) await addEventBanner(created.id, localBanner);
      } else {
        await updateEvent(eventId!, payload);
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
        <Field label="Banner Görseli">
          <TouchableOpacity
            style={styles.bannerSlot}
            onPress={pickBanner}
            disabled={uploadingBanner}
            accessibilityLabel={displayBanner ? "Banner görselini değiştir" : "Banner görseli ekle"}
          >
            {uploadingBanner ? (
              <ActivityIndicator color={colors.yellow} />
            ) : displayBanner ? (
              <Image source={{ uri: displayBanner }} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <Text style={styles.bannerAddText}>+ Banner Ekle</Text>
            )}
          </TouchableOpacity>
        </Field>

        <Field label="Tür">
          <View style={styles.chipRow}>
            {TYPE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.selectChip, form.type === t.value && styles.selectChipActive]}
                onPress={() => set("type", t.value)}
              >
                <Text style={[styles.selectChipText, form.type === t.value && styles.selectChipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Başlık *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={form.title}
            onChangeText={(v) => set("title", v)}
            placeholder="Örn. Yaz Kampı 2026"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Açıklama">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, styles.inputMultiline]}
            value={form.description ?? ""}
            onChangeText={(v) => set("description", v || null)}
            placeholder="Etkinlik detayları"
            placeholderTextColor={colors.muted}
            multiline
          />
        </Field>

        <Field label="Branş">
          {isLocked ? (
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={{ color: colors.muted }}>{selectedBranch}</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <TouchableOpacity
                style={[styles.selectChip, form.branch === null && styles.selectChipActive, { alignSelf: "flex-start" }]}
                onPress={() => set("branch", null)}
              >
                <Text style={[styles.selectChipText, form.branch === null && styles.selectChipTextActive]}>Kulüp Geneli</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.input} onPress={() => setBranchPickerVisible(true)}>
                <Text style={{ color: form.branch ? colors.ink : colors.muted }}>{form.branch ?? "Belirli bir branş seç"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Field>

        <Field label="Konum">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={form.location ?? ""}
            onChangeText={(v) => set("location", v || null)}
            placeholder="Örn. Kulüp Spor Salonu"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Başlangıç Tarihi *">
          <TouchableOpacity style={styles.input} onPress={() => setDatePickerField("start_date")}>
            <Text style={{ color: form.start_date ? colors.ink : colors.muted }}>{form.start_date || "Tarih seç"}</Text>
          </TouchableOpacity>
        </Field>

        <Field label="Bitiş Tarihi (isteğe bağlı)">
          <TouchableOpacity style={styles.input} onPress={() => setDatePickerField("end_date")}>
            <Text style={{ color: form.end_date ? colors.ink : colors.muted }}>{form.end_date || "Tek günlükse boş bırak"}</Text>
          </TouchableOpacity>
        </Field>

        <Field label="Ücret (₺, 0 = ücretsiz)">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={feeText}
            onChangeText={setFeeText}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Kontenjan (isteğe bağlı)">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={capacityText}
            onChangeText={(v) => setCapacityText(v.replace(/[^0-9]/g, ""))}
            placeholder="Sınırsız"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
          />
        </Field>

        <Field label="Son Kayıt Tarihi (isteğe bağlı)">
          <TouchableOpacity style={styles.input} onPress={() => setDatePickerField("registration_deadline")}>
            <Text style={{ color: form.registration_deadline ? colors.ink : colors.muted }}>
              {form.registration_deadline || "Sınırsız"}
            </Text>
          </TouchableOpacity>
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
        </TouchableOpacity>

        <BranchPickerModal
          visible={branchPickerVisible}
          selectedName={form.branch}
          onSelect={(b: Branch) => set("branch", b.name)}
          onClose={() => setBranchPickerVisible(false)}
        />
        <DatePickerModal
          visible={datePickerField !== null}
          selectedDate={datePickerField ? (form[datePickerField] as string | null) : null}
          onSelect={(d: string) => datePickerField && set(datePickerField, d)}
          onClose={() => setDatePickerField(null)}
        />
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
  inputDisabled: { justifyContent: "center" },
  inputMultiline: { minHeight: 84, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  selectChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  selectChipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  selectChipTextActive: { color: colors.bg },
  bannerSlot: {
    width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  bannerImage: { width: "100%", height: "100%" },
  bannerAddText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

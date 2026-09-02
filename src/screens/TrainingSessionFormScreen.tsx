import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getSession, createSession, updateSession, deleteSession, type TrainingSessionInput,
} from "../lib/api/trainingSessions";
import type { Group } from "../lib/api/groups";
import { listGroups } from "../lib/api/groups";
import type { Venue } from "../lib/api/venues";
import GroupPickerModal from "../components/GroupPickerModal";
import VenuePickerModal from "../components/VenuePickerModal";
import DatePickerModal from "../components/DatePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useAuth } from "../context/AuthContext";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";

// "SS:DD" formatında, saat 00-23 ve dakika 00-59 aralığında mı kontrol eder
// — aksi halde veritabanı "time" alanı (ör. 24:30) ham bir hata fırlatırdı.
function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

// Kullanıcı sadece rakam yazsın diye ":" işaretini otomatik ekler (ör.
// "2330" -> "23:30"). Her tuş vuruşunda ham rakamlardan yeniden kurulduğu
// için geri silme de doğal çalışır.
function formatTimeInput(text: string): string {
  const digits = text.replace(/[^0-9]/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

type Props = NativeStackScreenProps<HomeStackParamList, "TrainingSessionForm">;

const emptyForm: TrainingSessionInput = {
  group_id: "",
  venue_id: null,
  session_date: "",
  start_time: "",
  end_time: "",
  topic: null,
  notes: null,
};

export default function TrainingSessionFormScreen({ route, navigation }: Props) {
  const sessionId = route.params?.sessionId;
  const isEdit = !!sessionId;
  const { role } = useAuth();
  const isCoach = role === "coach";
  const { scrollRef, handleFocus } = useKeyboardScroll();

  const [form, setForm] = useState<TrainingSessionInput>(emptyForm);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const [venuePickerVisible, setVenuePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [myGroupIds, setMyGroupIds] = useState<string[] | undefined>(undefined);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı antrenmanı iki
  // kez oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? "Antrenmanı Düzenle" : "Yeni Antrenman" });
  }, [isEdit, navigation]);

  // Antrenör yalnızca kendi grupları için antrenman oluşturabilsin —
  // grup seçiciyi bu id'lerle sınırlıyoruz.
  useEffect(() => {
    if (!isCoach) return;
    getMyCoachedGroupIds().then(setMyGroupIds).catch(() => setMyGroupIds([]));
  }, [isCoach]);

  // Salon seçilince Grup seçiciyi o salona atanmış gruplarla sınırlamak
  // için tüm grupları (venue_id bilgisiyle) bir kere çekiyoruz.
  useEffect(() => {
    listGroups().then(setAllGroups).catch(() => setAllGroups([]));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId)
      .then((s) => {
        setForm({
          group_id: s.group_id,
          venue_id: s.venue_id,
          session_date: s.session_date,
          start_time: s.start_time.slice(0, 5),
          end_time: s.end_time.slice(0, 5),
          topic: s.topic,
          notes: s.notes,
        });
        setGroupName(s.groups?.name ?? null);
        setVenueName(s.venues?.name ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const set = <K extends keyof TrainingSessionInput>(key: K, value: TrainingSessionInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleGroupSelect = (g: Group) => {
    set("group_id", g.id);
    setGroupName(g.name);
  };

  const handleVenueSelect = (v: Venue) => {
    set("venue_id", v.id);
    setVenueName(v.name);
    // Salon değiştiğinde, seçili grup artık bu salona ait değilse
    // seçimi temizle — yanlışlıkla uyumsuz bir grup+salon kalmasın.
    const stillValid = allGroups.find((g) => g.id === form.group_id)?.venue_id === v.id;
    if (form.group_id && !stillValid) {
      set("group_id", "");
      setGroupName(null);
    }
  };

  // Grup seçici: Antrenör'de kendi grupları, ayrıca bir salon seçildiyse
  // (ve o salona atanmış en az bir grup varsa) sadece o salonun
  // gruplarıyla sınırlanır. Salona atanmış hiç grup yoksa (ör. o grup
  // hiç salon ataması yapılmamışsa) filtre uygulanmaz — tüm gruplar görünür.
  const venueGroupIds = form.venue_id
    ? allGroups.filter((g) => g.venue_id === form.venue_id).map((g) => g.id)
    : undefined;
  const groupAllowedIds =
    isCoach && venueGroupIds
      ? (myGroupIds ?? []).filter((id) => venueGroupIds.includes(id))
      : isCoach
      ? myGroupIds
      : venueGroupIds && venueGroupIds.length > 0
      ? venueGroupIds
      : undefined;

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.group_id) return Alert.alert("Eksik bilgi", "Grup seçmelisiniz.", [{ text: "Tamam" }]);
    if (!form.session_date.trim()) return Alert.alert("Eksik bilgi", "Tarih girmelisiniz (YYYY-AA-GG).", [{ text: "Tamam" }]);
    if (!form.start_time.trim() || !form.end_time.trim())
      return Alert.alert("Eksik bilgi", "Başlangıç ve bitiş saati girmelisiniz (SS:DD).", [{ text: "Tamam" }]);
    if (!isValidTime(form.start_time) || !isValidTime(form.end_time))
      return Alert.alert("Geçersiz saat", "Girdiğin saat geçerli bir saat değil — saat 00-23, dakika 00-59 arasında olmalı.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && sessionId) {
        await updateSession(sessionId, form);
      } else {
        await createSession(form);
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!sessionId) return;
    Alert.alert(
      "Antrenmanı sil",
      "Bu antrenman kaydını silmek istediğinden emin misin? (Örn. yanlışlıkla oluşturulduysa.) Bu işlem geri alınamaz — varsa bu antrenmana ait yoklama ve fotoğraf kayıtları da silinir.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSession(sessionId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
      <Field label="Salon">
        <TouchableOpacity style={styles.input} onPress={() => setVenuePickerVisible(true)}>
          <Text style={{ color: venueName ? colors.ink : colors.muted }}>{venueName ?? "Salon seçilmedi"}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Önce salon seçersen, aşağıdaki grup listesi o salona atanmış gruplarla sınırlanır.</Text>
      </Field>

      <Field label="Grup *">
        <TouchableOpacity style={styles.input} onPress={() => setGroupPickerVisible(true)}>
          <Text style={{ color: groupName ? colors.ink : colors.muted }}>{groupName ?? "Grup seçilmedi"}</Text>
        </TouchableOpacity>
      </Field>

      <Field label="Tarih *">
        <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisible(true)}>
          <Text style={{ color: form.session_date ? colors.ink : colors.muted }}>
            {form.session_date || "Tarih seç"}
          </Text>
        </TouchableOpacity>
      </Field>

      <View style={styles.row}>
        <Field label="Başlangıç (SS:DD) *" style={{ flex: 1, marginRight: spacing.sm }}>
          <TextInput
            style={styles.input}
            value={form.start_time}
            onChangeText={(v) => set("start_time", formatTimeInput(v))}
            placeholder="18:00"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={5}
            onFocus={handleFocus}
          />
        </Field>
        <Field label="Bitiş (SS:DD) *" style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            value={form.end_time}
            onChangeText={(v) => set("end_time", formatTimeInput(v))}
            keyboardType="number-pad"
            maxLength={5}
            placeholder="19:30"
            placeholderTextColor={colors.muted}
            onFocus={handleFocus}
          />
        </Field>
      </View>

      <Field label="Konu">
        <TextInput
          style={styles.input}
          value={form.topic ?? ""}
          onChangeText={(v) => set("topic", v || null)}
          placeholder="Örn. Servis ve Manşet"
          placeholderTextColor={colors.muted}
          onFocus={handleFocus}
        />
      </Field>

      <Field label="Notlar">
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          value={form.notes ?? ""}
          onChangeText={(v) => set("notes", v || null)}
          multiline
          placeholderTextColor={colors.muted}
          onFocus={handleFocus}
        />
      </Field>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Antrenmanı Sil</Text>
        </TouchableOpacity>
      )}

      <GroupPickerModal
        visible={groupPickerVisible}
        selectedId={form.group_id || null}
        onSelect={handleGroupSelect}
        onClose={() => setGroupPickerVisible(false)}
        allowedIds={groupAllowedIds}
      />
      <VenuePickerModal
        visible={venuePickerVisible}
        selectedId={form.venue_id}
        onSelect={handleVenueSelect}
        onClose={() => setVenuePickerVisible(false)}
      />
      <DatePickerModal
        visible={datePickerVisible}
        selectedDate={form.session_date || null}
        onSelect={(dateKey) => set("session_date", dateKey)}
        onClose={() => setDatePickerVisible(false)}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, children, style,
}: { label: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, justifyContent: "center",
  },
  row: { flexDirection: "row" },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  deleteButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 13 },
});

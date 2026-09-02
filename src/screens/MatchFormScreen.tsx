import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getMatch, createMatch, updateMatch, deleteMatch, getMatchRoster, setMatchRoster, checkRosterConflict,
  type MatchInput, type MatchRosterEntry,
} from "../lib/api/matches";
import type { Group } from "../lib/api/groups";
import { listGroups } from "../lib/api/groups";
import { listBranches, type Branch } from "../lib/api/branches";
import GroupPickerModal from "../components/GroupPickerModal";
import BranchPickerModal from "../components/BranchPickerModal";
import DatePickerModal from "../components/DatePickerModal";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useAuth } from "../context/AuthContext";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";

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

type Props = NativeStackScreenProps<HomeStackParamList, "MatchForm">;

const emptyForm: MatchInput = {
  group_id: "", opponent_name: "", match_date: "", start_time: "", location: null, notes: null,
  our_score: null, opponent_score: null, result_note: null,
};

export default function MatchFormScreen({ route, navigation }: Props) {
  const matchId = route.params?.matchId;
  const isEdit = !!matchId;
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const { role } = useAuth();
  const isCoach = role === "coach";

  const [form, setForm] = useState<MatchInput>(emptyForm);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  // Antrenör (branş koordinatörü) sadece kendi branşı/grupları için
  // müsabaka oluşturabilsin/görebilsin — undefined = henüz yüklenmedi.
  const [myGroupIds, setMyGroupIds] = useState<string[] | undefined>(isCoach ? undefined : []);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string | null>(null);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  // Bireysel branşlarda (Yüzme, Atletizm vb.) "vs. rakip takım" kavramı
  // olmadığı için o alan formda hiç gösterilmiyor.
  const isIndividualBranch = !!branches.find((b) => b.name === selectedBranchFilter)?.is_individual;
  const [roster, setRoster] = useState<MatchRosterEntry[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true) state
  // güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu engelleyemiyor
  // — hızlı çift dokunuşta handleSave iki kez çalışıp aynı maçı iki kez
  // oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? "Müsabakayı Düzenle" : "Yeni Müsabaka" });
  }, [isEdit, navigation]);

  useEffect(() => {
    listGroups().then(setAllGroups).catch(() => {});
    listBranches().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isCoach) return;
    getMyCoachedGroupIds().then(setMyGroupIds).catch(() => setMyGroupIds([]));
  }, [isCoach]);

  // Antrenör için branş listesi kendi gruplarının branşlarıyla sınırlı —
  // pratikte tek bir branş çıkar (koordinatörün kendi branşı), o yüzden
  // yeni müsabakada elle seçmesine gerek kalmadan otomatik dolduruyoruz.
  const allowedBranchNames = useMemo(() => {
    if (!isCoach) return [];
    const ids = new Set(myGroupIds ?? []);
    return Array.from(new Set(allGroups.filter((g) => ids.has(g.id)).map((g) => g.branch)));
  }, [isCoach, myGroupIds, allGroups]);

  useEffect(() => {
    if (isEdit || !isCoach || selectedBranchFilter || allowedBranchNames.length !== 1) return;
    setSelectedBranchFilter(allowedBranchNames[0]);
  }, [isEdit, isCoach, selectedBranchFilter, allowedBranchNames]);

  const loadRoster = useCallback(async (mId: string, groupId: string) => {
    try {
      setRoster(await getMatchRoster(mId, groupId));
    } catch {
      setRoster([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!matchId) return;
      getMatch(matchId)
        .then((m) => {
          setForm({
            group_id: m.group_id, opponent_name: m.opponent_name, match_date: m.match_date,
            // DB'den "SS:DD:SS" (saniyeli) geliyor — form/doğrulama "SS:DD"
            // bekliyor, kesmezsek düzenlemeye her girişte saat alanı bozuk
            // görünüp kaydederken "geçersiz saat" hatası veriyordu.
            start_time: m.start_time.slice(0, 5), location: m.location, notes: m.notes,
            our_score: m.our_score, opponent_score: m.opponent_score, result_note: m.result_note,
          });
          setGroupName(m.groups?.name ?? null);
          setSelectedBranchFilter(m.groups?.branch ?? null);
          if (m.group_id) loadRoster(matchId, m.group_id);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [matchId, loadRoster])
  );

  const set = <K extends keyof MatchInput>(key: K, value: MatchInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleGroupSelect = (g: Group) => {
    set("group_id", g.id);
    setGroupName(g.name);
    if (matchId) loadRoster(matchId, g.id);
    else setRoster([]); // Yeni müsabakada, kaydedilmeden kadro seçilemez.
  };

  const applyRosterToggle = (athleteId: string) => {
    setRoster((prev) => prev.map((r) => (r.athlete_id === athleteId ? { ...r, selected: !r.selected } : r)));
  };

  // Bir sporcuyu kadroya EKLERKEN, aynı gün başka bir maçın kadrosunda
  // zaten olup olmadığını kontrol ediyoruz — iki yaş grubunda birden
  // oynayan müsabıklar için basit bir çakışma uyarısı (engelleyici değil,
  // sadece bilgilendirme, istersen yine de ekleyebilirsin).
  const toggleRoster = async (athleteId: string) => {
    const entry = roster.find((r) => r.athlete_id === athleteId);
    if (!entry) return;

    if (!entry.selected && matchId && form.match_date) {
      try {
        const conflict = await checkRosterConflict(athleteId, form.match_date, matchId);
        if (conflict) {
          Alert.alert(
            "Aynı güne iki maç",
            `${entry.full_name}, ${conflict.matchDate} tarihinde "${conflict.opponentName}" maçının kadrosunda da yer alıyor. Yine de bu maça da eklemek istiyor musun?`,
            [
              { text: "Vazgeç", style: "cancel" },
              { text: "Yine de Ekle", onPress: () => applyRosterToggle(athleteId) },
            ]
          );
          return;
        }
      } catch {
        // Kontrol başarısız olsa bile kadro seçimini engelleme — sadece
        // bilgilendirici bir uyarı, kritik bir doğrulama değil.
      }
    }

    applyRosterToggle(athleteId);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.group_id) return Alert.alert("Eksik bilgi", "Grup seçmelisiniz.", [{ text: "Tamam" }]);
    if (!isIndividualBranch && !form.opponent_name.trim()) {
      return Alert.alert("Eksik bilgi", "Rakip takım adı girmelisiniz.", [{ text: "Tamam" }]);
    }
    if (!form.match_date.trim()) return Alert.alert("Eksik bilgi", "Tarih girmelisiniz (YYYY-AA-GG).", [{ text: "Tamam" }]);
    if (!form.start_time.trim()) return Alert.alert("Eksik bilgi", "Saat girmelisiniz (SS:DD).", [{ text: "Tamam" }]);
    if (!isValidTime(form.start_time)) return Alert.alert("Geçersiz saat", "Girdiğin saat geçerli bir saat değil — saat 00-23, dakika 00-59 arasında olmalı.", [{ text: "Tamam" }]);

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      // Bireysel branşta "Rakip Takım" alanı hiç gösterilmiyor ama
      // opponent_name veritabanında zorunlu — otomatik bir değerle dolduruyoruz.
      const payload: MatchInput = isIndividualBranch
        ? { ...form, opponent_name: form.opponent_name.trim() || selectedBranchFilter || "Müsabaka" }
        : form;

      let savedId = matchId;
      if (isEdit && matchId) {
        await updateMatch(matchId, payload);
      } else {
        const saved = await createMatch(payload);
        savedId = saved.id;
      }
      if (savedId && roster.length > 0) {
        await setMatchRoster(savedId, roster.filter((r) => r.selected).map((r) => r.athlete_id));
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
    if (!matchId) return;
    Alert.alert(
      "Müsabakayı sil",
      "Bu müsabaka kaydını silmek istediğinden emin misin? Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMatch(matchId);
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

  const selectedCount = roster.filter((r) => r.selected).length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Field label="Branş">
          <TouchableOpacity style={styles.input} onPress={() => setBranchPickerVisible(true)}>
            <Text style={{ color: selectedBranchFilter ? colors.ink : colors.muted }}>
              {selectedBranchFilter ?? "Branş seç (aşağıdaki grup listesini daraltır)"}
            </Text>
          </TouchableOpacity>
        </Field>

        <Field label="Grup *">
          <TouchableOpacity style={styles.input} onPress={() => setGroupPickerVisible(true)}>
            <Text style={{ color: groupName ? colors.ink : colors.muted }}>{groupName ?? "Grup seç"}</Text>
          </TouchableOpacity>
        </Field>

        {!isIndividualBranch && (
          <Field label="Rakip Takım *">
            <TextInput
              onFocus={handleFocus}
              style={styles.input}
              value={form.opponent_name}
              onChangeText={(v) => set("opponent_name", v)}
              placeholder="Örn. Fenerbahçe U16"
              placeholderTextColor={colors.muted}
            />
          </Field>
        )}

        <Field label="Tarih *">
          <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisible(true)}>
            <Text style={{ color: form.match_date ? colors.ink : colors.muted }}>{form.match_date || "Tarih seç"}</Text>
          </TouchableOpacity>
        </Field>

        <Field label="Saat (SS:DD) *">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={form.start_time}
            onChangeText={(v) => set("start_time", formatTimeInput(v))}
            placeholder="14:00"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={5}
          />
        </Field>

        <Field label="Konum">
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={form.location ?? ""}
            onChangeText={(v) => set("location", v || null)}
            placeholder="Örn. Şehir Spor Salonu"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Açıklama">
          <TextInput
            onFocus={handleFocus}
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            value={form.notes ?? ""}
            onChangeText={(v) => set("notes", v || null)}
            multiline
            placeholderTextColor={colors.muted}
          />
        </Field>

        {form.group_id && (
          <Field label={`Maç Kadrosu ${roster.length > 0 ? `(${selectedCount}/${roster.length})` : ""}`}>
            {roster.length === 0 ? (
              <Text style={styles.hint}>
                {isEdit
                  ? "Bu grupta Müsabık işaretli sporcu yok — Spor Okulu sporcuları maç kadrosuna girmiyor."
                  : "Kadro seçimi, müsabaka bir kere kaydedildikten sonra açılır."}
              </Text>
            ) : (
              roster.map((r) => (
                <TouchableOpacity key={r.athlete_id} style={styles.rosterRow} onPress={() => toggleRoster(r.athlete_id)}>
                  <View style={[styles.checkbox, r.selected && styles.checkboxChecked]}>
                    {r.selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  {r.photo_url ? (
                    <Image source={{ uri: r.photo_url }} style={styles.rosterAvatarImage} />
                  ) : (
                    <View style={styles.rosterAvatar}>
                      <Text style={styles.rosterAvatarText}>{r.full_name.slice(0, 1).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.rosterName}>{r.full_name}</Text>
                </TouchableOpacity>
              ))
            )}
          </Field>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Müsabakayı Sil</Text>
          </TouchableOpacity>
        )}

        <GroupPickerModal
          visible={groupPickerVisible}
          selectedId={form.group_id}
          onSelect={handleGroupSelect}
          onClose={() => setGroupPickerVisible(false)}
          allowedIds={
            isCoach
              ? (myGroupIds ?? []).filter((id) => {
                  if (!selectedBranchFilter) return true;
                  return allGroups.find((g) => g.id === id)?.branch === selectedBranchFilter;
                })
              : selectedBranchFilter
              ? allGroups.filter((g) => g.branch === selectedBranchFilter).map((g) => g.id)
              : undefined
          }
        />
        <BranchPickerModal
          visible={branchPickerVisible}
          selectedName={selectedBranchFilter}
          allowedNames={isCoach ? allowedBranchNames : undefined}
          onSelect={(b: Branch) => {
            setSelectedBranchFilter(b.name);
            // Branş değişince, seçili grup artık bu branşa ait değilse
            // seçimi temizle — yanlış eşleşme kalmasın.
            const currentGroup = allGroups.find((g) => g.id === form.group_id);
            if (currentGroup && currentGroup.branch !== b.name) {
              set("group_id", null);
              setGroupName(null);
            }
          }}
          onClose={() => setBranchPickerVisible(false)}
        />
        <DatePickerModal
          visible={datePickerVisible}
          selectedDate={form.match_date || null}
          onSelect={(d: string) => set("match_date", d)}
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
  hint: { color: colors.muted, fontSize: 12 },
  row: { flexDirection: "row" },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  rosterRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, padding: spacing.sm, marginBottom: 6,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  checkmark: { color: colors.bg, fontWeight: "800", fontSize: 12 },
  rosterAvatar: {
    width: 30, height: 30, borderRadius: radius.full, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  rosterAvatarImage: { width: 30, height: 30, borderRadius: radius.full },
  rosterAvatarText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  rosterName: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  error: { color: colors.coral, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  deleteButton: {
    borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md,
    paddingVertical: 14, alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 13 },
});

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, Modal, FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreventRemove } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getAthlete, createAthlete, updateAthlete, uploadAthletePhoto,
  getLinkedUser, linkAthleteAccount, listUnlinkedAthleteUsers,
  getLinkedParentUser, linkParentAccount, listParentUsers,
  getAthleteExtraGroups, setAthleteExtraGroups,
  type AthleteInput, type AthleteStatus, type LinkedUser, type AthleteGroupInfo,
} from "../lib/api/athletes";
import { createPaymentPlan } from "../lib/api/paymentPlans";
import type { Group } from "../lib/api/groups";
import { listGroups } from "../lib/api/groups";
import type { Branch } from "../lib/api/branches";
import { listBranches } from "../lib/api/branches";
import GroupPickerModal from "../components/GroupPickerModal";
import BranchPickerModal from "../components/BranchPickerModal";
import LinkedAccountField from "../components/LinkedAccountField";
import BirthDateInput from "../components/BirthDateInput";
import type { HomeStackParamList } from "../navigation/HomeStack";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { formatPhoneNumber } from "../lib/phoneFormat";
type Props = NativeStackScreenProps<HomeStackParamList, "AthleteForm">;

const BLOOD_TYPE_OPTIONS = ["A Rh+", "A Rh-", "B Rh+", "B Rh-", "AB Rh+", "AB Rh-", "0 Rh+", "0 Rh-"];

const emptyForm: AthleteInput = {
  full_name: "",
  birth_date: null,
  group_id: null,
  blood_type: null,
  height_cm: null,
  weight_kg: null,
  license_no: null,
  school: null,
  jersey_size: null,
  jersey_number: null,
  status: "active",
  athlete_type: "spor_okulu",
  photo_url: null,
  parent_name: null,
  parent_phone: null,
  health_info: null,
  allergies: null,
  medications: null,
};

export default function AthleteFormScreen({ route, navigation }: Props) {
  const { scrollRef, handleFocus } = useKeyboardScroll();
  const { athleteId, groupId, groupName: initialGroupName } = route.params;
  const isEdit = !!athleteId;

  const [form, setForm] = useState<AthleteInput>({
    ...emptyForm,
    group_id: groupId ?? null,
  });
  const [groupName, setGroupName] = useState<string | null>(initialGroupName ?? null);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const [bloodTypePickerVisible, setBloodTypePickerVisible] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string | null>(null);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null); // yeni seçilen, henüz yüklenmemiş fotoğraf
  const [monthlyFee, setMonthlyFee] = useState("");
  const [feeDayOfMonth, setFeeDayOfMonth] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  // TouchableOpacity'nin disabled={saving} kontrolü, setSaving(true)
  // state güncellemesi ekrana yansıyana kadar bir sonraki dokunuşu
  // engelleyemiyor — hızlı çift dokunuşta handleSave iki kez çalışıp aynı
  // sporcuyu iki kez oluşturabiliyordu. Senkron bir ref ile anında kilitliyoruz.
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [athleteLinkedUser, setAthleteLinkedUser] = useState<LinkedUser | null>(null);
  const [parentLinkedUser, setParentLinkedUser] = useState<LinkedUser | null>(null);
  const [extraGroups, setExtraGroups] = useState<AthleteGroupInfo[]>([]);
  const [extraGroupPickerVisible, setExtraGroupPickerVisible] = useState(false);
  const [extraGroupSaving, setExtraGroupSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  // handleSave içinde setJustSaved(true) çağrısının hemen ardından aynı
  // senkron adımda navigation.goBack() çağrılıyor — ama state güncellemesi
  // henüz ekrana yansımadığı (usePreventRemove hâlâ eski hasUnsavedChanges
  // değerini kullandığı) için goBack() engellenip "Çıkmak istediğine emin
  // misin?" uyarısı yanlışlıkla çıkıyordu. Ref senkron olduğu için bu
  // yarışı kapatıyor — kaydet başarılı olduğunda uyarı hiç gösterilmiyor.
  const justSavedRef = useRef(false);

  // Yeni sporcu eklerken, form doldurulmuşken yanlışlıkla başka bir yere
  // geçilirse (geri tuşu, kaydırma hareketi, Ana Sayfa vb.) veri
  // kaybını önlemek için onay ister. Düzenleme modunda ya da kayıt az
  // önce başarıyla tamamlandıysa (justSaved) hiç sormaz.
  //
  // Not: navigation.addListener("beforeRemove", ...) yerine bilerek
  // usePreventRemove kullanıyoruz — native-stack'te beforeRemove, geri
  // KAYDIRMA hareketiyle (swipe-back) birlikte tam desteklenmiyor ve
  // "ekran native tarafta kaldırıldı ama JS state'te kalmış" hatasına
  // yol açıyor. usePreventRemove bu senaryo için React Navigation'ın
  // resmi çözümü.
  const hasUnsavedChanges =
    !isEdit && !justSaved &&
    (form.full_name.trim().length > 0 || !!form.group_id || !!photoUri || !!athleteLinkedUser || !!parentLinkedUser);

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    if (justSavedRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert(
      "Çıkmak istediğine emin misin?",
      "Girdiğin bilgiler kaydedilmeyecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Çık", style: "destructive", onPress: () => navigation.dispatch(data.action) },
      ]
    );
  });

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? "Sporcuyu Düzenle" : "Yeni Sporcu" });
  }, [isEdit, navigation]);

  useEffect(() => {
    Promise.all([listBranches(), listGroups()])
      .then(([b, g]) => {
        setBranches(b);
        setAllGroups(g);
      })
      .catch(() => {});
  }, []);

  // Düzenlemede, sporcunun mevcut grubuna göre branş filtresini bir
  // kereliğine otomatik doldur (kullanıcı sonradan değiştirirse tekrar
  // ezmiyoruz).
  useEffect(() => {
    if (!form.group_id || allGroups.length === 0 || selectedBranchFilter) return;
    const g = allGroups.find((x) => x.id === form.group_id);
    if (g) setSelectedBranchFilter(g.branch);
  }, [form.group_id, allGroups]);

  useEffect(() => {
    if (!athleteId) return;
    getAthlete(athleteId)
      .then((a) => {
        if (!a) return;
        setForm({
          full_name: a.full_name,
          birth_date: a.birth_date,
          group_id: a.group_id,
          blood_type: a.blood_type,
          height_cm: a.height_cm,
          weight_kg: a.weight_kg,
          license_no: a.license_no,
          school: a.school,
          jersey_size: a.jersey_size,
          jersey_number: a.jersey_number,
          status: a.status,
          athlete_type: a.athlete_type,
          photo_url: a.photo_url,
          parent_name: a.parent_name,
          parent_phone: a.parent_phone,
          health_info: a.health_info,
          allergies: a.allergies,
          medications: a.medications,
        });
        setGroupName(a.groups?.name ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    getLinkedUser(athleteId).then(setAthleteLinkedUser).catch(() => {});
    getLinkedParentUser(athleteId).then(setParentLinkedUser).catch(() => {});
    getAthleteExtraGroups(athleteId).then(setExtraGroups).catch(() => {});
  }, [athleteId]);

  const toggleExtraGroup = async (g: Group) => {
    if (!athleteId) return;
    const exists = extraGroups.some((eg) => eg.group_id === g.id);
    const next = exists
      ? extraGroups.filter((eg) => eg.group_id !== g.id)
      : [...extraGroups, { group_id: g.id, group_name: g.name, branch: g.branch }];
    setExtraGroupSaving(true);
    try {
      await setAthleteExtraGroups(athleteId, next.map((eg) => eg.group_id));
      setExtraGroups(next);
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Kaydedilemedi", [{ text: "Tamam" }]);
    } finally {
      setExtraGroupSaving(false);
    }
  };

  // Ek grup seçimini tek büyük yığın yerine branş branş, düzenli
  // bölümler halinde göstermek için — her branş kendi başlığı ve grup
  // kutucukları satırıyla ayrı ayrı listeleniyor.
  const otherGroupsByBranch = useMemo(() => {
    const map = new Map<string, Group[]>();
    allGroups
      .filter((g) => g.id !== form.group_id)
      .forEach((g) => {
        if (!map.has(g.branch)) map.set(g.branch, []);
        map.get(g.branch)!.push(g);
      });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "tr"));
  }, [allGroups, form.group_id]);

  const set = <K extends keyof AthleteInput>(key: K, value: AthleteInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleGroupSelect = (g: Group) => {
    set("group_id", g.id);
    setGroupName(g.name);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.full_name.trim()) {
      Alert.alert("Eksik bilgi", "Ad Soyad zorunludur.", [{ text: "Tamam" }]);
      return;
    }
    if (!form.group_id) {
      Alert.alert("Eksik bilgi", "Bir grup seçmelisin.", [{ text: "Tamam" }]);
      return;
    }
    if (!form.parent_name?.trim()) {
      Alert.alert("Eksik bilgi", "Veli Adı Soyadı zorunludur.", [{ text: "Tamam" }]);
      return;
    }
    if (!form.parent_phone?.trim()) {
      Alert.alert("Eksik bilgi", "Veli Telefon zorunludur.", [{ text: "Tamam" }]);
      return;
    }
    // Aidat alanları isteğe bağlı ama ikisi birlikte doldurulmalı.
    const feeAmount = monthlyFee.trim() ? Number(monthlyFee) : null;
    const feeDay = feeDayOfMonth.trim() ? Number(feeDayOfMonth) : null;
    if ((feeAmount && !feeDay) || (feeDay && !feeAmount)) {
      Alert.alert("Eksik bilgi", "Aidat tutarı ve günü birlikte girilmeli (ya da ikisini de boş bırak).", [{ text: "Tamam" }]);
      return;
    }
    if (feeDay && (feeDay < 1 || feeDay > 31)) {
      Alert.alert("Eksik bilgi", "Ayın günü 1 ile 31 arasında olmalı.", [{ text: "Tamam" }]);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      let saved: { id: string };
      if (isEdit && athleteId) {
        saved = await updateAthlete(athleteId, form);
      } else {
        saved = await createAthlete(form);
      }
      if (photoUri && saved?.id) {
        const url = await uploadAthletePhoto(saved.id, photoUri);
        await updateAthlete(saved.id, { photo_url: url });
      }
      // Sporcu/Veli giriş hesabı bağlantısı da (bağlama, değiştirme ya da
      // kaldırma) Kaydet'e basınca tek seferde işlenir.
      await linkAthleteAccount(saved.id, athleteLinkedUser?.id ?? null);
      await linkParentAccount(saved.id, parentLinkedUser?.id ?? null);
      // Yeni sporcu eklerken aidat tutarı girildiyse, o gün itibarıyla
      // tekrarlayan aidat planını otomatik başlat (önümüzdeki 3 ay
      // otomatik oluşur — Finans ekranındaki sistemle aynı).
      if (!isEdit && feeAmount && feeDay && saved?.id) {
        await createPaymentPlan({ athlete_id: saved.id, amount: feeAmount, day_of_month: feeDay });
      }
      justSavedRef.current = true;
      setJustSaved(true);
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

  const previewUri = photoUri ?? form.photo_url;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
      <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>+ Fotoğraf</Text>
          </View>
        )}
      </TouchableOpacity>

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

      <Field label="Ad Soyad *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.full_name}
          onChangeText={(v) => set("full_name", v)}
          placeholder="Örn. Elif Kaya"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Doğum Tarihi">
        <BirthDateInput value={form.birth_date} onChange={(iso) => set("birth_date", iso)} onFocus={handleFocus} />
      </Field>

      <View style={styles.row}>
        <Field label="Boy (cm)" style={{ flex: 1, marginRight: spacing.sm }}>
          <TextInput
          onFocus={handleFocus}
            style={styles.input}
            value={form.height_cm?.toString() ?? ""}
            onChangeText={(v) => set("height_cm", v ? Number(v) : null)}
            keyboardType="numeric"
            placeholderTextColor={colors.muted}
          />
        </Field>
        <Field label="Kilo (kg)" style={{ flex: 1 }}>
          <TextInput
          onFocus={handleFocus}
            style={styles.input}
            value={form.weight_kg?.toString() ?? ""}
            onChangeText={(v) => set("weight_kg", v ? Number(v) : null)}
            keyboardType="numeric"
            placeholderTextColor={colors.muted}
          />
        </Field>
      </View>

      <Field label="Kan Grubu">
        <TouchableOpacity style={styles.input} onPress={() => setBloodTypePickerVisible(true)}>
          <Text style={{ color: form.blood_type ? colors.ink : colors.muted }}>
            {form.blood_type ?? "Kan grubu seç"}
          </Text>
        </TouchableOpacity>
      </Field>

      <Field label="Alerjiler">
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, styles.inputMultiline]}
          value={form.allergies ?? ""}
          onChangeText={(v) => set("allergies", v || null)}
          placeholder="Örn. Fıstık, polen — yoksa boş bırak"
          placeholderTextColor={colors.muted}
          multiline
        />
      </Field>

      <Field label="Kullandığı İlaçlar">
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, styles.inputMultiline]}
          value={form.medications ?? ""}
          onChangeText={(v) => set("medications", v || null)}
          placeholder="Düzenli kullandığı bir ilaç varsa yaz"
          placeholderTextColor={colors.muted}
          multiline
        />
      </Field>

      <Field label="Sağlık Notu">
        <TextInput
          onFocus={handleFocus}
          style={[styles.input, styles.inputMultiline]}
          value={form.health_info ?? ""}
          onChangeText={(v) => set("health_info", v || null)}
          placeholder="Kronik rahatsızlık, geçmiş ameliyat vb. antrenörün bilmesi gereken bilgi"
          placeholderTextColor={colors.muted}
          multiline
        />
      </Field>

      <Field label="Okul">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.school ?? ""}
          onChangeText={(v) => set("school", v || null)}
          placeholderTextColor={colors.muted}
        />
      </Field>

      <View style={styles.row}>
        <Field label="Forma Bedeni" style={{ flex: 1, marginRight: spacing.sm }}>
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={form.jersey_size ?? ""}
            onChangeText={(v) => set("jersey_size", v || null)}
            placeholder="Örn. S, M, L"
            placeholderTextColor={colors.muted}
          />
        </Field>
        <Field label="Forma Numarası" style={{ flex: 1 }}>
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={form.jersey_number ?? ""}
            onChangeText={(v) => set("jersey_number", v || null)}
            keyboardType="numeric"
            placeholder="Örn. 10"
            placeholderTextColor={colors.muted}
          />
        </Field>
      </View>

      <Field label="Durum">
        <View style={styles.row}>
          {(["active", "passive"] as AthleteStatus[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusChip, form.status === s && styles.statusChipActive]}
              onPress={() => set("status", s)}
            >
              <Text style={[styles.statusChipText, form.status === s && styles.statusChipTextActive]}>
                {s === "active" ? "Aktif" : "Pasif"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Sporcu Tipi">
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.typeChip, form.athlete_type === "spor_okulu" && styles.typeChipActive]}
            onPress={() => set("athlete_type", "spor_okulu")}
          >
            <Text style={[styles.typeChipText, form.athlete_type === "spor_okulu" && styles.typeChipTextActive]}>
              Spor Okulu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeChip, form.athlete_type === "musabik" && styles.typeChipActiveMusabik]}
            onPress={() => set("athlete_type", "musabik")}
          >
            <Text style={[styles.typeChipText, form.athlete_type === "musabik" && styles.typeChipTextActive]}>
              🏆 Müsabık Sporcu
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionHint}>
          Yeni sporcular varsayılan olarak Spor Okulu'nda başlar. Kadroya girdiğinde Müsabık
          Sporcu'ya çevir — sadece Müsabık sporcular Maç modülünde kadroya seçilebilir.
        </Text>
      </Field>

      <View style={styles.sectionDivider}>
        <Text style={styles.sectionLabel}>Veli Bilgileri</Text>
        <Text style={styles.sectionHint}>
          Bu, sadece iletişim bilgisidir — veliye uygulama girişi vermez.
        </Text>
      </View>

      <Field label="Veli Adı Soyadı *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.parent_name ?? ""}
          onChangeText={(v) => set("parent_name", v || null)}
          placeholder="Örn. Ayşe Kaya"
          placeholderTextColor={colors.muted}
        />
      </Field>

      <Field label="Veli Telefon *">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.parent_phone ?? ""}
          onChangeText={(v) => set("parent_phone", formatPhoneNumber(v) || null)}
          placeholder="0532-123-45-67"
          keyboardType="phone-pad"
          maxLength={14}
          placeholderTextColor={colors.muted}
        />
      </Field>

      <LinkedAccountField
        title="Veli Giriş Hesabı"
        hint={
          'Yukarıdaki "Veli Adı/Telefon" sadece iletişim bilgisidir. Velinin kendi ' +
          "telefonu ya da kullanıcı adıyla giriş yapıp SADECE bu sporcunun bilgilerini " +
          "görebilmesi için buradan bağla — aynı veli hesabı birden fazla kardeşe de bağlanabilir."
        }
        inviteRole="parent"
        defaultName={form.parent_name ?? ""}
        linkedUser={parentLinkedUser}
        onUnlink={() => setParentLinkedUser(null)}
        onLinkExisting={setParentLinkedUser}
        onCreated={setParentLinkedUser}
        listExisting={listParentUsers}
        pickerTitle="Veli Hesabı Seç"
        pickerEmptyText="Henüz davet edilmiş Veli hesabı yok."
      />

      <LinkedAccountField
        title="Sporcu Giriş Hesabı"
        hint={
          "Bu sporcunun kendi telefonu ya da kullanıcı adıyla giriş yapıp kendi " +
          "Antrenman Programı / Yoklama Durumu'nu görebilmesi için buradan bağla."
        }
        inviteRole="athlete"
        defaultName={form.full_name}
        linkedUser={athleteLinkedUser}
        onUnlink={() => setAthleteLinkedUser(null)}
        onLinkExisting={setAthleteLinkedUser}
        onCreated={setAthleteLinkedUser}
        listExisting={listUnlinkedAthleteUsers}
        pickerTitle="Sporcu Hesabı Seç"
        pickerEmptyText='Bağlanmamış Sporcu hesabı yok. Yukarıdan "veya yeni hesap oluştur" ile açabilirsin.'
      />

      {isEdit && (
        <>
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>Ek Branşlar / Gruplar</Text>
            <Text style={styles.sectionHint}>
              Yukarıdaki "Grup" ana (birincil) kaydı — bu sporcu ayrıca başka
              branş/gruplara da kayıtlı olabilir (ör. hem Voleybol hem Yüzme).
            </Text>
          </View>

          {otherGroupsByBranch.map(([branch, groups]) => (
            <View key={branch} style={styles.extraBranchBlock}>
              <Text style={styles.extraBranchLabel}>{branch}</Text>
              <View style={styles.extraGroupChipsRow}>
                {groups.map((g) => {
                  const active = extraGroups.some((eg) => eg.group_id === g.id);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.extraGroupChip, active && styles.extraGroupChipActive]}
                      onPress={() => toggleExtraGroup(g)}
                      disabled={extraGroupSaving}
                    >
                      <Text style={[styles.extraGroupChipText, active && styles.extraGroupChipTextActive]}>
                        {active ? "✓ " : ""}{g.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          {otherGroupsByBranch.length === 0 && (
            <Text style={styles.sectionHint}>Başka grup bulunmuyor.</Text>
          )}
        </>
      )}

      {!isEdit && (
        <>
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>Aidat</Text>
            <Text style={styles.sectionHint}>
              Doldurursan, bu sporcu için bugünden itibaren otomatik tekrarlayan bir
              aidat planı başlar ve önümüzdeki 3 ay otomatik oluşturulur. Boş bırakırsan
              istediğin zaman Finans ekranından ayrıca ekleyebilirsin.
            </Text>
          </View>

          <View style={styles.row}>
            <Field label="Aylık Aidat (₺)" style={{ flex: 1, marginRight: spacing.sm }}>
              <TextInput
          onFocus={handleFocus}
                style={styles.input}
                value={monthlyFee}
                onChangeText={setMonthlyFee}
                keyboardType="numeric"
                placeholder="1500"
                placeholderTextColor={colors.muted}
              />
            </Field>
            <Field label="Ayın Kaçında" style={{ flex: 1 }}>
              <TextInput
          onFocus={handleFocus}
                style={styles.input}
                value={feeDayOfMonth}
                onChangeText={setFeeDayOfMonth}
                keyboardType="numeric"
                placeholder="Örn. 5"
                placeholderTextColor={colors.muted}
              />
            </Field>
          </View>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <GroupPickerModal
        visible={groupPickerVisible}
        selectedId={form.group_id}
        onSelect={handleGroupSelect}
        onClose={() => setGroupPickerVisible(false)}
        allowedIds={
          selectedBranchFilter
            ? allGroups.filter((g) => g.branch === selectedBranchFilter).map((g) => g.id)
            : undefined
        }
      />
      <BranchPickerModal
        visible={branchPickerVisible}
        selectedName={selectedBranchFilter}
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
      <Modal
        visible={bloodTypePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBloodTypePickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Kan Grubu Seç</Text>
            <FlatList
              data={BLOOD_TYPE_OPTIONS}
              keyExtractor={(bt) => bt}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalRow, form.blood_type === item && styles.modalRowSelected]}
                  onPress={() => {
                    set("blood_type", item);
                    setBloodTypePickerVisible(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setBloodTypePickerVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
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
  photoPicker: { alignSelf: "center", marginBottom: spacing.lg },
  photoPreview: { width: 96, height: 96, borderRadius: radius.full },
  photoPlaceholder: {
    width: 96, height: 96, borderRadius: radius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center",
  },
  photoPlaceholderText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, justifyContent: "center",
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  row: { flexDirection: "row" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: "70%",
  },
  modalTitle: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  modalRow: {
    paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.line, marginBottom: spacing.sm,
  },
  modalRowSelected: { borderColor: colors.yellow },
  modalRowText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  modalCloseButton: { alignItems: "center", paddingVertical: spacing.md },
  modalCloseButtonText: { color: colors.muted, fontWeight: "600" },
  statusChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm,
  },
  statusChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  statusChipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  statusChipTextActive: { color: colors.bg },
  typeChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm,
  },
  typeChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  typeChipActiveMusabik: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  typeChipText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  typeChipTextActive: { color: colors.bg },
  sectionDivider: { marginTop: spacing.sm, marginBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  sectionLabel: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  sectionHint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  extraBranchBlock: {
    marginBottom: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  extraBranchLabel: {
    color: colors.yellow, fontSize: 12, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: spacing.xs,
  },
  extraGroupChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  extraGroupChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  extraGroupChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  extraGroupChipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  extraGroupChipTextActive: { color: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  footer: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line,
  },
  saveButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

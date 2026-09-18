import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getAthlete, createAthlete, updateAthlete, uploadAthletePhoto,
  getLinkedUser, linkAthleteAccount, listUnlinkedAthleteUsers,
  getLinkedParentUser, linkParentAccount, listParentUsers,
  type AthleteInput, type AthleteStatus, type LinkedUser,
} from "../lib/api/athletes";
import { createPaymentPlan } from "../lib/api/paymentPlans";
import type { Group } from "../lib/api/groups";
import { listGroups } from "../lib/api/groups";
import type { Branch } from "../lib/api/branches";
import { listBranches, listBranchesWithFees } from "../lib/api/branches";
import GroupPickerModal from "../components/GroupPickerModal";
import BranchPickerModal from "../components/BranchPickerModal";
import LinkedAccountField from "../components/LinkedAccountField";
import BirthDateInput from "../components/BirthDateInput";
import DateMaskInput from "../components/DateMaskInput";
import { cropToSquare } from "../lib/cropToSquare";
import type { HomeStackParamList } from "../navigation/HomeStack";

import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
import { formatPhoneNumber } from "../lib/phoneFormat";
type Props = NativeStackScreenProps<HomeStackParamList, "AthleteForm">;

const emptyForm: AthleteInput = {
  full_name: "",
  birth_date: null,
  group_id: null,
  height_cm: null,
  weight_kg: null,
  license_no: null,
  school: null,
  jersey_size: null,
  jersey_number: null,
  status: "active",
  athlete_type: "spor_okulu",
  gender: null,
  photo_url: null,
  parent_name: null,
  parent_phone: null,
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
  const [branches, setBranches] = useState<Branch[]>([]);
  // Branş bazlı sabit aidat ücretleri SADECE admin'e görünür (bkz.
  // listBranchesWithFees) — koordinatör/antrenör bu ekrana erişebildiği
  // için RPC yetkisiz çağrıda hata fırlatır, o yüzden sessizce yutulur:
  // admin değilse otomatik doldurma özelliği devre dışı kalır, sporcu
  // ekleme akışı hiç etkilenmez.
  const [branchFees, setBranchFees] = useState<Record<string, number>>({});
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const isMusabikGroup = allGroups.find((g) => g.id === form.group_id)?.athlete_type === "musabik";
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string | null>(null);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null); // yeni seçilen, henüz yüklenmemiş fotoğraf
  const [monthlyFee, setMonthlyFee] = useState("");
  const [feeFirstPaymentDate, setFeeFirstPaymentDate] = useState<string | null>(null);
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
  // Edit modunda "gerçekten bir şey değişti mi" kıyaslaması için — veri
  // yüklenince (aşağıdaki Promise.all, tüm paralel istekler bitince) dolar.
  const initialSnapshotRef = useRef<string | null>(null);

  // Yeni sporcu eklerken form doldurulmuşken, ya da düzenlemede mevcut
  // kayıt fiilen değiştirilmişken yanlışlıkla başka bir yere geçilirse
  // (geri tuşu, kaydırma hareketi, Ana Sayfa vb.) veri kaybını önlemek
  // için onay ister.
  const hasUnsavedChanges = isEdit
    ? !loading &&
      initialSnapshotRef.current !== null &&
      (JSON.stringify({
        form,
        athleteLinkedUserId: athleteLinkedUser?.id ?? null,
        parentLinkedUserId: parentLinkedUser?.id ?? null,
      }) !== initialSnapshotRef.current ||
        !!photoUri)
    : form.full_name.trim().length > 0 || !!form.group_id || !!photoUri || !!athleteLinkedUser || !!parentLinkedUser;
  const { markSaved } = useUnsavedChangesGuard(navigation, hasUnsavedChanges);

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
    listBranchesWithFees()
      .then((fees) => {
        setBranchFees(
          Object.fromEntries(fees.filter((f) => f.standard_fee_try != null).map((f) => [f.name, f.standard_fee_try as number]))
        );
      })
      .catch(() => {}); // admin değilse RPC reddeder — otomatik doldurma sessizce devre dışı kalır
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
    // Üçü de PARALEL ama TEK Promise.all ile bekleniyor — hasUnsavedChanges
    // kıyaslaması için "başlangıç" anını ancak hepsi (veli/sporcu hesap
    // bağlantıları dahil) yüklendikten sonra sabitleyebiliriz, aksi halde
    // linked-user istekleri biraz geç bitince "değişti" yanlış pozitifi
    // çıkardı (bkz. eski kod: ayrı ayrı .then'lerle bu senkronizasyon yoktu).
    Promise.all([
      getAthlete(athleteId),
      getLinkedUser(athleteId).catch(() => null),
      getLinkedParentUser(athleteId).catch(() => null),
    ])
      .then(([a, linkedAthleteUser, linkedParentUser]) => {
        if (!a) return;
        const loadedForm: AthleteInput = {
          full_name: a.full_name,
          birth_date: a.birth_date,
          group_id: a.group_id,
          height_cm: a.height_cm,
          weight_kg: a.weight_kg,
          license_no: a.license_no,
          school: a.school,
          jersey_size: a.jersey_size,
          jersey_number: a.jersey_number,
          status: a.status,
          athlete_type: a.athlete_type,
          gender: a.gender,
          photo_url: a.photo_url,
          parent_name: a.parent_name,
          parent_phone: a.parent_phone,
        };
        setForm(loadedForm);
        setGroupName(a.groups?.name ?? null);
        setAthleteLinkedUser(linkedAthleteUser);
        setParentLinkedUser(linkedParentUser);
        initialSnapshotRef.current = JSON.stringify({
          form: loadedForm,
          athleteLinkedUserId: linkedAthleteUser?.id ?? null,
          parentLinkedUserId: linkedParentUser?.id ?? null,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [athleteId]);

  const set = <K extends keyof AthleteInput>(key: K, value: AthleteInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleGroupSelect = (g: Group) => {
    set("group_id", g.id);
    setGroupName(g.name);
    // Branşın sabit bir aidat ücreti varsa (bkz. StandardFeeScreen), yeni
    // sporcu eklerken aidat tutarını otomatik doldur — admin hâlâ isterse
    // değiştirebilir. Sadece YENİ kayıtta ve henüz elle bir şey
    // yazılmamışsa (mevcut sporcunun planını veya elle girilmiş bir
    // tutarı sessizce ezmemek için).
    if (!isEdit && !monthlyFee.trim() && branchFees[g.branch] != null) {
      setMonthlyFee(String(branchFees[g.branch]));
    }
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
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setPhotoUri(await cropToSquare(asset.uri, asset.width, asset.height));
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
    if ((feeAmount && !feeFirstPaymentDate) || (feeFirstPaymentDate && !feeAmount)) {
      Alert.alert("Eksik bilgi", "Aidat tutarı ve ilk ödeme tarihi birlikte girilmeli (ya da ikisini de boş bırak).", [{ text: "Tamam" }]);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      let saved: { id: string };
      // Spor Okulu grubunda forma numarası olmaz — grup sonradan değiştirilip
      // eski bir numara kalmış olabilir, kaydederken temizle.
      const payload = isMusabikGroup ? form : { ...form, jersey_number: null };
      if (isEdit && athleteId) {
        saved = await updateAthlete(athleteId, payload);
      } else {
        saved = await createAthlete(payload);
      }
      if (photoUri && saved?.id) {
        const url = await uploadAthletePhoto(saved.id, photoUri);
        await updateAthlete(saved.id, { photo_url: url });
      }
      // Sporcu/Veli giriş hesabı bağlantısı da (bağlama, değiştirme ya da
      // kaldırma) Kaydet'e basınca tek seferde işlenir.
      await linkAthleteAccount(saved.id, athleteLinkedUser?.id ?? null);
      await linkParentAccount(saved.id, parentLinkedUser?.id ?? null);
      // Yeni sporcu eklerken aidat tutarı ve ilk ödeme tarihi girildiyse,
      // o tarihten itibaren tekrarlayan aidat planını otomatik başlat
      // (önümüzdeki 3 ay otomatik oluşur — Finans ekranındaki sistemle aynı).
      // Hangi ayda başlayacağı artık seçilen TARİHTEN doğrudan belli
      // (bkz. paymentPlans.ts computeMissingRows) — eskiden "ayın kaçında"
      // bilgisinden "bu ay mı gelecek ay mı" diye tahmin ediliyordu.
      if (!isEdit && feeAmount && feeFirstPaymentDate && saved?.id) {
        await createPaymentPlan({ athlete_id: saved.id, amount: feeAmount, first_payment_date: feeFirstPaymentDate });
      }
      markSaved();
      // Yeni sporcu eklerken Sporcu Yönetimi listesine değil, doğrudan yeni
      // oluşturulan sporcunun profiline giriliyor — replace kullanılıyor ki
      // geri tuşu formu değil listeyi göstersin (kullanıcı isteği).
      if (!isEdit && saved?.id) {
        navigation.replace("AthleteDetail", { athleteId: saved.id });
      } else {
        navigation.goBack();
      }
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
      <TouchableOpacity
        style={styles.photoPicker}
        onPress={pickPhoto}
        accessibilityLabel={previewUri ? "Fotoğrafı değiştir" : "Fotoğraf seç"}
      >
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

      <Field label="Cinsiyet">
        <View style={styles.row}>
          {([
            { value: "erkek" as const, label: "Erkek" },
            { value: "kadin" as const, label: "Kız" },
          ]).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.statusChip, form.gender === opt.value && styles.statusChipActive]}
              onPress={() => set("gender", form.gender === opt.value ? null : opt.value)}
            >
              <Text style={[styles.statusChipText, form.gender === opt.value && styles.statusChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

      <Field label="Okul">
        <TextInput
          onFocus={handleFocus}
          style={styles.input}
          value={form.school ?? ""}
          onChangeText={(v) => set("school", v || null)}
          placeholderTextColor={colors.muted}
        />
      </Field>

      {/* Forma numarası sadece Müsabık sporcu gruplarında anlamlı (kullanıcı
          isteği) — Spor Okulu gruplarında hiç gösterilmiyor. Forma bedeni
          (üniforma) ikisinde de var. */}
      <View style={styles.row}>
        <Field label="Forma Bedeni" style={{ flex: 1, marginRight: isMusabikGroup ? spacing.sm : 0 }}>
          <TextInput
            onFocus={handleFocus}
            style={styles.input}
            value={form.jersey_size ?? ""}
            onChangeText={(v) => set("jersey_size", v || null)}
            placeholder="Örn. S, M, L"
            placeholderTextColor={colors.muted}
          />
        </Field>
        {isMusabikGroup && (
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
        )}
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
        {(() => {
          const group = allGroups.find((g) => g.id === form.group_id);
          if (!group) {
            return <Text style={styles.sectionHint}>Grup seçilince otomatik belirlenir.</Text>;
          }
          return (
            <View style={[styles.typeChip, group.athlete_type === "musabik" ? styles.typeChipActiveMusabik : styles.typeChipActive]}>
              <Text style={[styles.typeChipText, styles.typeChipTextActive]}>
                {group.athlete_type === "musabik" ? "🏆 Müsabık Sporcu" : "Spor Okulu"}
              </Text>
            </View>
          );
        })()}
        <Text style={styles.sectionHint}>
          Sporcu tipi, seçtiğin gruba göre otomatik belirlenir — sadece Müsabık sporcular Maç
          modülünde kadroya seçilebilir. Değiştirmek için grubun tipini (Grup Ayarları'ndan) güncelle.
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
          "Takvim / Yoklama Durumu'nu görebilmesi için buradan bağla."
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

      {!isEdit && (
        <>
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>Aidat</Text>
            <Text style={styles.sectionHint}>
              Doldurursan, bu sporcu için seçtiğin ilk ödeme tarihinden itibaren
              otomatik tekrarlayan bir aidat planı başlar ve önümüzdeki 3 ay otomatik
              oluşturulur. Boş bırakırsan istediğin zaman Finans ekranından ayrıca
              ekleyebilirsin.
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
            <Field label="İlk Ödeme Tarihi" style={{ flex: 1 }}>
              <DateMaskInput value={feeFirstPaymentDate} onChange={setFeeFirstPaymentDate} onFocus={handleFocus} />
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

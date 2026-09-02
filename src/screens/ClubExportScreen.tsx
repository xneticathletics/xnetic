import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllAthletes } from "../lib/api/athletes";
import { listCoaches } from "../lib/api/coaches";
import { listGroups } from "../lib/api/groups";
import { listBranches } from "../lib/api/branches";
import { listVenues } from "../lib/api/venues";

const STATUS_LABEL: Record<string, string> = { active: "Aktif", passive: "Pasif" };
const TYPE_LABEL: Record<string, string> = { musabik: "Müsabık", spor_okulu: "Spor Okulu" };

export default function ClubExportScreen() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const [athletes, coaches, groups, branches, venues] = await Promise.all([
        listAllAthletes(),
        listCoaches(),
        listGroups(),
        listBranches(),
        listVenues(),
      ]);

      const wb = XLSX.utils.book_new();

      const athleteSheet = XLSX.utils.json_to_sheet(
        athletes.map((a) => ({
          "Adı Soyadı": a.full_name,
          "Doğum Tarihi": a.birth_date ?? "",
          Grup: a.groups?.name ?? "",
          Durum: STATUS_LABEL[a.status] ?? a.status,
          Tip: TYPE_LABEL[a.athlete_type] ?? a.athlete_type,
          "Forma No": a.jersey_number ?? "",
          "Veli Adı": a.parent_name ?? "",
          "Veli Telefon": a.parent_phone ?? "",
          "Kayıt Tarihi": a.registered_at ?? "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, athleteSheet, "Sporcular");

      const coachSheet = XLSX.utils.json_to_sheet(
        coaches.map((c) => ({
          "Adı Soyadı": c.name,
          Telefon: c.phone ?? "",
          "Doğum Tarihi": c.birth_date ?? "",
          "Öğrenim Durumu": c.education_level ?? "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, coachSheet, "Antrenörler");

      const groupSheet = XLSX.utils.json_to_sheet(
        groups.map((g) => ({ Grup: g.name, Branş: g.branch, Salon: g.venues?.name ?? "" }))
      );
      XLSX.utils.book_append_sheet(wb, groupSheet, "Gruplar");

      const branchSheet = XLSX.utils.json_to_sheet(
        branches.map((b) => ({
          Branş: b.name,
          Koordinatör: b.coordinator?.name ?? "",
          Tür: b.is_individual ? "Bireysel" : "Takım",
        }))
      );
      XLSX.utils.book_append_sheet(wb, branchSheet, "Branşlar");

      const venueSheet = XLSX.utils.json_to_sheet(
        venues.map((v) => ({ Salon: v.name, Adres: v.address ?? "", Kapasite: v.capacity ?? "" }))
      );
      XLSX.utils.book_append_sheet(wb, venueSheet, "Salonlar");

      const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const dateStamp = new Date().toISOString().slice(0, 10);
      const fileUri = `${FileSystem.cacheDirectory}kulup-bilgileri-${dateStamp}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Kulüp Bilgilerini Kaydet",
        });
      } else {
        Alert.alert("Hazır", `Dosya oluşturuldu: ${fileUri}`, [{ text: "Tamam" }]);
      }
    } catch (e: any) {
      setError(e.message ?? "Dışa aktarılamadı");
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Kulübünüzün sporcu, antrenör, grup, branş ve salon bilgilerini tek bir Excel dosyası olarak indirin —
        her biri ayrı bir sayfada. Aidat/sipariş gibi finansal veriler bu dosyaya dahil değildir.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.exportButton} onPress={handleExport} disabled={exporting}>
        {exporting ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.exportButtonText}>📤 Excel Olarak Dışa Aktar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md },
  exportButton: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  exportButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

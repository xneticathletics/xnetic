import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listBranches, type Branch } from "../lib/api/branches";
import { bulkCreateAthletes } from "../lib/api/athletes";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteBulkImport">;

type ParsedRow = {
  fullName: string;
  rawBranch: string | null;
  matchedBranch: string | null;
  branchNotFound: boolean;
};

const NAME_HEADER = "Adı Soyadı";
const BRANCH_HEADER = "Branşı";

export default function AthleteBulkImportScreen({ navigation }: Props) {
  useHomeButton(navigation);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listBranches().then(setBranches).catch(() => {});
    }, [])
  );

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const wsData = [[NAME_HEADER, BRANCH_HEADER], ["Örn. Elif Kaya", branches[0]?.name ?? "Örn. Voleybol"]];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 28 }, { wch: 20 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sporcular");

      if (branches.length > 0) {
        const branchSheet = XLSX.utils.aoa_to_sheet([["Geçerli Branşlar"], ...branches.map((b) => [b.name])]);
        XLSX.utils.book_append_sheet(wb, branchSheet, "Branşlar");
      }

      const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const fileUri = `${FileSystem.cacheDirectory}sporcu-sablonu.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Sporcu Şablonunu Kaydet",
        });
      } else {
        Alert.alert("Hazır", `Şablon oluşturuldu: ${fileUri}`, [{ text: "Tamam" }]);
      }
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Şablon oluşturulamadı", [{ text: "Tamam" }]);
    } finally {
      setDownloading(false);
    }
  };

  const matchBranch = (raw: string | null): { matched: string | null; notFound: boolean } => {
    if (!raw || !raw.trim()) return { matched: null, notFound: false };
    const found = branches.find((b) => b.name.trim().toLowerCase() === raw.trim().toLowerCase());
    return found ? { matched: found.name, notFound: false } : { matched: null, notFound: true };
  };

  const handlePickFile = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setFileName(asset.name);
    setRows([]);
    setParsing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const wb = XLSX.read(base64, { type: "base64" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const parsed: ParsedRow[] = json
        .map((r) => {
          const fullName = String(r[NAME_HEADER] ?? "").trim();
          const rawBranch = String(r[BRANCH_HEADER] ?? "").trim() || null;
          const { matched, notFound } = matchBranch(rawBranch);
          return { fullName, rawBranch, matchedBranch: matched, branchNotFound: notFound };
        })
        .filter((r) => r.fullName.length > 0);

      if (parsed.length === 0) {
        setError(`Dosyada "${NAME_HEADER}" sütununda geçerli isim bulunamadı.`);
      }
      setRows(parsed);
    } catch (e: any) {
      setError(e.message ?? "Dosya okunamadı — geçerli bir .xlsx dosyası olduğundan emin ol.");
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const count = await bulkCreateAthletes(
        rows.map((r) => ({ full_name: r.fullName, branch: r.matchedBranch }))
      );
      Alert.alert(
        "İçe Aktarıldı",
        `${count} sporcu eklendi. Grup atamalarını Sporcu Yönetimi'nden koordinatör/admin yapabilir.`,
        [{ text: "Tamam", onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "İçe aktarılamadı", [{ text: "Tamam" }]);
    } finally {
      setImporting(false);
    }
  };

  const notFoundCount = rows.filter((r) => r.branchNotFound).length;

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Şablonu indir, "Adı Soyadı" ve "Branşı" sütunlarını doldur, sonra buradan yükle. Diğer bilgileri
        (boy, kilo, veli bilgisi vb.) sporcunun kendisi ya da admin sonradan tamamlar. Grup ataması
        koordinatör/admin tarafından ayrıca yapılır.
      </Text>

      <TouchableOpacity style={styles.templateButton} onPress={handleDownloadTemplate} disabled={downloading}>
        {downloading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.templateButtonText}>📥 Şablonu İndir</Text>}
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Doldurulmuş Dosyayı Yükle</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={handlePickFile} disabled={parsing}>
        {parsing ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.uploadButtonText}>📤 Dosya Seç</Text>}
      </TouchableOpacity>
      {!!fileName && <Text style={styles.fileName}>{fileName}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {rows.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>
            Önizleme ({rows.length} sporcu{notFoundCount > 0 ? `, ${notFoundCount} branş eşleşmedi` : ""})
          </Text>
          <FlatList
            data={rows}
            keyExtractor={(_, i) => String(i)}
            style={{ maxHeight: 260 }}
            renderItem={({ item }) => (
              <View style={styles.previewRow}>
                <Text style={styles.previewName}>{item.fullName}</Text>
                {item.matchedBranch ? (
                  <Text style={styles.previewBranchOk}>{item.matchedBranch}</Text>
                ) : item.branchNotFound ? (
                  <Text style={styles.previewBranchWarn}>"{item.rawBranch}" bulunamadı</Text>
                ) : (
                  <Text style={styles.previewBranchNone}>Branş yok</Text>
                )}
              </View>
            )}
          />

          <TouchableOpacity style={styles.importButton} onPress={handleImport} disabled={importing}>
            {importing ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.importButtonText}>İçe Aktar ({rows.length})</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: spacing.lg },
  templateButton: { backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  templateButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.lg },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: spacing.sm },
  uploadButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingVertical: 14, alignItems: "center",
  },
  uploadButtonText: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  fileName: { color: colors.muted, fontSize: 12, marginTop: spacing.sm, textAlign: "center" },
  errorText: { color: colors.coral, marginTop: spacing.sm, textAlign: "center" },
  previewRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  previewName: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  previewBranchOk: { color: colors.teal, fontSize: 12, fontWeight: "700" },
  previewBranchWarn: { color: colors.coral, fontSize: 11, fontWeight: "600" },
  previewBranchNone: { color: colors.muted, fontSize: 11 },
  importButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.md },
  importButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

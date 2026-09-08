import React, { useCallback, useState, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert,
  Modal, ScrollView, Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listSessionMedia, uploadSessionPhoto, deleteSessionMedia, type SessionMedia } from "../lib/api/sessionMedia";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SessionMedia">;

const screenWidth = Dimensions.get("window").width;

export default function SessionMediaScreen({ route }: Props) {
  const { sessionId, label, canManagePhotos } = route.params;
  const { role } = useAuth();
  // Veli sadece görüntüler — RLS zaten yüklemeye izin vermiyor, buton
  // gösterip başarısız bir yükleme denemesi yaşatmamak için baştan gizli.
  const canUpload = role !== "parent";

  const [media, setMedia] = useState<SessionMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Ana Sayfa'ya her dönüşte yükleniyor göstergesi/sayfa kaymaması için sadece İLK yüklemede gösterilecek.
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setMedia(await listSessionMedia(sessionId));
    } catch (e: any) {
      setError(e.message ?? "Fotoğraflar yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const handleAddPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf eklemek için galeri erişim izni vermelisin.", [{ text: "Tamam" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploading(true);
    setError(null);
    try {
      await uploadSessionPhoto(sessionId, result.assets[0].uri);
      load();
    } catch (e: any) {
      setError(e.message ?? "Yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (item: SessionMedia) => {
    setDownloading(true);
    try {
      const ext = item.storage_path.split(".").pop()?.split("?")[0] || "jpg";
      const localUri = FileSystem.cacheDirectory + `antrenman-fotografi-${item.id}.${ext}`;
      const { uri } = await FileSystem.downloadAsync(item.media_url, localUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "İndirilemedi", [{ text: "Tamam" }]);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = (item: SessionMedia) => {
    Alert.alert("Fotoğrafı sil", "Bu fotoğraf kalıcı olarak silinecek. Emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteSessionMedia(item);
            setViewerIndex(null);
            load();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{label ?? "Antrenman Fotoğrafları"}</Text>
        {canUpload && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto} disabled={uploading}>
            {uploading ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.addButtonText}>+ Fotoğraf</Text>}
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.hint}>Fotoğraflar yüklendikten 2 hafta sonra otomatik olarak silinir.</Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={media}
        keyExtractor={(m) => m.id}
        numColumns={3}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        columnWrapperStyle={{ gap: spacing.sm }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz fotoğraf eklenmemiş.</Text> : null}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => setViewerIndex(index)}>
            <Image source={{ uri: item.media_url }} style={styles.thumb} />
          </TouchableOpacity>
        )}
      />

      <Modal visible={viewerIndex !== null} animationType="fade" transparent={false} onRequestClose={() => setViewerIndex(null)}>
        <View style={styles.viewerContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (viewerIndex ?? 0) * screenWidth, y: 0 }}
            onMomentumScrollEnd={(e) => setViewerIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
          >
            {media.map((item) => (
              <View key={item.id} style={{ width: screenWidth, alignItems: "center", justifyContent: "center" }}>
                <Image source={{ uri: item.media_url }} style={styles.fullImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>

          <View style={styles.viewerFooter}>
            <TouchableOpacity style={styles.viewerButton} onPress={() => setViewerIndex(null)}>
              <Text style={styles.viewerButtonText}>Kapat</Text>
            </TouchableOpacity>
            {viewerIndex !== null && media[viewerIndex] && (
              <>
                <TouchableOpacity
                  style={styles.viewerButton}
                  onPress={() => handleDownload(media[viewerIndex])}
                  disabled={downloading}
                >
                  {downloading ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.viewerButtonText}>⬇ İndir</Text>}
                </TouchableOpacity>
                {canManagePhotos && (
                  <TouchableOpacity
                    style={[styles.viewerButton, styles.viewerDeleteButton]}
                    onPress={() => handleDelete(media[viewerIndex])}
                    disabled={deleting}
                  >
                    {deleting ? <ActivityIndicator color={colors.coral} /> : <Text style={styles.viewerDeleteButtonText}>🗑 Sil</Text>}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, paddingBottom: spacing.xs },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", flexShrink: 1 },
  hint: { color: colors.muted, fontSize: 11, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  thumb: { width: (screenWidth - spacing.lg * 2 - spacing.sm * 2) / 3, aspectRatio: 1, borderRadius: radius.sm, marginBottom: spacing.sm, backgroundColor: colors.surface },
  viewerContainer: { flex: 1, backgroundColor: "#000" },
  fullImage: { width: screenWidth, height: "100%" },
  viewerFooter: {
    flexDirection: "row", justifyContent: "center", gap: spacing.md,
    paddingVertical: spacing.md, paddingBottom: spacing.xl, backgroundColor: "rgba(0,0,0,0.6)",
  },
  viewerButton: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: 12, backgroundColor: colors.surface,
  },
  viewerButtonText: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  viewerDeleteButton: { borderColor: colors.coral },
  viewerDeleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 13 },
});

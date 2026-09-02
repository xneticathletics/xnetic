import React, { useCallback, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listSessionMedia, uploadSessionPhoto, type SessionMedia } from "../lib/api/sessionMedia";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SessionMedia">;

export default function SessionMediaScreen({ route }: Props) {
  const { sessionId, label } = route.params;

  const [media, setMedia] = useState<SessionMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{label ?? "Antrenman Fotoğrafları"}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto} disabled={uploading}>
          {uploading ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.addButtonText}>+ Fotoğraf</Text>}
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={media}
        keyExtractor={(m) => m.id}
        numColumns={3}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        columnWrapperStyle={{ gap: spacing.sm }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz fotoğraf eklenmemiş.</Text> : null}
        renderItem={({ item }) => (
          <Image source={{ uri: item.media_url }} style={styles.thumb} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", flexShrink: 1 },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  error: { color: colors.coral, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  thumb: { width: "31%", aspectRatio: 1, borderRadius: radius.sm, marginBottom: spacing.sm, backgroundColor: colors.surface },
});

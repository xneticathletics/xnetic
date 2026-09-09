import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert,
  Modal, ScrollView, Dimensions,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  listSocialFeed, listPendingSocialPosts, approveSocialPost, deleteSocialPost, type SocialPost,
} from "../lib/api/socialPosts";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SocialFeed">;
type Tab = "feed" | "pending";

const screenWidth = Dimensions.get("window").width;

export default function SocialFeedScreen({ route, navigation }: Props) {
  const { role } = useAuth();
  // Herhangi bir antrenör (sadece koordinatör değil) branşındaki bekleyen
  // paylaşımları onaylayabilir — bkz. is_branch_moderator RLS helper'ı.
  const canModerate = role === "coach" || role === "club_admin";

  const [tab, setTab] = useState<Tab>(route.params?.initialTab === "pending" && canModerate ? "pending" : "feed");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPosts(tab === "pending" ? await listPendingSocialPosts() : await listSocialFeed());
    } catch (e: any) {
      setError(e.message ?? "Paylaşımlar yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const handleApprove = (post: SocialPost) => {
    setApproving(true);
    approveSocialPost(post.id)
      .then(() => {
        setViewerIndex(null);
        load();
      })
      .catch((e: any) => Alert.alert("Hata", e.message ?? "Onaylanamadı", [{ text: "Tamam" }]))
      .finally(() => setApproving(false));
  };

  const handleDelete = (post: SocialPost) => {
    Alert.alert("Paylaşımı sil", "Bu paylaşım kalıcı olarak silinecek. Emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteSocialPost(post);
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
        <Text style={styles.title}>Sosyal Alan</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("SocialPostForm")}>
          <Text style={styles.addButtonText}>+ Paylaş</Text>
        </TouchableOpacity>
      </View>

      {canModerate && (
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabButton, tab === "feed" && styles.tabButtonActive]} onPress={() => setTab("feed")}>
            <Text style={[styles.tabButtonText, tab === "feed" && styles.tabButtonTextActive]}>Akış</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, tab === "pending" && styles.tabButtonActive]} onPress={() => setTab("pending")}>
            <Text style={[styles.tabButtonText, tab === "pending" && styles.tabButtonTextActive]}>Onay Bekleyenler</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.hint}>Fotoğraf ve videolar yüklendikten 2 hafta sonra otomatik olarak silinir.</Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        numColumns={3}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        columnWrapperStyle={{ gap: spacing.sm }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>{tab === "pending" ? "Onay bekleyen paylaşım yok." : "Henüz paylaşım yapılmamış."}</Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => setViewerIndex(index)}>
            {item.media_type === "photo" ? (
              <Image source={{ uri: item.media_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.videoThumb]}>
                <Text style={styles.videoThumbIcon}>▶</Text>
              </View>
            )}
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
            onMomentumScrollEnd={(e) => {
              // Bir sayfa geçişinin momentum'u hâlâ sönümlenirken "Kapat"a
              // basılırsa, bu olay kapatmadan SONRA gecikmeli tetiklenip
              // viewerIndex'i tekrar dolduruyor ve görüntüleyici kapanır
              // kapanmaz yeniden açılıyordu. Zaten kapatılmışsa (null)
              // gecikmeli olayı yok sayıyoruz.
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setViewerIndex((current) => (current === null ? null : newIndex));
            }}
          >
            {posts.map((item, index) => (
              <ViewerPage key={item.id} post={item} active={index === viewerIndex} />
            ))}
          </ScrollView>

          <View style={styles.viewerFooter}>
            <TouchableOpacity style={styles.viewerButton} onPress={() => setViewerIndex(null)}>
              <Text style={styles.viewerButtonText}>Kapat</Text>
            </TouchableOpacity>
            {viewerIndex !== null && posts[viewerIndex] && (
              <>
                {posts[viewerIndex].status === "pending" && canModerate && (
                  <TouchableOpacity style={styles.viewerButton} onPress={() => handleApprove(posts[viewerIndex])} disabled={approving}>
                    {approving ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.viewerButtonText}>✓ Onayla</Text>}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.viewerButton, styles.viewerDeleteButton]}
                  onPress={() => handleDelete(posts[viewerIndex])}
                  disabled={deleting}
                >
                  {deleting ? <ActivityIndicator color={colors.coral} /> : <Text style={styles.viewerDeleteButtonText}>🗑 Sil</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Tam ekran görüntüleyicideki tek bir sayfa — foto için <Image>, video
// için useVideoPlayer/<VideoView>. Player SADECE aktif sayfa için
// oluşturulur (tüm liste için değil), aksi halde paging listesindeki her
// video aynı anda bir player'a bağlanmaya çalışırdı.
function ViewerPage({ post, active }: { post: SocialPost; active: boolean }) {
  if (post.media_type === "photo") {
    return (
      <View style={styles.viewerPage}>
        <Image source={{ uri: post.media_url }} style={styles.fullImage} resizeMode="contain" />
      </View>
    );
  }
  return <VideoViewerPage uri={post.media_url} active={active} />;
}

function VideoViewerPage({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  React.useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  return (
    <View style={styles.viewerPage}>
      <VideoView style={styles.fullVideo} player={player} allowsFullscreen contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, paddingBottom: spacing.xs },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", flexShrink: 1 },
  addButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  tabRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tabButton: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8 },
  tabButtonActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  tabButtonText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  tabButtonTextActive: { color: colors.bg },
  hint: { color: colors.muted, fontSize: 11, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  error: { color: colors.coral, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  thumb: { width: (screenWidth - spacing.lg * 2 - spacing.sm * 2) / 3, aspectRatio: 1, borderRadius: radius.sm, marginBottom: spacing.sm, backgroundColor: colors.surface },
  videoThumb: { alignItems: "center", justifyContent: "center" },
  videoThumbIcon: { color: colors.ink, fontSize: 20 },
  viewerContainer: { flex: 1, backgroundColor: "#000" },
  viewerPage: { width: screenWidth, alignItems: "center", justifyContent: "center" },
  fullImage: { width: screenWidth, height: "100%" },
  fullVideo: { width: screenWidth, height: "100%" },
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

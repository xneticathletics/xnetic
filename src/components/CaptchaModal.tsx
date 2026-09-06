import React from "react";
import { Modal, View, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { colors, radius, spacing } from "../theme/tokens";

// website/public/captcha-challenge.html — Cloudflare Turnstile widget'ını
// barındıran statik sayfa, xnetic.net'e deploy edildi (website/ Vite
// projesinin public/ klasörü, SPA rewrite kuralının dışında kalıyor).
// Turnstile'ın site key'i SADECE o HTML dosyasının içinde — burada hiç
// gizli/bilinmesi gereken bir şey yok, sadece sabit bir URL.
const CAPTCHA_URL = "https://xnetic.net/captcha-challenge.html";

type Props = {
  visible: boolean;
  onSuccess: (token: string) => void;
  onCancel: () => void;
};

// Supabase Auth'un CAPTCHA koruması (Authentication → Attack Protection)
// açıldığında signInWithPassword çağrılarının bir captchaToken'a ihtiyacı
// olacak — bu bileşen o token'ı, gerçek bir tarayıcı bileşeni olmadan
// (Turnstile bir web widget'ı) bir WebView içinde göstererek üretir.
// bkz. src/context/AuthContext.tsx (signIn) ve ChangePasswordScreen.tsx
// (mevcut şifre doğrulama) — ikisi de signInWithPassword çağırıyor, ikisi
// de bu bileşeni kullanmalı.
export default function CaptchaModal({ visible, onSuccess, onCancel }: Props) {
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "success" && data.token) onSuccess(data.token);
    } catch {
      // Ayrıştırılamayan bir mesaj gelirse yok say.
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <WebView
            key={visible ? "open" : "closed"}
            source={{ uri: CAPTCHA_URL }}
            onMessage={handleMessage}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.yellow} />
              </View>
            )}
          />
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  card: {
    width: 320, height: 220, backgroundColor: colors.bg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, overflow: "hidden",
  },
  webview: { flex: 1, backgroundColor: colors.bg },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  cancelButton: { paddingVertical: spacing.sm, alignItems: "center", borderTopWidth: 1, borderTopColor: colors.line },
  cancelButtonText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
});

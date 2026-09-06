import React, { useRef, useState } from "react";
import { Modal, View, ActivityIndicator, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { WebView, type WebView as WebViewType } from "react-native-webview";
import { colors, radius, spacing } from "../theme/tokens";

// Android'in varsayılan WebView user-agent'ı kendini "; wv)" ile
// "gömülü WebView" olarak tanıtıyor — Cloudflare Turnstile'ın bot
// tespiti bunu şüpheli buluyor ve doğrulamayı "Doğrulama başarısız"
// ile sessizce reddediyor (canlıda tam olarak bu şekilde doğrulandı).
// Bu marker'ı taşımayan, normal bir mobil Chrome user-agent'ı vermek
// bu tespiti atlatıyor. iOS'ta WKWebView zaten bu şekilde işaretlenmiyor,
// dokunmuyoruz.
const ANDROID_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";

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
  const webviewRef = useRef<WebViewType>(null);
  const [failed, setFailed] = useState(false);
  // Her yeniden deneme WebView'i sıfırdan monte etsin diye — reload()
  // sayfayı yeniden yükler ama Turnstile'ın kendi iç durumu bazen takılı
  // kalabiliyor, key değiştirmek garantili temiz bir başlangıç sağlıyor.
  const [attempt, setAttempt] = useState(0);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "success" && data.token) {
        setFailed(false);
        onSuccess(data.token);
      } else if (data.type === "error") {
        setFailed(true);
      }
      // "expired" — widget kendi kendine yeniden dener, ekstra bir şey
      // yapmaya gerek yok.
    } catch {
      // Ayrıştırılamayan bir mesaj gelirse yok say.
    }
  };

  const handleRetry = () => {
    setFailed(false);
    setAttempt((a) => a + 1);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {failed ? (
            <View style={styles.loading}>
              <Text style={styles.errorText}>Doğrulama başarısız oldu.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              key={`${visible ? "open" : "closed"}-${attempt}`}
              ref={webviewRef}
              source={{ uri: CAPTCHA_URL }}
              onMessage={handleMessage}
              style={styles.webview}
              startInLoadingState
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              mixedContentMode="always"
              userAgent={Platform.OS === "android" ? ANDROID_USER_AGENT : undefined}
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.yellow} />
                </View>
              )}
            />
          )}
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
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: spacing.md },
  errorText: { color: colors.coral, fontSize: 13, fontWeight: "600" },
  retryButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  retryButtonText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
  cancelButton: { paddingVertical: spacing.sm, alignItems: "center", borderTopWidth: 1, borderTopColor: colors.line },
  cancelButtonText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
});

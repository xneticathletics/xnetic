import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Sentry from "@sentry/react-native";
import { colors, radius, spacing } from "../theme/tokens";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

// Uygulamanın hiçbir yerinde bir üst seviye hata yakalayıcı yoktu — bir
// ekranda beklenmedik bir render hatası olursa kullanıcı boş/donmuş bir
// ekranla baş başa kalıyordu, kurtarma yolu yoktu. Bu bileşen App.tsx'te
// en dışa sarılarak "Bir şeyler ters gitti" ekranı + Yeniden Dene ile bu
// durumu kurtarılabilir hale getiriyor. Class component olması ZORUNLU —
// React'te componentDidCatch/getDerivedStateFromError hook karşılığı yok.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Yakalanan render hatası:", error, info.componentStack);
    Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
  }

  handleRetry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😕</Text>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.subtitle}>
            Beklenmedik bir hata oluştu. Yeniden denemek genelde sorunu çözer — devam ederse uygulamayı
            tamamen kapatıp tekrar açmayı dene.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { color: colors.ink, fontSize: 18, fontWeight: "800", marginBottom: spacing.sm, textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: spacing.xl },
  button: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: spacing.xl },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});

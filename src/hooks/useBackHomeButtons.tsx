import { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { colors } from "../theme/tokens";

// useHomeButton'ın aksine, Ana Menü'den DOĞRUDAN değil bir üst ekrandan
// (ör. Sporcu Yönetimi → Sporcu Listesi → Sporcu Detayı) açılan ekranlarda
// kullanılır — useHomeButton headerLeft'i "🏠 Ana Sayfa" ile TAMAMEN
// değiştirdiği için React Navigation'ın normalde otomatik gösterdiği geri
// oku kayboluyordu, bir üst ekrana dönmenin tek yolu Ana Sayfa'ya
// atlayıp yeniden gezinmek kalıyordu. Burada ikisini yan yana gösteriyoruz.
export function useBackHomeButtons(navigation: any) {
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Geri dön"
            >
              <Text style={{ color: colors.yellow, fontWeight: "800", fontSize: 22, lineHeight: 22 }}>‹</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate("Home")} style={{ paddingHorizontal: 4 }}>
            <Text style={{ color: colors.yellow, fontWeight: "700", fontSize: 15 }}>🏠 Ana Sayfa</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);
}

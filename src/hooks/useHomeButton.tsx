import { useEffect } from "react";
import { Text, TouchableOpacity } from "react-native";
import { colors } from "../theme/tokens";

// Ana Menü'deki bir kutucuktan doğrudan açılan ekranlarda (Antrenman
// Programı, Aidat Takibi, Sporcu Yönetimi vb.) sol üstte her zaman
// görünen bir "Ana Sayfa" butonu ekler. Bu ekranlar zaten HomeStack
// içinde olduğu için basit navigation.navigate("Home") yeterlidir.
export function useHomeButton(navigation: any) {
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={{ paddingHorizontal: 4 }}>
          <Text style={{ color: colors.yellow, fontWeight: "700", fontSize: 15 }}>🏠 Ana Sayfa</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
}

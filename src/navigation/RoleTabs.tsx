import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, radius } from "../theme/tokens";
import type { UserRole } from "../context/AuthContext";
import HomeStack from "./HomeStack";
import AIScreen from "../screens/AIScreen";
import ProfileStack from "./ProfileStack";
import ClubSettingsStack from "./ClubSettingsStack";
import SystemSettingsScreen from "../screens/SystemSettingsScreen";
import MessagesStack from "./MessagesStack";
import { refreshUnreadMessagesCount, subscribeUnreadMessages } from "../lib/unreadMessagesStore";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  "Ana Menü": "🏠",
  "AI Asistan": "🤖",
  Mesajlar: "💬",
  Profil: "👤",
  "Kulüp Ayarları": "⚙️",
  "Sistem Ayarları": "⚙️",
};

function TabIcon({ routeName, focused, badgeCount }: { routeName: string; focused: boolean; badgeCount?: number }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View>
        <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[routeName] ?? "•"}</Text>
        {!!badgeCount && (
          <View
            style={{
              position: "absolute", top: -4, right: -10, backgroundColor: colors.yellow,
              borderRadius: radius.full, minWidth: 16, height: 16, paddingHorizontal: 3,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.bg, fontSize: 9, fontWeight: "800" }}>
              {badgeCount > 9 ? "9+" : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{
          marginTop: 2, fontSize: 10, fontWeight: "600",
          color: focused ? colors.yellow : colors.muted,
        }}
      >
        {routeName}
      </Text>
    </View>
  );
}

const TAB_BAR_HEIGHT = 58;
const LOGO_SIZE = 62;
// Ortadaki logoya yer açmak için sol/sağ gruplara ayrılan sabit
// genişliği — logonun altına gizlenip dokunmayı engellemesin diye.
const CENTER_GAP = LOGO_SIZE + 12;

// Sol tarafta Ana Menü (+ Kulüp Admini'nde Kulüp Ayarları), sağda Profil
// (+ Kulüp Admini'nde yanına AI Asistan), ortada da büyük/çıkıntılı marka
// rozeti için boşluk bırakan özel bir tab bar. Kulüp Ayarları ve AI
// Asistan da tıpkı Ana Menü/Profil gibi GERÇEK, bağımsız sekmeler — Ana
// Menü'nün altına gizlenmiş bir alt sayfa değiller.
function CustomTabBar({
  state, descriptors, navigation, role, onReady, unreadMessages,
}: BottomTabBarProps & {
  role: UserRole;
  onReady?: (navigation: BottomTabBarProps["navigation"]) => void;
  unreadMessages: number;
}) {
  const insets = useSafeAreaInsets();
  const isClubAdmin = role === "club_admin";
  const isSuperAdmin = role === "super_admin";

  // Tab.Navigator'ın kendi navigation nesnesini, dışarıdaki (Tab.Navigator'ın
  // ÜSTÜNDEKİ) logo bileşenine aktarır — bu sayede ortadaki logo, normal bir
  // sekme olmadığı halde "AI Asistan" ekranını açabilir.
  useEffect(() => {
    onReady?.(navigation);
  }, [navigation, onReady]);

  // Sol: Ana Menü + Mesajlar (HERKESTE). Sağ: Profil (+ Kulüp Admini'nde
  // Kulüp Ayarları, Süper Admin'de Sistem Ayarları önünde). AI Asistan
  // artık normal bir sekme değil — ortadaki logoya dokununca açılıyor, bu
  // yüzden görünür sıraya hiç dahil edilmiyor (kendisi hâlâ gerçek bir
  // Tab.Screen, sadece bu satırlarda gizleniyor).
  const leftCount = 2;
  const rightCount = isClubAdmin || isSuperAdmin ? 2 : 1;

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.7}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6 }}
      >
        <TabIcon routeName={route.name} focused={isFocused} badgeCount={route.name === "Mesajlar" ? unreadMessages : undefined} />
      </TouchableOpacity>
    );
  };

  const leftRoutes = state.routes.slice(0, leftCount);
  const rightRoutes = state.routes.slice(state.routes.length - rightCount);

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.bg,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        height: TAB_BAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        {leftRoutes.map((route, i) => renderTab(route, i))}
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate("AI Asistan")}
        activeOpacity={0.7}
        style={{ width: CENTER_GAP, alignItems: "center", justifyContent: "center" }}
      >
        {/* Görünmez boşluk — diğer sekmelerdeki ikonla aynı yüksekliği
            kaplayarak "AI Asistan" yazısının onlarla aynı hizada
            (flex ile ortalanmış) durmasını sağlar. */}
        <View style={{ height: 24 }} />
        <Text style={{ marginTop: 2, fontSize: 10, fontWeight: "600", color: colors.muted }}>AI Asistan</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {rightRoutes.map((route, i) => renderTab(route, state.routes.length - rightCount + i))}
      </View>
    </View>
  );
}

// Kulüp Ayarları sadece Kulüp Admini'ne, Sistem Ayarları sadece Süper
// Admin'e gösterilir. AI Asistan artık HERKESE açık.
export default function RoleTabs({ role }: { role: UserRole }) {
  const isClubAdmin = role === "club_admin";
  const isSuperAdmin = role === "super_admin";
  const insets = useSafeAreaInsets();
  const tabNavRef = useRef<BottomTabBarProps["navigation"] | null>(null);
  const logoScale = useRef(new Animated.Value(1)).current;
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Mesajlar rozetini canlı tutar: açılışta + her tab değişiminde hemen
  // yeniler, arada da periyodik olarak (yeni gelen mesajları yakalamak için)
  // yoklama yapar.
  useEffect(() => {
    const unsubscribe = subscribeUnreadMessages(setUnreadMessages);
    refreshUnreadMessagesCount();
    const interval = setInterval(refreshUnreadMessagesCount, 20000);
    return () => { unsubscribe(); clearInterval(interval); };
  }, []);

  // Logoya basınca önce büyüyüp (pop efekti), tam büyüdüğü anda AI Asistan
  // sekmesine geçiyor, sonra normal boyutuna geri dönüyor — "büyüyüp o
  // sayfaya geçen" efekt.
  const handleLogoPress = () => {
    Animated.timing(logoScale, {
      toValue: 1.45, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start(() => {
      tabNavRef.current?.navigate("AI Asistan");
      Animated.timing(logoScale, {
        toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            role={role}
            unreadMessages={unreadMessages}
            onReady={(nav) => { tabNavRef.current = nav; }}
          />
        )}
      >
        <Tab.Screen name="Ana Menü">{() => <HomeStack role={role} />}</Tab.Screen>
        {/* CustomTabBar sol/sağ gruplarını dizideki KONUMA göre ayırıyor
            (leftCount/rightCount) — AI Asistan'ın gizli kalabilmesi için
            her zaman tam ortada durması gerekiyor. Mesajlar HERKESTE Ana
            Menü'nün hemen yanında (sol grup). */}
        <Tab.Screen name="Mesajlar">{() => <MessagesStack role={role} />}</Tab.Screen>
        <Tab.Screen name="AI Asistan" component={AIScreen} />
        {isClubAdmin && <Tab.Screen name="Kulüp Ayarları" component={ClubSettingsStack} />}
        {isSuperAdmin && <Tab.Screen name="Sistem Ayarları" component={SystemSettingsScreen} />}
        <Tab.Screen
          name="Profil"
          listeners={({ navigation }) => ({
            // Sekme ikonuna elle her basıldığında Profil'i baştan (Profile
            // ekranından) aç. preventDefault ÖNEMLİ: yoksa React Navigation'ın
            // "son kalınan ekrana dön" varsayılan davranışıyla bizim
            // navigate çağrımız yarışa girip ekran bir an Profil'i gösterip
            // hemen ardından eski duyuru ekranına geri dönüyordu.
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate("Profil", { screen: "Profile" });
            },
          })}
        >
          {() => <ProfileStack role={role} />}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Ortadaki büyük/çıkıntılı marka rozeti — tab bar'ın üst kenarından
          taşacak şekilde konumlanır, herkes için dokunulabilir: AI
          Asistan'ı açar (artık ayrı bir sekme değil). pointerEvents="box-none"
          — dış kutu dokunmayı yutmasın, sadece içindeki buton yakalasın. */}
      <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, alignItems: "center", bottom: insets.bottom + TAB_BAR_HEIGHT - LOGO_SIZE / 2 - 2 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLogoPress}
          style={{ alignItems: "center" }}
        >
          <Animated.View
            style={{
              width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: radius.full,
              backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.bg,
              alignItems: "center", justifyContent: "center", overflow: "hidden",
              shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 8,
              transform: [{ scale: logoScale }],
            }}
          >
            <Image
              source={require("../assets/xnetic-logo-transparent.png")}
              style={{ width: LOGO_SIZE, height: LOGO_SIZE, tintColor: colors.yellow }}
              resizeMode="contain"
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

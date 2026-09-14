import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, radius } from "../theme/tokens";
import type { UserRole } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import HomeStack from "./HomeStack";
import AIScreen from "../screens/AIScreen";
import ProfileStack from "./ProfileStack";
import SystemSettingsScreen from "../screens/SystemSettingsScreen";
import MessagesStack from "./MessagesStack";
import { refreshUnreadMessagesCount, subscribeUnreadMessages } from "../lib/unreadMessagesStore";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  "Ana Menü": "🏠",
  Asistan: "🤖",
  Mesajlar: "💬",
  Profil: "👤",
  "Sistem Ayarları": "⚙️",
  Sosyal: "📸",
  Mağaza: "🛍️",
  Etkinlik: "🏆",
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
// genişliği — logonun altına gizlenip dokunmayı engellemesin diye, ama
// menüler logoya biraz daha yakın dursun diye eskisinden (LOGO_SIZE + 12)
// dar tutuluyor.
const CENTER_GAP = LOGO_SIZE - 6;

// Sol tarafta Ana Menü/Sosyal/Mağaza, sağda Etkinlik/Mesajlar/[Sistem
// Ayarları varsa]/Profil, ortada da büyük/çıkıntılı marka rozeti için
// boşluk bırakan özel bir tab bar. Asistan da tıpkı Ana Menü/Profil gibi
// GERÇEK, bağımsız bir sekme — Ana Menü'nün altına gizlenmiş bir alt sayfa
// değil.
function CustomTabBar({
  state, descriptors, navigation, onReady, unreadMessages,
}: BottomTabBarProps & {
  onReady?: (navigation: BottomTabBarProps["navigation"]) => void;
  unreadMessages: number;
}) {
  const insets = useSafeAreaInsets();

  // Tab.Navigator'ın kendi navigation nesnesini, dışarıdaki (Tab.Navigator'ın
  // ÜSTÜNDEKİ) logo bileşenine aktarır — bu sayede ortadaki logo, normal bir
  // sekme olmadığı halde "Asistan" ekranını açabilir.
  useEffect(() => {
    onReady?.(navigation);
  }, [navigation, onReady]);

  // Asistan artık normal bir sekme değil — ortadaki logoya dokununca
  // açılıyor, bu yüzden görünür sıraya hiç dahil edilmiyor (kendisi hâlâ
  // gerçek bir Tab.Screen, sadece burada gizleniyor). Sol/sağ grup
  // uzunlukları rol bazında değişebildiği için (ör. Süper Admin'de Sosyal/
  // Mağaza/Etkinlik yok) sabit 3/2 yerine Asistan'ın dizideki KONUMUNA göre
  // dinamik hesaplanıyor — bu sayede Asistan her zaman iki grubun tam
  // ortasında (iki flex:1 kapsayıcı arasında) kalır, gruplardaki sekme
  // sayısı eşit olmasa bile.
  const asistanIndex = state.routes.findIndex((r) => r.name === "Asistan");
  const leftCount = asistanIndex;
  const rightCount = state.routes.length - asistanIndex - 1;

  // Sosyal/Mağaza/Etkinlik kendi sekmesi hiç FOCUS olmuyor (tabPress hep
  // preventDefault edip Ana Menü'nün stack'ine yönlendiriyor) — o yüzden
  // "hangi sekmedeyiz" hissi Ana Menü'nün İÇİNDEKİ aktif ekrana bakılarak
  // ayrıca hesaplanıyor: gerçekten SocialFeed/Shop(Manage)/Events(Manage)
  // 'daysak o kısayolun ikonu renkleniyor, Ana Menü'nünki de o sırada SÖNÜK
  // kalıyor (aksi halde ikisi birden aktif görünüp kafa karıştırırdı).
  // "Ana Menü" gerçekten ODAKLI değilse (ör. Mesajlar/Profil'e geçilmiş)
  // activeHomeScreen'e hiç bakmıyoruz — yoksa Ana Menü'nün stack'i son
  // kaldığı ekranı (ör. EventsManage) hafızada tuttuğu için, o ekrandan
  // çıkıp sağdaki bir sekmeye geçtiğinde bile Etkinlik/Sosyal/Mağaza ikonu
  // yanlışlıkla renkli kalmaya devam ediyordu.
  const isHomeTabFocused = state.routes[state.index]?.name === "Ana Menü";
  const homeRoute = state.routes.find((r) => r.name === "Ana Menü");
  const homeNestedState = homeRoute?.state as { index?: number; routes: { name: string }[] } | undefined;
  const activeHomeScreen = homeNestedState
    ? homeNestedState.routes[homeNestedState.index ?? homeNestedState.routes.length - 1]?.name
    : undefined;
  const isOnSocialFeed = isHomeTabFocused && activeHomeScreen === "SocialFeed";
  const isOnShop = isHomeTabFocused && (activeHomeScreen === "Shop" || activeHomeScreen === "ShopManage");
  const isOnEvents = isHomeTabFocused && (activeHomeScreen === "EventsList" || activeHomeScreen === "EventsManage");

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const { options } = descriptors[route.key];
    let isFocused = state.index === index;
    if (route.name === "Sosyal") isFocused = isOnSocialFeed;
    else if (route.name === "Mağaza") isFocused = isOnShop;
    else if (route.name === "Etkinlik") isFocused = isOnEvents;
    else if (route.name === "Ana Menü") isFocused = isFocused && !isOnSocialFeed && !isOnShop && !isOnEvents;

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
        onPress={() => navigation.navigate("Asistan")}
        activeOpacity={0.7}
        style={{ width: CENTER_GAP, alignItems: "center", justifyContent: "center" }}
      >
        {/* Görünmez boşluk — diğer sekmelerdeki ikonla aynı yüksekliği
            kaplayarak "Asistan" yazısının onlarla aynı hizada
            (flex ile ortalanmış) durmasını sağlar. */}
        <View style={{ height: 24 }} />
        <Text style={{ marginTop: 2, fontSize: 10, fontWeight: "600", color: colors.muted }}>Asistan</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {rightRoutes.map((route, i) => renderTab(route, state.routes.length - rightCount + i))}
      </View>
    </View>
  );
}

// Sistem Ayarları sadece Süper Admin'e gösterilir. Kulüp Ayarları ve
// Duyurular artık alt menüde değil — ikisi de Profil'in içinde (bkz.
// ProfileStack.tsx). Asistan HERKESE açık.
export default function RoleTabs({ role }: { role: UserRole }) {
  const isClubAdmin = role === "club_admin";
  const isSuperAdmin = role === "super_admin";
  // Süper Admin'in Ana Sayfa'sında Sosyal/Mağaza/Etkinlik kutucuğu hiç yok
  // (kulübe özel değil, platform yönetimi ekranları var) — bu yüzden alt
  // menüde de sadece o bu kısayolları görmüyor.
  const showShopTabs = !isSuperAdmin;
  const { isLocked } = useBranchSelect();
  const isBranchCoordinator = role === "coach" && isLocked;
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

  // Logoya basınca önce büyüyüp (pop efekti), tam büyüdüğü anda Asistan
  // sekmesine geçiyor, sonra normal boyutuna geri dönüyor — "büyüyüp o
  // sayfaya geçen" efekt.
  const handleLogoPress = () => {
    Animated.timing(logoScale, {
      toValue: 1.45, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start(() => {
      tabNavRef.current?.navigate("Asistan");
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
            unreadMessages={unreadMessages}
            onReady={(nav) => { tabNavRef.current = nav; }}
          />
        )}
      >
        <Tab.Screen name="Ana Menü">{() => <HomeStack role={role} />}</Tab.Screen>

        {/* CustomTabBar sol/sağ gruplarını Asistan'ın dizideki KONUMUNA göre
            dinamik ayırıyor — Asistan'ın gizli kalabilmesi için her zaman
            iki grubun tam ortasında durması gerekiyor. showShopTabs=true
            iken sol grup Ana Menü/Sosyal/Mağaza (3), sağ grup Etkinlik/
            Mesajlar/Profil (3) — tam 3-3. Süper Admin'de (showShopTabs=
            false) Mesajlar hemen Ana Menü'nün yanında (sol grup), sağda
            Sistem Ayarları/Profil. Sosyal/Mağaza/Etkinlik kendi ekranı
            değil — dokununca Ana Menü'nün stack'indeki gerçek SocialFeed/
            Shop/Events ekranına yönlendiren birer kısayol (Profil
            sekmesindeki aynı desen). Not: bu 5 ekranda (bkz. HomeStack.tsx)
            önce animation:"none", sonra kısa bir animation:"fade" denendi
            — ikisi de Stok/Siparişler/Ürün Ekle gibi üstüne PUSH edilen
            ekranlardan geri dönüşü bir süre sonra (birkaç geçişten sonra)
            bozdu (native-stack v7 + react-native-screens + Yeni Mimari'de
            özelleştirilmiş "animation" ile ilgili bilinen bir kırılganlık
            alanı). Geri tuşunun her zaman güvenilir çalışması sağdan kayma
            hissinden daha önemli olduğu için animation özelleştirmesi
            TAMAMEN kaldırıldı — bu 5 ekran de artık varsayılan geçişi
            kullanıyor (sağdan kayarak açılıyorlar, ama geri her zaman
            çalışıyor). */}
        {showShopTabs && (
          <>
            <Tab.Screen
              name="Sosyal"
              listeners={({ navigation }) => ({
                tabPress: (e) => {
                  e.preventDefault();
                  navigation.navigate("Ana Menü", { screen: "SocialFeed" });
                },
              })}
            >
              {() => null}
            </Tab.Screen>
            <Tab.Screen
              name="Mağaza"
              listeners={({ navigation }) => ({
                tabPress: (e) => {
                  e.preventDefault();
                  navigation.navigate("Ana Menü", { screen: isClubAdmin || isBranchCoordinator ? "ShopManage" : "Shop" });
                },
              })}
            >
              {() => null}
            </Tab.Screen>
          </>
        )}

        {!showShopTabs && <Tab.Screen name="Mesajlar">{() => <MessagesStack role={role} />}</Tab.Screen>}

        <Tab.Screen name="Asistan" component={AIScreen} />

        {showShopTabs && (
          <>
            <Tab.Screen
              name="Etkinlik"
              listeners={({ navigation }) => ({
                tabPress: (e) => {
                  e.preventDefault();
                  navigation.navigate("Ana Menü", { screen: isClubAdmin || isBranchCoordinator ? "EventsManage" : "EventsList" });
                },
              })}
            >
              {() => null}
            </Tab.Screen>
            <Tab.Screen name="Mesajlar">{() => <MessagesStack role={role} />}</Tab.Screen>
          </>
        )}
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

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import ShopScreen from "../screens/ShopScreen";
import ShopProductDetailScreen from "../screens/ShopProductDetailScreen";
import ShopPurchaseScreen from "../screens/ShopPurchaseScreen";
import MyShopOrdersScreen from "../screens/MyShopOrdersScreen";
import ShopManageScreen from "../screens/ShopManageScreen";
import ShopProductFormScreen from "../screens/ShopProductFormScreen";
import ShopOrdersScreen from "../screens/ShopOrdersScreen";
import ShopStockScreen from "../screens/ShopStockScreen";

export type ShopStackParamList = {
  Shop: undefined;
  ShopProductDetail: { productId: string };
  ShopPurchase: { productId: string; title: string; price: number };
  MyShopOrders: undefined;
  ShopManage: undefined;
  ShopProductForm: { productId: string | undefined };
  ShopOrders: undefined;
  ShopStock: undefined;
};

const Stack = createNativeStackNavigator<ShopStackParamList>();

// "Mağaza" sekmesine basınca açılan gerçek, bağımsız bir stack — bkz.
// SocialStack.tsx'teki aynı gerekçe (animation'a dokunmadan "direkt
// açılma" davranışı). Shop VE ShopManage İKİSİ de her zaman kayıtlı —
// hangisinin başlangıç ekranı olacağı role'e göre ShopStack'e prop
// olarak geçiliyor (eskiden RoleTabs.tsx'teki tabPress yönlendirmesinde
// karar veriliyordu).
export default function ShopStack({ initialRouteName }: { initialRouteName: "Shop" | "ShopManage" }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Shop" component={ShopScreen} options={{ headerShown: false, title: "Mağaza" }} />
      <Stack.Screen name="ShopProductDetail" component={ShopProductDetailScreen} options={{ title: "Ürün" }} />
      <Stack.Screen name="ShopPurchase" component={ShopPurchaseScreen} options={{ title: "Satın Al" }} />
      <Stack.Screen name="MyShopOrders" component={MyShopOrdersScreen} options={{ title: "Siparişlerim" }} />
      <Stack.Screen name="ShopManage" component={ShopManageScreen} options={{ headerShown: false, title: "Mağaza" }} />
      <Stack.Screen name="ShopProductForm" component={ShopProductFormScreen} options={{ title: "Ürün" }} />
      <Stack.Screen name="ShopOrders" component={ShopOrdersScreen} options={{ title: "Siparişler" }} />
      <Stack.Screen name="ShopStock" component={ShopStockScreen} options={{ title: "Stok" }} />
    </Stack.Navigator>
  );
}

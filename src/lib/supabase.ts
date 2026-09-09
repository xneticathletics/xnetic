import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// .env üzerinden gelmeli (expo-constants veya babel-plugin-dotenv ile) —
// burada okunabilirlik için doğrudan process.env referansı bırakıldı.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Oturum artık cihazın Keychain'inde (iOS) / Keystore'unda (Android) — yani
// şifrelenmiş, uygulama dışından erişilemeyen bir yerde — kalıcı tutuluyor.
// Uygulama tamamen kapatılıp tekrar açıldığında veli/sporcu direkt içeri
// giriyor; admin/antrenör için ise BiometricLockGate (App.tsx) bu oturumu
// göstermeden önce Face ID/parmak izi/cihaz PIN'i istiyor — "kalıcı oturum"
// ile "her açılışta şifre sorma" arasındaki orta yol bu ikisinin birleşimi.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

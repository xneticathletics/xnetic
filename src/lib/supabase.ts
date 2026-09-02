import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

// .env üzerinden gelmeli (expo-constants veya babel-plugin-dotenv ile) —
// burada okunabilirlik için doğrudan process.env referansı bırakıldı.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    // Bilinçli olarak false: oturum cihazda kalıcı saklanmasın — uygulama
    // "Çıkış Yap" denmeden kapatılsa (tamamen sonlandırılsa) bile, tekrar
    // açıldığında geri yüklenecek bir oturum olmasın, kullanıcı yeniden
    // giriş yapmak zorunda kalsın.
    persistSession: false,
    detectSessionInUrl: false,
  },
});

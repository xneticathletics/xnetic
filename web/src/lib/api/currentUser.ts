import { supabase } from "../supabase";

// Web panelinin JWT'sinde yalnızca club_id/app_role claim'i var; bazı
// insert'lerde (ör. fitness_programs.created_by) users tablosundaki iç
// id'ye ihtiyaç duyulur. Mobildeki src/lib/api/currentUser.ts'in
// getCurrentAppUserId fonksiyonuyla aynı sorgu.
let cachedUserId: string | null | undefined;

// Hesabım sayfası için — ad/telefon/foto önbelleği. Mobildeki
// src/lib/api/currentUser.ts'teki aynı desenle birebir aynı.
let cachedUser: { id: string; name: string; phone: string | null; photo_url: string | null } | null = null;

// Çıkış yapılınca veya farklı bir hesapla giriş yapılınca önbellek
// temizlenmeli — yoksa önceki oturumun kullanıcı id'si/adı yanlışlıkla
// kullanılmaya devam eder (bkz. AuthContext.tsx signOut).
export function resetCurrentUserCache() {
  cachedUserId = undefined;
  cachedUser = null;
}

// React bileşeni olmayan (useAuth çağıramayan) API fonksiyonlarının kendi
// club_id'sine ihtiyaç duyduğu yerler için — JWT claim'inden okur.
// Süper Admin için her zaman null döner (kendi kulübü yok). Mobildeki
// src/lib/api/currentUser.ts'teki aynı isimli fonksiyonla birebir aynı.
export async function getCurrentClubId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.club_id ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentAppUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authData.user.id)
    .single();
  if (error) throw error;

  const userId: string | null = data?.id ?? null;
  cachedUserId = userId;
  return userId;
}

async function loadCurrentUser(): Promise<{ id: string; name: string; phone: string | null; photo_url: string | null } | null> {
  if (cachedUser) return cachedUser;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, name, phone, photo_url")
    .eq("auth_user_id", authData.user.id)
    .single();
  if (error) throw error;

  cachedUser = data;
  return cachedUser;
}

// Hesabım sayfasındaki ad/telefon alanları için.
export async function getCurrentUserName(): Promise<string | null> {
  const user = await loadCurrentUser();
  return user?.name ?? null;
}

export async function getCurrentUserPhone(): Promise<string | null> {
  const user = await loadCurrentUser();
  return user?.phone ?? null;
}

export async function getCurrentUserPhoto(): Promise<string | null> {
  const user = await loadCurrentUser();
  return user?.photo_url ?? null;
}

// Hesabım ekranından kullanıcının kendi ad/telefon bilgisini
// güncellemesi için. Mobildeki updateMyProfile ile birebir aynı.
export async function updateMyProfile(input: { name: string; phone: string | null }) {
  const userId = await getCurrentAppUserId();
  if (!userId) throw new Error("Kullanıcı bulunamadı");

  const { error } = await supabase.from("users").update(input).eq("id", userId);
  if (error) throw error;

  if (cachedUser) {
    cachedUser.name = input.name;
    cachedUser.phone = input.phone;
  }
}

// user-photos bucket'ı private — mobildeki uploadMyPhoto ile aynı, sadece
// yerel dosya URI'si yerine tarayıcının File nesnesini kullanır (bkz.
// web/src/lib/api/athletes.ts uploadAthletePhoto ile aynı desen).
export async function uploadMyPhoto(file: File): Promise<string> {
  const userId = await getCurrentAppUserId();
  if (!userId) throw new Error("Kullanıcı bulunamadı");

  const fileExt = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("user-photos")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  // Bucket private — herkese açık URL yerine ~10 yıllık imzalı URL.
  const { data: signedData, error: signError } = await supabase.storage.from("user-photos").createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  const { error: updateError } = await supabase.from("users").update({ photo_url: signedData.signedUrl }).eq("id", userId);
  if (updateError) throw updateError;

  if (cachedUser) cachedUser.photo_url = signedData.signedUrl;
  return signedData.signedUrl;
}

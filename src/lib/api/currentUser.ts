import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

let cachedUser: { id: string; name: string; phone: string | null; photo_url: string | null } | null = null;

// Çıkış yapılınca veya farklı bir hesapla giriş yapılınca önbellek
// temizlenmeli — yoksa önceki oturumun kullanıcı id'si/adı yanlışlıkla
// kullanılmaya devam eder (bkz. AuthContext.tsx).
export function resetCurrentUserCache() {
  cachedUser = null;
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

// React bileşeni olmayan (useAuth çağıramayan) API fonksiyonlarının kendi
// club_id'sine ihtiyaç duyduğu yerler için — JWT claim'inden okur.
// Süper Admin için her zaman null döner (kendi kulübü yok).
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

// JWT'de yalnızca club_id/app_role var; users tablosundaki iç id'ye
// (athletes.parent_user_id gibi ilişkilerde kullanılan) ihtiyaç duyan
// ekranlar için bu yardımcı fonksiyon bir kere sorgulayıp önbelleğe alır.
export async function getCurrentAppUserId(): Promise<string | null> {
  const user = await loadCurrentUser();
  return user?.id ?? null;
}

// Ana Sayfa'daki "Hoş geldin, {isim}" karşılaması gibi kişiselleştirme
// için kullanıcının adını döner.
export async function getCurrentUserName(): Promise<string | null> {
  const user = await loadCurrentUser();
  return user?.name ?? null;
}

// Profil ekranındaki avatar için — kullanıcının kendi yüklediği profil
// fotoğrafı (varsa).
export async function getCurrentUserPhoto(): Promise<string | null> {
  const user = await loadCurrentUser();
  return user?.photo_url ?? null;
}

// Profil Ayarları ekranı için — mevcut telefon numarasını döner.
export async function getCurrentUserPhone(): Promise<string | null> {
  const user = await loadCurrentUser();
  return user?.phone ?? null;
}

// Profil Ayarları ekranından kullanıcının kendi ad/telefon bilgisini
// güncellemesi için.
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

// Antrenör (ve diğer giriş yapabilen roller) kendi profil fotoğrafını
// Profil ekranından yükler — davet sırasında admin'in fotoğraf yükleme
// imkanı olmadığı için bu, kullanıcının kendi tamamlaması gereken bir adım.
// Davet akışında, henüz oturum açmamış YENİ bir kullanıcı için fotoğraf
// yüklemek amacıyla — uploadMyPhoto'nun aksine kullanıcı id'sini kendi
// oturumundan değil, parametre olarak alır.
export async function uploadPhotoForUser(userId: string, localUri: string): Promise<string> {
  const fileExt = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${userId}/${Date.now()}.${fileExt}`;
  const contentType = fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from("user-photos")
    .upload(path, arrayBuffer, { upsert: true, contentType });
  if (uploadError) throw uploadError;

  // Bucket private — herkese açık URL yerine ~10 yıllık imzalı URL.
  const { data: signedData, error: signError } = await supabase.storage.from("user-photos").createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  const { error: updateError } = await supabase.from("users").update({ photo_url: signedData.signedUrl }).eq("id", userId);
  if (updateError) throw updateError;

  return signedData.signedUrl;
}

export async function uploadMyPhoto(localUri: string): Promise<string> {
  const userId = await getCurrentAppUserId();
  if (!userId) throw new Error("Kullanıcı bulunamadı");

  const fileExt = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${userId}/${Date.now()}.${fileExt}`;
  const contentType = fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from("user-photos")
    .upload(path, arrayBuffer, { upsert: true, contentType });
  if (uploadError) throw uploadError;

  // Bucket private — herkese açık URL yerine ~10 yıllık imzalı URL.
  const { data: signedData, error: signError } = await supabase.storage.from("user-photos").createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  const { error: updateError } = await supabase
    .from("users")
    .update({ photo_url: signedData.signedUrl })
    .eq("id", userId);
  if (updateError) throw updateError;

  if (cachedUser) cachedUser.photo_url = signedData.signedUrl;
  return signedData.signedUrl;
}

// Yeni davet edilen bir kullanıcının ilk girişte kendi bilgilerini
// doldurması gerekip gerekmediğini kontrol eder. Şu an sadece Antrenör
// rolü için kullanılıyor (Veli/Sporcu için ileride ayrıca eklenecek).
export async function getMyOnboardingStatus(): Promise<boolean> {
  const userId = await getCurrentAppUserId();
  if (!userId) return true; // bilinmeyen durumda kimseyi bloklamayalım
  const { data, error } = await supabase.from("users").select("onboarding_completed").eq("id", userId).single();
  if (error) return true;
  return data?.onboarding_completed ?? true;
}

// Onboarding formunun "Kaydet" butonundan çağrılır — kendi bilgilerini
// kaydeder ve onboarding_completed=true yapar.
export async function completeMyOnboarding(input: {
  name: string;
  phone: string;
  birthDate: string;
  educationLevel: string;
}) {
  const userId = await getCurrentAppUserId();
  if (!userId) throw new Error("Kullanıcı bulunamadı");

  const { error } = await supabase
    .from("users")
    .update({
      name: input.name,
      phone: input.phone,
      birth_date: input.birthDate,
      education_level: input.educationLevel,
      onboarding_completed: true,
    })
    .eq("id", userId);
  if (error) throw error;

  if (cachedUser) {
    cachedUser.name = input.name;
    cachedUser.phone = input.phone;
  }
}

// Geçici şifreyle giriş yapan bir kullanıcının, ilk girişte kendi
// şifresini belirlemesi gerekip gerekmediğini kontrol eder — TÜM
// roller için geçerli (Antrenör'e özel onboarding'den farklı, ayrı bir
// kapı).
export async function getMyMustChangePassword(): Promise<boolean> {
  const userId = await getCurrentAppUserId();
  if (!userId) return false;
  const { data, error } = await supabase.from("users").select("must_change_password").eq("id", userId).single();
  if (error) return false;
  return data?.must_change_password ?? false;
}

// İlk girişte zorunlu şifre değiştirme ekranından çağrılır.
export async function changeMyPasswordFirstLogin(newPassword: string) {
  const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
  if (authError) throw authError;

  const userId = await getCurrentAppUserId();
  if (userId) {
    const { error: flagError } = await supabase.from("users").update({ must_change_password: false }).eq("id", userId);
    if (flagError) throw flagError;
  }
}

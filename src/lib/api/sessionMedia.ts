import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

export type SessionMedia = {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
};

export async function listSessionMedia(sessionId: string): Promise<SessionMedia[]> {
  const { data, error } = await supabase
    .from("training_session_media")
    .select("id, media_url, media_type, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Galeriden seçilen fotoğrafı Supabase Storage'daki "session-media" bucket'ına
// yükler, sonra training_session_media tablosuna kaydını düşer.
// Not: fetch().blob() yerine base64 -> ArrayBuffer yöntemi kullanılıyor
// (RN'de blob ile yerel dosya okuma bazen 0 byte'lık boş dosya üretiyor).
export async function uploadSessionPhoto(sessionId: string, localUri: string) {
  const fileExt = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${sessionId}/${Date.now()}.${fileExt}`;
  const contentType = fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from("session-media")
    .upload(path, arrayBuffer, { contentType });
  if (uploadError) throw uploadError;

  // Bucket private — herkese açık URL yerine ~10 yıllık imzalı URL.
  const { data: signedData, error: signError } = await supabase.storage.from("session-media").createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  const { error: insertError } = await supabase
    .from("training_session_media")
    .insert({ session_id: sessionId, media_url: signedData.signedUrl, media_type: "photo" });
  if (insertError) throw insertError;

  return signedData.signedUrl;
}

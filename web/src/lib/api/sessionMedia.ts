import { supabase } from "../supabase";

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

// Mobildeki src/lib/api/sessionMedia.ts ile aynı sözleşme: "session-media"
// bucket'ı private, bu yüzden herkese açık URL yerine ~10 yıllık imzalı URL
// üretip training_session_media'ya onu kaydediyoruz.
export async function uploadSessionPhoto(sessionId: string, file: File): Promise<string> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${sessionId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("session-media")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  const { data: signedData, error: signError } = await supabase.storage.from("session-media").createSignedUrl(path, 315360000);
  if (signError || !signedData) throw signError ?? new Error("İmzalı URL oluşturulamadı");

  const { error: insertError } = await supabase
    .from("training_session_media")
    .insert({ session_id: sessionId, media_url: signedData.signedUrl, media_type: "photo" });
  if (insertError) throw insertError;

  return signedData.signedUrl;
}

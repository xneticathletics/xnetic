import { supabase } from "../supabase";

const LOGO_PATH = "logo.png";

export function getClubLogoUrl(): string {
  const { data } = supabase.storage.from("club-logos").getPublicUrl(LOGO_PATH);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadClubLogo(file: File): Promise<string> {
  const { error } = await supabase.storage
    .from("club-logos")
    .upload(LOGO_PATH, file, { upsert: true, contentType: file.type || "image/png" });
  if (error) throw error;
  return getClubLogoUrl();
}

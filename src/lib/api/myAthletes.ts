import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";

export type MyAthlete = {
  id: string;
  full_name: string;
  group_id: string | null;
  photo_url: string | null;
  athlete_type: "spor_okulu" | "musabik";
  groups?: { name: string } | null;
};

// Bir sporcu hem veli hesabı (parent_user_id) hem kendi hesabı
// (athlete_user_id) üzerinden bağlı olabilir — ikisi de aynı sporcuyu
// görebilmeli, o yüzden ikisini de kontrol ediyoruz.
export async function getMyAthletes(): Promise<MyAthlete[]> {
  const userId = await getCurrentAppUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("athletes")
    .select("id, full_name, group_id, photo_url, athlete_type, groups!group_id(name)")
    .or(`parent_user_id.eq.${userId},athlete_user_id.eq.${userId}`);

  if (error) throw error;
  return (data as unknown as MyAthlete[]) ?? [];
}

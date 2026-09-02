import { supabase } from "../supabase";

export type Venue = {
  id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  branch_ids: string[];
};

export type VenueInput = {
  name: string;
  address: string | null;
  capacity: number | null;
  branch_ids: string[];
};

const VENUE_FIELDS = "id, name, address, capacity, branch_ids";

export async function listVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_FIELDS)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getVenue(id: string): Promise<Venue> {
  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_FIELDS)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createVenue(input: VenueInput) {
  const { data, error } = await supabase.from("venues").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateVenue(id: string, input: VenueInput) {
  const { data, error } = await supabase.from("venues").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// training_sessions.venue_id "on delete set null" ile tanımlı — bir salon
// silinirse bağlı antrenmanlar silinmez, sadece salon bilgisi boşalır.
export async function deleteVenue(id: string) {
  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) throw error;
}

import { supabase } from "../supabase";
import { getMyCoachedGroupIds } from "./myGroups";

export type GroupAthleteType = "spor_okulu" | "musabik";

export type Group = {
  id: string;
  name: string;
  branch: string;
  venue_id: string | null;
  athlete_type: GroupAthleteType;
  venues?: { name: string } | null;
};

export type GroupInput = {
  name: string;
  branch: string;
  venue_id: string | null;
  athlete_type: GroupAthleteType;
};

const GROUP_FIELDS = "id, name, branch, venue_id, athlete_type, venues(name)";

// RLS sayesinde yalnızca giriş yapan kullanıcının kulübüne ait gruplar döner —
// club_id filtresi ayrıca yazılmasına gerek yok.
export async function listGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select(GROUP_FIELDS)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as unknown as Group[]) ?? [];
}

export async function getGroup(id: string): Promise<Group> {
  const { data, error } = await supabase.from("groups").select(GROUP_FIELDS).eq("id", id).single();
  if (error) throw error;
  return data as unknown as Group;
}

export async function createGroup(input: GroupInput) {
  const { data, error } = await supabase.from("groups").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateGroup(id: string, input: GroupInput) {
  const { data, error } = await supabase.from("groups").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// Dikkat: training_sessions.group_id "on delete cascade" ile tanımlı —
// bir grup silinirse o gruba bağlı TÜM antrenman kayıtları da silinir.
// Çağıran ekran, silmeden önce kullanıcıyı bu konuda uyarmalı.
export async function deleteGroup(id: string) {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw error;
}

// Antrenör paneli için: kullanıcının baş antrenör veya yardımcı antrenör
// olarak atandığı grupları döner (bkz. myGroups.ts).
export async function listMyCoachedGroups(): Promise<Group[]> {
  const ids = await getMyCoachedGroupIds();
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("groups").select(GROUP_FIELDS).in("id", ids);
  if (error) throw error;
  return (data as unknown as Group[]) ?? [];
}

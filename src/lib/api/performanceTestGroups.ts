import { supabase } from "../supabase";
import type { Athlete } from "./athletes";
import type { CustomPerformanceTest } from "./customPerformanceTests";

export type TestGroup = {
  id: string;
  club_id: string;
  name: string;
  created_at: string;
};

export type TestGroupSummary = TestGroup & {
  athlete_count: number;
  test_count: number;
};

export async function listTestGroups(): Promise<TestGroupSummary[]> {
  const { data, error } = await supabase
    .from("performance_test_groups")
    .select("id, club_id, name, created_at, performance_test_group_athletes(count), performance_test_group_tests(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    club_id: r.club_id,
    name: r.name,
    created_at: r.created_at,
    athlete_count: r.performance_test_group_athletes?.[0]?.count ?? 0,
    test_count: r.performance_test_group_tests?.[0]?.count ?? 0,
  }));
}

export async function getTestGroup(id: string): Promise<{ group: TestGroup; athletes: Athlete[]; tests: CustomPerformanceTest[] }> {
  const { data: group, error: groupError } = await supabase
    .from("performance_test_groups")
    .select("id, club_id, name, created_at")
    .eq("id", id)
    .single();
  if (groupError) throw groupError;

  // groups!group_id: athletes ile groups arasında birden fazla ilişki
  // olduğu için PostgREST'e hangi foreign key'i kullanacağını açıkça
  // söylememiz gerekiyor (bkz. aynı desenin athletes.ts/fitnessGroups.ts/
  // socialPosts.ts'de kullanıldığı yerler).
  const { data: athleteRows, error: athleteError } = await supabase
    .from("performance_test_group_athletes")
    .select("athletes(id, full_name, birth_date, group_id, photo_url, groups!group_id(name, branch))")
    .eq("test_group_id", id);
  if (athleteError) throw athleteError;

  const { data: testRows, error: testError } = await supabase
    .from("performance_test_group_tests")
    .select("performance_test_catalog(id, club_id, category, name, unit, equipment, instructions, video_url, created_at)")
    .eq("test_group_id", id);
  if (testError) throw testError;

  return {
    group,
    athletes: (athleteRows ?? []).map((r: any) => r.athletes).filter(Boolean),
    tests: (testRows ?? []).map((r: any) => r.performance_test_catalog).filter(Boolean),
  };
}

export async function createTestGroup(input: { name: string; athleteIds: string[]; testIds: string[] }): Promise<TestGroup> {
  const { data: group, error: groupError } = await supabase
    .from("performance_test_groups")
    .insert({ name: input.name })
    .select("id, club_id, name, created_at")
    .single();
  if (groupError) throw groupError;

  if (input.athleteIds.length > 0) {
    const { error } = await supabase
      .from("performance_test_group_athletes")
      .insert(input.athleteIds.map((athlete_id) => ({ test_group_id: group.id, athlete_id })));
    if (error) throw error;
  }
  if (input.testIds.length > 0) {
    const { error } = await supabase
      .from("performance_test_group_tests")
      .insert(input.testIds.map((test_id) => ({ test_group_id: group.id, test_id })));
    if (error) throw error;
  }

  return group;
}

export async function addAthletesToGroup(testGroupId: string, athleteIds: string[]): Promise<void> {
  if (athleteIds.length === 0) return;
  const { error } = await supabase
    .from("performance_test_group_athletes")
    .insert(athleteIds.map((athlete_id) => ({ test_group_id: testGroupId, athlete_id })));
  if (error) throw error;
}

export async function removeAthleteFromGroup(testGroupId: string, athleteId: string): Promise<void> {
  const { error } = await supabase
    .from("performance_test_group_athletes")
    .delete()
    .eq("test_group_id", testGroupId)
    .eq("athlete_id", athleteId);
  if (error) throw error;
}

export async function deleteTestGroup(id: string): Promise<void> {
  const { error } = await supabase.from("performance_test_groups").delete().eq("id", id);
  if (error) throw error;
}

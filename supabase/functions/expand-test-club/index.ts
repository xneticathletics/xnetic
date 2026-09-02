// supabase/functions/expand-test-club/index.ts
//
// TEK SEFERLİK: mevcut "Test Kulübü"nü BÜYÜTÜR (silip yeniden kurmaz) —
// yeni bir branş (Futbol) + o branşa 1 koordinatör + 10 sıradan antrenör
// + 75 yeni sporcu/veli çifti ekler. Var olan veriye dokunmaz, sadece
// üstüne ekler.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_PASSWORD = "Test1234!";
const EMAIL_DOMAIN = "test.xnetic.app";
const NEW_BRANCH = "Futbol";

// Mevcut seed-test-club'ta kullanılan numaralandırmanın devamı —
// koordinator1-3, antrenor1-5, veli1-30 zaten var.
const COORDINATOR_START = 4;
const COACH_START = 6;
const COACH_COUNT = 10;
const PARENT_START = 31;
const PARENT_COUNT = 75;

const MALE_NAMES = ["Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Emre", "Burak", "Caner", "Kaan", "Ege", "Berk", "Yusuf", "Onur", "Serkan", "Tolga", "Volkan", "Barış", "Cem", "Eren", "Gökhan"];
const FEMALE_NAMES = ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Ece", "Buse", "Gizem", "Aslı", "Pınar", "Ceren", "İrem", "Nazlı", "Sude", "Dilara", "Melis", "Sena", "Yağmur", "Beren"];
const LAST_NAMES = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan", "Koç", "Kurt", "Özdemir", "Aktaş", "Polat", "Şen", "Güneş", "Türk", "Erdoğan", "Bulut"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function athleteName(i: number): string {
  const first = i % 2 === 0 ? pick(MALE_NAMES, i) : pick(FEMALE_NAMES, i);
  const last = pick(LAST_NAMES, i + 3);
  return `${first} ${last}`;
}

function parentName(i: number, athleteLast: string): string {
  const first = i % 2 === 0 ? pick(FEMALE_NAMES, i + 7) : pick(MALE_NAMES, i + 7);
  return `${first} ${athleteLast}`;
}

function coachName(i: number): string {
  const first = i % 2 === 0 ? pick(MALE_NAMES, i + 11) : pick(FEMALE_NAMES, i + 11);
  const last = pick(LAST_NAMES, i + 5);
  return `${first} ${last}`;
}

function birthDateForAge(age: number): string {
  const year = new Date().getFullYear() - age;
  return `${year}-06-15`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SETUP_SECRET = Deno.env.get("SETUP_SECRET");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    if (!SETUP_SECRET || body.setupSecret !== SETUP_SECRET) throw new Error("Yetkisiz istek.");

    const { data: club, error: clubError } = await admin.from("clubs").select("id").eq("name", "Test Kulübü").maybeSingle();
    if (clubError) throw clubError;
    if (!club) throw new Error("'Test Kulübü' bulunamadı — önce seed-test-club çalıştırılmalı.");
    const clubId = club.id;

    const { data: existingBranch } = await admin.from("branches").select("id").eq("club_id", clubId).eq("name", NEW_BRANCH).maybeSingle();
    if (existingBranch) throw new Error(`'${NEW_BRANCH}' branşı zaten var — tekrar eklenmedi.`);

    async function createLogin(email: string, name: string, role: string) {
      const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
        email, password: TEST_PASSWORD, email_confirm: true,
      });
      if (authError) throw authError;
      const { data: userRow, error: userError } = await admin
        .from("users")
        .insert({
          auth_user_id: createdAuth.user.id, club_id: clubId, name, email, role,
          is_active: true, must_change_password: false, onboarding_completed: true,
        })
        .select().single();
      if (userError) throw userError;
      return userRow;
    }

    // 1) Yeni branş
    const { data: newBranch, error: branchError } = await admin
      .from("branches").insert({ club_id: clubId, name: NEW_BRANCH }).select().single();
    if (branchError) throw branchError;

    // Mevcut "Merkez Spor Salonu"na yeni branşı da ekle.
    const { data: mainVenue } = await admin
      .from("venues").select("id, branch_ids").eq("club_id", clubId).eq("name", "Merkez Spor Salonu").maybeSingle();
    if (mainVenue) {
      await admin.from("venues").update({ branch_ids: [...(mainVenue.branch_ids ?? []), newBranch.id] }).eq("id", mainVenue.id);
    }

    // 2) Yeni koordinatör (Futbol)
    const coordinator = await createLogin(`koordinator${COORDINATOR_START}@${EMAIL_DOMAIN}`, coachName(COORDINATOR_START), "coach");
    await admin.from("branches").update({ coordinator_user_id: coordinator.id }).eq("id", newBranch.id);
    await admin.from("coach_branches").insert({ coach_id: coordinator.id, branch_id: newBranch.id, level: 2, experience_years: 8 });

    // 3) 10 yeni sıradan antrenör — Futbol dahil tüm branşlara dağıt.
    const { data: allBranches } = await admin.from("branches").select("id, name").eq("club_id", clubId);
    const branchList = allBranches ?? [];
    const newCoaches = [];
    for (let i = 0; i < COACH_COUNT; i++) {
      const idx = COACH_START + i;
      const branch = branchList[i % branchList.length];
      const row = await createLogin(`antrenor${idx}@${EMAIL_DOMAIN}`, coachName(idx + 10), "coach");
      newCoaches.push(row);
      await admin.from("coach_branches").insert({ coach_id: row.id, branch_id: branch.id, level: 1, experience_years: 2 });
    }

    // 4) Futbol için 2 yeni grup (var olan branşlardaki desenle aynı).
    const { data: groupA, error: gaError } = await admin
      .from("groups")
      .insert({ club_id: clubId, branch: NEW_BRANCH, name: `${NEW_BRANCH} Yıldızlar`, head_coach_id: coordinator.id, venue_id: mainVenue?.id ?? null })
      .select().single();
    if (gaError) throw gaError;
    const { data: groupB, error: gbError } = await admin
      .from("groups")
      .insert({ club_id: clubId, branch: NEW_BRANCH, name: `${NEW_BRANCH} Gençler`, head_coach_id: newCoaches[0].id, venue_id: mainVenue?.id ?? null })
      .select().single();
    if (gbError) throw gbError;

    // Kalan yeni antrenörleri yardımcı olarak var olan + yeni gruplara dağıt.
    const { data: allGroups } = await admin.from("groups").select("id").eq("club_id", clubId);
    const groupList = allGroups ?? [];
    for (let i = 1; i < newCoaches.length; i++) {
      const group = groupList[i % groupList.length];
      await admin.from("group_coaches").insert({ group_id: group.id, coach_id: newCoaches[i].id, permission_level: "standard" });
    }

    // 5) 75 yeni sporcu + veli, tüm gruplara (eski+yeni) dağıtılmış.
    for (let i = 0; i < PARENT_COUNT; i++) {
      const globalIndex = PARENT_START - 1 + i; // isim/yaş çeşitliliği eskiyle çakışmasın
      const fullName = athleteName(globalIndex);
      const lastName = fullName.split(" ").slice(-1)[0];
      const group = groupList[i % groupList.length];
      const age = 8 + (globalIndex % 9);
      const athleteType = globalIndex % 3 === 0 ? "musabik" : "spor_okulu";

      const { data: athleteRow, error: athleteError } = await admin
        .from("athletes")
        .insert({
          club_id: clubId, full_name: fullName, birth_date: birthDateForAge(age),
          athlete_type: athleteType, group_id: group.id, status: "active",
        })
        .select().single();
      if (athleteError) throw athleteError;

      await admin.from("athlete_groups").insert({ athlete_id: athleteRow.id, group_id: group.id });

      const parentIdx = PARENT_START + i;
      const parentRow = await createLogin(`veli${parentIdx}@${EMAIL_DOMAIN}`, parentName(globalIndex, lastName), "parent");
      await admin.from("athletes").update({ parent_user_id: parentRow.id, parent_name: parentRow.name }).eq("id", athleteRow.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        added: {
          branch: NEW_BRANCH,
          coordinator: `koordinator${COORDINATOR_START}@${EMAIL_DOMAIN}`,
          coaches: `antrenor${COACH_START}@${EMAIL_DOMAIN} .. antrenor${COACH_START + COACH_COUNT - 1}@${EMAIL_DOMAIN}`,
          parents: `veli${PARENT_START}@${EMAIL_DOMAIN} .. veli${PARENT_START + PARENT_COUNT - 1}@${EMAIL_DOMAIN}`,
        },
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Bilinmeyen hata" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

// supabase/functions/seed-test-club/index.ts
//
// TEK SEFERLİK bir kurulum aracı: Süper Admin'in GERÇEK kulüplerin
// verisine hiç dokunmadan, tamamen izole bir "Test Kulübü" üzerinde her
// rolü (admin, koordinatör, antrenör, veli, sporcu) gerçek giriş
// yaparak test edebilmesi için sahte ama gerçekçi bir veri seti kurar.
//
// Güvenlik: SETUP_SECRET ile korumalı, ve "Test Kulübü" adında bir kulüp
// zaten varsa çalışmayı reddeder (yanlışlıkla iki kere çalıştırıp
// yinelenen veri oluşturmayı engeller).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_PASSWORD = "Test1234!";
const EMAIL_DOMAIN = "test.xnetic.app";

const BRANCHES = ["Voleybol", "Basketbol", "Yüzme"];

const MALE_NAMES = ["Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Emre", "Burak", "Caner", "Kaan", "Ege", "Berk", "Yusuf", "Onur", "Serkan", "Tolga"];
const FEMALE_NAMES = ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Ece", "Buse", "Gizem", "Aslı", "Pınar", "Ceren", "İrem", "Nazlı", "Sude"];
const LAST_NAMES = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan", "Koç", "Kurt", "Özdemir", "Aktaş", "Polat"];

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

    const { data: existingClub } = await admin.from("clubs").select("id").eq("name", "Test Kulübü").maybeSingle();
    if (existingClub) throw new Error("'Test Kulübü' zaten var. Yeniden oluşturmak için önce elle silinmeli.");

    // 1) Kulüp
    const { data: club, error: clubError } = await admin
      .from("clubs")
      .insert({ name: "Test Kulübü", plan: "starter", contact_email: `admin@${EMAIL_DOMAIN}` })
      .select()
      .single();
    if (clubError) throw clubError;
    const clubId = club.id;

    async function createLogin(email: string, name: string, role: string, extra: Record<string, unknown> = {}) {
      const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
        email, password: TEST_PASSWORD, email_confirm: true,
      });
      if (authError) throw authError;
      const { data: userRow, error: userError } = await admin
        .from("users")
        .insert({
          auth_user_id: createdAuth.user.id, club_id: clubId, name, email, role,
          is_active: true, must_change_password: false, onboarding_completed: true, ...extra,
        })
        .select()
        .single();
      if (userError) throw userError;
      return userRow;
    }

    // 2) Kulüp Admini
    await createLogin(`admin@${EMAIL_DOMAIN}`, "Test Admin", "club_admin");

    // 3) Branşlar
    const branchRows: { id: string; name: string }[] = [];
    for (const name of BRANCHES) {
      const { data, error } = await admin.from("branches").insert({ club_id: clubId, name }).select().single();
      if (error) throw error;
      branchRows.push(data);
    }

    // 4) Salonlar
    const { data: venue1, error: v1Error } = await admin
      .from("venues")
      .insert({ club_id: clubId, name: "Merkez Spor Salonu", branch_ids: branchRows.filter((b) => b.name !== "Yüzme").map((b) => b.id) })
      .select().single();
    if (v1Error) throw v1Error;
    const { data: venue2, error: v2Error } = await admin
      .from("venues")
      .insert({ club_id: clubId, name: "Yüzme Havuzu", branch_ids: branchRows.filter((b) => b.name === "Yüzme").map((b) => b.id) })
      .select().single();
    if (v2Error) throw v2Error;

    // 5) Antrenörler: 3 koordinatör (branş başına 1) + 5 sıradan antrenör = 8
    const coordinators = [];
    for (let i = 0; i < 3; i++) {
      const row = await createLogin(`koordinator${i + 1}@${EMAIL_DOMAIN}`, coachName(i), "coach");
      coordinators.push(row);
      await admin.from("branches").update({ coordinator_user_id: row.id }).eq("id", branchRows[i].id);
      await admin.from("coach_branches").insert({ coach_id: row.id, branch_id: branchRows[i].id, level: 2, experience_years: 8 });
    }
    const coaches = [];
    for (let i = 0; i < 5; i++) {
      const branch = branchRows[i % branchRows.length];
      const row = await createLogin(`antrenor${i + 1}@${EMAIL_DOMAIN}`, coachName(i + 10), "coach");
      coaches.push(row);
      await admin.from("coach_branches").insert({ coach_id: row.id, branch_id: branch.id, level: 1, experience_years: 3 });
    }

    // 6) Gruplar: branş başına 2 grup (toplam 6), koordinatör kendi branşının
    // ilk grubuna baş antrenör, sıradan antrenörler ikinci gruplara dağıtılır.
    const groups: { id: string; branch: string }[] = [];
    for (let bi = 0; bi < branchRows.length; bi++) {
      const branch = branchRows[bi];
      const venueId = branch.name === "Yüzme" ? venue2.id : venue1.id;

      const { data: groupA, error: gaError } = await admin
        .from("groups")
        .insert({ club_id: clubId, branch: branch.name, name: `${branch.name} Yıldızlar`, head_coach_id: coordinators[bi].id, venue_id: venueId })
        .select().single();
      if (gaError) throw gaError;
      groups.push(groupA);

      const secondCoach = coaches[bi % coaches.length];
      const { data: groupB, error: gbError } = await admin
        .from("groups")
        .insert({ club_id: clubId, branch: branch.name, name: `${branch.name} Gençler`, head_coach_id: secondCoach.id, venue_id: venueId })
        .select().single();
      if (gbError) throw gbError;
      groups.push(groupB);
    }

    // Kalan antrenörleri yardımcı antrenör olarak ekstra gruplara dağıt.
    for (let i = 0; i < coaches.length; i++) {
      const group = groups[(i + 1) % groups.length];
      await admin.from("group_coaches").insert({ group_id: group.id, coach_id: coaches[i].id, permission_level: "standard" });
    }

    // 7) 30 sporcu + 30 veli (1'e 1 eşleştirilmiş), 6 gruba ~5'er dağıtılmış.
    for (let i = 0; i < 30; i++) {
      const fullName = athleteName(i);
      const lastName = fullName.split(" ").slice(-1)[0];
      const group = groups[i % groups.length];
      const age = 8 + (i % 9); // 8-16 yaş arası
      const athleteType = i % 3 === 0 ? "musabik" : "spor_okulu";

      const { data: athleteRow, error: athleteError } = await admin
        .from("athletes")
        .insert({
          club_id: clubId, full_name: fullName, birth_date: birthDateForAge(age),
          athlete_type: athleteType, group_id: group.id, status: "active",
        })
        .select().single();
      if (athleteError) throw athleteError;

      await admin.from("athlete_groups").insert({ athlete_id: athleteRow.id, group_id: group.id });

      const parentRow = await createLogin(`veli${i + 1}@${EMAIL_DOMAIN}`, parentName(i, lastName), "parent");
      await admin.from("athletes").update({ parent_user_id: parentRow.id, parent_name: parentRow.name }).eq("id", athleteRow.id);
    }

    // 8) Sporcu rolüyle DOĞRUDAN giriş test edebilmek için 2 kendi hesabını
    // yöneten ekstra sporcu (30'un dışında, ayrı).
    for (let i = 0; i < 2; i++) {
      const group = groups[i % groups.length];
      const fullName = athleteName(i + 100);
      const { data: athleteRow, error: athleteError } = await admin
        .from("athletes")
        .insert({
          club_id: clubId, full_name: fullName, birth_date: birthDateForAge(15),
          athlete_type: "musabik", group_id: group.id, status: "active",
        })
        .select().single();
      if (athleteError) throw athleteError;
      await admin.from("athlete_groups").insert({ athlete_id: athleteRow.id, group_id: group.id });

      const athleteUser = await createLogin(`sporcu${i + 1}@${EMAIL_DOMAIN}`, fullName, "athlete");
      await admin.from("athletes").update({ parent_user_id: athleteUser.id }).eq("id", athleteRow.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        password: TEST_PASSWORD,
        emails: {
          admin: `admin@${EMAIL_DOMAIN}`,
          coordinators: [1, 2, 3].map((n) => `koordinator${n}@${EMAIL_DOMAIN}`),
          coaches: [1, 2, 3, 4, 5].map((n) => `antrenor${n}@${EMAIL_DOMAIN}`),
          parents: `veli1@${EMAIL_DOMAIN} .. veli30@${EMAIL_DOMAIN}`,
          athletes: [1, 2].map((n) => `sporcu${n}@${EMAIL_DOMAIN}`),
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

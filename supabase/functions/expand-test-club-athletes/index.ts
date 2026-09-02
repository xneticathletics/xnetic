// supabase/functions/expand-test-club-athletes/index.ts
//
// TEK SEFERLİK: "Test Kulübü"ne SADECE yeni sporcu+veli çifti ekler (yeni
// branş/antrenör YOK) — var olan tüm gruplara (dolayısıyla tüm branşlara)
// eşit dağıtılmış olarak. Kaç tane ekleneceği body.count ile belirlenir.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_PASSWORD = "Test1234!";
const EMAIL_DOMAIN = "test.xnetic.app";

const MALE_NAMES = ["Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Emre", "Burak", "Caner", "Kaan", "Ege", "Berk", "Yusuf", "Onur", "Serkan", "Tolga", "Volkan", "Barış", "Cem", "Eren", "Gökhan"];
const FEMALE_NAMES = ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Ece", "Buse", "Gizem", "Aslı", "Pınar", "Ceren", "İrem", "Nazlı", "Sude", "Dilara", "Melis", "Sena", "Yağmur", "Beren"];
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
    const count: number = Number(body.count) > 0 ? Number(body.count) : 100;

    const { data: club, error: clubError } = await admin.from("clubs").select("id").eq("name", "Test Kulübü").maybeSingle();
    if (clubError) throw clubError;
    if (!club) throw new Error("'Test Kulübü' bulunamadı.");
    const clubId = club.id;

    const { data: groups, error: groupsError } = await admin.from("groups").select("id").eq("club_id", clubId);
    if (groupsError) throw groupsError;
    if (!groups || groups.length === 0) throw new Error("Test Kulübü'nde hiç grup yok.");

    const { count: existingParentCount, error: countError } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("role", "parent");
    if (countError) throw countError;
    const startIndex = existingParentCount ?? 0;

    for (let i = 0; i < count; i++) {
      const globalIndex = startIndex + i;
      const fullName = athleteName(globalIndex);
      const lastName = fullName.split(" ").slice(-1)[0];
      const group = groups[i % groups.length];
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

      const parentIdx = startIndex + i + 1;
      const email = `veli${parentIdx}@${EMAIL_DOMAIN}`;
      const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
        email, password: TEST_PASSWORD, email_confirm: true,
      });
      if (authError) throw authError;
      const { data: parentRow, error: userError } = await admin
        .from("users")
        .insert({
          auth_user_id: createdAuth.user.id, club_id: clubId, name: parentName(globalIndex, lastName),
          email, role: "parent", is_active: true, must_change_password: false, onboarding_completed: true,
        })
        .select().single();
      if (userError) throw userError;

      await admin.from("athletes").update({ parent_user_id: parentRow.id, parent_name: parentRow.name }).eq("id", athleteRow.id);
    }

    return new Response(
      JSON.stringify({ success: true, added: count, emailRange: `veli${startIndex + 1}@${EMAIL_DOMAIN} .. veli${startIndex + count}@${EMAIL_DOMAIN}` }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Bilinmeyen hata" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

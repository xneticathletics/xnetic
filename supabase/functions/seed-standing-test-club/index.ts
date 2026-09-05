// supabase/functions/seed-standing-test-club/index.ts
//
// TEK SEFERLİK: kalıcı standing test kulübünü ("XNETIC TEST KULÜBÜ (SİLME)",
// bkz. project_standing_test_club memory'si) 5 branş + 15 antrenör +
// 10 grup + 100 sporcu/veli çifti + her sporcuya bir aidat planıyla
// doldurur. seed-test-club/expand-test-club'ın aynı deseni — ayrı bir
// e-posta alan adı (xnetic.net) ve şifre (123456) kullanıyor çünkü kulüp
// sahibi özellikle bunu istedi.
//
// İki adım (body.step): "setup" (branş/antrenör/grup, tek sefer) ve
// "athletes" (sporcu/veli/aidat, body.count kadar, resumable — var olan
// sporcu sayısına göre kaldığı yerden devam eder, birden fazla çağrılabilir).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLUB_ID = "2d563f8b-4ce3-485a-a0e4-129e354f8b0f";
const EMAIL_DOMAIN = "xnetic.net";
const PASSWORD = "123456";
const BRANCHES = ["Futbol", "Basketbol", "Voleybol", "Yüzme", "Atletizm"];
const COACHES_PER_BRANCH = 3;
const MONTHLY_FEE = 5000;

const MALE_NAMES = ["Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Emre", "Burak", "Caner", "Kaan", "Ege", "Berk", "Yusuf", "Onur", "Serkan", "Tolga", "Volkan", "Barış", "Cem", "Eren", "Gökhan"];
const FEMALE_NAMES = ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Ece", "Buse", "Gizem", "Aslı", "Pınar", "Ceren", "İrem", "Nazlı", "Sude", "Dilara", "Melis", "Sena", "Yağmur", "Beren"];

// "Soyisimler farklı olacak şekilde" — 100 sporcunun HER BİRİNE ayrı bir
// soyisim düşsün diye en az 100 farklı, gerçek Türkçe soyisim.
const LAST_NAMES_100 = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan",
  "Koç", "Kurt", "Özdemir", "Aktaş", "Polat", "Şen", "Güneş", "Türk", "Erdoğan", "Bulut",
  "Aslan", "Yıldırım", "Çetin", "Kara", "Koçak", "Aksoy", "Erdem", "Güler", "Özkan", "Kılıç",
  "Avcı", "Bozkurt", "Tekin", "Acar", "Uçar", "Sarı", "Ateş", "Çakır", "Duman", "Ünal",
  "Karaca", "Işık", "Bilgin", "Ergün", "Korkmaz", "Yalçın", "Keskin", "Özcan", "Turan", "Şimşek",
  "Demirci", "Toprak", "Aygün", "Balcı", "Vural", "Uysal", "Karataş", "Kaplan", "Yaman", "Tunç",
  "Bayram", "Erol", "Uzun", "Genç", "Yaşar", "Yavuz", "Yücel", "Sever", "Onat", "Aktürk",
  "Aral", "Gündüz", "Ilgaz", "Beyaz", "Ekinci", "Kutlu", "Alkan", "Batur", "Cengiz", "Doğru",
  "Dinç", "Ergin", "Esen", "Güven", "İnan", "Kartal", "Metin", "Nalbant", "Orhan", "Pamuk",
  "Sezer", "Tuna", "Uygun", "Varol", "Yurt", "Zengin", "Akman", "Baykal", "Coşkun", "Deveci",
];
// İkinci 100 sporcu (sporcu101-200) LAST_NAMES_100'ü tekrar kullanınca
// (idx % 100) sporcu1 ile sporcu101 birebir aynı isme çıkıyordu — o hatayı
// keşfedip düzeltirken eklendi. idx 100-199 için bu ikinci liste kullanılır.
const LAST_NAMES_100_B = [
  "Karadağ", "Bektaş", "Sağlam", "Çevik", "Yorulmaz", "Yurtsever", "Tokgöz", "Sancak", "Bilir", "Erbil",
  "Kahraman", "Görgün", "Tuncel", "Şeker", "Odabaşı", "Gürbüz", "Bostancı", "Aybar", "Baysal", "Demirtaş",
  "Aycan", "Aydemir", "Karabulut", "Karagöz", "Kandemir", "Solmaz", "Yurdakul", "Tozlu", "Yeşil", "Kızılkaya",
  "Morova", "Tekinalp", "Şentürk", "Bozdağ", "Aslantaş", "Erkoç", "Gökçe", "Bulur", "Sarıkaya", "Kurttepe",
  "Aktepe", "Yalman", "Baysan", "Çakmak", "Kutluk", "Demirok", "Yeter", "Akgün", "Bayraktar", "Karaman",
  "Alagöz", "Boztepe", "Çınar", "Doruk", "Elmas", "Fidan", "Gezer", "Hasgül", "İpek", "Kaçar",
  "Levent", "Mercan", "Nural", "Onbaşı", "Pekcan", "Reis", "Sipahi", "Taşkın", "Ulusoy", "Vardar",
  "Yorgun", "Zaralı", "Akbulut", "Baştürk", "Ciğerci", "Değirmenci", "Erkal", "Fırat", "Girgin", "Halıcıoğlu",
  "Işıklı", "Kalkan", "Manav", "Necipoğlu", "Oymak", "Peker", "Sunar", "Tarhan", "Uçkun", "Yener",
  "Zorlu", "Akalın", "Bulutoğlu", "Cesur", "Duru", "Ergenç", "Feyzioğlu", "Güngör", "Hızlı", "İlhanlı",
];
const ALL_LAST_NAMES = [...LAST_NAMES_100, ...LAST_NAMES_100_B]; // idx 0-99 → liste A, 100-199 → liste B
const COACH_LAST_NAMES = ["Yılmazer", "Kayacan", "Demiröz", "Çelikbaş", "Şahinkaya", "Yıldıztepe", "Aydınlı", "Öztürkmen", "Arslanoğlu", "Doğançay", "Koçyiğit", "Kurtoğlu", "Özdemirci", "Aktaşoğlu", "Polater"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function athleteName(i: number): string {
  const first = i % 2 === 0 ? pick(MALE_NAMES, i) : pick(FEMALE_NAMES, i);
  return `${first} ${ALL_LAST_NAMES[i % ALL_LAST_NAMES.length]}`;
}
function parentName(i: number): string {
  const first = i % 2 === 0 ? pick(FEMALE_NAMES, i + 7) : pick(MALE_NAMES, i + 7);
  return `${first} ${ALL_LAST_NAMES[i % ALL_LAST_NAMES.length]}`;
}
function coachName(i: number): string {
  const first = i % 2 === 0 ? pick(MALE_NAMES, i + 3) : pick(FEMALE_NAMES, i + 3);
  return `${first} ${pick(COACH_LAST_NAMES, i)}`;
}
function birthDateForAge(age: number): string {
  return `${new Date().getFullYear() - age}-06-15`;
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

    const { data: club, error: clubError } = await admin.from("clubs").select("id").eq("id", CLUB_ID).maybeSingle();
    if (clubError) throw clubError;
    if (!club) throw new Error("Standing test kulübü bulunamadı.");

    async function createLogin(email: string, name: string, role: string) {
      const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
        email, password: PASSWORD, email_confirm: true,
      });
      if (authError) throw authError;
      const { data: userRow, error: userError } = await admin
        .from("users")
        .insert({
          auth_user_id: createdAuth.user.id, club_id: CLUB_ID, name, email, role,
          is_active: true, must_change_password: false, onboarding_completed: true,
        })
        .select().single();
      if (userError) throw userError;
      return userRow;
    }

    if (body.step === "setup") {
      // Kulübün gerçek sahibi telefonundan zaten kendi branş/salon/grup
      // yapısını kurmuş olabilir — varsa ONLARI kullan, yoksa varsayılan
      // 5 branşı oluştur. Asla var olan branş/grup/salonun üstüne yazma.
      let { data: branchRows } = await admin.from("branches").select("id, name, coordinator_user_id").eq("club_id", CLUB_ID);
      if (!branchRows || branchRows.length === 0) {
        const created: { id: string; name: string; coordinator_user_id: string | null }[] = [];
        for (const name of BRANCHES) {
          const { data, error } = await admin.from("branches").insert({ club_id: CLUB_ID, name }).select().single();
          if (error) throw error;
          created.push(data);
        }
        branchRows = created;
        await admin.from("venues").insert({ club_id: CLUB_ID, name: "Ana Spor Salonu", branch_ids: created.map((b) => b.id) });
      }

      let coachIndex = 1;
      const allNewCoaches: { id: string; branchId: string }[] = [];
      for (const branch of branchRows) {
        const branchCoaches: { id: string; name: string }[] = [];
        for (let j = 0; j < COACHES_PER_BRANCH; j++) {
          const row = await createLogin(`antrenor${coachIndex}@${EMAIL_DOMAIN}`, coachName(coachIndex), "coach");
          branchCoaches.push(row);
          allNewCoaches.push({ id: row.id, branchId: branch.id });
          await admin.from("coach_branches").insert({
            coach_id: row.id, branch_id: branch.id, level: j === 0 ? 2 : 1, experience_years: j === 0 ? 8 : 3,
          });
          coachIndex++;
        }
        // Branşın zaten bir koordinatörü yoksa, yeni antrenörlerden ilkini ata.
        if (!branch.coordinator_user_id) {
          await admin.from("branches").update({ coordinator_user_id: branchCoaches[0].id }).eq("id", branch.id);
        }
        // Var olan gruplara (varsa) yeni antrenörleri yardımcı olarak ekle.
        const { data: branchGroups } = await admin.from("groups").select("id").eq("club_id", CLUB_ID).eq("branch", branch.name);
        if (branchGroups && branchGroups.length > 0) {
          for (let j = 0; j < branchCoaches.length; j++) {
            const group = branchGroups[j % branchGroups.length];
            await admin.from("group_coaches").insert({ group_id: group.id, coach_id: branchCoaches[j].id, permission_level: "standard" });
          }
        }
      }

      const { data: allGroups } = await admin.from("groups").select("id").eq("club_id", CLUB_ID);

      return new Response(
        JSON.stringify({
          success: true,
          branches: branchRows.map((b) => b.name),
          coaches: `antrenor1..${coachIndex - 1}@${EMAIL_DOMAIN}`,
          existingGroups: allGroups?.length ?? 0,
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (body.step === "athletes") {
      const count: number = Number(body.count) > 0 ? Number(body.count) : 20;

      const { data: groups, error: groupsError } = await admin.from("groups").select("id").eq("club_id", CLUB_ID);
      if (groupsError) throw groupsError;
      if (!groups || groups.length === 0) throw new Error("Önce 'setup' adımı çalıştırılmalı (grup yok).");

      // Kaldığı yerden devam etmek için athletes.count değil, en yüksek
      // "sporcuN@..." e-postasının N'ini baz alıyoruz — kulüpte scriptin
      // DIŞINDA (elle) eklenmiş sporcular da olabilir, onlar sayıyı
      // saptırmasın diye.
      const { data: existingSporcuUsers } = await admin
        .from("users").select("email").eq("club_id", CLUB_ID).eq("role", "athlete").ilike("email", `sporcu%@${EMAIL_DOMAIN}`);
      let maxN = 0;
      for (const u of existingSporcuUsers ?? []) {
        const match = u.email.match(/^sporcu(\d+)@/);
        if (match) maxN = Math.max(maxN, parseInt(match[1], 10));
      }
      const startIndex = maxN; // 0-based devam noktası (maxN zaten kullanılmış son N)

      const created: string[] = [];
      for (let i = 0; i < count; i++) {
        const idx = startIndex + i; // 0-based
        const n = idx + 1; // 1-based, sporcuN/veliN eşleşsin
        const fullName = athleteName(idx);
        const group = groups[idx % groups.length];
        const age = 8 + (idx % 9);
        const athleteType = idx % 3 === 0 ? "musabik" : "spor_okulu";

        const { data: athleteRow, error: athleteError } = await admin
          .from("athletes")
          .insert({ club_id: CLUB_ID, full_name: fullName, birth_date: birthDateForAge(age), athlete_type: athleteType, group_id: group.id, status: "active" })
          .select().single();
        if (athleteError) throw athleteError;
        await admin.from("athlete_groups").insert({ athlete_id: athleteRow.id, group_id: group.id });

        const athleteUser = await createLogin(`sporcu${n}@${EMAIL_DOMAIN}`, fullName, "athlete");
        const parentRow = await createLogin(`veli${n}@${EMAIL_DOMAIN}`, parentName(idx), "parent");
        await admin.from("athletes").update({
          athlete_user_id: athleteUser.id, parent_user_id: parentRow.id, parent_name: parentRow.name,
        }).eq("id", athleteRow.id);

        // "5 bin aylık, farklı farklı tarihler" — ayın günü sporcudan sporcuya değişsin.
        await admin.from("payment_plans").insert({
          club_id: CLUB_ID, athlete_id: athleteRow.id, amount: MONTHLY_FEE, day_of_month: 1 + (idx % 28), active: true,
        });

        created.push(`sporcu${n}@${EMAIL_DOMAIN}`);
      }

      return new Response(
        JSON.stringify({ success: true, added: created.length, from: startIndex + 1, to: startIndex + count, password: PASSWORD }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (body.step === "fix_names") {
      // Tek seferlik düzeltme: sporcu101-200 ilk 100 ile AYNI soyisimleri
      // almıştı (LAST_NAMES_100 100'de bir tekrar ediyordu) — fromN..toN
      // aralığındaki sporcu/veli isimlerini ALL_LAST_NAMES ile yeniden hesaplar.
      const fromN = Number(body.fromN);
      const toN = Number(body.toN);
      const fixed: string[] = [];
      for (let n = fromN; n <= toN; n++) {
        const idx = n - 1;
        const newAthleteName = athleteName(idx);
        const newParentName = parentName(idx);
        const { data: athleteUserRow } = await admin.from("users").select("id").eq("club_id", CLUB_ID).eq("email", `sporcu${n}@${EMAIL_DOMAIN}`).maybeSingle();
        const { data: parentUserRow } = await admin.from("users").select("id").eq("club_id", CLUB_ID).eq("email", `veli${n}@${EMAIL_DOMAIN}`).maybeSingle();
        if (!athleteUserRow || !parentUserRow) continue;
        await admin.from("users").update({ name: newAthleteName }).eq("id", athleteUserRow.id);
        await admin.from("users").update({ name: newParentName }).eq("id", parentUserRow.id);
        await admin.from("athletes").update({ full_name: newAthleteName, parent_name: newParentName }).eq("athlete_user_id", athleteUserRow.id);
        fixed.push(`sporcu${n}`);
      }
      return new Response(JSON.stringify({ success: true, fixed: fixed.length }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (body.step === "renumber") {
      // Tek seferlik düzeltme: ilk "athletes" çağrısı kulüpte zaten var olan
      // (bu script dışında elle eklenmiş) 1 sporcu yüzünden sporcu2/veli2'den
      // başlamıştı — fromN..toN aralığını delta kadar kaydırır (ör. 2..21,
      // delta=-1 → sporcu1..20).
      const fromN = Number(body.fromN);
      const toN = Number(body.toN);
      const delta = Number(body.delta);
      for (let n = fromN; n <= toN; n++) {
        const newN = n + delta;
        for (const prefix of ["sporcu", "veli"]) {
          const oldEmail = `${prefix}${n}@${EMAIL_DOMAIN}`;
          const newEmail = `${prefix}${newN}@${EMAIL_DOMAIN}`;
          const { data: userRow } = await admin.from("users").select("id, auth_user_id").eq("club_id", CLUB_ID).eq("email", oldEmail).maybeSingle();
          if (!userRow) continue;
          await admin.auth.admin.updateUserById(userRow.auth_user_id, { email: newEmail });
          await admin.from("users").update({ email: newEmail }).eq("id", userRow.id);
        }
      }
      return new Response(JSON.stringify({ success: true, renumbered: `${fromN}..${toN} by ${delta}` }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200,
      });
    }

    throw new Error("Geçersiz step — 'setup', 'athletes' ya da 'renumber' olmalı.");
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Bilinmeyen hata" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

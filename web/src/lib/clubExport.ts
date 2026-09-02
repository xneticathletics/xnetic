import * as XLSX from "xlsx";
import { listAllAthletes } from "./api/athletes";
import { listCoaches } from "./api/coaches";
import { listGroups } from "./api/groups";
import { listBranches } from "./api/branches";
import { listVenues } from "./api/venues";

const STATUS_LABEL: Record<string, string> = { active: "Aktif", passive: "Pasif" };
const TYPE_LABEL: Record<string, string> = { musabik: "Müsabık", spor_okulu: "Spor Okulu" };

// Kulübün sporcu/antrenör/grup/branş/salon verilerini tek bir Excel
// dosyasında, her biri ayrı sayfada indirir — mobildeki
// src/screens/ClubExportScreen.tsx ile birebir aynı sayfa yapısı, sadece
// tarayıcıda dosya indirme kısmı FileSystem+Sharing yerine Blob+<a download>.
export async function exportClubData() {
  const [athletes, coaches, groups, branches, venues] = await Promise.all([
    listAllAthletes(),
    listCoaches(),
    listGroups(),
    listBranches(),
    listVenues(),
  ]);

  const wb = XLSX.utils.book_new();

  const athleteSheet = XLSX.utils.json_to_sheet(
    athletes.map((a) => ({
      "Adı Soyadı": a.full_name,
      "Doğum Tarihi": a.birth_date ?? "",
      Grup: a.groups?.name ?? "",
      Durum: STATUS_LABEL[a.status] ?? a.status,
      Tip: TYPE_LABEL[a.athlete_type] ?? a.athlete_type,
      "Forma No": a.jersey_number ?? "",
      "Veli Adı": a.parent_name ?? "",
      "Veli Telefon": a.parent_phone ?? "",
      "Kayıt Tarihi": a.registered_at ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, athleteSheet, "Sporcular");

  const coachSheet = XLSX.utils.json_to_sheet(
    coaches.map((c) => ({
      "Adı Soyadı": c.name,
      Telefon: c.phone ?? "",
      "Doğum Tarihi": c.birth_date ?? "",
      "Öğrenim Durumu": c.education_level ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, coachSheet, "Antrenörler");

  const groupSheet = XLSX.utils.json_to_sheet(
    groups.map((g) => ({ Grup: g.name, Branş: g.branch, Salon: g.venues?.name ?? "" }))
  );
  XLSX.utils.book_append_sheet(wb, groupSheet, "Gruplar");

  const branchSheet = XLSX.utils.json_to_sheet(
    branches.map((b) => ({
      Branş: b.name,
      Koordinatör: b.coordinator?.name ?? "",
      Tür: b.is_individual ? "Bireysel" : "Takım",
    }))
  );
  XLSX.utils.book_append_sheet(wb, branchSheet, "Branşlar");

  const venueSheet = XLSX.utils.json_to_sheet(
    venues.map((v) => ({ Salon: v.name, Adres: v.address ?? "", Kapasite: v.capacity ?? "" }))
  );
  XLSX.utils.book_append_sheet(wb, venueSheet, "Salonlar");

  const arrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const dateStamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kulup-bilgileri-${dateStamp}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

import { supabase } from "../supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { getCurrentClubId } from "./currentUser";
import type { BadgeType, AnyBadge } from "./badges";

// Sadece bu 4'ü sporcuya (athlete_id), diğer 3'ü kullanıcıya (user_id) bağlı
// — mevcut sabit rozet sistemiyle (badges.ts) birebir aynı ayrım.
export const ATHLETE_METRIC_TYPES: BadgeType[] = ["antrenman_serisi", "grup_fitness", "bireysel_fitness", "kulup_kidem"];

export const METRIC_LABELS: Record<string, string> = {
  antrenman_serisi: "Antrenman Serisi (kesintisiz katılım)",
  grup_fitness: "Grup Fitness Tamamlama",
  bireysel_fitness: "Bireysel Fitness Çalışması",
  kulup_kidem: "Kulüp Kıdemi (yıl)",
  sosyal_paylasim: "Sosyal Alan Paylaşımı",
  magaza_alisverisi: "Mağaza Alışverişi",
  mesajlasma: "Mesajlaşma (farklı kişi sayısı)",
};

export type BadgeTemplateStage = {
  id: string;
  template_id: string;
  stage_order: number;
  threshold: number;
  title: string | null;
  description: string | null;
};

export type BadgeTemplate = {
  id: string;
  club_id: string;
  name: string;
  icon_url: string | null;
  description: string | null;
  short_description: string | null;
  metric_type: string;
  created_by: string | null;
  created_at: string;
  active: boolean;
  stages?: BadgeTemplateStage[];
};

export type CustomBadgeEarned = {
  id: string;
  club_id: string;
  athlete_id: string | null;
  user_id: string | null;
  template_id: string;
  stage_order: number;
  earned_at: string;
  seen_at: string | null;
};

const TEMPLATE_FIELDS = "id, club_id, name, icon_url, description, short_description, metric_type, created_by, created_at, active";

export async function listBadgeTemplates(): Promise<BadgeTemplate[]> {
  const [{ data: templates, error: templatesError }, { data: stages, error: stagesError }] = await Promise.all([
    supabase.from("badge_templates").select(TEMPLATE_FIELDS).order("created_at", { ascending: false }),
    supabase.from("badge_template_stages").select("*").order("stage_order", { ascending: true }),
  ]);
  if (templatesError) throw templatesError;
  if (stagesError) throw stagesError;

  const stagesByTemplate = new Map<string, BadgeTemplateStage[]>();
  (stages ?? []).forEach((s) => {
    const list = stagesByTemplate.get(s.template_id) ?? [];
    list.push(s);
    stagesByTemplate.set(s.template_id, list);
  });
  return (templates ?? []).map((t) => ({ ...t, stages: stagesByTemplate.get(t.id) ?? [] }));
}

export type StageInput = { threshold: number; title?: string | null; description?: string | null };

// Şablon + aşamaları TEK işlemde oluşturur — aşama sayısı DEĞİŞKEN (kullanıcı
// isteği), en az 1 olmalı. RLS zaten sadece admin/koordinatöre izin veriyor.
export async function createBadgeTemplate(
  input: { name: string; icon_url: string | null; description: string; short_description: string; metric_type: string },
  stages: StageInput[]
): Promise<BadgeTemplate> {
  if (stages.length === 0) throw new Error("En az bir aşama eklemelisin.");
  const { data: template, error: templateError } = await supabase
    .from("badge_templates")
    .insert(input)
    .select(TEMPLATE_FIELDS)
    .single();
  if (templateError) throw templateError;

  const stageRows = stages.map((s, i) => ({
    template_id: template.id,
    stage_order: i + 1,
    threshold: s.threshold,
    title: s.title ?? null,
    description: s.description ?? null,
  }));
  const { error: stagesError } = await supabase.from("badge_template_stages").insert(stageRows);
  if (stagesError) throw stagesError;

  return template as BadgeTemplate;
}

export async function setBadgeTemplateActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("badge_templates").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteBadgeTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("badge_templates").delete().eq("id", id);
  if (error) throw error;
}

function iconPath(clubId: string): string {
  return `${clubId}/${Date.now()}.jpg`;
}

// Rozet simgesi profil fotoğrafından farklı — küçük, dekoratif bir ikon
// olduğu için 200px'e kadar küçültülüyor (kullanıcı isteği: "belirli
// boyutta küçült yer kaplamasın"). cropToSquare.ts'teki kareye kırpma +
// AYRICA burada bir de gerçek çözünürlük düşürme (resize) birleştirildi.
const BADGE_ICON_SIZE = 200;

export async function uploadBadgeIcon(localUri: string, width: number, height: number): Promise<string> {
  const clubId = await getCurrentClubId();
  if (!clubId) throw new Error("Kulüp bulunamadı");

  const size = Math.min(width, height);
  const originX = Math.round((width - size) / 2);
  const originY = Math.round((height - size) / 2);
  const context = ImageManipulator.manipulate(localUri)
    .crop({ originX, originY, width: size, height: size })
    .resize({ width: BADGE_ICON_SIZE, height: BADGE_ICON_SIZE });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });

  const base64 = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.Base64 });
  const path = iconPath(clubId);
  const { error } = await supabase.storage.from("badge-icons").upload(path, decode(base64), { contentType: "image/jpeg" });
  if (error) throw error;

  const { data } = supabase.storage.from("badge-icons").getPublicUrl(path);
  return data.publicUrl;
}

export async function checkMyCustomBadges(): Promise<CustomBadgeEarned[]> {
  const { data, error } = await supabase.rpc("check_my_custom_badges");
  if (error) throw error;
  return (data as CustomBadgeEarned[]) ?? [];
}

export async function markCustomBadgeSeen(id: string): Promise<void> {
  const { error } = await supabase.rpc("mark_custom_badge_seen", { p_id: id });
  if (error) throw error;
}

export async function listMyCustomBadgesEarned(athleteIds: string[], userId: string | null): Promise<CustomBadgeEarned[]> {
  const orParts: string[] = [];
  if (userId) orParts.push(`user_id.eq.${userId}`);
  if (athleteIds.length > 0) orParts.push(`athlete_id.in.(${athleteIds.join(",")})`);
  if (orParts.length === 0) return [];

  const { data, error } = await supabase
    .from("custom_badge_earned")
    .select("*")
    .or(orParts.join(","))
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return (data as CustomBadgeEarned[]) ?? [];
}

// Aşama sırası, o şablonun TOPLAM aşama sayısına göre bronz/gümüş/altına
// eşleniyor — sabit sistemdeki gibi hardcoded 3 seviye yok, çünkü aşama
// sayısı admin tarafından DEĞİŞKEN belirleniyor.
function customVisualTier(stageOrder: number, totalStages: number): "bronze" | "silver" | "gold" {
  if (totalStages <= 1 || stageOrder >= totalStages) return "gold";
  if (stageOrder <= 1) return "bronze";
  return "silver";
}

function fromCustomEarned(earned: CustomBadgeEarned, template: BadgeTemplate): AnyBadge {
  const stages = template.stages ?? [];
  const stage = stages.find((s) => s.stage_order === earned.stage_order);
  const title = stage?.title?.trim() || template.name;
  const description = stage?.description?.trim() || template.short_description || template.description || template.name;
  return {
    id: earned.id,
    source: "custom",
    earned_at: earned.earned_at,
    seen_at: earned.seen_at,
    icon: template.icon_url || "🎖️",
    iconIsImage: !!template.icon_url,
    title,
    description,
    visualTier: customVisualTier(earned.stage_order, stages.length),
  };
}

// checkMyCustomBadges()'ten (ham satır) ya da listMyCustomBadgesEarned'dan
// gelen satırları, ilgili şablon+aşama bilgisiyle birleştirip AnyBadge'e
// çevirir — HomeScreen (yeni kazanılanlar) ve BadgesScreen (tüm liste)
// tarafından ortak kullanılıyor.
export async function normalizeCustomEarnedRows(rows: CustomBadgeEarned[]): Promise<AnyBadge[]> {
  if (rows.length === 0) return [];
  const templateIds = Array.from(new Set(rows.map((r) => r.template_id)));
  const [{ data: templates, error: templatesError }, { data: stages, error: stagesError }] = await Promise.all([
    supabase.from("badge_templates").select(TEMPLATE_FIELDS).in("id", templateIds),
    supabase.from("badge_template_stages").select("*").in("template_id", templateIds),
  ]);
  if (templatesError) throw templatesError;
  if (stagesError) throw stagesError;

  const templateById = new Map<string, BadgeTemplate>(
    (templates ?? []).map((t) => [t.id, { ...t, stages: (stages ?? []).filter((s) => s.template_id === t.id) }])
  );
  return rows
    .map((r) => {
      const template = templateById.get(r.template_id);
      return template ? fromCustomEarned(r, template) : null;
    })
    .filter((x): x is AnyBadge => x !== null);
}

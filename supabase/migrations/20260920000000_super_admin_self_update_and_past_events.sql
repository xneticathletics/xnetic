-- 1) Süper admin kendi profilini (ad/telefon) kaydedemiyordu: "new row violates
-- row-level security policy for table users". Süper adminin club_id'si NULL;
-- is_self_update_safe içindeki `club_id = new_club_id` NULL = NULL → NULL
-- (false) döndürüyordu. NULL-güvenli karşılaştırma kullanılıyor.
create or replace function public.is_self_update_safe(uid uuid, new_role user_role, new_club_id uuid, new_is_active boolean)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  return exists (
    select 1 from users
    where id = uid and role = new_role and club_id is not distinct from new_club_id and is_active = new_is_active
  );
end;
$function$;

-- 2) Geçmiş tarihli etkinlik oluşturma DB seviyesinde de engelleniyor
-- (bitiş tarihi, yoksa başlangıç tarihi bugünden önce olamaz; Türkiye günü).
create or replace function public.events_block_past_insert()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated'
     and coalesce(new.end_date, new.start_date) < (now() at time zone 'Europe/Istanbul')::date then
    raise exception 'Bitiş tarihi bugünden önce olan bir etkinlik oluşturulamaz.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_events_block_past_insert on public.events;
create trigger trg_events_block_past_insert
  before insert on public.events
  for each row execute function public.events_block_past_insert();

-- Duyuru silme: announcement_reads tablosunun "own row" (bkz.
-- announcement_reads_own_delete) politikası bir admin'in BAŞKA
-- kullanıcıların okundu kayıtlarını silmesine izin vermiyor — düz bir
-- `delete from announcements` bu yüzden yabancı anahtar/RLS engeline
-- takılabilir. SECURITY DEFINER bir RPC ile hem yetki kontrolünü hem de
-- ilişkili announcement_reads temizliğini tek, atomik adımda yapıyoruz
-- (bkz. aynı desenin diğer cross-row kontrollerinde kullanıldığı yerler).
create or replace function public.delete_announcement(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.announcements a
    where a.id = p_announcement_id and a.club_id = public.current_club_id()
  ) then
    raise exception 'Duyuru bulunamadı';
  end if;

  if not public.is_admin_tier() then
    raise exception 'Bu duyuruyu silme yetkiniz yok';
  end if;

  delete from public.announcement_reads where announcement_id = p_announcement_id;
  delete from public.announcements where id = p_announcement_id;
end;
$$;

revoke all on function public.delete_announcement(uuid) from public;
grant execute on function public.delete_announcement(uuid) to authenticated;

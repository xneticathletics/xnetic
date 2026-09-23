-- Rozet kutlaması KİŞİ BAZINDA takip edilsin.
--
-- Sorun: badges.seen_at TEK bir sütun, ama bir sporcu rozetini hem
-- SPORCUNUN kendi hesabı hem de VELİSİ görüyor (check_my_badges ikisine de
-- döndürüyor). Hangisi uygulamayı önce açarsa kutlamayı "tüketiyor",
-- diğerine hiç gösterilmiyordu — canlıda yaşandı: şampiyon rozeti 19:47'de
-- verildi, 19:48'de görüldü işaretlendi, diğer hesapta kutlama hiç çıkmadı.
--
-- Çözüm: her (rozet, kullanıcı) çifti için ayrı bir "gördü" kaydı.
-- badges.seen_at geriye dönük uyumluluk için GÜNCELLENMEYE devam ediyor
-- (raporlama/eski istemciler), ama kutlama kararı artık badge_views'tan.

create table if not exists public.badge_views (
  badge_id uuid not null references public.badges(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (badge_id, user_id)
);
alter table public.badge_views enable row level security;

drop policy if exists "badge_views_select_own" on public.badge_views;
create policy "badge_views_select_own" on public.badge_views
  for select to authenticated
  using (public.is_current_user_row(user_id));
-- Yazma politikası bilerek YOK: yalnız mark_badge_seen RPC'si üzerinden.

-- Geriye dönük doldurma: ŞU AN seen_at'i dolu olan rozetler için ilgili TÜM
-- hesaplara (sporcunun kendisi, velisi, ya da rozet bir kullanıcıya aitse o
-- kullanıcı) "görüldü" kaydı yaz — aksi halde bu göç, geçmişte kutlanmış
-- her rozeti herkese yeniden kutlatırdı.
insert into public.badge_views (badge_id, user_id, seen_at)
select b.id, u.id, b.seen_at
from public.badges b
join public.users u on (
  u.id = b.user_id
  or u.id in (select a.athlete_user_id from public.athletes a where a.id = b.athlete_id and a.athlete_user_id is not null)
  or u.id in (select a.parent_user_id from public.athletes a where a.id = b.athlete_id and a.parent_user_id is not null)
)
where b.seen_at is not null
on conflict do nothing;

create or replace function public.mark_badge_seen(p_badge_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.my_user_id();
begin
  if me is null then return; end if;

  -- Rozet gerçekten bana mı ait (kendi rozetim ya da bağlı olduğum sporcunun)?
  if not exists (
    select 1 from public.badges b
    where b.id = p_badge_id and (
      b.user_id = me
      or b.athlete_id in (select a.id from public.athletes a where a.athlete_user_id = me or a.parent_user_id = me)
    )
  ) then
    return;
  end if;

  insert into public.badge_views (badge_id, user_id) values (p_badge_id, me)
  on conflict (badge_id, user_id) do nothing;

  -- Geriye dönük uyumluluk: eski istemciler/raporlar hâlâ badges.seen_at'e bakıyor.
  update public.badges set seen_at = now() where id = p_badge_id and seen_at is null;
end;
$$;

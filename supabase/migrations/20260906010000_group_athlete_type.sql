-- Gruba "Müsabık" ya da "Spor Okulu" tipi ekler ve bunu sporculara doğru
-- yönde otomatik yayar:
-- 1. Bir sporcu bir gruba eklendiğinde/taşındığında, o sporcunun
--    athlete_type'ı otomatik olarak grubun tipine eşitlenir (elle girilen
--    değer varsa üzerine yazılır — "o gruptaki HERKES aynı tip olsun").
-- 2. Bir grubun tipi sonradan değiştirilirse, o anda o gruba bağlı TÜM
--    sporcuların athlete_type'ı da otomatik güncellenir.
-- group_id NULL olan (henüz gruba atanmamış) sporcularda athlete_type
-- serbest kalır — bu durumda otomatik atama uygulanamaz.

alter table public.groups add column if not exists athlete_type public.athlete_type not null default 'spor_okulu';

create or replace function public.sync_athlete_type_from_group()
returns trigger
language plpgsql
as $$
begin
  if new.group_id is not null then
    select g.athlete_type into new.athlete_type from public.groups g where g.id = new.group_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_athlete_type_from_group on public.athletes;
create trigger trg_sync_athlete_type_from_group
  before insert or update on public.athletes
  for each row execute function public.sync_athlete_type_from_group();

create or replace function public.cascade_group_athlete_type()
returns trigger
language plpgsql
as $$
begin
  if new.athlete_type is distinct from old.athlete_type then
    update public.athletes set athlete_type = new.athlete_type where group_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cascade_group_athlete_type on public.groups;
create trigger trg_cascade_group_athlete_type
  after update on public.groups
  for each row execute function public.cascade_group_athlete_type();

-- Mağaza siparişleri onaylanınca zaten otomatik Finansal Dökümanlar'a
-- gelir olarak işleniyordu (bkz. update_shop_order_status, extra_income.
-- order_id) — Etkinlik kayıtları için AYNI şey hiç yapılmıyordu, admin/
-- koordinatör bir havale/elden ödemesini onaylasa bile bu tutar hiçbir
-- yerde gelir olarak görünmüyordu. Aynı deseni event_registrations'a da
-- uyguluyoruz.
alter table public.extra_income add column if not exists event_registration_id uuid unique
  references public.event_registrations(id) on delete set null;

create or replace function public.update_event_registration_status(p_registration_id uuid, p_status text)
returns public.event_registrations
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_reg event_registrations%rowtype;
  v_event events%rowtype;
  v_result event_registrations%rowtype;
begin
  if p_status not in ('approved','rejected') then
    raise exception 'Geçersiz durum.';
  end if;

  select * into v_reg from event_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;
  if v_reg.status <> 'pending' then
    raise exception 'Bu kayıt zaten incelenmiş.';
  end if;

  select * into v_event from events where id = v_reg.event_id;

  if v_event.club_id is distinct from current_club_id() then
    raise exception 'Bu kayıt üzerinde yetkiniz yok.';
  end if;

  if not (is_admin_tier() or (v_event.branch is not null and is_my_coordinator_branch(v_event.branch))) then
    raise exception 'Bu kayıt üzerinde yetkiniz yok.';
  end if;

  update event_registrations
  set status = p_status, reviewed_at = now(), reviewed_by = (select id from users where auth_user_id = auth.uid())
  where id = p_registration_id
  returning * into v_result;

  -- Onaylanan (ödemesi doğrulanan) bir kayıt, ücretsiz (amount_due = 0)
  -- değilse Finansal Dökümanlar'a otomatik gelir olarak işlenir — mağaza
  -- siparişleriyle aynı mantık.
  if p_status = 'approved' and v_reg.amount_due > 0 then
    insert into extra_income (club_id, description, amount, income_date, event_registration_id)
    values (
      v_event.club_id,
      concat('Etkinlik kaydı — ', v_event.title),
      v_reg.amount_due,
      current_date,
      v_reg.id
    )
    on conflict (event_registration_id) do nothing;
  end if;

  return v_result;
end;
$$;

revoke execute on function public.update_event_registration_status(uuid, text) from public;
grant execute on function public.update_event_registration_status(uuid, text) to authenticated;

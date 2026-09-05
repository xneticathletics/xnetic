-- Süper Admin panelinin genişletilmesi: kulüp abonelik geçmişi (kim değil,
-- ne zaman ne oldu — tek süper admin olduğu için "kim yaptı" takibinin
-- değeri düşük, ama durum geçmişi hâlâ değerli, bkz. sohbet 2026-09-05).
create table public.club_subscription_history (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  status text not null,
  billing_period text not null,
  amount_try numeric,
  changed_at timestamptz not null default now()
);

create index club_subscription_history_club_id_idx on public.club_subscription_history (club_id, changed_at desc);

alter table public.club_subscription_history enable row level security;

create policy club_subscription_history_super_admin_only on public.club_subscription_history
  for all
  using (is_super_admin())
  with check (is_super_admin());

grant select, insert on table public.club_subscription_history to authenticated;

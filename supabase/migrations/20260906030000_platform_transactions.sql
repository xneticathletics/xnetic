-- Süper Admin'in KENDİ işletmesinin (X-NETIC'i bir SaaS olarak işletmenin)
-- gelir/gider muhasebesini tuttuğu tablo — herhangi bir kulübün finansıyla
-- ilgisi yok, tamamen platform sahibinin kendi defteri. Sadece süper admin
-- erişebilir.
create table public.platform_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount_try numeric not null check (amount_try > 0),
  description text not null,
  category text,
  transaction_date date not null default current_date,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.platform_transactions enable row level security;

create policy platform_transactions_super_admin_all
  on public.platform_transactions
  for all
  using (is_super_admin())
  with check (is_super_admin());

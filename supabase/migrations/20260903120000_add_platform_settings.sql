-- Süper Admin'in platform genelinde kontrol edebileceği tek satırlık
-- ayarlar: abonelik fiyatları, bakım modu, destek iletişim bilgileri.
-- id sabit "true" olacak şekilde tek satır zorunlu kılınıyor (tekil satır deseni).
create table if not exists public.platform_settings (
  id boolean primary key default true check (id),
  monthly_price_try numeric not null default 999,
  yearly_price_try numeric not null default 9990,
  maintenance_mode boolean not null default false,
  maintenance_message text not null default 'Uygulama şu anda bakımda. Kısa süre içinde tekrar hizmetinizdeyiz.',
  support_email text,
  support_phone text,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (true)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

-- Herkes okuyabilir: Kulüp Oluştur ekranı henüz oturum yokken güncel
-- fiyatı ve bakım durumunu göstermek zorunda.
drop policy if exists "platform_settings_public_read" on public.platform_settings;
create policy "platform_settings_public_read"
  on public.platform_settings for select
  using (true);

-- Sadece aktif Süper Admin güncelleyebilir.
drop policy if exists "platform_settings_super_admin_update" on public.platform_settings;
create policy "platform_settings_super_admin_update"
  on public.platform_settings for update
  using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin' and u.is_active = true
    )
  );

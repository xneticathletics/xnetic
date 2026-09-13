-- Performans testi KATEGORİLERİ ("Test Grubu") artık kısmen veritabanında —
-- src/lib/performanceTests.ts'teki sabit 8 kategori (Antropometrik, Sürat,
-- vb.) aynen kalıyor, ama admin/branş koordinatörü artık kendi kulübüne
-- özel YENİ bir kategori de ekleyebiliyor (performance_test_catalog'un
-- kendisi zaten aynı club_id NULL=global desenini kullanıyordu — bu tablo
-- sadece o desenin "kategori" seviyesindeki eksik parçası).
--
-- set_club_id_from_jwt trigger'ı club_id'yi çağıranın JWT'sinden otomatik
-- dolduruyor (club_admin/koordinatör -> kendi kulübü, super_admin'in
-- current_club_id()'si NULL olduğu için -> global) — performance_test_catalog
-- ile birebir aynı mekanizma, client'ın club_id göndermesine hiç gerek yok.
--
-- NOT (aynı gün geri alındı): "Test Grubu" burada yanlış anlaşılmıştı —
-- kullanıcı aslında sporcu+test seçilip ölçüm girilen bir "test seansı"
-- istiyordu, kategori değil. Bkz. 20260913121500_drop_performance_test_categories.sql.
create table public.performance_test_categories (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id),
  label text not null,
  icon text not null default '🏅',
  created_at timestamptz not null default now()
);

create index performance_test_categories_club_id_idx on public.performance_test_categories(club_id);

alter table public.performance_test_categories enable row level security;

create trigger trg_set_club_id
  before insert on public.performance_test_categories
  for each row
  execute function public.set_club_id_from_jwt();

-- Herkes kendi kulübünün + global kategorileri görebilir.
create policy "performance_test_categories_select" on public.performance_test_categories
  for select to authenticated
  using (club_id is null or club_id = public.current_club_id());

-- Ekleme: kulübe özel -> admin/branş koordinatörü; global -> sadece süper admin
-- (performance_test_catalog_insert ile birebir aynı yetki şekli).
create policy "performance_test_categories_insert" on public.performance_test_categories
  for insert to authenticated
  with check (
    (club_id = public.current_club_id() and (public.is_admin_tier() or public.is_branch_coordinator()))
    or (club_id is null and public.is_super_admin())
  );

revoke all on public.performance_test_categories from anon;
grant select, insert on public.performance_test_categories to authenticated;

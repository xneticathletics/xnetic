-- Kulüp admininin belirlediği tek, sabit bir aidat ücreti — bunu
-- değiştirdiğinde TÜM sporcuların aidat planı ve henüz ödenmemiş gelecek
-- ay kayıtları (bulunduğumuz ay HARİÇ) otomatik güncellensin diye.
alter table public.club_settings add column if not exists standard_fee_try numeric;

-- Kimlik doğrulaması gerektirmeyen (verify_jwt=false) uç noktaların
-- (create-club gibi) IP başına hız sınırlaması için — bot/otomatik
-- tekrarlı çağrılarla sahte kulüp kaydı açıp süper admine bildirim/push
-- yağdırmayı engeller. Sadece edge function'lar (servis-rol) yazıyor/okuyor,
-- istemciden hiçbir erişim yok (RLS açık, hiç politika yok = varsayılan ret).
create table if not exists public.edge_rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists edge_rate_limits_lookup_idx
  on public.edge_rate_limits (bucket, identifier, created_at);

alter table public.edge_rate_limits enable row level security;

-- Kayıt silindiğinde ona ait Storage dosyalarının (sporcu/kullanıcı fotoğrafı,
-- etkinlik afişi, ürün fotoğrafı, antrenman medyası, PDF, dekont) otomatik
-- silinmesi. SQL'den doğrudan storage.objects silinemez (yalnız katalog
-- temizlenir / Supabase engeller); gerçek silme Storage API ile olur. Bu
-- yüzden: silme tetikleyicisi bir KUYRUK satırı yazar, `purge-storage-queue`
-- Edge Function'ı (pg_cron ile 10 dakikada bir) kuyruğu Storage API ile boşaltır.
-- Tüm silme yolları (mobil, web, kulüp silme, cascade) tek noktada yakalanır.

create table if not exists public.storage_purge_queue (
  id bigserial primary key,
  bucket text not null,
  path text not null,          -- klasör öneki (<id>) ya da tek dosya yolu
  is_file boolean not null default false,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.storage_purge_queue enable row level security;
-- Bilerek politika YOK: yalnız SECURITY DEFINER tetikleyiciler ve service role erişir.

create or replace function public.enqueue_storage_purge()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_bucket text := tg_argv[0];
  v_col text := tg_argv[1];
  v_val text;
  v_pos int;
begin
  if v_col = 'id' then
    insert into public.storage_purge_queue (bucket, path) values (v_bucket, old.id::text);
  elsif v_col = 'banner_url' then
    -- Afiş, etkinlik id'li klasörde: önek silmesi yeterli.
    if old.banner_url is not null then
      insert into public.storage_purge_queue (bucket, path) values (v_bucket, old.id::text);
    end if;
  elsif v_col = 'pdf_url' then
    v_val := old.pdf_url;
    v_pos := position('/nutrition-pdfs/' in coalesce(v_val, ''));
    if v_pos > 0 then
      insert into public.storage_purge_queue (bucket, path, is_file)
      values (v_bucket, split_part(substr(v_val, v_pos + length('/nutrition-pdfs/')), '?', 1), true);
    end if;
  elsif v_col = 'receipt_url' then
    -- Dekont, kayıt/ödeme id'li klasörde.
    if (to_jsonb(old) ->> 'receipt_url') is not null then
      insert into public.storage_purge_queue (bucket, path) values (v_bucket, old.id::text);
    end if;
  end if;
  return old;
end;
$$;
revoke all on function public.enqueue_storage_purge() from public, anon, authenticated;

drop trigger if exists trg_purge_athlete_photos on public.athletes;
create trigger trg_purge_athlete_photos after delete on public.athletes
  for each row execute function public.enqueue_storage_purge('athlete-photos', 'id');

drop trigger if exists trg_purge_user_photos on public.users;
create trigger trg_purge_user_photos after delete on public.users
  for each row execute function public.enqueue_storage_purge('user-photos', 'id');

drop trigger if exists trg_purge_event_banners on public.events;
create trigger trg_purge_event_banners after delete on public.events
  for each row execute function public.enqueue_storage_purge('event-banners', 'banner_url');

drop trigger if exists trg_purge_shop_photos on public.shop_products;
create trigger trg_purge_shop_photos after delete on public.shop_products
  for each row execute function public.enqueue_storage_purge('shop-photos', 'id');

drop trigger if exists trg_purge_session_media on public.training_sessions;
create trigger trg_purge_session_media after delete on public.training_sessions
  for each row execute function public.enqueue_storage_purge('session-media', 'id');

drop trigger if exists trg_purge_nutrition_pdf on public.nutrition_articles;
create trigger trg_purge_nutrition_pdf after delete on public.nutrition_articles
  for each row execute function public.enqueue_storage_purge('nutrition-pdfs', 'pdf_url');

drop trigger if exists trg_purge_event_receipts on public.event_registrations;
create trigger trg_purge_event_receipts after delete on public.event_registrations
  for each row execute function public.enqueue_storage_purge('event-receipts', 'receipt_url');

drop trigger if exists trg_purge_payment_receipts on public.payments;
create trigger trg_purge_payment_receipts after delete on public.payments
  for each row execute function public.enqueue_storage_purge('payment-receipts', 'receipt_url');

-- Kuyruk boş değilse Edge Function'ı tetikler (cron çağırır).
create or replace function public.trigger_storage_purge()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_project_url text := 'https://wzyyjilodsrwwqdjiqam.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eXlqaWxvZHNyd3dxZGppcWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTkwNDEsImV4cCI6MjEwNTA3NTA0MX0.Mdj3UIk1hMHi_MhITU84I99KZZ7Uj_c-abQIak9Kyu0';
begin
  if not exists (select 1 from public.storage_purge_queue) then return; end if;
  perform net.http_post(
    url := v_project_url || '/functions/v1/purge-storage-queue',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_anon_key, 'Authorization', 'Bearer ' || v_anon_key),
    body := '{}'::jsonb
  );
end;
$$;
revoke all on function public.trigger_storage_purge() from public, anon, authenticated;

select cron.schedule('purge-storage-queue', '*/10 * * * *', $$select public.trigger_storage_purge();$$);

-- 20260921200000 yer tutucu anahtarla uygulandı; doğru anahtarla yeniden tanım.
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

-- 1) storage_purge_queue: beslenme PDF'i yolu satırdaki serbest metinden (pdf_url)
-- türetiliyordu; bir kulüp yöneticisi başka kulübün dosya yolunu yazıp yazıyı
-- silerek o dosyayı sildirebilirdi. Artık yol, satırın KENDİ kulüp klasörüyle
-- (<club_id>/…) başlamıyorsa kuyruğa alınmaz.
create or replace function public.enqueue_storage_purge()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_bucket text := tg_argv[0];
  v_col text := tg_argv[1];
  v_val text;
  v_pos int;
  v_path text;
begin
  if v_col = 'id' then
    insert into public.storage_purge_queue (bucket, path) values (v_bucket, old.id::text);
  elsif v_col = 'banner_url' then
    if old.banner_url is not null then
      insert into public.storage_purge_queue (bucket, path) values (v_bucket, old.id::text);
    end if;
  elsif v_col = 'pdf_url' then
    v_val := old.pdf_url;
    v_pos := position('/nutrition-pdfs/' in coalesce(v_val, ''));
    if v_pos > 0 then
      v_path := split_part(substr(v_val, v_pos + length('/nutrition-pdfs/')), '?', 1);
      if old.club_id is not null and v_path like old.club_id::text || '/%' and v_path !~ '\.\.' then
        insert into public.storage_purge_queue (bucket, path, is_file) values (v_bucket, v_path, true);
      end if;
    end if;
  elsif v_col = 'receipt_url' then
    if (to_jsonb(old) ->> 'receipt_url') is not null then
      insert into public.storage_purge_queue (bucket, path) values (v_bucket, old.id::text);
    end if;
  end if;
  return old;
end;
$$;
revoke all on function public.enqueue_storage_purge() from public, anon, authenticated;

-- 2) Şikayet: kanıt metni sunucuda, gerçek kayıttan alınır (istemci sahte
-- mesaj/paylaşım metni yükleyemez); şikayet edilen kişi içeriğin gerçek sahibi
-- olmalı; kullanıcı başına günde en fazla 20 şikayet.
create or replace function public.submit_content_report(
  p_type text, p_content_id uuid, p_reported_user uuid, p_reason text, p_details text, p_snapshot text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.my_user_id();
  my_club uuid := public.current_club_id();
  rid uuid;
  v_snapshot text := null;
begin
  if me is null or my_club is null then raise exception 'not allowed'; end if;
  if p_reported_user = me then raise exception 'cannot report self'; end if;
  if not exists (select 1 from public.users u where u.id = p_reported_user and u.club_id = my_club) then
    raise exception 'user not found';
  end if;
  if (select count(*) from public.content_reports r
      where r.reporter_id = me and r.created_at > now() - interval '1 day') >= 20 then
    raise exception 'too many reports';
  end if;

  if p_type = 'message' then
    select m.body into v_snapshot from public.messages m
      where m.id = p_content_id and m.sender_id = p_reported_user and m.receiver_id = me;
    if not found then raise exception 'message not found'; end if;
  elsif p_type = 'social_post' then
    select sp.caption into v_snapshot from public.social_posts sp
      where sp.id = p_content_id and sp.author_id = p_reported_user and sp.club_id = my_club;
    if not found then raise exception 'post not found'; end if;
  elsif p_type <> 'user' then
    raise exception 'invalid type';
  end if;

  insert into public.content_reports (club_id, reporter_id, reported_user_id, content_type, content_id, content_snapshot, reason, details)
  values (my_club, me, p_reported_user, p_type, p_content_id, left(v_snapshot, 500), p_reason, left(p_details, 500))
  returning id into rid;
  return rid;
end;
$$;
revoke all on function public.submit_content_report(text, uuid, uuid, text, text, text) from public, anon;
grant execute on function public.submit_content_report(text, uuid, uuid, text, text, text) to authenticated;

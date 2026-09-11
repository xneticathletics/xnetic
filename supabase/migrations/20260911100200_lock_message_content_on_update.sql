-- messages_update_own (20260909150000_fix_self_row_check_performance.sql) allows
-- the RECEIVER of a message to UPDATE it (intended use: markMessagesRead() sets
-- read_at) but has no WITH CHECK clause. Per Postgres RLS semantics, omitting
-- WITH CHECK on an UPDATE policy reuses the USING expression as the check —
-- so the only real constraint is "receiver_id still equals me"; sender_id,
-- body, sent_at, and club_id are completely unconstrained. Found during the
-- full-app audit: a message recipient could silently rewrite what the sender
-- purportedly said, or reassign authorship, via a direct client update.
--
-- Fix: lock every column except read_at for anyone going through this path
-- (mirrors the project's established "lock non-transition columns" trigger
-- pattern, since RLS policies can't compare old vs new columns directly).
create or replace function public.messages_lock_content_on_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  new.club_id := old.club_id;
  new.sender_id := old.sender_id;
  new.receiver_id := old.receiver_id;
  new.body := old.body;
  new.sent_at := old.sent_at;
  return new;
end;
$$;

drop trigger if exists trg_messages_lock_content_on_update on public.messages;
create trigger trg_messages_lock_content_on_update
  before update on public.messages
  for each row execute function public.messages_lock_content_on_update();

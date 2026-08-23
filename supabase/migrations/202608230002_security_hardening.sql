-- Security hardening for privileged match/dispute RPCs.
-- These functions are SECURITY DEFINER, so every caller must be authorized explicitly.

create or replace function public.confirm_match_result(p_submission uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  s match_result_submissions%rowtype;
  m matches%rowtype;
  winner uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select * into s from match_result_submissions where id=p_submission for update;
  if not found then
    raise exception 'SUBMISSION_NOT_FOUND';
  end if;

  if not public.can_access_match(s.match_id) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  -- The original submitter cannot self-confirm their own result unless staff.
  if s.submitted_by=auth.uid() and not public.is_staff() then
    raise exception 'SECOND_PARTY_CONFIRMATION_REQUIRED';
  end if;

  select * into m from matches where id=s.match_id for update;
  if m.status<>'AWAITING_CONFIRMATION' then
    raise exception 'INVALID_MATCH_STATE';
  end if;

  winner:=case when s.team_a_score>s.team_b_score then m.team_a_id else m.team_b_id end;
  update match_result_submissions
    set confirmed_by=auth.uid(), confirmed_at=now()
    where id=p_submission and confirmed_at is null;
  if not found then
    raise exception 'RESULT_ALREADY_CONFIRMED';
  end if;

  update matches
    set status='COMPLETED', team_a_score=s.team_a_score, team_b_score=s.team_b_score,
        winner_team_id=winner, completed_at=now()
    where id=m.id;
end $$;

create or replace function public.open_match_dispute(p_submission uuid,p_reason text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  d uuid;
  mid uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;
  if p_reason is null or length(trim(p_reason))<3 then
    raise exception 'INVALID_DISPUTE_REASON';
  end if;

  select match_id into mid from match_result_submissions where id=p_submission;
  if mid is null then
    raise exception 'SUBMISSION_NOT_FOUND';
  end if;
  if not public.can_access_match(mid) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if not exists(select 1 from matches where id=mid and status='AWAITING_CONFIRMATION') then
    raise exception 'INVALID_MATCH_STATE';
  end if;

  insert into disputes(match_id,opened_by,reason)
    values(mid,auth.uid(),left(trim(p_reason),2000))
    returning id into d;
  update matches set status='DISPUTED' where id=mid and status='AWAITING_CONFIRMATION';
  return d;
end $$;

-- Do not expose privileged mutating RPCs to anonymous callers.
revoke execute on function public.confirm_match_result(uuid) from public, anon;
revoke execute on function public.open_match_dispute(uuid,text) from public, anon;
grant execute on function public.confirm_match_result(uuid) to authenticated;
grant execute on function public.open_match_dispute(uuid,text) to authenticated;

-- Replace the overly broad evidence-upload policy. The first path segment must be
-- a dispute UUID that the authenticated user can access through its match.
drop policy if exists "eligible dispute evidence" on storage.objects;
create policy "eligible dispute evidence" on storage.objects
for insert to authenticated
with check (
  bucket_id='dispute-evidence'
  and (storage.foldername(name))[1] is not null
  and exists (
    select 1
    from public.disputes d
    where d.id=((storage.foldername(name))[1])::uuid
      and public.can_access_match(d.match_id)
  )
);

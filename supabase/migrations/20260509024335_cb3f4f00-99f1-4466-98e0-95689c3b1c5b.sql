
create table public.league_not_found_events (
  id uuid primary key default gen_random_uuid(),
  param text not null,
  param_type text not null check (param_type in ('uuid','slug','empty')),
  referrer text,
  path text,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table public.league_not_found_events enable row level security;

create policy "anyone can log league not found"
on public.league_not_found_events
for insert
to anon, authenticated
with check (true);

create policy "admins can read league not found logs"
on public.league_not_found_events
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create index idx_lnf_created_at on public.league_not_found_events (created_at desc);
create index idx_lnf_param on public.league_not_found_events (param);

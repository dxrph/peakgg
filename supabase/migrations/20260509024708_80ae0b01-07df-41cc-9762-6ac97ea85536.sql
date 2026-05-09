
delete from public.league_registrations lr
using public.teams t
where lr.team_id = t.id
  and t.is_demo = true;

-- Also clean any standings rows tied to removed demo teams
delete from public.league_standings ls
using public.teams t
where ls.team_id = t.id
  and t.is_demo = true;

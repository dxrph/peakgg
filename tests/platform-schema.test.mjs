import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const migrationPath = 'supabase/migrations/202608230001_peakgg_platform.sql';

test('platform migration defines every required entity with RLS', () => {
  const sql = readFileSync(migrationPath, 'utf8').toLowerCase();
  const tables = ['profiles','user_roles','teams','team_members','team_invites','team_applications','seasons','tournaments','tournament_registrations','tournament_roster_members','matches','match_ready_states','match_player_participation','match_result_submissions','match_room_messages','disputes','dispute_evidence','tournament_point_events','notifications','admin_announcements','admin_audit_logs'];
  for (const table of tables) {
    assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test('platform migration defines protected transactional operations', () => {
  const sql = readFileSync(migrationPath, 'utf8').toLowerCase();
  for (const operation of ['register_tournament_team','check_in_tournament_team','confirm_match_result','open_match_dispute','transition_tournament','promote_waitlisted_team']) {
    assert.match(sql, new RegExp(`function public\\.${operation}`));
  }
  assert.match(sql, /security definer/);
  assert.match(sql, /insert into public\.admin_audit_logs/);
});

test('migration creates the four required storage buckets and targeted indexes', () => {
  const sql = readFileSync(migrationPath, 'utf8').toLowerCase();
  for (const bucket of ['avatars','team-logos','tournament-banners','dispute-evidence']) assert.match(sql, new RegExp(`'${bucket}'`));
  for (const index of ['profiles_username','teams_slug','team_members_user','tournaments_slug','tournaments_status','registrations_tournament_team','matches_tournament_status','notifications_user_read','tp_season_team_player','disputes_status']) assert.match(sql, new RegExp(`index[^;]*${index}`));
});

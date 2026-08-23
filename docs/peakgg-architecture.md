# PeakGG Platform Architecture

## Route map

Public routes are `/`, `/play`, `/tournaments`, `/tournaments/[slug]`, `/teams`, `/teams/[slug]`, `/players`, `/players/[username]`, `/leaderboard`, `/ranks`, `/about`, `/privacy`, and `/terms`. Authentication routes are `/login`, `/register`, `/forgot-password`, and `/onboarding`. Authenticated product routes are `/profile`, `/teams/create`, `/dashboard`, `/dashboard/team`, `/dashboard/tournaments`, `/dashboard/matches`, `/dashboard/notifications`, `/settings`, and `/matches/[id]`. Staff routes live under `/admin` with tournament, match, dispute, user, team, announcement, and audit subroutes defined by the master specification.

## Runtime architecture

PeakGG uses the Next App Router through vinext, React server components for public/data-reading surfaces, and narrowly scoped client components for forms, filters, menus, dialogs, realtime chat, and optimistic interaction. Supabase provides email/password authentication, Postgres, Row Level Security, Realtime, and Storage. Browser clients use the anonymous key only. Privileged mutations are performed by database functions protected by `auth.uid()` and stored roles; no service-role key is shipped to the browser.

When Supabase environment variables are absent, public pages render honest empty states and authentication/product mutations show a configuration error. No mock account, match, leaderboard, or registration data enters production code paths.

## Authentication and authorization

Authentication is email/password through Supabase Auth. Registration redirects to `/onboarding`; login preserves a validated internal `next` URL. Middleware refreshes sessions and protects authenticated and admin route prefixes. Database authorization is authoritative.

Application roles are `USER`, `MODERATOR`, `ADMIN`, and `SUPER_ADMIN`, stored in `user_roles`. Staff access checks query this table. Email addresses never imply privileges.

## Team permissions

`team_members` separates leadership (`CAPTAIN`, `CO_CAPTAIN`, `MEMBER`) from roster slot (`STARTER`, `SUBSTITUTE`). A partial unique index ensures one active competitive team per player. Captains and co-captains manage invites, applications, recruiting, and roster slots. Only captains transfer captaincy or disband. Team membership mutations use security-definer database functions with capacity and authorization checks.

## Tournament state machine

Allowed states are `DRAFT → PUBLISHED → REGISTRATION_OPEN → REGISTRATION_CLOSED → CHECK_IN → LIVE → COMPLETED → ARCHIVED`. Staff-only database functions validate each transition and create audit events. Backward or skipped transitions are rejected except explicit super-admin overrides recorded in the audit log.

## Registration state machine

Registration states are `PENDING`, `REGISTERED`, `WAITLISTED`, `CHECKED_IN`, `WITHDRAWN`, `REJECTED`, `NO_SHOW`, and `DISQUALIFIED`. Registration is created transactionally after validating leadership, tournament state, region, capacity, roster count, uniqueness, and duplicate entry. Roster members are snapshots. Leaders can edit them before `roster_lock_at`; staff corrections after lock require an audit reason.

## Match lifecycle

Matches move through `UPCOMING`, `READY`, `LIVE`, `AWAITING_CONFIRMATION`, `COMPLETED`, `DISPUTED`, and `FORFEIT`. Eligible leaders mark readiness. A leader submits scores and five participating players; the opponent confirms or opens a dispute. Confirmation runs transactionally: verify the result, complete the match, set the winner, advance the bracket, record participation, and award Tournament Points. Disputes pause advancement until audited staff resolution.

## Tournament Points

TP is an append-only ledger in `tournament_point_events`. Base awards are match win 10, quarterfinal 15, semifinal 30, runner-up 60, and tournament win 100. Multipliers are Community/Open 1.00, Premier 1.25, Peak League 1.50, and Championship 2.00. Team awards apply to the eligible team. Player match-win awards require recorded participation; placement awards require participation in at least one verified match. Reversals retain the original event and set reversal metadata.

## Admin permissions

Moderators can inspect and moderate match/dispute operations granted by policy. Admins manage tournaments, registrations, brackets, matches, announcements, users, and teams. Super admins alone can ban accounts, change roles, or override brackets with verified results. Every privileged mutation affecting users, teams, registrations, rosters, brackets, scores, winners, disputes, or TP inserts an immutable audit record.

## Database entities

Identity: `profiles`, `user_roles`. Teams: `teams`, `team_members`, `team_invites`, `team_applications`. Competition: `seasons`, `tournaments`, `tournament_registrations`, `tournament_roster_members`, `matches`, `match_ready_states`, `match_player_participation`, `match_result_submissions`, `match_room_messages`, `disputes`, `dispute_evidence`, `tournament_point_events`. Product communication and control: `notifications`, `notification_preferences`, `admin_announcements`, `admin_audit_logs`.

## RLS overview

Published tournaments, public profiles and teams, published brackets/matches, seasons, and leaderboard ledger projections are publicly readable. Users update only their own profile. Team and tournament writes require membership/leadership predicates. Match room records require a roster-participant or staff predicate. Staff writes require stored roles. Audit logs allow staff reads and privileged inserts but no updates or deletes. Sensitive dispute evidence uses private storage and signed URLs.

## Storage

Buckets are `avatars`, `team-logos`, `tournament-banners`, and private `dispute-evidence`. Object policies enforce profile ownership, team leadership, staff role, and match eligibility respectively.

## Error and empty-state policy

Every async surface has loading, success, empty, and error states. Missing external configuration is explicit and non-deceptive. Mutations return field errors next to fields and use toasts only for transient confirmation. Destructive operations require accessible confirmation dialogs.

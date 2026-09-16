# PeakGG Local Setup

## Requirements

- Node.js 22.13 or newer
- npm
- Supabase CLI
- A local or hosted Supabase project

## Install and configure

```powershell
npm install
Copy-Item .env.example .env.local
```

Set the public URL and anonymous key in `.env.local`. Never place a service-role key in a `NEXT_PUBLIC_` variable.

## Local Supabase

```powershell
supabase start
supabase db reset
```

`supabase db reset` is for the local development database only. Do not run it against production. To apply migrations to an existing linked project after review:

```powershell
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Run the application

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Verification

```powershell
npm test
npm run lint
npm run build
git diff --check
```

## First administrator

Create a normal account, then assign its role through a trusted SQL session. Never add email-based role logic to application code.

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID', 'SUPER_ADMIN')
on conflict (user_id) do update set role = excluded.role;
```



## Authentication callback configuration

The SSR authentication flow now uses `/auth/callback` to exchange PKCE codes.
Set `NEXT_PUBLIC_SITE_URL` to the actual origin of this environment. Configure
the corresponding callback URLs, including required return query parameters,
in Supabase Auth redirect allowlists before testing email confirmation/recovery.
Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(or the existing legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Never use a service
role/secret key in a public variable. The local config does not modify production.

Do not apply the current migration history to an existing database until the
schema mismatch documented in `peakgg-audit-2026-09-16.md` is resolved.

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

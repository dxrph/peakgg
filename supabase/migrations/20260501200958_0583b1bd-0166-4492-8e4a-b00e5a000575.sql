
-- Banned users table for admin moderation
CREATE TABLE IF NOT EXISTS public.banned_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  banned_by uuid NOT NULL,
  reason text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  lifted_at timestamptz,
  lifted_by uuid
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bans"
ON public.banned_users
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Users can see if they are banned"
ON public.banned_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS banned_users_active_idx ON public.banned_users (user_id) WHERE lifted_at IS NULL;
CREATE INDEX IF NOT EXISTS admin_actions_created_idx ON public.admin_actions (created_at DESC);

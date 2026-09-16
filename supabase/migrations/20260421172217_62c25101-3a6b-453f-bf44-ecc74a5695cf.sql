
-- ============ PROFILES: add preferred_game ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_game text CHECK (preferred_game IN ('valorant','cs2','r6s'));

-- ============ USER ROLES (secure admin system) ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TEAMS: unique name + tag length ============
DO $$ BEGIN
  ALTER TABLE public.teams ADD CONSTRAINT teams_name_unique UNIQUE (name);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.teams ADD CONSTRAINT teams_tag_length CHECK (char_length(tag) <= 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TOURNAMENTS: only admins can create ============
DROP POLICY IF EXISTS "Authenticated can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can create tournaments" ON public.tournaments;
CREATE POLICY "Admins can create tournaments" ON public.tournaments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Creator can update tournament" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON public.tournaments;
CREATE POLICY "Admins can update tournaments" ON public.tournaments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ MATCHES: admin-only updates ============
DROP POLICY IF EXISTS "Players can update own matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can update matches" ON public.matches;
CREATE POLICY "Admins can update matches" ON public.matches
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ TOURNAMENT REGISTRATIONS (new) ============
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, team_id)
);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view registrations" ON public.tournament_registrations;
CREATE POLICY "Anyone can view registrations" ON public.tournament_registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Team owner can register" ON public.tournament_registrations;
CREATE POLICY "Team owner can register" ON public.tournament_registrations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id AND t.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Team owner can withdraw" ON public.tournament_registrations;
CREATE POLICY "Team owner can withdraw" ON public.tournament_registrations
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id AND t.owner_id = auth.uid()
  ));

-- ============ LFP BOARD ============
CREATE TABLE IF NOT EXISTS public.lfp_board (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('lft','lfp')),
  game text NOT NULL CHECK (game IN ('valorant','cs2','r6s')),
  rank text,
  message text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lfp_board ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lfp" ON public.lfp_board;
CREATE POLICY "Anyone can view lfp" ON public.lfp_board
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User can create lfp" ON public.lfp_board;
CREATE POLICY "User can create lfp" ON public.lfp_board
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User can update own lfp" ON public.lfp_board;
CREATE POLICY "User can update own lfp" ON public.lfp_board
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User can delete own lfp" ON public.lfp_board;
CREATE POLICY "User can delete own lfp" ON public.lfp_board
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ PEAK COINS TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS public.peak_coins_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.peak_coins_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view own transactions" ON public.peak_coins_transactions;
CREATE POLICY "Owner can view own transactions" ON public.peak_coins_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.peak_coins_transactions;
CREATE POLICY "Admins can view all transactions" ON public.peak_coins_transactions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- No INSERT/UPDATE/DELETE policies => only service role can write

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view notifications" ON public.notifications;
CREATE POLICY "Owner can view notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner can update notifications" ON public.notifications;
CREATE POLICY "Owner can update notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner can delete notifications" ON public.notifications;
CREATE POLICY "Owner can delete notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_profiles_elo ON public.profiles (elo DESC);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches (tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON public.tournament_registrations (tournament_id);
CREATE INDEX IF NOT EXISTS idx_lfp_board_game_active ON public.lfp_board (game, is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON public.chat_messages (channel_id, created_at);

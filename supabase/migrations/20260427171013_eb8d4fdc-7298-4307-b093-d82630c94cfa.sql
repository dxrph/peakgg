
-- 1) Create player_stats table (per-game ELO + stats)
CREATE TABLE IF NOT EXISTS public.player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game text NOT NULL CHECK (game IN ('valorant','cs2','r6s')),
  elo integer NOT NULL DEFAULT 1000,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  win_streak integer NOT NULL DEFAULT 0,
  best_win_streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game)
);

CREATE INDEX IF NOT EXISTS idx_player_stats_game_elo ON public.player_stats (game, elo DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_user ON public.player_stats (user_id);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Public can SELECT
CREATE POLICY "Anyone can view player_stats"
  ON public.player_stats FOR SELECT
  USING (true);

-- INSERT/UPDATE only via service role (Edge Functions). No client-side write policies.

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_player_stats_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_player_stats_updated_at ON public.player_stats;
CREATE TRIGGER trg_player_stats_updated_at
BEFORE UPDATE ON public.player_stats
FOR EACH ROW EXECUTE FUNCTION public.touch_player_stats_updated_at();

-- 2) Auto-create 3 player_stats rows when a profile is created
CREATE OR REPLACE FUNCTION public.create_player_stats_for_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.player_stats (user_id, game, elo)
  VALUES
    (NEW.id, 'valorant', 1000),
    (NEW.id, 'cs2', 1000),
    (NEW.id, 'r6s', 1000)
  ON CONFLICT (user_id, game) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_player_stats ON public.profiles;
CREATE TRIGGER trg_create_player_stats
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_player_stats_for_profile();

-- 3) Backfill: create rows for existing profiles
INSERT INTO public.player_stats (user_id, game, elo)
SELECT p.id, g.game, 1000
FROM public.profiles p
CROSS JOIN (VALUES ('valorant'),('cs2'),('r6s')) AS g(game)
ON CONFLICT (user_id, game) DO NOTHING;

-- 4) Migrate any existing 'r6' references to 'r6s' across tables that store game id
UPDATE public.scrims SET game = 'r6s' WHERE game = 'r6';
UPDATE public.tournaments SET game = 'r6s' WHERE game = 'r6';
UPDATE public.teams SET game = 'r6s' WHERE game = 'r6';
UPDATE public.matches SET game = 'r6s' WHERE game = 'r6';
UPDATE public.chat_channels SET game = 'r6s' WHERE game = 'r6';
UPDATE public.lfp_board SET game = 'r6s' WHERE game = 'r6';
UPDATE public.profiles SET preferred_game = 'r6s' WHERE preferred_game = 'r6';

-- 5) Drop legacy per-game stats columns from profiles (clean reset)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS elo,
  DROP COLUMN IF EXISTS rank,
  DROP COLUMN IF EXISTS tournament_points;

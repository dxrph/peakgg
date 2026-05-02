
-- 1. TEAMS: aggiungi campi mancanti
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS rank text,
  ADD COLUMN IF NOT EXISTS region text DEFAULT 'EU',
  ADD COLUMN IF NOT EXISTS looking_for_players boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS slots integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS trophies integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#7C3AED';

UPDATE public.teams SET region = 'EU' WHERE region IS NULL;
UPDATE public.teams SET trophies = 0 WHERE trophies IS NULL;

-- 2. PROFILES: aggiungi campi mancanti
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS looking_for_team boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trophies integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS game text,
  ADD COLUMN IF NOT EXISTS rank text,
  ADD COLUMN IF NOT EXISTS role text;

-- 3. SCRIMS: estendi per sistema team-vs-team
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS challenger_team_id uuid,
  ADD COLUMN IF NOT EXISTS target_team_id uuid,
  ADD COLUMN IF NOT EXISTS accepted_team_id uuid;

-- popola challenger_team_id con team_id per backfill (non rompere dati esistenti)
UPDATE public.scrims SET challenger_team_id = team_id WHERE challenger_team_id IS NULL;

-- 4. TEAM_JOIN_REQUESTS
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can create own join request"
  ON public.team_join_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User sees own requests, owner sees team's"
  ON public.team_join_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
  );

CREATE POLICY "Team owner updates request status"
  ON public.team_join_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));

CREATE POLICY "User can cancel own request"
  ON public.team_join_requests FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. RECRUITMENT_MESSAGES
CREATE TABLE IF NOT EXISTS public.recruitment_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender can insert message"
  ON public.recruitment_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Sender or receiver can read"
  ON public.recruitment_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Receiver can mark read"
  ON public.recruitment_messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 6. TRIGGER: ricalcola trofei team
CREATE OR REPLACE FUNCTION public.recalculate_team_trophies()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_total integer;
BEGIN
  v_team_id := COALESCE(NEW.team_id, OLD.team_id);
  SELECT COALESCE(SUM(p.trophies), 0) INTO v_total
  FROM public.team_members tm
  JOIN public.profiles p ON p.id = tm.user_id
  WHERE tm.team_id = v_team_id;
  UPDATE public.teams SET trophies = v_total WHERE id = v_team_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_team_members_trophies ON public.team_members;
CREATE TRIGGER trg_team_members_trophies
  AFTER INSERT OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_team_trophies();

-- Indici utili
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team ON public.team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_user ON public.team_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_messages_receiver ON public.recruitment_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_scrims_status ON public.scrims(status);
CREATE INDEX IF NOT EXISTS idx_teams_looking ON public.teams(looking_for_players) WHERE looking_for_players = true;

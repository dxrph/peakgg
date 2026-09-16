
-- Profiles extras
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS warn_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS ban_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS reputation_score numeric(3,2) NOT NULL DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS fast_track boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fast_track_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Tournaments extras
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS bo text NOT NULL DEFAULT 'BO1',
  ADD COLUMN IF NOT EXISTS bracket_type text NOT NULL DEFAULT 'single_elim',
  ADD COLUMN IF NOT EXISTS map_mode text NOT NULL DEFAULT 'random',
  ADD COLUMN IF NOT EXISTS map_pool text[] DEFAULT ARRAY['Ascent','Breeze','Fracture','Haven','Lotus','Pearl','Split'],
  ADD COLUMN IF NOT EXISTS fixed_map text,
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS entry_cost_coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_trophies integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_badge text,
  ADD COLUMN IF NOT EXISTS reward_banner text,
  ADD COLUMN IF NOT EXISTS seeding_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rank_max integer DEFAULT 9999;

-- tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid,
  reporter_id uuid NOT NULL,
  reported_player_id uuid,
  type text NOT NULL CHECK (type IN ('cheat','bug','abuse','impersonation','wrong_result','other')),
  description text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','rejected')),
  admin_notes text,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporter or staff sees tickets" ON public.tickets FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR auth.uid() = reported_player_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
    OR public.has_role(auth.uid(), 'organizer'::app_role));
CREATE POLICY "Authed creates ticket" ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Mods update tickets" ON public.tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins delete tickets" ON public.tickets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter ON public.tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reported ON public.tickets(reported_player_id);

-- admin_logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff reads admin logs" ON public.admin_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
    OR public.has_role(auth.uid(), 'organizer'::app_role));
CREATE POLICY "Staff writes admin logs" ON public.admin_logs FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
    OR public.has_role(auth.uid(), 'organizer'::app_role)));
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);

-- announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  urgent boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads announcements" ON public.announcements FOR SELECT TO public
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Mods create announcements" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)));
CREATE POLICY "Mods update announcements" ON public.announcements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins delete announcements" ON public.announcements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- reputation_votes
CREATE TABLE IF NOT EXISTS public.reputation_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid NOT NULL,
  player_id uuid NOT NULL,
  match_id uuid NOT NULL,
  communication smallint NOT NULL CHECK (communication BETWEEN 1 AND 5),
  fairplay smallint NOT NULL CHECK (fairplay BETWEEN 1 AND 5),
  punctuality smallint NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (voter_id, player_id, match_id)
);
ALTER TABLE public.reputation_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reputation" ON public.reputation_votes FOR SELECT TO public USING (true);
CREATE POLICY "Voter inserts own vote" ON public.reputation_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = voter_id AND voter_id <> player_id);
CREATE POLICY "Admins delete votes" ON public.reputation_votes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- player_reports
CREATE TABLE IF NOT EXISTS public.player_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  reason text NOT NULL,
  auto_flagged boolean NOT NULL DEFAULT false,
  flag_type text CHECK (flag_type IN ('smurf','winrate_anomaly','ip_duplicate','manual')),
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.player_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff reads player reports" ON public.player_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Staff create player reports" ON public.player_reports FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Staff update player reports" ON public.player_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

-- messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Sender sends" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver marks read" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- tournament_waitlist
CREATE TABLE IF NOT EXISTS public.tournament_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  team_id uuid NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, team_id)
);
ALTER TABLE public.tournament_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads waitlist" ON public.tournament_waitlist FOR SELECT TO public USING (true);
CREATE POLICY "Team owner joins waitlist" ON public.tournament_waitlist FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = tournament_waitlist.team_id AND t.owner_id = auth.uid()));
CREATE POLICY "Owner or staff removes from waitlist" ON public.tournament_waitlist FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = tournament_waitlist.team_id AND t.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'organizer'::app_role));

-- updated_at helper + ticket trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_tickets_updated ON public.tickets;
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Reputation auto-recalc
CREATE OR REPLACE FUNCTION public.recalc_reputation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_avg numeric; v_target uuid;
BEGIN
  v_target := COALESCE(NEW.player_id, OLD.player_id);
  SELECT AVG((communication + fairplay + punctuality)::numeric / 3.0)
    INTO v_avg FROM public.reputation_votes WHERE player_id = v_target;
  UPDATE public.profiles SET reputation_score = COALESCE(v_avg, 5.00) WHERE id = v_target;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_recalc_reputation ON public.reputation_votes;
CREATE TRIGGER trg_recalc_reputation
AFTER INSERT OR UPDATE OR DELETE ON public.reputation_votes
FOR EACH ROW EXECUTE FUNCTION public.recalc_reputation();

-- Storage bucket private
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-screenshots', 'ticket-screenshots', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authed upload own ticket screenshots" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner or staff reads ticket screenshots" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ticket-screenshots' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)));
CREATE POLICY "Mods delete ticket screenshots" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ticket-screenshots' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)));


-- 1. matches additions
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS lobby_code text,
  ADD COLUMN IF NOT EXISTS server_info text;

-- 2. league_seasons additions
ALTER TABLE public.league_seasons
  ADD COLUMN IF NOT EXISTS playoffs_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS champion_team_id uuid;

-- 3. team_chat_messages
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'general' CHECK (channel IN ('general','match_prep','announcements')),
  user_id uuid NOT NULL,
  content text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_chat_team_channel ON public.team_chat_messages(team_id, channel, created_at DESC);
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_chat_messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Members read team chat" ON public.team_chat_messages;
CREATE POLICY "Members read team chat" ON public.team_chat_messages FOR SELECT TO authenticated
  USING (is_team_member(auth.uid(), team_id) OR has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Members post team chat" ON public.team_chat_messages;
CREATE POLICY "Members post team chat" ON public.team_chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_team_member(auth.uid(), team_id));

DROP POLICY IF EXISTS "Captain or author updates team chat" ON public.team_chat_messages;
CREATE POLICY "Captain or author updates team chat" ON public.team_chat_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_team_captain(auth.uid(), team_id))
  WITH CHECK (user_id = auth.uid() OR is_team_captain(auth.uid(), team_id));

DROP POLICY IF EXISTS "Captain or author deletes team chat" ON public.team_chat_messages;
CREATE POLICY "Captain or author deletes team chat" ON public.team_chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_team_captain(auth.uid(), team_id) OR has_role(auth.uid(),'admin'));

-- 4. match_chat_messages
CREATE TABLE IF NOT EXISTS public.match_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_match_chat_match ON public.match_chat_messages(match_id, created_at DESC);
ALTER TABLE public.match_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_chat_messages REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.can_access_match_chat(_user_id uuid, _match_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM matches m
    WHERE m.id = _match_id
      AND (
        is_team_member(_user_id, m.team_a_id)
        OR is_team_member(_user_id, m.team_b_id)
      )
  ) OR has_role(_user_id, 'admin') OR has_role(_user_id, 'moderator');
$$;

DROP POLICY IF EXISTS "Participants read match chat" ON public.match_chat_messages;
CREATE POLICY "Participants read match chat" ON public.match_chat_messages FOR SELECT TO authenticated
  USING (can_access_match_chat(auth.uid(), match_id));

DROP POLICY IF EXISTS "Participants post match chat" ON public.match_chat_messages;
CREATE POLICY "Participants post match chat" ON public.match_chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND can_access_match_chat(auth.uid(), match_id));

DROP POLICY IF EXISTS "Author or admin deletes match chat" ON public.match_chat_messages;
CREATE POLICY "Author or admin deletes match chat" ON public.match_chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

-- 5. match_ready_checks
CREATE TABLE IF NOT EXISTS public.match_ready_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  ready boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, team_id)
);
ALTER TABLE public.match_ready_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_ready_checks REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Anyone reads ready checks" ON public.match_ready_checks;
CREATE POLICY "Anyone reads ready checks" ON public.match_ready_checks FOR SELECT TO authenticated USING (true);

-- writes done via RPC only; no direct insert/update/delete policies needed

-- 6. set_match_ready RPC
CREATE OR REPLACE FUNCTION public.set_match_ready(_match_id uuid, _ready boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m record; v_team uuid; v_a_ready boolean; v_b_ready boolean;
BEGIN
  SELECT * INTO m FROM matches WHERE id = _match_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF is_team_captain(auth.uid(), m.team_a_id) THEN v_team := m.team_a_id;
  ELSIF is_team_captain(auth.uid(), m.team_b_id) THEN v_team := m.team_b_id;
  ELSE RAISE EXCEPTION 'Only captains can ready up'; END IF;

  INSERT INTO match_ready_checks (match_id, team_id, user_id, ready, updated_at)
  VALUES (_match_id, v_team, auth.uid(), _ready, now())
  ON CONFLICT (match_id, team_id) DO UPDATE
    SET ready = _ready, user_id = auth.uid(), updated_at = now();

  SELECT COALESCE(BOOL_OR(ready),false) INTO v_a_ready FROM match_ready_checks WHERE match_id = _match_id AND team_id = m.team_a_id;
  SELECT COALESCE(BOOL_OR(ready),false) INTO v_b_ready FROM match_ready_checks WHERE match_id = _match_id AND team_id = m.team_b_id;

  IF v_a_ready AND v_b_ready AND m.result_status = 'scheduled' THEN
    UPDATE matches SET result_status = 'live', status = 'in_progress' WHERE id = _match_id;
  ELSIF (NOT (v_a_ready AND v_b_ready)) AND m.result_status = 'live' THEN
    UPDATE matches SET result_status = 'scheduled', status = 'pending' WHERE id = _match_id;
  END IF;
END; $$;

-- 7. start_playoffs RPC: top 4 → SF (1v4, 2v3) + GF
CREATE OR REPLACE FUNCTION public.start_playoffs(_season_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_div uuid; v_game text; v_top uuid[]; v_sf1 uuid; v_sf2 uuid; v_gf uuid;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT id INTO v_div FROM league_divisions WHERE season_id = _season_id ORDER BY tier ASC LIMIT 1;
  IF v_div IS NULL THEN RAISE EXCEPTION 'No division for season'; END IF;
  SELECT l.game INTO v_game FROM league_seasons s JOIN leagues l ON l.id = s.league_id WHERE s.id = _season_id;

  SELECT array_agg(team_id ORDER BY position ASC) INTO v_top
  FROM (SELECT team_id, position FROM league_standings WHERE division_id = v_div AND position IS NOT NULL ORDER BY position ASC LIMIT 4) t;

  IF v_top IS NULL OR array_length(v_top,1) < 4 THEN RAISE EXCEPTION 'Need at least 4 ranked teams'; END IF;

  -- clean previous playoff matches if any
  DELETE FROM matches WHERE season_id = _season_id AND matchday >= 999 AND result_status = 'scheduled';

  -- Grand final placeholder
  INSERT INTO matches (game, season_id, division_id, matchday, bracket_position, result_status, status)
  VALUES (v_game, _season_id, v_div, 1001, 1, 'scheduled', 'pending')
  RETURNING id INTO v_gf;

  -- SF1: 1 vs 4 → next slot a
  INSERT INTO matches (game, season_id, division_id, matchday, bracket_position, team_a_id, team_b_id,
    next_match_id, next_match_slot, result_status, status)
  VALUES (v_game, _season_id, v_div, 999, 1, v_top[1], v_top[4], v_gf, 'a', 'scheduled', 'pending')
  RETURNING id INTO v_sf1;

  -- SF2: 2 vs 3 → next slot b
  INSERT INTO matches (game, season_id, division_id, matchday, bracket_position, team_a_id, team_b_id,
    next_match_id, next_match_slot, result_status, status)
  VALUES (v_game, _season_id, v_div, 999, 2, v_top[2], v_top[3], v_gf, 'b', 'scheduled', 'pending')
  RETURNING id INTO v_sf2;

  UPDATE league_seasons SET playoffs_started_at = now(), status = 'playoffs' WHERE id = _season_id;
END; $$;

-- 8. award_league_champion
CREATE OR REPLACE FUNCTION public.award_league_champion(_season_id uuid, _team_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_league_name text;
BEGIN
  SELECT l.name INTO v_league_name FROM league_seasons s JOIN leagues l ON l.id = s.league_id WHERE s.id = _season_id;
  UPDATE league_seasons SET champion_team_id = _team_id, status = 'completed' WHERE id = _season_id;
  INSERT INTO trophies (team_id, season_id, kind, label)
  VALUES (_team_id, _season_id, 'champion', '🏆 ' || COALESCE(v_league_name,'Peak League') || ' Champion');
  -- Notify members
  INSERT INTO notifications (user_id, title, message)
  SELECT tm.user_id, '🏆 League Champion!', 'Your team won ' || COALESCE(v_league_name,'the league') || '!'
  FROM team_members tm WHERE tm.team_id = _team_id;
END; $$;

-- 9. Update advance_bracket_winner to also support league grand finals
CREATE OR REPLACE FUNCTION public.advance_bracket_winner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL
     AND (OLD.status IS DISTINCT FROM 'completed' OR OLD.winner_id IS DISTINCT FROM NEW.winner_id) THEN

    IF NEW.next_match_id IS NOT NULL THEN
      IF NEW.next_match_slot = 'a' THEN
        UPDATE public.matches SET team_a_id = NEW.winner_id WHERE id = NEW.next_match_id;
      ELSE
        UPDATE public.matches SET team_b_id = NEW.winner_id WHERE id = NEW.next_match_id;
      END IF;
    ELSE
      -- Final completed
      IF NEW.tournament_id IS NOT NULL THEN
        PERFORM public.award_tournament_prizes(NEW.tournament_id);
      ELSIF NEW.season_id IS NOT NULL AND NEW.matchday >= 1000 THEN
        PERFORM public.award_league_champion(NEW.season_id, NEW.winner_id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advance_bracket_winner ON public.matches;
CREATE TRIGGER trg_advance_bracket_winner
AFTER UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.advance_bracket_winner();

-- 10. Realtime
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='team_chat_messages';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_messages; END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='match_chat_messages';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.match_chat_messages; END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='match_ready_checks';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.match_ready_checks; END IF;
END $$;

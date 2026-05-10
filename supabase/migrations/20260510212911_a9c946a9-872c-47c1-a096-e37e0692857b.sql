
-- 1) New tables --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.competitive_queue_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('open_cup','ranked')),
  game text NOT NULL,
  created_by uuid NOT NULL,
  permanent_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('solo','party','team')),
  desired_team_size integer NOT NULL CHECK (desired_team_size BETWEEN 1 AND 5),
  current_party_size integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','matched','cancelled','expired')),
  match_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cqg_status_mode_game
  ON public.competitive_queue_groups(status, mode, game);

CREATE TABLE IF NOT EXISTS public.competitive_queue_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.competitive_queue_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('captain','player','fill')),
  accepted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_cqgm_user ON public.competitive_queue_group_members(user_id);

ALTER TABLE public.competitive_queue_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitive_queue_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own group" ON public.competitive_queue_groups;
CREATE POLICY "Members read own group" ON public.competitive_queue_groups
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.competitive_queue_group_members m
    WHERE m.group_id = competitive_queue_groups.id AND m.user_id = auth.uid()
  )
  OR has_role(auth.uid(),'admin')
);

DROP POLICY IF EXISTS "Owner cancels own group" ON public.competitive_queue_groups;
CREATE POLICY "Owner cancels own group" ON public.competitive_queue_groups
FOR DELETE TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Members read members" ON public.competitive_queue_group_members;
CREATE POLICY "Members read members" ON public.competitive_queue_group_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.competitive_queue_group_members m2
    WHERE m2.group_id = competitive_queue_group_members.group_id AND m2.user_id = auth.uid()
  )
  OR has_role(auth.uid(),'admin')
);

-- Inserts/updates for groups + members are only via SECURITY DEFINER RPCs below.

-- 2) Extend match_rosters ----------------------------------------------------

ALTER TABLE public.match_rosters
  ADD COLUMN IF NOT EXISTS side text CHECK (side IN ('A','B')),
  ADD COLUMN IF NOT EXISTS is_fill boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS joined_from text CHECK (joined_from IN ('solo','party','team')),
  ADD COLUMN IF NOT EXISTS queue_group_id uuid;

ALTER TABLE public.match_rosters ALTER COLUMN team_id DROP NOT NULL;

-- Backfill side for existing queue matches (where two synthetic team_ids exist)
UPDATE public.match_rosters mr
SET side = sub.side
FROM (
  SELECT mr2.id,
         CASE WHEN m.team_a_id = mr2.team_id THEN 'A'
              WHEN m.team_b_id = mr2.team_id THEN 'B'
              ELSE NULL END AS side
  FROM public.match_rosters mr2
  JOIN public.matches m ON m.id = mr2.match_id
  WHERE mr2.side IS NULL
) sub
WHERE mr.id = sub.id AND sub.side IS NOT NULL;

-- 3) Cancel/cleanup helper ---------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_queue_group(_group_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  g record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO g FROM competitive_queue_groups WHERE id = _group_id;
  IF g IS NULL THEN RETURN; END IF;
  IF g.created_by <> v_uid AND NOT has_role(v_uid,'admin') THEN
    RAISE EXCEPTION 'Only the group owner can cancel';
  END IF;
  UPDATE competitive_queue_groups SET status='cancelled', updated_at=now() WHERE id=_group_id;
END
$$;
GRANT EXECUTE ON FUNCTION public.cancel_queue_group(uuid) TO authenticated;

-- 4) enqueue_solo: thin wrapper that records group + delegates to existing matchmaker

CREATE OR REPLACE FUNCTION public.enqueue_solo(_mode text, _game text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_team_size integer;
  v_result jsonb;
  v_match_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'You must be signed in to join the queue'; END IF;
  IF _mode NOT IN ('open_cup','ranked') THEN RAISE EXCEPTION 'Invalid mode'; END IF;

  -- Read team size from platform_settings, default to 1 (current beta)
  SELECT COALESCE((value->>'team_size')::int, 1) INTO v_team_size
  FROM platform_settings WHERE key = 'competitive_queue_config';
  IF v_team_size IS NULL THEN v_team_size := 1; END IF;

  -- One active queue per user
  IF EXISTS (
    SELECT 1 FROM competitive_queue_groups g
    JOIN competitive_queue_group_members m ON m.group_id = g.id
    WHERE m.user_id = v_uid AND g.status = 'queued'
  ) THEN
    RAISE EXCEPTION 'You are already in a queue';
  END IF;

  -- Create the tracking group
  INSERT INTO competitive_queue_groups (mode, game, created_by, source, desired_team_size, current_party_size)
  VALUES (_mode, _game, v_uid, 'solo', v_team_size, 1)
  RETURNING id INTO v_group_id;

  INSERT INTO competitive_queue_group_members (group_id, user_id, role)
  VALUES (v_group_id, v_uid, 'captain');

  -- Delegate to existing matchmaker (handles open_cup queue table + match creation + notifications)
  v_result := join_open_cup_queue(_game, v_team_size);

  IF v_result->>'status' = 'matched' THEN
    v_match_id := (v_result->>'match_id')::uuid;
    UPDATE competitive_queue_groups
       SET status='matched', match_id=v_match_id, updated_at=now()
     WHERE id = v_group_id;
    -- Tag rosters with side/joined_from/queue_group_id for the new architecture
    UPDATE match_rosters mr
       SET side = CASE WHEN m.team_a_id = mr.team_id THEN 'A'
                       WHEN m.team_b_id = mr.team_id THEN 'B' ELSE mr.side END,
           joined_from = COALESCE(mr.joined_from,'solo')
      FROM matches m
     WHERE mr.match_id = v_match_id AND m.id = mr.match_id;
    UPDATE match_rosters SET queue_group_id = v_group_id
     WHERE match_id = v_match_id AND user_id = v_uid;
  END IF;

  RETURN jsonb_build_object('status', v_result->>'status',
                            'match_id', v_result->>'match_id',
                            'group_id', v_group_id,
                            'mode', _mode);
END
$$;
GRANT EXECUTE ON FUNCTION public.enqueue_solo(text, text) TO authenticated;

-- 5) Stubs for future party / full team queue --------------------------------
-- These create the group entry but DO NOT yet attempt matchmaking. UI surfaces
-- them as "coming soon" until the 5v5 switch.

CREATE OR REPLACE FUNCTION public.enqueue_party(_mode text, _game text, _user_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Party queue is not enabled yet — opens with the 5v5 beta';
END
$$;
GRANT EXECUTE ON FUNCTION public.enqueue_party(text, text, uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_full_team(_mode text, _game text, _team_id uuid, _user_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Full-team queue is not enabled yet — opens with the 5v5 beta';
END
$$;
GRANT EXECUTE ON FUNCTION public.enqueue_full_team(text, text, uuid, uuid[]) TO authenticated;

-- 6) Default platform_settings row -------------------------------------------

INSERT INTO public.platform_settings(key, value)
VALUES (
  'competitive_queue_config',
  jsonb_build_object(
    'team_size', 1,
    'allow_solo', true,
    'allow_party', false,
    'allow_full_team', false,
    'auto_fill', true
  )
)
ON CONFLICT (key) DO NOTHING;

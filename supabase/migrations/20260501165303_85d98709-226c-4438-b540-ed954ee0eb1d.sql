DROP TRIGGER IF EXISTS on_team_created_chat ON public.teams;
DROP TRIGGER IF EXISTS on_team_member_added_chat ON public.team_members;
DROP FUNCTION IF EXISTS public.handle_new_team_chat() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_team_member_chat() CASCADE;

DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_members CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;

CREATE TABLE public.chat_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope text NOT NULL CHECK (scope IN ('global','team','all')),
  team_id uuid NULL,
  reason text NULL,
  muted_by uuid NOT NULL,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_mutes_user ON public.chat_mutes(user_id);

ALTER TABLE public.chat_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own mutes"
  ON public.chat_mutes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Mods manage mutes"
  ON public.chat_mutes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE OR REPLACE FUNCTION public.is_muted(_user_id uuid, _scope text, _team_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_mutes m
    WHERE m.user_id = _user_id
      AND (m.expires_at IS NULL OR m.expires_at > now())
      AND (
        m.scope = 'all'
        OR (m.scope = _scope AND (_scope <> 'team' OR m.team_id IS NULL OR m.team_id = _team_id))
      )
  )
$$;

CREATE TABLE public.global_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200),
  flagged boolean NOT NULL DEFAULT false,
  flag_reason text NULL,
  report_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_global_messages_created ON public.global_messages(created_at DESC);
ALTER TABLE public.global_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed can read global"
  ON public.global_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authed not-muted can post global"
  ON public.global_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_muted(auth.uid(),'global'));

CREATE POLICY "Owner or mods can delete global"
  ON public.global_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Mods can update global"
  ON public.global_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE TABLE public.team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200),
  flagged boolean NOT NULL DEFAULT false,
  flag_reason text NULL,
  report_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_messages_team_created ON public.team_messages(team_id, created_at DESC);
ALTER TABLE public.team_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = _team_id AND tm.user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = _team_id AND t.owner_id = _user_id)
$$;

CREATE POLICY "Members read team chat"
  ON public.team_messages FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid(), team_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Members post team chat"
  ON public.team_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_team_member(auth.uid(), team_id)
    AND NOT public.is_muted(auth.uid(), 'team', team_id)
  );

CREATE POLICY "Owner or mods delete team chat"
  ON public.team_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Mods update team chat"
  ON public.team_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
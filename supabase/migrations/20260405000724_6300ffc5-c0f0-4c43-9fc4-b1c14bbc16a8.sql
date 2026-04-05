
-- Create chat_channels table
CREATE TABLE public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('global', 'game', 'team')),
  name text NOT NULL,
  game text,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 500),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create chat_members table (for team channels)
CREATE TABLE public.chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Index for message performance
CREATE INDEX idx_chat_messages_channel_created ON public.chat_messages (channel_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- chat_channels: anyone authenticated can view
CREATE POLICY "Authenticated can view channels" ON public.chat_channels
  FOR SELECT TO authenticated USING (true);

-- chat_messages SELECT: global/game = all authenticated, team = members only
CREATE POLICY "Read messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
      AND (
        c.type IN ('global', 'game')
        OR EXISTS (
          SELECT 1 FROM public.chat_members cm
          WHERE cm.channel_id = chat_messages.channel_id AND cm.user_id = auth.uid()
        )
      )
    )
  );

-- chat_messages INSERT: same as SELECT + must be own user_id
CREATE POLICY "Send messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
      AND (
        c.type IN ('global', 'game')
        OR EXISTS (
          SELECT 1 FROM public.chat_members cm
          WHERE cm.channel_id = chat_messages.channel_id AND cm.user_id = auth.uid()
        )
      )
    )
  );

-- chat_messages DELETE: message author or team admin for team channels
CREATE POLICY "Delete messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.chat_members cm
      JOIN public.chat_channels c ON c.id = chat_messages.channel_id
      WHERE cm.channel_id = chat_messages.channel_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'admin'
      AND c.type = 'team'
    )
  );

-- chat_members SELECT: authenticated can view
CREATE POLICY "View chat members" ON public.chat_members
  FOR SELECT TO authenticated USING (true);

-- chat_members INSERT: team channel admin only
CREATE POLICY "Admin manage members" ON public.chat_members
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.channel_id = chat_members.channel_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
    )
    OR NOT EXISTS (SELECT 1 FROM public.chat_members cm WHERE cm.channel_id = chat_members.channel_id)
  );

-- chat_members DELETE: admin or self
CREATE POLICY "Remove chat members" ON public.chat_members
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.channel_id = chat_members.channel_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
    )
  );

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Seed default channels
INSERT INTO public.chat_channels (type, name, game, icon) VALUES
  ('global', '🌍 Chat Globale', null, '🌍'),
  ('game', '🎯 Valorant', 'valorant', '🎯'),
  ('game', '💥 CS2', 'cs2', '💥'),
  ('game', '🛡️ Rainbow Six Siege', 'r6', '🛡️');

-- Trigger: auto-create team chat channel when a team is created
CREATE OR REPLACE FUNCTION public.handle_new_team_chat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_channel_id uuid;
BEGIN
  INSERT INTO public.chat_channels (type, name, game, team_id, icon)
  VALUES ('team', '🏆 ' || NEW.name, NEW.game, NEW.id, '🏆')
  RETURNING id INTO new_channel_id;

  INSERT INTO public.chat_members (channel_id, user_id, role)
  VALUES (new_channel_id, NEW.owner_id, 'admin');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team_chat();

-- Trigger: auto-add team member to chat when added to team
CREATE OR REPLACE FUNCTION public.handle_new_team_member_chat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.chat_members (channel_id, user_id, role)
  SELECT cc.id, NEW.user_id, CASE WHEN NEW.role = 'captain' THEN 'admin' ELSE 'member' END
  FROM public.chat_channels cc
  WHERE cc.team_id = NEW.team_id AND cc.type = 'team'
  ON CONFLICT (channel_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_member_added
  AFTER INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team_member_chat();

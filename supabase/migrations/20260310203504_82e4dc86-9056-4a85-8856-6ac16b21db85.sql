
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  elo INTEGER NOT NULL DEFAULT 0,
  tournament_points INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', 'Player')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game TEXT NOT NULL DEFAULT 'valorant',
  avatar_url TEXT,
  description TEXT,
  avg_elo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Owner can update team" ON public.teams FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated can create team" ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete team" ON public.teams FOR DELETE USING (auth.uid() = owner_id);

-- Team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Team owner can manage members" ON public.team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  OR auth.uid() = user_id
);
CREATE POLICY "Team owner or self can remove" ON public.team_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  OR auth.uid() = user_id
);

-- Tournaments
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game TEXT NOT NULL DEFAULT 'valorant',
  tier INTEGER NOT NULL DEFAULT 1,
  format TEXT NOT NULL DEFAULT '5v5',
  status TEXT NOT NULL DEFAULT 'upcoming',
  max_teams INTEGER NOT NULL DEFAULT 16,
  prize_pool TEXT,
  description TEXT,
  rules TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  min_elo INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update tournament" ON public.tournaments FOR UPDATE USING (auth.uid() = created_by);

-- Tournament entries
CREATE TABLE public.tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered',
  placement INTEGER,
  points_earned INTEGER DEFAULT 0,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view entries" ON public.tournament_entries FOR SELECT USING (true);
CREATE POLICY "User can register" ON public.tournament_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own entry" ON public.tournament_entries FOR UPDATE USING (auth.uid() = user_id);

-- Matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game TEXT NOT NULL DEFAULT 'valorant',
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  team_a_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_b_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  player_a_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player_b_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  score_a INTEGER,
  score_b INTEGER,
  winner_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  map TEXT,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Players can create matches" ON public.matches FOR INSERT WITH CHECK (
  auth.uid() = player_a_id OR auth.uid() = player_b_id
);
CREATE POLICY "Players can update own matches" ON public.matches FOR UPDATE USING (
  auth.uid() = player_a_id OR auth.uid() = player_b_id
);

-- Scrims
CREATE TABLE public.scrims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game TEXT NOT NULL DEFAULT 'valorant',
  format TEXT NOT NULL DEFAULT '5v5 BO1',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  rank_min INTEGER DEFAULT 0,
  rank_max INTEGER DEFAULT 9999,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  accepted_by_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  contact_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scrims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scrims" ON public.scrims FOR SELECT USING (true);
CREATE POLICY "User can post scrims" ON public.scrims FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Poster can update scrim" ON public.scrims FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Poster can delete scrim" ON public.scrims FOR DELETE USING (auth.uid() = posted_by);

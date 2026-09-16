-- Add missing fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discord_username text,
  ADD COLUMN IF NOT EXISTS rank text NOT NULL DEFAULT 'Rookie',
  ADD COLUMN IF NOT EXISTS peak_coins integer NOT NULL DEFAULT 0;

-- Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Reset profile policies to match spec
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No INSERT/DELETE policies => blocked for users; trigger uses SECURITY DEFINER

-- Recreate handle_new_user trigger to populate from OAuth metadata (Google, Discord, etc.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_username text;
  v_avatar text;
  v_display text;
  v_discord text;
BEGIN
  v_username := COALESCE(
    meta->>'username',
    meta->>'preferred_username',
    meta->>'user_name',
    meta->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_display := COALESCE(meta->>'display_name', meta->>'full_name', meta->>'name', v_username);
  v_avatar  := COALESCE(meta->>'avatar_url', meta->>'picture');
  v_discord := CASE WHEN NEW.raw_app_meta_data->>'provider' = 'discord'
                    THEN COALESCE(meta->>'user_name', meta->>'preferred_username')
                    ELSE NULL END;

  -- Ensure unique username
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substr(NEW.id::text, 1, 6);
  END IF;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, discord_username)
  VALUES (NEW.id, v_username, v_display, v_avatar, v_discord)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
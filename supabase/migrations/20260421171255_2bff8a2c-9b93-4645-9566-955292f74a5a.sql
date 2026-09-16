ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

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

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substr(NEW.id::text, 1, 6);
  END IF;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, discord_username, email)
  VALUES (NEW.id, v_username, v_display, v_avatar, v_discord, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
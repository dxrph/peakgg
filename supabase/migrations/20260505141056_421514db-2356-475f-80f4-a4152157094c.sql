CREATE OR REPLACE FUNCTION public.check_fast_track_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak int;
  v_elo int;
  v_fast boolean;
BEGIN
  SELECT win_streak, elo INTO v_streak, v_elo
  FROM public.player_stats WHERE id = NEW.id;

  SELECT fast_track INTO v_fast FROM public.profiles WHERE id = NEW.user_id;

  -- Activate: 5+ win streak and still in Rookie/Bronze (elo < 1200)
  IF NOT v_fast AND v_streak >= 5 AND v_elo < 1200 THEN
    UPDATE public.profiles
    SET fast_track = true, fast_track_wins = v_streak
    WHERE id = NEW.user_id;

    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.user_id, '🚀 Fast Track attivato',
            'Hai vinto 5 di fila — guadagni ELO 1.8x finché non raggiungi Gold');
  END IF;

  -- Deactivate: reached Gold
  IF v_fast AND v_elo >= 1400 THEN
    UPDATE public.profiles SET fast_track = false WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fast_track ON public.player_stats;
CREATE TRIGGER trg_fast_track
AFTER UPDATE OF elo, win_streak ON public.player_stats
FOR EACH ROW
WHEN (NEW.win_streak IS DISTINCT FROM OLD.win_streak OR NEW.elo IS DISTINCT FROM OLD.elo)
EXECUTE FUNCTION public.check_fast_track_trigger();
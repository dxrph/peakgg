-- Upgrade dynamic ELO helper with K-factor (proper Elo expected-score formula).
-- Old 3-arg signature kept for compatibility; it now delegates to the new
-- 4-arg version with K=24 so existing callers keep working.

CREATE OR REPLACE FUNCTION public.calculate_dynamic_elo_delta(
  _player_elo integer,
  _opponent_elo integer,
  _won boolean,
  _k integer
) RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_expected numeric;
  v_actual numeric;
  v_k integer;
  v_delta integer;
BEGIN
  v_k := COALESCE(_k, 24);
  -- Expected score (probability of winning) using standard Elo formula.
  v_expected := 1.0 / (1.0 + power(10.0, ((_opponent_elo - _player_elo)::numeric) / 400.0));
  v_actual := CASE WHEN _won THEN 1.0 ELSE 0.0 END;
  v_delta := round(v_k * (v_actual - v_expected));

  -- Safety clamp so a single match can never swing ELO by more than ~2x K.
  IF v_delta > v_k * 2 THEN v_delta := v_k * 2; END IF;
  IF v_delta < -v_k * 2 THEN v_delta := -v_k * 2; END IF;

  -- Guarantee at least 1 point of movement so wins always feel rewarding
  -- and losses always sting (matches the spec — no zero-delta competitive games).
  IF _won AND v_delta < 1 THEN v_delta := 1; END IF;
  IF NOT _won AND v_delta > -1 THEN v_delta := -1; END IF;

  RETURN v_delta;
END;
$$;

-- Backwards-compatible 3-arg wrapper (existing edge function callers).
CREATE OR REPLACE FUNCTION public.calculate_dynamic_elo_delta(
  _player_elo integer,
  _opponent_elo integer,
  _won boolean
) RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.calculate_dynamic_elo_delta(_player_elo, _opponent_elo, _won, 24);
$$;
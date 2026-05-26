
DELETE FROM public.rank_definitions;

INSERT INTO public.rank_definitions
  (rank_key, rank_name, min_elo, max_elo, sort_order, color_token, is_active)
VALUES
  ('rookie',    'Rookie',    0,    499,  1, '#6B7280', true),
  ('contender', 'Contender', 500,  999,  2, '#9CA3AF', true),
  ('rival',     'Rival',     1000, 1499, 3, '#C77F4B', true),
  ('expert',    'Expert',    1500, 1999, 4, '#F5B514', true),
  ('elite',     'Elite',     2000, 2499, 5, '#E5E7EB', true),
  ('master',    'Master',    2500, 2999, 6, '#FF8C42', true),
  ('apex',      'Apex',      3000, NULL, 7, '#FF4655', true);

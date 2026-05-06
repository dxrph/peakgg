-- Achievements catalog
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  color text NOT NULL DEFAULT '#ff4655',
  category text NOT NULL DEFAULT 'general',
  rarity text NOT NULL DEFAULT 'common',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads achievements"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins manage achievements"
  ON public.achievements FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User unlocked achievements
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads user achievements"
  ON public.user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins manage user achievements"
  ON public.user_achievements FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Service role / triggers can also insert
CREATE POLICY "Service role inserts user achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Seed initial achievements
INSERT INTO public.achievements (code, label, description, icon, color, category, rarity) VALUES
  ('first_win',         'First Blood',          'Win your first match',                       'swords',     '#ff4655', 'combat',      'common'),
  ('win_streak_5',      'On Fire',              'Win 5 matches in a row',                     'flame',      '#ff8c42', 'combat',      'uncommon'),
  ('win_streak_10',     'Unstoppable',          'Win 10 matches in a row',                    'zap',        '#ffd700', 'combat',      'rare'),
  ('matches_50',        'Veteran',              'Play 50 matches',                            'shield',     '#9ca3af', 'progression', 'common'),
  ('matches_250',       'Hardened',             'Play 250 matches',                           'shield-check','#3b82f6', 'progression', 'uncommon'),
  ('rank_gold',         'Gold Standard',        'Reach Gold rank',                            'medal',      '#ffd700', 'progression', 'uncommon'),
  ('rank_diamond',      'Diamond Hands',        'Reach Diamond rank',                         'gem',        '#22d3ee', 'progression', 'rare'),
  ('rank_apex',         'Apex Predator',        'Reach Apex rank',                            'crown',      '#ff4655', 'progression', 'legendary'),
  ('tournament_winner', 'Tournament Champion',  'Win an official tournament',                 'trophy',     '#ffd700', 'tournament',  'epic'),
  ('verified',          'Verified',             'Complete account verification',              'badge-check','#22c55e', 'community',   'common'),
  ('fast_track',        'Fast Track',           'Activate Fast Track progression',            'rocket',     '#ff8c42', 'special',     'uncommon'),
  ('founder',           'Founder',              'Joined PeakGG during the closed beta',       'star',       '#a855f7', 'special',     'legendary');
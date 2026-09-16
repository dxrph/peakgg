ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_founding boolean NOT NULL DEFAULT false;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
UPDATE public.teams SET is_founding = true WHERE id IN (
  '7861db24-ac52-4e06-83d8-3246d4578f02', -- Phoenix
  '86fd42e3-5778-4b2e-b994-5bae205a4388', -- Void Raptors
  'e0c32d2f-1feb-45d5-b554-bed36cece0f4', -- Neon Kings
  '9880a008-3a94-47c1-9250-742ed3a083d6'  -- Alpha Wolves
);
UPDATE public.teams SET is_demo = true WHERE id IN (
  '86fd42e3-5778-4b2e-b994-5bae205a4388','e0c32d2f-1feb-45d5-b554-bed36cece0f4','9880a008-3a94-47c1-9250-742ed3a083d6',
  'b3801ff9-726b-4c9b-b100-0cbb855c7662','b229e0af-9cb0-4b0f-86fa-5f152ac70c4f','9d2ef6c7-8c68-46ef-b4a2-388f21bb5fe3',
  'f7570742-adca-4782-b5fc-ae61db0fac9d','15b24987-f49e-4c22-b458-f641e96293b4'
);
-- Normalize ONLY demo teams
UPDATE public.teams SET slots = LEAST(GREATEST(COALESCE(slots,2), 0), 2) WHERE is_demo = true;
UPDATE public.teams SET trophies = 0 WHERE is_demo = true AND (trophies IS NULL OR trophies > 5);
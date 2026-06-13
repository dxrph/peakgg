ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS route_label   text,
  ADD COLUMN IF NOT EXISTS permit_number text,
  ADD COLUMN IF NOT EXISTS serial        text,
  ADD COLUMN IF NOT EXISTS stamp_line1   text DEFAULT 'Free entry',
  ADD COLUMN IF NOT EXISTS stamp_line2   text DEFAULT '· Approved ·',
  ADD COLUMN IF NOT EXISTS show_stamp    boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS summit_accent text;

-- Allow staff to insert coin transactions
CREATE POLICY "Staff can insert coin transactions"
ON public.peak_coins_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderator'::app_role)
);

-- Trigger: keep profiles.peak_coins balance in sync
CREATE OR REPLACE FUNCTION public.apply_peak_coins_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET peak_coins = GREATEST(0, COALESCE(peak_coins, 0) + NEW.amount)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_peak_coins_transaction ON public.peak_coins_transactions;
CREATE TRIGGER trg_apply_peak_coins_transaction
AFTER INSERT ON public.peak_coins_transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_peak_coins_transaction();

-- Allow mods to delete reputation votes (admins already had it)
CREATE POLICY "Mods delete reputation votes"
ON public.reputation_votes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'::app_role));

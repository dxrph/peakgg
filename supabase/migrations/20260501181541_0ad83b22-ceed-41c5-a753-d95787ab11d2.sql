
-- 1. ADMIN AUDIT LOG
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  target_resource text,
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_actions_admin ON public.admin_actions(admin_id, created_at DESC);
CREATE INDEX idx_admin_actions_target ON public.admin_actions(target_user_id, created_at DESC);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
ON public.admin_actions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit entries"
ON public.admin_actions FOR INSERT TO authenticated
WITH CHECK (
  admin_id = auth.uid()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
);

-- No UPDATE/DELETE: audit log is append-only.

-- 2. GDPR REQUESTS (delete account / export data)
CREATE TABLE public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('delete', 'export')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')),
  scheduled_for timestamptz,
  completed_at timestamptz,
  export_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gdpr_user ON public.gdpr_requests(user_id, created_at DESC);
CREATE INDEX idx_gdpr_status ON public.gdpr_requests(status, scheduled_for);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own gdpr requests"
ON public.gdpr_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own gdpr requests"
ON public.gdpr_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Owner can cancel a pending delete request (sets status='cancelled')
CREATE POLICY "Users can cancel own gdpr requests"
ON public.gdpr_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

CREATE TRIGGER gdpr_requests_touch
BEFORE UPDATE ON public.gdpr_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_player_stats_updated_at();

-- 3. DISPOSABLE EMAIL BLOCKLIST
CREATE TABLE public.disposable_email_domains (
  domain text PRIMARY KEY,
  added_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.disposable_email_domains ENABLE ROW LEVEL SECURITY;

-- Public can read (so client validation can happen too); only admins can mutate
CREATE POLICY "Anyone can read disposable list"
ON public.disposable_email_domains FOR SELECT
USING (true);

CREATE POLICY "Admins manage disposable list"
ON public.disposable_email_domains FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed common disposable email providers
INSERT INTO public.disposable_email_domains (domain) VALUES
  ('mailinator.com'),('10minutemail.com'),('guerrillamail.com'),('guerrillamail.info'),
  ('sharklasers.com'),('grr.la'),('yopmail.com'),('tempmail.com'),('temp-mail.org'),
  ('temp-mail.io'),('throwawaymail.com'),('trashmail.com'),('trashmail.de'),('mailnesia.com'),
  ('maildrop.cc'),('getnada.com'),('nada.email'),('mintemail.com'),('mohmal.com'),
  ('fakemailgenerator.com'),('emailondeck.com'),('mytemp.email'),('dispostable.com'),
  ('mailcatch.com'),('mailbox.org'),('spambog.com'),('spam4.me'),('mailtemp.uk'),
  ('luxusmail.org'),('moakt.cc'),('moakt.com'),('linshiyou.com'),('inboxbear.com'),
  ('tempinbox.com'),('tempr.email'),('discard.email'),('33mail.com'),('anonbox.net'),
  ('byom.de'),('emltmp.com'),('emkei.cz'),('e4ward.com'),('jetable.org'),
  ('mvrht.com'),('mt2015.com'),('owlpic.com'),('rcpt.at'),('spamavert.com'),
  ('spambox.us'),('superrito.com'),('tempemail.net'),('trash-mail.com'),('zetmail.com')
ON CONFLICT (domain) DO NOTHING;

-- 4. HELPER FUNCTION + WAITLIST POLICY UPGRADE
CREATE OR REPLACE FUNCTION public.is_disposable_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.disposable_email_domains
    WHERE domain = lower(split_part(_email, '@', 2))
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_disposable_email(text) TO anon, authenticated;

-- Replace waitlist INSERT policy to also reject disposable domains
DROP POLICY IF EXISTS "Anyone can join waitlist with valid email" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist with valid email"
ON public.waitlist FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 3 AND 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND NOT public.is_disposable_email(email)
);

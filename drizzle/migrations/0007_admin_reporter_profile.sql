ALTER TABLE public.reporter_profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE public.reporter_profiles
SET full_name = 'Fidel Hernandez', is_admin = true, active = true, must_change_password = true
WHERE username = 'fidel.hernandez';

DROP POLICY IF EXISTS admin_reporter_profiles ON public.reporter_profiles;
CREATE POLICY admin_reporter_profiles ON public.reporter_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.reporter_profiles p WHERE p.user_id = auth.uid() AND p.is_admin AND p.active))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.reporter_profiles p WHERE p.user_id = auth.uid() AND p.is_admin AND p.active));

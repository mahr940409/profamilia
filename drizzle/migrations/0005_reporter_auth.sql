-- Reporter accounts and audit ownership for authenticated submissions.
CREATE TABLE IF NOT EXISTS public.reporter_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (username = lower(username) AND username ~ '^[a-z0-9]+(\.[a-z0-9]+)+$'),
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 120),
  active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS incidents_created_by_user_id ON public.incidents(created_by_user_id);

ALTER TABLE public.reporter_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reporter_own_profile ON public.reporter_profiles;
CREATE POLICY reporter_own_profile ON public.reporter_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND active);

DROP POLICY IF EXISTS admin_reporter_profiles ON public.reporter_profiles;
CREATE POLICY admin_reporter_profiles ON public.reporter_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS reporter_insert_incident ON public.incidents;
CREATE POLICY reporter_insert_incident ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.reporter_profiles WHERE user_id = auth.uid() AND active AND NOT must_change_password)
    AND EXISTS (SELECT 1 FROM public.employees WHERE id = employee_id AND active)
    AND EXISTS (SELECT 1 FROM public.incident_types WHERE id = incident_type_id AND active)
  );

CREATE OR REPLACE FUNCTION public.validate_authenticated_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.created_by_user_id IS NULL THEN
    RAISE EXCEPTION 'El usuario autenticado es obligatorio';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.reporter_profiles WHERE user_id = NEW.created_by_user_id AND active AND NOT must_change_password) THEN
    RAISE EXCEPTION 'El usuario reportador no está habilitado';
  END IF;
  NEW.created_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_authenticated_incident_before ON public.incidents;
CREATE TRIGGER validate_authenticated_incident_before
  BEFORE INSERT ON public.incidents FOR EACH ROW
  WHEN (NEW.created_by_user_id IS NOT NULL)
  EXECUTE FUNCTION public.validate_authenticated_incident();

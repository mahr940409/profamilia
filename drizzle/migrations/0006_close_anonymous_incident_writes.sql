-- Public catalogs remain readable, but incident creation is authenticated-only.
REVOKE EXECUTE ON FUNCTION public.record_public_incident(uuid, uuid) FROM anon;
DROP POLICY IF EXISTS public_insert ON public.incidents;

-- The authenticated server path writes created_by_user_id and is validated by
-- validate_authenticated_incident. Keep the legacy function unavailable to anon.
REVOKE EXECUTE ON FUNCTION public.record_public_incident(uuid, uuid) FROM public;

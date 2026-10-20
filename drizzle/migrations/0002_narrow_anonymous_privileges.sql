REVOKE ALL ON TABLE public.employees,public.incident_types,public.incidents,public.user_roles FROM anon;
GRANT SELECT(id,name) ON public.employees,public.incident_types TO anon;
GRANT INSERT(employee_id,incident_type_id) ON public.incidents TO anon;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
CREATE OR REPLACE FUNCTION public.record_public_incident(_employee_id uuid,_incident_type_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=_employee_id AND active FOR SHARE) OR NOT EXISTS(SELECT 1 FROM public.incident_types WHERE id=_incident_type_id AND active FOR SHARE) THEN RAISE EXCEPTION 'Empleado o incidente inactivo'; END IF; INSERT INTO public.incidents(employee_id,incident_type_id) VALUES(_employee_id,_incident_type_id); END $$;
REVOKE ALL ON FUNCTION public.record_public_incident(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_incident(uuid,uuid) TO anon,authenticated;
REVOKE INSERT(employee_id,incident_type_id) ON public.incidents FROM anon,authenticated;
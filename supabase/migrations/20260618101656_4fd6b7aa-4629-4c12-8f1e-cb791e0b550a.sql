-- Revoga EXECUTE desnecessário para anon (nenhuma policy pública usa has_role)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
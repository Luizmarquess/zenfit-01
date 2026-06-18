-- Trigger para impedir que usuários alterem seu próprio campo premium na tabela profiles
CREATE OR REPLACE FUNCTION private.prevent_profile_premium_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.premium IS DISTINCT FROM OLD.premium 
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) 
  THEN
    NEW.premium := OLD.premium;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_premium_self_update ON public.profiles;
CREATE TRIGGER prevent_profile_premium_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_profile_premium_self_update();

-- Grant para a view pública (reforço)
GRANT SELECT ON public.massoterapeutas_public TO anon;
GRANT SELECT ON public.massoterapeutas_public TO authenticated;
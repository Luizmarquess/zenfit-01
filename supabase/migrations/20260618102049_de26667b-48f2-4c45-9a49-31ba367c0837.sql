CREATE SCHEMA IF NOT EXISTS private;

-- Move funções trigger para schema private (não exposto pelo PostgREST)
CREATE OR REPLACE FUNCTION private.prevent_self_premium_update()
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

CREATE OR REPLACE FUNCTION private.prevent_self_ativo_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ativo IS DISTINCT FROM OLD.ativo 
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) 
  THEN
    NEW.ativo := OLD.ativo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.prevent_self_avaliacao_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.avaliacao IS DISTINCT FROM OLD.avaliacao 
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) 
  THEN
    NEW.avaliacao := OLD.avaliacao;
  END IF;
  RETURN NEW;
END;
$$;

-- Atualiza triggers para apontar para funções no schema private
DROP TRIGGER IF EXISTS prevent_premium_self_update ON public.massoterapeutas;
CREATE TRIGGER prevent_premium_self_update
  BEFORE UPDATE ON public.massoterapeutas
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_self_premium_update();

DROP TRIGGER IF EXISTS prevent_ativo_self_update ON public.massoterapeutas;
CREATE TRIGGER prevent_ativo_self_update
  BEFORE UPDATE ON public.massoterapeutas
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_self_ativo_update();

DROP TRIGGER IF EXISTS prevent_avaliacao_self_update ON public.massoterapeutas;
CREATE TRIGGER prevent_avaliacao_self_update
  BEFORE UPDATE ON public.massoterapeutas
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_self_avaliacao_update();

-- Limpa funções antigas de public
DROP FUNCTION IF EXISTS public.prevent_self_premium_update();
DROP FUNCTION IF EXISTS public.prevent_self_ativo_update();
DROP FUNCTION IF EXISTS public.prevent_self_avaliacao_update();
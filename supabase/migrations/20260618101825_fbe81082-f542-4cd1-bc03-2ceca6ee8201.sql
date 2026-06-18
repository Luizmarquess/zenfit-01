-- Corrige privilege escalation: profissionais não podem alterar seu próprio campo premium
-- 1. Remove a policy antiga que permitia ALL
DROP POLICY IF EXISTS "Profissional gerencia o próprio cadastro" ON public.massoterapeutas;

-- 2. Cria policies separadas com controle adequado
CREATE POLICY "Profissional vê próprio cadastro"
  ON public.massoterapeutas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Profissional atualiza próprio cadastro"
  ON public.massoterapeutas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Profissional remove próprio cadastro"
  ON public.massoterapeutas FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Trigger para impedir que profissionais alterem seu próprio premium
CREATE OR REPLACE FUNCTION public.prevent_self_premium_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o usuário não for admin, mantém o valor antigo de premium
  IF NEW.premium IS DISTINCT FROM OLD.premium 
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) 
  THEN
    NEW.premium := OLD.premium;
  END IF;
  RETURN NEW;
END;
$$;

-- Remove trigger existente se houver
DROP TRIGGER IF EXISTS prevent_premium_self_update ON public.massoterapeutas;

CREATE TRIGGER prevent_premium_self_update
  BEFORE UPDATE ON public.massoterapeutas
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_premium_update();
-- ============================================
-- 1. VIEW PÚBLICA: esconde telefone de massoterapeutas
-- ============================================

-- Cria view pública sem dados sensíveis
CREATE OR REPLACE VIEW public.massoterapeutas_public AS
SELECT 
  id,
  nome,
  cidade,
  bio,
  especialidades,
  premium,
  ativo,
  avaliacao,
  created_at,
  updated_at
FROM public.massoterapeutas
WHERE ativo = true;

-- Grants
GRANT SELECT ON public.massoterapeutas_public TO anon;
GRANT SELECT ON public.massoterapeutas_public TO authenticated;

-- Remove a policy pública da tabela base (agora a view serve o público)
DROP POLICY IF EXISTS "Massoterapeutas ativos são públicos" ON public.massoterapeutas;

-- ============================================
-- 2. TRIGGERS ANTI-PRIVILEGE-ESCALATION
-- ============================================

-- Trigger para impedir alteração de `ativo` por não-admins
CREATE OR REPLACE FUNCTION public.prevent_self_ativo_update()
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

DROP TRIGGER IF EXISTS prevent_ativo_self_update ON public.massoterapeutas;
CREATE TRIGGER prevent_ativo_self_update
  BEFORE UPDATE ON public.massoterapeutas
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_ativo_update();

-- Trigger para impedir alteração de `avaliacao` por não-admins
CREATE OR REPLACE FUNCTION public.prevent_self_avaliacao_update()
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

DROP TRIGGER IF EXISTS prevent_avaliacao_self_update ON public.massoterapeutas;
CREATE TRIGGER prevent_avaliacao_self_update
  BEFORE UPDATE ON public.massoterapeutas
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_avaliacao_update();

-- Revoga EXECUTE dessas funções trigger (não devem ser chamadas diretamente)
REVOKE EXECUTE ON FUNCTION public.prevent_self_ativo_update() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_ativo_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_self_avaliacao_update() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_avaliacao_update() FROM anon;

-- ============================================
-- 3. PROTEGE INSERT EM AGENDAMENTOS
-- ============================================

-- Garante que apenas o próprio cliente pode criar agendamentos para si
DROP POLICY IF EXISTS "Cliente acessa seus agendamentos" ON public.agendamentos;

-- Policy SELECT: cliente vê seus agendamentos
CREATE POLICY "Cliente vê seus agendamentos"
  ON public.agendamentos FOR SELECT
  TO authenticated
  USING (cliente_id = auth.uid());

-- Policy INSERT: cliente só insere para si mesmo
CREATE POLICY "Cliente cria seus agendamentos"
  ON public.agendamentos FOR INSERT
  TO authenticated
  WITH CHECK (cliente_id = auth.uid());

-- Policy UPDATE: cliente só atualiza seus agendamentos
CREATE POLICY "Cliente atualiza seus agendamentos"
  ON public.agendamentos FOR UPDATE
  TO authenticated
  USING (cliente_id = auth.uid())
  WITH CHECK (cliente_id = auth.uid());

-- Policy DELETE: cliente só remove seus agendamentos
CREATE POLICY "Cliente remove seus agendamentos"
  ON public.agendamentos FOR DELETE
  TO authenticated
  USING (cliente_id = auth.uid());

-- Admin ainda vê e gerencia tudo
-- (policies de admin já existem, mantidas)
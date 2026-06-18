-- Policy SELECT para authenticated ver massoterapeutas ativos (inclui telefone)
CREATE POLICY "Clientes autenticados veem massoterapeutas ativos"
  ON public.massoterapeutas FOR SELECT
  TO authenticated
  USING (ativo = true);
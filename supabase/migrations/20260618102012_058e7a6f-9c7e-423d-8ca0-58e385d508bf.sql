CREATE OR REPLACE VIEW public.massoterapeutas_public
WITH (security_invoker = on) AS
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

GRANT SELECT ON public.massoterapeutas_public TO anon;
GRANT SELECT ON public.massoterapeutas_public TO authenticated;
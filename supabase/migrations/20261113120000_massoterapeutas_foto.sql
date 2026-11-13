-- Foto do profissional exibida nos cartões do painel do cliente.
ALTER TABLE public.massoterapeutas ADD COLUMN IF NOT EXISTS foto_url TEXT;

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
  updated_at,
  foto_url
FROM public.massoterapeutas
WHERE ativo = true;

GRANT SELECT ON public.massoterapeutas_public TO anon;
GRANT SELECT ON public.massoterapeutas_public TO authenticated;

-- Agendamento confirmado dentro do site: data/horário marcados e um retrato
-- dos dados do cliente e da ficha de anamnese no momento da confirmação.
-- O massoterapeuta já pode ler os próprios agendamentos (policy existente),
-- então passa a ver nome, WhatsApp e ficha do cliente sem acesso às tabelas dele.
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS data_hora TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
  ADD COLUMN IF NOT EXISTS cliente_telefone TEXT,
  ADD COLUMN IF NOT EXISTS anamnese JSONB;

-- Impede dois agendamentos ativos no mesmo horário com o mesmo profissional.
CREATE UNIQUE INDEX IF NOT EXISTS agendamentos_horario_unico
  ON public.agendamentos (massoterapeuta_id, data_hora)
  WHERE status <> 'cancelado' AND data_hora IS NOT NULL;

-- Horários já ocupados de um profissional num dia (sem expor quem agendou).
CREATE OR REPLACE FUNCTION public.horarios_ocupados(_massoterapeuta_id UUID, _inicio TIMESTAMPTZ, _fim TIMESTAMPTZ)
RETURNS SETOF TIMESTAMPTZ
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT data_hora FROM public.agendamentos
  WHERE massoterapeuta_id = _massoterapeuta_id
    AND status <> 'cancelado'
    AND data_hora >= _inicio AND data_hora < _fim
$$;

REVOKE EXECUTE ON FUNCTION public.horarios_ocupados(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.horarios_ocupados(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

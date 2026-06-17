
-- Enums
CREATE TYPE public.user_tipo AS ENUM ('cliente', 'massoterapeuta');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ==========================
-- profiles
-- ==========================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.user_tipo NOT NULL DEFAULT 'cliente',
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  telefone TEXT,
  cidade TEXT,
  premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================
-- user_roles
-- ==========================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles policies (after has_role exists)
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================
-- massoterapeutas (catálogo público)
-- ==========================
CREATE TABLE public.massoterapeutas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  telefone TEXT,
  bio TEXT,
  especialidades TEXT[] NOT NULL DEFAULT '{}',
  premium BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  avaliacao NUMERIC(2,1) DEFAULT 5.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.massoterapeutas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.massoterapeutas TO authenticated;
GRANT ALL ON public.massoterapeutas TO service_role;
ALTER TABLE public.massoterapeutas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_masso_updated BEFORE UPDATE ON public.massoterapeutas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Massoterapeutas ativos são públicos" ON public.massoterapeutas
  FOR SELECT USING (ativo = true);
CREATE POLICY "Profissional gerencia o próprio cadastro" ON public.massoterapeutas
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins gerenciam massoterapeutas" ON public.massoterapeutas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================
-- anamneses
-- ==========================
CREATE TABLE public.anamneses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  idade TEXT,
  contato TEXT,
  queixa TEXT,
  historico TEXT,
  doencas TEXT,
  medicamentos TEXT,
  cirurgias TEXT,
  alergias TEXT,
  habitos TEXT,
  contraindicacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamneses TO authenticated;
GRANT ALL ON public.anamneses TO service_role;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_anamneses_updated BEFORE UPDATE ON public.anamneses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Usuário acessa própria anamnese" ON public.anamneses
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins veem todas anamneses" ON public.anamneses
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ==========================
-- agendamentos
-- ==========================
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  massoterapeuta_id UUID REFERENCES public.massoterapeutas(id) ON DELETE SET NULL,
  tipo_massagem TEXT NOT NULL,
  duracao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  cidade TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_agend_updated BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Cliente acessa seus agendamentos" ON public.agendamentos
  FOR ALL TO authenticated
  USING (cliente_id = auth.uid()) WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "Massoterapeuta vê seus agendamentos" ON public.agendamentos
  FOR SELECT TO authenticated
  USING (massoterapeuta_id IN (SELECT id FROM public.massoterapeutas WHERE user_id = auth.uid()));
CREATE POLICY "Admins gerenciam agendamentos" ON public.agendamentos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================
-- Trigger: handle_new_user
-- Cria perfil + papel (primeiro vira admin)
-- ==========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tipo public.user_tipo;
  v_nome TEXT;
  v_count INT;
BEGIN
  v_tipo := COALESCE((NEW.raw_user_meta_data->>'tipo')::public.user_tipo, 'cliente');
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (user_id, tipo, nome, email)
  VALUES (NEW.id, v_tipo, v_nome, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT COUNT(*) INTO v_count FROM public.user_roles;
  IF v_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT DO NOTHING;
  END IF;

  IF v_tipo = 'massoterapeuta' THEN
    INSERT INTO public.massoterapeutas (user_id, nome, cidade)
    VALUES (NEW.id, v_nome, COALESCE(NEW.raw_user_meta_data->>'cidade', 'Baturité'));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================
-- Seeds: massoterapeutas iniciais
-- ==========================
INSERT INTO public.massoterapeutas (nome, cidade, bio, especialidades, premium, avaliacao) VALUES
('Ana Lima', 'Aracoiaba', 'Especialista em relaxamento profundo.', ARRAY['Relaxante','Antiestresse'], true, 4.9),
('Carlos Souza', 'Aratuba', 'Massoterapeuta certificado, 10 anos de experiência.', ARRAY['Esportiva','Ventosa'], true, 4.8),
('Bianca Rocha', 'Itapiúna', 'Atendimento personalizado em domicílio.', ARRAY['Relaxante','Ventosa'], false, 4.7),
('Diego Martins', 'Baturité', 'Foco em recuperação muscular.', ARRAY['Esportiva','Antiestresse'], false, 4.6),
('Elaine Costa', 'Capistrano', 'Terapias integrativas e relaxamento.', ARRAY['Relaxante','Antiestresse','Ventosa'], true, 5.0),
('Fábio Nunes', 'Baturité', 'Massoterapeuta acessível e atencioso.', ARRAY['Relaxante'], false, 4.5);

-- Concede permissão de executar a função has_role para roles que precisam acessar políticas RLS
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- O role anon também pode precisar se houver políticas públicas que verificam admin
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Garante que a função SECURITY DEFINER possa acessar a tabela user_roles
-- (o dono da função já deve ter, mas reforça via policy/grant se necessário)
GRANT SELECT ON public.user_roles TO authenticated;
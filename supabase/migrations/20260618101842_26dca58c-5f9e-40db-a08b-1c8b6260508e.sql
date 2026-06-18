-- Revoga EXECUTE em funções SECURITY DEFINER que não precisam ser chamadas diretamente por usuários
-- prevent_self_premium_update é um trigger — não deve ser executado diretamente
REVOKE EXECUTE ON FUNCTION public.prevent_self_premium_update() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_premium_update() FROM anon;
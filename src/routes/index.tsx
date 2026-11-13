import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// A entrada do site é a tela de login; quem já está logado vai direto ao painel.
export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/painel" });
    throw redirect({ to: "/auth", search: { redirect: "/painel" } });
  },
});

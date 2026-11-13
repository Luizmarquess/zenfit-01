import { Link, Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, History, Home, Loader2, LogOut, Settings, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ZenFitMark, ZenFitWordmark } from "@/components/zenfit-logo";
import { useAuth } from "@/hooks/use-auth";
import { PerfilContext, type PerfilAtual } from "@/hooks/use-perfil";
import { supabase } from "@/integrations/supabase/client";
import { cidadeLabel, iniciais } from "@/lib/zenfit";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Meu painel · ZenFit" }] }),
  component: LayoutPainel,
});

const NAV = [
  { to: "/painel", label: "Home", desc: "Novo agendamento", icon: Home, exato: true },
  {
    to: "/painel/massagens",
    label: "Minhas Massagens",
    desc: "Próximos horários",
    icon: CalendarClock,
  },
  { to: "/painel/historico", label: "Histórico", desc: "Massagens realizadas", icon: History },
] as const;

function LayoutPainel() {
  const { user, isAdmin } = useAuth();

  const { data: perfil, isLoading } = useQuery({
    queryKey: ["perfil", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const atual: PerfilAtual = {
    userId: user.id,
    tipo: perfil?.tipo ?? (meta.tipo === "massoterapeuta" ? "massoterapeuta" : "cliente"),
    nome: perfil?.nome || meta.nome || meta.full_name || "",
    telefone: perfil?.telefone || meta.telefone || "",
    cidade: perfil?.cidade || meta.cidade || "",
    isAdmin,
  };

  return (
    <PerfilContext.Provider value={atual}>
      <SidebarProvider>
        <MenuLateral perfil={atual} />
        <SidebarInset className="min-w-0">
          <header className="zf-no-print sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
            <SidebarTrigger aria-label="Abrir menu" />
            <div className="md:hidden flex items-center gap-2">
              <ZenFitMark className="h-7 w-7" />
              <ZenFitWordmark className="text-lg" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {atual.cidade && (
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  {cidadeLabel(atual.cidade)}
                </span>
              )}
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </PerfilContext.Provider>
  );
}

function MenuLateral({ perfil }: { perfil: PerfilAtual }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const ativo = (to: string, exato?: boolean) =>
    exato ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);
  const fechar = () => setOpenMobile(false);

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: "/painel" } });
  };

  return (
    <Sidebar className="zf-no-print">
      <SidebarHeader className="px-4 py-5">
        <Link to="/painel" onClick={fechar} className="flex items-center gap-2.5">
          <ZenFitMark className="h-10 w-10" />
          <div>
            <ZenFitWordmark className="text-2xl leading-none" />
            <div className="text-[11px] text-muted-foreground mt-1">
              {perfil.tipo === "massoterapeuta"
                ? "Área do massoterapeuta"
                : "Bem-estar na sua cidade"}
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={ativo(item.to, "exato" in item)}
                    size="lg"
                    className="gap-3"
                  >
                    <Link to={item.to} onClick={fechar}>
                      <item.icon className="!h-5 !w-5" />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {perfil.tipo === "massoterapeuta" && item.to === "/painel"
                            ? "Meu perfil profissional"
                            : item.desc}
                        </span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {perfil.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild size="lg" className="gap-3">
                    <Link to="/admin" onClick={fechar}>
                      <Shield className="!h-5 !w-5" />
                      <span className="font-medium">Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarSeparator className="mx-0" />
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={ativo("/painel/configuracoes")}
              size="lg"
              className="gap-3"
            >
              <Link to="/painel/configuracoes" onClick={fechar}>
                <Settings className="!h-5 !w-5" />
                <div className="flex flex-col leading-tight">
                  <span className="font-medium">Configurações</span>
                  <span className="text-[11px] text-muted-foreground">Conta e preferências</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={sair} className="gap-3 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sair
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-sidebar-accent/60 px-3 py-2.5">
          <div
            className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: "var(--gradient-hero)" }}
          >
            {iniciais(perfil.nome || "Z")}
          </div>
          <div className="min-w-0 text-xs leading-tight">
            <div className="truncate font-medium">{perfil.nome || "Minha conta"}</div>
            <div className="truncate text-muted-foreground">
              {perfil.cidade ? cidadeLabel(perfil.cidade) : "Cidade não definida"}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

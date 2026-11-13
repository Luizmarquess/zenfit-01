import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ZenFitMark, ZenFitWordmark } from "@/components/zenfit-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: "/painel" } });
  };

  const nome = (user?.user_metadata?.nome as string | undefined) ?? user?.email ?? "";

  return (
    <header className="border-b border-border/60 backdrop-blur sticky top-0 z-30 bg-background/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/painel" className="flex items-center gap-2">
          <ZenFitMark />
          <ZenFitWordmark className="text-xl" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {!loading && user && (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link to="/painel">
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Painel
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin">
                    <Shield className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <span className="hidden md:inline text-xs text-muted-foreground max-w-40 truncate">
                {nome}
              </span>
              <Button size="sm" variant="ghost" onClick={sair} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
          {!loading && !user && (
            <Button asChild size="sm">
              <Link to="/auth" search={{ redirect: "/painel" }}>
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

import { Link, useRouter } from "@tanstack/react-router";
import { Heart, LogOut, Shield, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const sair = async () => {
    await supabase.auth.signOut();
    router.invalidate();
  };

  return (
    <header className="border-b border-border/60 backdrop-blur sticky top-0 z-30 bg-background/80">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">zenfit</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden sm:inline-flex">Maciço de Baturité · CE</Badge>
          {!loading && (user ? (
            <>
              {isAdmin && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin"><Shield className="h-4 w-4 mr-1" />Admin</Link>
                </Button>
              )}
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <UserIcon className="h-3 w-3" />{user.email}
              </span>
              <Button size="sm" variant="ghost" onClick={sair}><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Entrar</Link></Button>
          ))}
        </div>
      </div>
    </header>
  );
}
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHAVE = "zenfit-tema";

/** Aplica e salva o tema (usado pelo botão e pela página de Configurações). */
export function definirTema(escuro: boolean) {
  document.documentElement.classList.toggle("dark", escuro);
  try {
    localStorage.setItem(CHAVE, escuro ? "escuro" : "claro");
  } catch {
    // armazenamento indisponível (aba anônima): o tema vale só nesta visita
  }
}

/**
 * Script inline (injetado no <head>) que aplica o tema antes da pintura,
 * evitando o "flash" de tema claro ao abrir no modo escuro.
 */
export const temaInicialScript = `(function(){try{var t=localStorage.getItem("${CHAVE}");var d=t?t==="escuro":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function ThemeToggle({ className }: { className?: string }) {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    setEscuro(document.documentElement.classList.contains("dark"));
  }, []);

  const alternar = () => {
    const proximo = !escuro;
    setEscuro(proximo);
    document.documentElement.classList.toggle("dark", proximo);
    try {
      localStorage.setItem(CHAVE, proximo ? "escuro" : "claro");
    } catch {
      // armazenamento indisponível (aba anônima): o tema vale só nesta visita
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={alternar}
      className={cn("rounded-full", className)}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro"}
    >
      {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

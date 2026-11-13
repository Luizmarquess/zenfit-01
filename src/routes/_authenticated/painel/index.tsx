import { createFileRoute } from "@tanstack/react-router";
import { PainelCliente } from "@/components/painel/painel-cliente";
import { PainelMassoterapeuta } from "@/components/painel/painel-massoterapeuta";
import { usePerfil } from "@/hooks/use-perfil";

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({ meta: [{ title: "Home · ZenFit" }] }),
  component: Home,
});

function Home() {
  const perfil = usePerfil();
  return perfil.tipo === "massoterapeuta" ? (
    <PainelMassoterapeuta userId={perfil.userId} nome={perfil.nome} />
  ) : (
    <PainelCliente />
  );
}

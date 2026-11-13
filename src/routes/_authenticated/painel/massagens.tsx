import { createFileRoute } from "@tanstack/react-router";
import { ListaAgendamentos } from "@/components/painel/lista-agendamentos";
import { usePerfil } from "@/hooks/use-perfil";

export const Route = createFileRoute("/_authenticated/painel/massagens")({
  head: () => ({ meta: [{ title: "Minhas Massagens · ZenFit" }] }),
  component: MinhasMassagens,
});

function MinhasMassagens() {
  const { tipo } = usePerfil();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {tipo === "massoterapeuta" ? "Sua agenda" : "Próximos horários"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Minhas Massagens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tipo === "massoterapeuta"
            ? "Atendimentos confirmados pelos clientes, com data, horário e ficha de anamnese."
            : "Suas massagens agendadas, com data, horário e comprovante."}
        </p>
      </div>
      <ListaAgendamentos modo="proximos" />
    </div>
  );
}

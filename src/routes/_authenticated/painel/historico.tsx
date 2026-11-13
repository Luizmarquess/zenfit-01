import { createFileRoute } from "@tanstack/react-router";
import { ListaAgendamentos } from "@/components/painel/lista-agendamentos";

export const Route = createFileRoute("/_authenticated/painel/historico")({
  head: () => ({ meta: [{ title: "Histórico · ZenFit" }] }),
  component: Historico,
});

function Historico() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Registro completo</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as massagens já realizadas e os agendamentos cancelados.
        </p>
      </div>
      <ListaAgendamentos modo="historico" />
    </div>
  );
}

import { CalendarCheck, Leaf, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import {
  type Anamnese,
  cidadeLabel,
  codigoComprovante,
  formatarDataHora,
  formatarPreco,
  linhasAnamnese,
} from "@/lib/zenfit";

export type Agendamento = Tables<"agendamentos"> & {
  massoterapeutas: { nome: string; cidade: string } | null;
};

export const STATUS: Record<string, { rotulo: string; classe: string }> = {
  confirmado: { rotulo: "Confirmado", classe: "bg-primary/15 text-primary border-primary/30" },
  solicitado: { rotulo: "Confirmado", classe: "bg-primary/15 text-primary border-primary/30" },
  realizado: { rotulo: "Realizado", classe: "bg-secondary text-secondary-foreground" },
  cancelado: {
    rotulo: "Cancelado",
    classe: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

/** Status exibido: confirmado com data passada conta como realizado. */
export function statusDe(a: Agendamento) {
  if (a.status === "cancelado") return "cancelado";
  if (a.status === "realizado") return "realizado";
  if (!a.data_hora || new Date(a.data_hora).getTime() < Date.now()) return "realizado";
  return "confirmado";
}

export function StatusBadge({ a }: { a: Agendamento }) {
  const s = STATUS[statusDe(a)];
  return (
    <Badge variant="outline" className={cn("font-medium", s.classe)}>
      {s.rotulo}
    </Badge>
  );
}

/** Comprovante digital do agendamento, pronto para imprimir/salvar em PDF. */
export function Comprovante({ a, clienteNome }: { a: Agendamento; clienteNome?: string }) {
  const ficha = a.anamnese as Anamnese | null;
  const linhas: [string, string][] = [
    ["Massagem", a.tipo_massagem],
    ["Duração", a.duracao],
    ["Data e horário", formatarDataHora(a.data_hora)],
    ["Massoterapeuta", a.massoterapeutas?.nome ?? "—"],
    ["Local", cidadeLabel(a.massoterapeutas?.cidade ?? a.cidade)],
    ["Cliente", a.cliente_nome || clienteNome || "—"],
    ["WhatsApp do cliente", a.cliente_telefone || "—"],
    ["Pagamento", a.forma_pagamento],
  ];

  return (
    <div className="zf-print rounded-2xl border bg-card text-card-foreground overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 px-5 py-4 text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5" />
          <span className="font-display text-xl font-semibold">ZenFit</span>
        </div>
        <div className="text-right text-xs leading-tight">
          <div className="opacity-80">Comprovante de agendamento</div>
          <div className="font-mono text-sm font-semibold tracking-wider">
            {codigoComprovante(a.id)}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Emitido em {formatarDataHora(a.created_at, "curto")}
          </div>
          <StatusBadge a={a} />
        </div>

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {linhas.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
          <span className="text-sm text-muted-foreground">Valor total</span>
          <span className="text-xl font-semibold text-primary">
            {formatarPreco(Number(a.valor))}
          </span>
        </div>

        {ficha && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
              Ficha de anamnese enviada
            </div>
            <dl className="divide-y rounded-xl border text-sm">
              {linhasAnamnese(ficha).map(([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:justify-between sm:gap-4"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="sm:text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Apresente este código ({codigoComprovante(a.id)}) no atendimento. Cancelamentos podem ser
          feitos em “Minhas Massagens”.
        </p>
      </div>
    </div>
  );
}

export function BotaoImprimir({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("zf-no-print", className)}
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4 mr-2" /> Imprimir / salvar PDF
    </Button>
  );
}

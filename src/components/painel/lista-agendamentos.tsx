import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarPlus,
  Clock,
  FileText,
  History,
  Loader2,
  MapPin,
  Phone,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BotaoImprimir,
  Comprovante,
  StatusBadge,
  statusDe,
  type Agendamento,
} from "@/components/comprovante";
import { usePerfil } from "@/hooks/use-perfil";
import { supabase } from "@/integrations/supabase/client";
import { FUSO, cidadeLabel, codigoComprovante, formatarPreco } from "@/lib/zenfit";

type Modo = "proximos" | "historico";

export function ListaAgendamentos({ modo }: { modo: Modo }) {
  const perfil = usePerfil();
  const profissional = perfil.tipo === "massoterapeuta";
  const qc = useQueryClient();
  const [aberto, setAberto] = useState<Agendamento | null>(null);
  const [cancelar, setCancelar] = useState<Agendamento | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["agendamentos", perfil.userId, perfil.tipo],
    queryFn: async () => {
      let q = supabase.from("agendamentos").select("*, massoterapeutas(nome, cidade)");
      if (profissional) {
        const { data: meu } = await supabase
          .from("massoterapeutas")
          .select("id")
          .eq("user_id", perfil.userId)
          .maybeSingle();
        if (!meu) return [] as Agendamento[];
        q = q.eq("massoterapeuta_id", meu.id);
      } else {
        q = q.eq("cliente_id", perfil.userId);
      }
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Agendamento[];
    },
  });

  const tempo = (a: Agendamento) =>
    a.data_hora ? new Date(a.data_hora).getTime() : new Date(a.created_at).getTime();
  const lista = (data ?? [])
    .filter((a) =>
      modo === "proximos" ? statusDe(a) === "confirmado" : statusDe(a) !== "confirmado",
    )
    .sort((a, b) => (modo === "proximos" ? tempo(a) - tempo(b) : tempo(b) - tempo(a)));

  const confirmarCancelamento = async () => {
    if (!cancelar) return;
    setCancelando(true);
    const { error } = await supabase
      .from("agendamentos")
      .update({ status: "cancelado" })
      .eq("id", cancelar.id);
    setCancelando(false);
    if (error) {
      toast.error("Não foi possível cancelar: " + error.message);
      return;
    }
    toast.success("Agendamento cancelado.");
    setCancelar(null);
    qc.invalidateQueries({ queryKey: ["agendamentos"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed p-10 sm:p-14 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          {modo === "proximos" ? (
            <CalendarClock className="h-7 w-7" />
          ) : (
            <History className="h-7 w-7" />
          )}
        </div>
        <h2 className="mt-4 text-xl font-semibold">
          {modo === "proximos" ? "Nenhuma massagem agendada" : "Nenhuma massagem no histórico"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
          {profissional
            ? modo === "proximos"
              ? "Quando um cliente da sua cidade agendar, o horário aparece aqui."
              : "Os atendimentos realizados e cancelados ficam registrados aqui."
            : modo === "proximos"
              ? "Seus próximos horários aparecem aqui assim que você confirmar um agendamento."
              : "As massagens que você já realizou ficam registradas aqui."}
        </p>
        {!profissional && (
          <Button asChild className="mt-6 h-11">
            <Link to="/painel">
              <CalendarPlus className="h-4 w-4 mr-2" /> Agendar uma massagem
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {lista.map((a, i) => (
          <li key={a.id}>
            <ItemAgendamento
              a={a}
              destaque={modo === "proximos" && i === 0}
              profissional={profissional}
              onComprovante={() => setAberto(a)}
              onCancelar={!profissional && modo === "proximos" ? () => setCancelar(a) : undefined}
            />
          </li>
        ))}
      </ul>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="zf-no-print">
            <DialogTitle>Comprovante</DialogTitle>
          </DialogHeader>
          {aberto && <Comprovante a={aberto} clienteNome={perfil.nome} />}
          <BotaoImprimir className="w-full" />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cancelar} onOpenChange={(o) => !o && setCancelar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelar && (
                <>
                  {cancelar.tipo_massagem} ({cancelar.duracao}) com{" "}
                  {cancelar.massoterapeutas?.nome ?? "o profissional"}. O horário será liberado para
                  outros clientes.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmarCancelamento();
              }}
              disabled={cancelando}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cancelar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ItemAgendamento({
  a,
  destaque,
  profissional,
  onComprovante,
  onCancelar,
}: {
  a: Agendamento;
  destaque: boolean;
  profissional: boolean;
  onComprovante: () => void;
  onCancelar?: () => void;
}) {
  const quando = a.data_hora ? new Date(a.data_hora) : null;
  const parte = (o: Intl.DateTimeFormatOptions) =>
    quando
      ? new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...o }).format(quando).replace(".", "")
      : "";

  return (
    <article
      className={
        "flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:p-5 " +
        (destaque ? "border-primary/50 ring-1 ring-primary/20 shadow-[var(--shadow-soft)]" : "")
      }
    >
      <div className="flex items-center gap-4 sm:w-auto">
        <div
          className={
            "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl " +
            (statusDe(a) === "confirmado"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground")
          }
        >
          {quando ? (
            <>
              <span className="text-[10px] uppercase leading-none">
                {parte({ weekday: "short" })}
              </span>
              <span className="text-2xl font-semibold leading-tight">
                {parte({ day: "2-digit" })}
              </span>
              <span className="text-[10px] uppercase leading-none">
                {parte({ month: "short" })}
              </span>
            </>
          ) : (
            <CalendarClock className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 sm:hidden">
          <Titulo a={a} parte={parte} />
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="hidden sm:block">
          <Titulo a={a} parte={parte} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {a.duracao}
          </span>
          {profissional ? (
            <>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {a.cliente_nome || "Cliente"}
              </span>
              {a.cliente_telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {a.cliente_telefone}
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> {a.massoterapeutas?.nome ?? "Profissional"}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {cidadeLabel(a.massoterapeutas?.cidade ?? a.cidade)}
          </span>
          <span className="font-mono text-xs self-center">{codigoComprovante(a.id)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatarPreco(Number(a.valor))}</span>
          <StatusBadge a={a} />
        </div>
        <div className="flex gap-1 ml-auto sm:ml-0">
          <Button variant="outline" size="sm" onClick={onComprovante}>
            <FileText className="h-4 w-4 mr-1" />{" "}
            {profissional ? "Ficha e detalhes" : "Comprovante"}
          </Button>
          {onCancelar && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onCancelar}
            >
              <XCircle className="h-4 w-4 mr-1" /> Cancelar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function Titulo({
  a,
  parte,
}: {
  a: Agendamento;
  parte: (o: Intl.DateTimeFormatOptions) => string;
}) {
  return (
    <>
      <h3 className="font-sans text-base font-semibold">{a.tipo_massagem}</h3>
      <p className="text-sm">
        {a.data_hora ? (
          <>
            {parte({ weekday: "long" })}, {parte({ day: "2-digit", month: "long" })} ·{" "}
            <strong>{parte({ hour: "2-digit", minute: "2-digit" })}</strong>
          </>
        ) : (
          <span className="text-muted-foreground">Data a combinar</span>
        )}
      </p>
    </>
  );
}

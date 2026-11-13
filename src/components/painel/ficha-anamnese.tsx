import { useState } from "react";
import { AlertTriangle, ArrowLeft, ClipboardList, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type Anamnese, type Pergunta, type SimNao } from "@/lib/zenfit";

const PERGUNTAS: {
  chave: "alergias" | "lesao" | "medicamentos" | "cirurgias" | "doencas";
  titulo: string;
  dica: string;
}[] = [
  { chave: "alergias", titulo: "Possui alergias?", dica: "Óleos, cremes, perfumes, látex..." },
  {
    chave: "lesao",
    titulo: "Tem alguma lesão crônica ou dor aguda?",
    dica: "Onde é, há quanto tempo, intensidade...",
  },
  {
    chave: "medicamentos",
    titulo: "Faz uso de algum medicamento contínuo?",
    dica: "Quais (ex.: anticoagulante, anti-inflamatório)",
  },
  { chave: "cirurgias", titulo: "Fez alguma cirurgia nos últimos 6 meses?", dica: "Qual e quando" },
  {
    chave: "doencas",
    titulo: "Tem pressão alta, diabetes, varizes ou problema de circulação?",
    dica: "Quais",
  },
];

export function FichaAnamnese({
  inicial,
  resumoSelecao,
  enviando,
  onVoltar,
  onEnviar,
}: {
  inicial: Anamnese;
  resumoSelecao: React.ReactNode;
  enviando: boolean;
  onVoltar: () => void;
  onEnviar: (ficha: Anamnese) => void;
}) {
  const [f, setF] = useState<Anamnese>(inicial);
  const [declaro, setDeclaro] = useState(false);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const setPergunta = (k: (typeof PERGUNTAS)[number]["chave"], v: Partial<Pergunta>) =>
    setF((x) => ({ ...x, [k]: { ...x[k], ...v } }));

  const pendentes = [
    !f.idade && "idade",
    f.queixa.trim().length < 3 && "o que você sente",
    !f.gestante && "gestante",
    ...PERGUNTAS.filter((p) => !f[p.chave].resposta).map((p) => p.titulo.toLowerCase()),
    !declaro && "declaração",
  ].filter(Boolean);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    setTentouEnviar(true);
    if (pendentes.length) {
      toast.error("Responda todas as perguntas da ficha para confirmar o agendamento.");
      return;
    }
    onEnviar(f);
  };

  const faltando = (vazio: boolean) => tentouEnviar && vazio;

  return (
    <form
      onSubmit={enviar}
      className="rounded-3xl border bg-card p-5 sm:p-8 shadow-[var(--shadow-soft)] space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <ClipboardList className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Pré-atendimento</span>
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-semibold">Ficha de Anamnese</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Suas respostas vão direto para o profissional, para um atendimento seguro e
            personalizado.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onVoltar} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-1" /> Trocar massagem
        </Button>
      </div>

      <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 text-sm">
        {resumoSelecao}
      </div>

      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="a-idade">Idade</Label>
          <Input
            id="a-idade"
            inputMode="numeric"
            maxLength={3}
            value={f.idade}
            onChange={(e) => setF({ ...f, idade: e.target.value.replace(/\D/g, "") })}
            className={cn("h-11", faltando(!f.idade) && "border-destructive")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-queixa">
            O que você está sentindo? Qual seu objetivo com a massagem?
          </Label>
          <Textarea
            id="a-queixa"
            value={f.queixa}
            onChange={(e) => setF({ ...f, queixa: e.target.value })}
            placeholder="Ex: dor nas costas e muita tensão nos ombros"
            className={cn("min-h-11", faltando(f.queixa.trim().length < 3) && "border-destructive")}
          />
        </div>
      </div>

      <div className="divide-y rounded-2xl border">
        {PERGUNTAS.map((p) => (
          <div key={p.chave} className="p-4 space-y-3">
            <LinhaSimNao
              titulo={p.titulo}
              valor={f[p.chave].resposta}
              onChange={(r) => setPergunta(p.chave, { resposta: r })}
              erro={faltando(!f[p.chave].resposta)}
            />
            {f[p.chave].resposta === "sim" && (
              <Input
                value={f[p.chave].detalhe}
                onChange={(e) => setPergunta(p.chave, { detalhe: e.target.value })}
                placeholder={p.dica}
                aria-label={`Detalhes: ${p.titulo}`}
                className="h-10"
              />
            )}
          </div>
        ))}
        <div className="p-4 space-y-3">
          <LinhaSimNao
            titulo="Está gestante?"
            valor={f.gestante}
            onChange={(r) => setF({ ...f, gestante: r })}
            erro={faltando(!f.gestante)}
          />
          {f.gestante === "sim" && (
            <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Massagem na gestação exige técnica e posicionamento específicos. Confirme com o
              profissional e, se possível, tenha liberação do seu obstetra.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="a-obs">Observações (opcional)</Label>
        <Textarea
          id="a-obs"
          value={f.observacoes}
          onChange={(e) => setF({ ...f, observacoes: e.target.value })}
          placeholder="Pressão preferida, regiões a evitar, atendimento em domicílio..."
          className="min-h-16"
        />
      </div>

      <label
        className={cn(
          "flex items-start gap-3 text-sm cursor-pointer",
          faltando(!declaro) && "text-destructive",
        )}
      >
        <Checkbox
          checked={declaro}
          onCheckedChange={(v) => setDeclaro(v === true)}
          className="mt-0.5"
        />
        Declaro que as informações acima são verdadeiras e autorizo o envio desta ficha ao
        massoterapeuta escolhido.
      </label>

      <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={enviando}>
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Enviar ficha e confirmar agendamento
      </Button>
    </form>
  );
}

function LinhaSimNao({
  titulo,
  valor,
  onChange,
  erro,
}: {
  titulo: string;
  valor: SimNao;
  onChange: (v: SimNao) => void;
  erro: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span className={cn("text-sm font-medium", erro && "text-destructive")}>{titulo}</span>
      <div className="flex gap-2 shrink-0" role="radiogroup" aria-label={titulo}>
        {(["sim", "nao"] as const).map((op) => (
          <button
            key={op}
            type="button"
            role="radio"
            aria-checked={valor === op}
            onClick={() => onChange(op)}
            className={cn(
              "min-w-16 rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors",
              valor === op
                ? "border-primary bg-primary text-primary-foreground"
                : cn(
                    "text-muted-foreground hover:border-primary/50",
                    erro && "border-destructive/60",
                  ),
            )}
          >
            {op === "sim" ? "Sim" : "Não"}
          </button>
        ))}
      </div>
    </div>
  );
}

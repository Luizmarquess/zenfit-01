import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Check,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BotaoImprimir, Comprovante, type Agendamento } from "@/components/comprovante";
import { FichaAnamnese } from "@/components/painel/ficha-anamnese";
import { PremiumSection } from "@/components/premium-section";
import { ProfissionalCard, type Profissional } from "@/components/profissional-card";
import { usePerfil } from "@/hooks/use-perfil";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import {
  CIDADES,
  HORARIOS,
  SERVICOS,
  anamneseVazia,
  cidadeLabel,
  dataHoraISO,
  fimDoDia,
  formatarDataHora,
  formatarDuracao,
  formatarPreco,
  formatarWhatsApp,
  inicioDoDia,
  lerPergunta,
  proximosDias,
  servicosDoProfissional,
  textoPergunta,
  triagem,
  whatsAppValido,
  type Anamnese,
  type ResultadoTriagem,
  type Servico,
  type Variacao,
} from "@/lib/zenfit";

type Etapa = "localidade" | "catalogo" | "anamnese" | "confirmado";
type Identificacao = { nome: string; telefone: string; cidade: string };
type Escolha = { p: Profissional; servico: Servico; variacao: Variacao };
type Selecao = Escolha & { dataHora: string };

const ETAPAS: { id: Etapa; titulo: string }[] = [
  { id: "localidade", titulo: "Localidade" },
  { id: "catalogo", titulo: "Massagem e tempo" },
  { id: "anamnese", titulo: "Anamnese" },
  { id: "confirmado", titulo: "Confirmação" },
];

export function PainelCliente() {
  const perfil = usePerfil();
  const qc = useQueryClient();
  const [id, setId] = useState<Identificacao>({
    nome: perfil.nome,
    telefone: perfil.telefone ? formatarWhatsApp(perfil.telefone) : "",
    cidade: perfil.cidade,
  });
  const identificado = !!id.nome.trim() && whatsAppValido(id.telefone) && !!id.cidade;
  // Passo 1 é obrigatório: só vai direto ao catálogo quem já tem cidade, nome e WhatsApp salvos.
  const [etapa, setEtapa] = useState<Etapa>(identificado ? "catalogo" : "localidade");
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [relato, setRelato] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState<Agendamento | null>(null);

  const { data: anamneseSalva } = useQuery({
    queryKey: ["anamnese", perfil.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("anamneses")
        .select("*")
        .eq("user_id", perfil.userId)
        .maybeSingle();
      return data;
    },
  });

  const fichaInicial = useMemo<Anamnese>(() => {
    if (!anamneseSalva) return { ...anamneseVazia(), queixa: relato };
    const ci = anamneseSalva.contraindicacoes ?? "";
    return {
      idade: anamneseSalva.idade ?? "",
      queixa: relato || anamneseSalva.queixa || "",
      alergias: lerPergunta(anamneseSalva.alergias),
      lesao: lerPergunta(anamneseSalva.historico),
      gestante: /gestante:\s*sim/i.test(ci) ? "sim" : ci ? "nao" : "",
      medicamentos: lerPergunta(anamneseSalva.medicamentos),
      cirurgias: lerPergunta(anamneseSalva.cirurgias),
      doencas: lerPergunta(anamneseSalva.doencas),
      observacoes: anamneseSalva.habitos ?? "",
    };
  }, [anamneseSalva, relato]);

  const topo = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const salvarIdentificacao = async (novo: Identificacao) => {
    const { error } = await supabase
      .from("profiles")
      .update({ nome: novo.nome.trim(), telefone: novo.telefone, cidade: novo.cidade })
      .eq("user_id", perfil.userId);
    if (error) {
      toast.error("Não foi possível salvar seus dados: " + error.message);
      return;
    }
    setId(novo);
    setEscolha(null);
    qc.invalidateQueries({ queryKey: ["perfil", perfil.userId] });
    setEtapa("catalogo");
  };

  const confirmar = async (ficha: Anamnese) => {
    if (!selecao) return;
    const { p, servico, variacao, dataHora } = selecao;
    setEnviando(true);

    // Mantém a ficha salva no perfil para pré-preencher os próximos agendamentos.
    const { error: erroFicha } = await supabase.from("anamneses").upsert(
      {
        user_id: perfil.userId,
        nome: id.nome.trim(),
        idade: ficha.idade,
        contato: id.telefone,
        queixa: ficha.queixa.trim(),
        alergias: textoPergunta(ficha.alergias),
        historico: textoPergunta(ficha.lesao),
        medicamentos: textoPergunta(ficha.medicamentos),
        cirurgias: textoPergunta(ficha.cirurgias),
        doencas: textoPergunta(ficha.doencas),
        contraindicacoes: `Gestante: ${ficha.gestante === "sim" ? "Sim" : "Não"}`,
        habitos: ficha.observacoes.trim() || null,
      },
      { onConflict: "user_id" },
    );
    if (erroFicha) {
      setEnviando(false);
      toast.error("Não foi possível salvar a ficha: " + erroFicha.message);
      return;
    }

    const { data, error } = await supabase
      .from("agendamentos")
      .insert({
        cliente_id: perfil.userId,
        massoterapeuta_id: p.id,
        tipo_massagem: servico.nome,
        duracao: formatarDuracao(variacao.minutos),
        valor: variacao.valor,
        cidade: id.cidade,
        forma_pagamento: "No local do atendimento",
        status: "confirmado",
        data_hora: dataHora,
        cliente_nome: id.nome.trim(),
        cliente_telefone: id.telefone,
        anamnese: ficha as unknown as Json,
      })
      .select("*, massoterapeutas(nome, cidade)")
      .single();
    setEnviando(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("Esse horário acabou de ser reservado por outra pessoa. Escolha outro.");
        setSelecao(null);
        setEtapa("catalogo");
      } else if (error.code === "42703" || error.code === "PGRST204") {
        // Coluna inexistente: a migração de agendamentos ainda não foi aplicada no banco.
        console.error("Migração pendente: 20261113130000_agendamentos_data_comprovante.sql", error);
        toast.error(
          "O banco de dados ainda não foi atualizado para receber agendamentos com data e horário. Avise o administrador da plataforma.",
          { duration: 10000 },
        );
      } else {
        toast.error("Não foi possível confirmar: " + error.message);
      }
      return;
    }

    setConfirmado(data as Agendamento);
    qc.invalidateQueries({ queryKey: ["agendamentos"] });
    qc.invalidateQueries({ queryKey: ["anamnese", perfil.userId] });
    qc.invalidateQueries({ queryKey: ["horarios"] });
    setEtapa("confirmado");
    topo();
    toast.success("Agendamento confirmado!");
  };

  const novoAgendamento = () => {
    setEscolha(null);
    setSelecao(null);
    setConfirmado(null);
    setEtapa("catalogo");
    topo();
  };

  const primeiroNome = id.nome.split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Novo agendamento</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Olá{primeiroNome ? `, ${primeiroNome}` : ""}! Vamos cuidar de você.
        </h1>
      </div>

      <Passos atual={etapa} onIr={setEtapa} podeIrCatalogo={identificado} />

      {etapa === "localidade" && <EtapaLocalidade inicial={id} onSalvar={salvarIdentificacao} />}

      {etapa === "catalogo" &&
        (escolha ? (
          <EscolhaHorario
            escolha={escolha}
            cidade={id.cidade}
            onVoltar={() => setEscolha(null)}
            onContinuar={(dataHora) => {
              setSelecao({ ...escolha, dataHora });
              setEtapa("anamnese");
              topo();
            }}
          />
        ) : (
          <EtapaCatalogo
            id={id}
            relato={relato}
            setRelato={setRelato}
            onEditarLocalidade={() => setEtapa("localidade")}
            onEscolher={(e) => {
              setEscolha(e);
              topo();
            }}
          />
        ))}

      {etapa === "anamnese" && selecao && (
        <FichaAnamnese
          key={selecao.p.id + selecao.servico.id + selecao.dataHora + (anamneseSalva ? "1" : "0")}
          inicial={fichaInicial}
          enviando={enviando}
          onVoltar={() => setEtapa("catalogo")}
          onEnviar={confirmar}
          resumoSelecao={<ResumoSelecao s={selecao} cidade={id.cidade} />}
        />
      )}

      {etapa === "confirmado" && confirmado && (
        <section className="space-y-5 max-w-3xl mx-auto">
          <div className="zf-no-print text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <CalendarCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">Agendamento confirmado!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Seu horário está reservado e já aparece em{" "}
              <strong className="text-foreground">Minhas Massagens</strong>.
            </p>
          </div>
          <Comprovante a={confirmado} />
          <div className="zf-no-print flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild className="h-11 font-semibold">
              <Link to="/painel/massagens">
                <CalendarClock className="h-4 w-4 mr-2" /> Ver em Minhas Massagens
              </Link>
            </Button>
            <BotaoImprimir className="h-11" />
            <Button variant="ghost" className="h-11" onClick={novoAgendamento}>
              <Plus className="h-4 w-4 mr-2" /> Novo agendamento
            </Button>
          </div>
        </section>
      )}

      {etapa !== "confirmado" && <PremiumSection tipo="cliente" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Indicador de passos
// ---------------------------------------------------------------------------

function Passos({
  atual,
  onIr,
  podeIrCatalogo,
}: {
  atual: Etapa;
  onIr: (e: Etapa) => void;
  podeIrCatalogo: boolean;
}) {
  const idxAtual = ETAPAS.findIndex((e) => e.id === atual);
  return (
    <ol className="zf-no-print grid grid-cols-4 gap-2">
      {ETAPAS.map((e, i) => {
        const feito = i < idxAtual;
        const ativo = i === idxAtual;
        // Só dá para voltar para Localidade/Massagem, e nunca depois de confirmar.
        const clicavel =
          feito &&
          atual !== "confirmado" &&
          (e.id === "localidade" || (e.id === "catalogo" && podeIrCatalogo));
        return (
          <li key={e.id}>
            <button
              type="button"
              disabled={!clicavel}
              onClick={() => onIr(e.id)}
              className={cn(
                "w-full text-left disabled:cursor-default",
                clicavel && "hover:opacity-80",
              )}
              aria-current={ativo ? "step" : undefined}
            >
              <div
                className={cn("h-1.5 rounded-full", feito || ativo ? "bg-primary" : "bg-muted")}
              />
              <div className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    feito
                      ? "bg-primary text-primary-foreground"
                      : ativo
                        ? "border-2 border-primary text-primary"
                        : "border text-muted-foreground",
                  )}
                >
                  {feito ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={cn("truncate", ativo ? "font-semibold" : "text-muted-foreground")}>
                  <span className="hidden sm:inline">Passo {i + 1} · </span>
                  {e.titulo}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Passo 1 — Localidade
// ---------------------------------------------------------------------------

function EtapaLocalidade({
  inicial,
  onSalvar,
}: {
  inicial: Identificacao;
  onSalvar: (v: Identificacao) => Promise<void>;
}) {
  const [v, setV] = useState(inicial);
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.cidade) return toast.error("Escolha sua cidade para vermos quem atende perto de você.");
    if (!v.nome.trim()) return toast.error("Informe seu nome ou apelido.");
    if (!whatsAppValido(v.telefone)) return toast.error("Informe um WhatsApp válido com DDD.");
    setSalvando(true);
    await onSalvar(v);
    setSalvando(false);
  };

  return (
    <form
      onSubmit={enviar}
      className="rounded-3xl border bg-card p-5 sm:p-8 shadow-[var(--shadow-soft)] max-w-2xl space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 text-primary">
          <MapPin className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">Passo 1</span>
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-semibold">Onde você está?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Usamos sua cidade para mostrar apenas massoterapeutas que atendem na sua região.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="l-cidade">Cidade / Região</Label>
        <Select value={v.cidade} onValueChange={(c) => setV({ ...v, cidade: c })}>
          <SelectTrigger id="l-cidade" className="h-12 w-full text-base">
            <SelectValue placeholder="Ex: Aracoiaba - CE" />
          </SelectTrigger>
          <SelectContent>
            {CIDADES.map((c) => (
              <SelectItem key={c} value={c}>
                {cidadeLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="l-nome">Nome completo ou apelido</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="l-nome"
              placeholder="Ex: Ana Dev"
              value={v.nome}
              onChange={(e) => setV({ ...v, nome: e.target.value })}
              className="h-11 pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="l-whats">WhatsApp</Label>
          <div className="relative">
            <MessageCircle className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="l-whats"
              inputMode="tel"
              placeholder="Ex: (85) 9 9999-9999"
              value={v.telefone}
              onChange={(e) => setV({ ...v, telefone: formatarWhatsApp(e.target.value) })}
              className="h-11 pl-9"
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={salvando}>
        {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Ver massagens na minha cidade <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Passo 2a — Catálogo: massagens, tempos e valores na cidade
// ---------------------------------------------------------------------------

function EtapaCatalogo({
  id,
  relato,
  setRelato,
  onEditarLocalidade,
  onEscolher,
}: {
  id: Identificacao;
  relato: string;
  setRelato: (v: string) => void;
  onEditarLocalidade: () => void;
  onEscolher: (s: Escolha) => void;
}) {
  const [filtro, setFiltro] = useState<string>("todos");
  const [resultado, setResultado] = useState<ResultadoTriagem | null>(null);

  const { data: profissionais, isLoading } = useQuery({
    queryKey: ["massoterapeutas", id.cidade],
    queryFn: async () => {
      // Filtro automático: só quem atende na cidade do cliente.
      const { data, error } = await supabase
        .from("massoterapeutas")
        .select("*")
        .eq("cidade", id.cidade)
        .eq("ativo", true)
        .order("premium", { ascending: false })
        .order("avaliacao", { ascending: false });
      if (error) throw error;
      return data as Profissional[];
    },
  });

  const ofertas = useMemo(
    () =>
      (profissionais ?? []).map((p) => ({ p, servicos: servicosDoProfissional(p.especialidades) })),
    [profissionais],
  );
  const servicosNaCidade = SERVICOS.filter((s) => ofertas.some((o) => o.servicos.includes(s)));
  const visiveis =
    filtro === "todos" ? ofertas : ofertas.filter((o) => o.servicos.some((s) => s.id === filtro));
  const recomendado = resultado
    ? SERVICOS.find((s) => s.tecnicaId === resultado.principal.id)
    : undefined;

  const analisar = (texto = relato) => {
    if (texto.trim().length < 3) return toast.error("Conte um pouco do que você está sentindo.");
    setRelato(texto);
    const r = triagem(texto);
    setResultado(r);
    const s = SERVICOS.find((x) => x.tecnicaId === r.principal.id);
    if (s && ofertas.some((o) => o.servicos.includes(s))) setFiltro(s.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border bg-card px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <MapPin className="h-4 w-4 text-primary" /> {cidadeLabel(id.cidade)}
        </span>
        <span className="text-muted-foreground">
          {id.nome} · {id.telefone}
        </span>
        <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={onEditarLocalidade}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Alterar
        </Button>
      </div>

      <section className="rounded-3xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-primary">
          <Stethoscope className="h-5 w-5" />
          <h2 className="font-sans text-base font-semibold text-foreground">
            O que você está sentindo?
          </h2>
          <span className="text-xs text-muted-foreground">
            (opcional — ajuda a escolher a massagem)
          </span>
        </div>
        <form
          className="mt-3 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            analisar();
          }}
        >
          <Textarea
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                analisar();
              }
            }}
            placeholder='Ex: "Estou com dor nas costas e muita tensão"'
            className="min-h-11 resize-none"
            rows={1}
            aria-label="Descreva seu sintoma ou necessidade"
          />
          <Button type="submit" variant="secondary" className="h-11 shrink-0">
            <Search className="h-4 w-4 mr-2" /> Sugerir massagem
          </Button>
        </form>
        {resultado && (
          <div className="mt-4 rounded-2xl bg-primary/10 border border-primary/30 p-4 text-sm">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <Sparkles className="h-4 w-4" /> Técnica ideal: {resultado.principal.nome}
            </div>
            <p className="mt-1 text-muted-foreground">
              {resultado.principal.resumo}
              {resultado.alternativa && (
                <>
                  {" "}
                  Também pode ajudar:{" "}
                  <strong className="text-foreground">{resultado.alternativa.nome}</strong>.
                </>
              )}
            </p>
            {recomendado && !servicosNaCidade.includes(recomendado) && (
              <p className="mt-2 text-xs text-muted-foreground">
                Nenhum profissional de {id.cidade} oferece {recomendado.nome} ainda — veja as outras
                opções abaixo.
              </p>
            )}
            {resultado.alertaSaude && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Pelo que você descreveu, procure um
                médico antes da massagem.
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 text-primary">
          <span className="text-sm font-medium uppercase tracking-wide">Passo 2</span>
        </div>
        <h2 className="text-2xl font-semibold">Massagens em {id.cidade}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha o profissional, a massagem e o tempo — os valores já estão na tela.
        </p>
        {servicosNaCidade.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <Chip ativo={filtro === "todos"} onClick={() => setFiltro("todos")}>
              Todas
            </Chip>
            {servicosNaCidade.map((s) => (
              <Chip
                key={s.id}
                ativo={filtro === s.id}
                onClick={() => setFiltro(s.id)}
                destaque={s === recomendado}
              >
                {s.nome}
                <span className="opacity-70">
                  · a partir de {formatarPreco(Math.min(...s.variacoes.map((v) => v.valor)))}
                </span>
              </Chip>
            ))}
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : ofertas.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-3 text-sage" />
          <p className="max-w-md mx-auto text-sm">
            Ainda não há massoterapeutas cadastrados em {cidadeLabel(id.cidade)}. Volte em breve —
            novos profissionais entram toda semana.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiveis.map(({ p, servicos }) => {
            const lista = filtro === "todos" ? servicos : servicos.filter((s) => s.id === filtro);
            const indicado = recomendado && servicos.includes(recomendado);
            return (
              <ProfissionalCard
                key={p.id}
                p={p}
                indicado={indicado ? recomendado.nome : null}
                acao={
                  <div className="space-y-3 border-t pt-4">
                    {lista.map((s) => (
                      <div key={s.id}>
                        <div className="text-sm font-medium">{s.nome}</div>
                        <div className="mt-1.5 grid grid-cols-2 gap-2">
                          {s.variacoes.map((v) => (
                            <button
                              key={v.minutos}
                              type="button"
                              onClick={() => onEscolher({ p, servico: s, variacao: v })}
                              className="group flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> {formatarDuracao(v.minutos)}
                              </span>
                              <span className="font-semibold">{formatarPreco(v.valor)}</span>
                              <span className="text-[11px] font-medium text-primary group-hover:underline">
                                Agendar
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({
  ativo,
  destaque,
  onClick,
  children,
}: {
  ativo: boolean;
  destaque?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
        destaque && !ativo && "border-primary/60 text-primary",
      )}
    >
      {destaque && <Sparkles className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Passo 2b — Dia e horário
// ---------------------------------------------------------------------------

function EscolhaHorario({
  escolha,
  cidade,
  onVoltar,
  onContinuar,
}: {
  escolha: Escolha;
  cidade: string;
  onVoltar: () => void;
  onContinuar: (dataHora: string) => void;
}) {
  const dias = useMemo(() => proximosDias(14), []);
  const [dia, setDia] = useState(dias[0].iso);
  const [hora, setHora] = useState<string | null>(null);

  const { data: ocupados = [], isFetching } = useQuery({
    queryKey: ["horarios", escolha.p.id, dia],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("horarios_ocupados", {
        _massoterapeuta_id: escolha.p.id,
        _inicio: inicioDoDia(dia),
        _fim: fimDoDia(dia),
      });
      // Sem a função no banco, seguimos sem bloquear horários (o índice único ainda protege).
      if (error) return [] as number[];
      return (data ?? []).map((d) => new Date(d).getTime());
    },
  });

  const limite = Date.now() + 60 * 60 * 1000; // pelo menos 1h de antecedência
  const slots = HORARIOS.map((h) => {
    const iso = dataHoraISO(dia, h);
    const t = new Date(iso).getTime();
    return { h, iso, livre: t > limite && !ocupados.includes(t) };
  });
  const escolhido = hora ? slots.find((s) => s.h === hora && s.livre) : undefined;

  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-8 shadow-[var(--shadow-soft)] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <CalendarClock className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Passo 2 · Dia e horário
            </span>
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-semibold">Quando fica melhor para você?</h2>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onVoltar} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-1" /> Trocar massagem
        </Button>
      </div>

      <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 text-sm">
        <ResumoSelecao s={escolha} cidade={cidade} />
      </div>

      <div>
        <Label className="mb-2 block">Dia</Label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {dias.map((d) => (
            <button
              key={d.iso}
              type="button"
              aria-pressed={dia === d.iso}
              onClick={() => {
                setDia(d.iso);
                setHora(null);
              }}
              className={cn(
                "flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 transition-colors",
                dia === d.iso
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary/50 text-muted-foreground",
              )}
            >
              <span className="text-[11px] uppercase">{d.semana}</span>
              <span className="text-lg font-semibold leading-tight">{d.dia}</span>
              <span className="text-[11px]">{d.mes}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 flex items-center gap-2">
          Horário{" "}
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slots.map((s) => (
            <button
              key={s.h}
              type="button"
              disabled={!s.livre}
              aria-pressed={hora === s.h}
              onClick={() => setHora(s.h)}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through",
                hora === s.h && s.livre
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary/50",
              )}
            >
              {s.h}
            </button>
          ))}
        </div>
        {slots.every((s) => !s.livre) && (
          <p className="mt-2 text-sm text-muted-foreground">
            Sem horários livres neste dia. Escolha outro dia.
          </p>
        )}
      </div>

      <Button
        className="w-full h-12 text-base font-semibold"
        disabled={!escolhido}
        onClick={() => escolhido && onContinuar(escolhido.iso)}
      >
        {escolhido ? `Continuar · ${formatarDataHora(escolhido.iso)}` : "Escolha um horário"}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </section>
  );
}

function ResumoSelecao({ s, cidade }: { s: Escolha & { dataHora?: string }; cidade: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="font-semibold">{s.servico.nome}</span>
      <span className="flex items-center gap-1 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> {formatarDuracao(s.variacao.minutos)}
      </span>
      <span className="font-semibold text-primary">{formatarPreco(s.variacao.valor)}</span>
      <span className="text-muted-foreground">
        com <strong className="text-foreground">{s.p.nome}</strong> · {cidadeLabel(cidade)}
      </span>
      {s.dataHora && (
        <span className="flex items-center gap-1 font-medium">
          <CalendarClock className="h-3.5 w-3.5 text-primary" /> {formatarDataHora(s.dataHora)}
        </span>
      )}
    </div>
  );
}

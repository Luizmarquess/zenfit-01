import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Heart, Search, Star, Gift, TrendingUp, Users, CheckCircle2, Clock, Wallet, ClipboardList, CreditCard, Banknote, QrCode, Loader2, Phone } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "zenfit — Encontre seu massoterapeuta" },
      { name: "description", content: "Conectamos clientes a massoterapeutas em Aracoiaba, Aratuba, Itapiúna, Baturité e Capistrano." },
      { property: "og:title", content: "zenfit — Bem-estar perto de você" },
      { property: "og:description", content: "Encontre massoterapeutas qualificados na sua região." },
    ],
  }),
  component: Index,
});

const REGIOES = ["Aracoiaba", "Aratuba", "Itapiúna", "Baturité", "Capistrano"];
const MASSAGENS = [
  {
    id: "relaxante",
    nome: "Massagem Relaxante",
    desc: "Tranquilidade e bem-estar para corpo e mente",
    variacoes: [
      { duracao: "30 min", valor: 60 },
      { duracao: "1 hora", valor: 100 },
    ],
  },
  {
    id: "antiestresse",
    nome: "Massagem Antiestresse",
    desc: "Alívio profundo da tensão acumulada",
    variacoes: [
      { duracao: "40 min", valor: 80 },
      { duracao: "1 hora", valor: 120 },
    ],
  },
  {
    id: "esportiva",
    nome: "Massagem Esportiva",
    desc: "Recuperação muscular e performance",
    variacoes: [
      { duracao: "50 min", valor: 110 },
      { duracao: "1h30", valor: 160 },
    ],
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="container mx-auto px-6 pt-12 pb-8 text-center max-w-3xl">
        <Badge className="mb-4" variant="outline">
          <Sparkles className="h-3 w-3 mr-1" /> Bem-estar na sua região
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
          Encontre seu <span className="text-primary">massoterapeuta</span> ideal
        </h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Conectamos clientes e profissionais de massoterapia em Aracoiaba, Aratuba, Itapiúna, Baturité e Capistrano.
        </p>
      </section>

      <section className="container mx-auto px-6 pb-20 max-w-3xl">
        <Tabs defaultValue="cliente" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="cliente" className="text-base">Sou Cliente</TabsTrigger>
            <TabsTrigger value="massoterapeuta" className="text-base">Sou Massoterapeuta</TabsTrigger>
          </TabsList>

          <TabsContent value="cliente" className="mt-6">
            <ClientePanel />
          </TabsContent>

          <TabsContent value="massoterapeuta" className="mt-6">
            <MassoterapeutaPanel />
          </TabsContent>
        </Tabs>
      </section>

      <PremiumSection />

      <footer className="border-t border-border/60 py-8 mt-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} zenfit · Cuidando do seu bem-estar
        </div>
      </footer>
    </div>
  );
}

function ClientePanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [regiao, setRegiao] = useState("");
  const [tipo, setTipo] = useState("");
  const [variacaoIdx, setVariacaoIdx] = useState<number | null>(null);
  const [etapa, setEtapa] = useState<"busca" | "anamnese" | "pagamento" | "concluido">("busca");
  const [pagamento, setPagamento] = useState("");
  const [anamnese, setAnamnese] = useState({
    nome: "", idade: "", contato: "",
    queixa: "", historico: "", doencas: "",
    medicamentos: "", cirurgias: "", alergias: "",
    habitos: "", contraindicacoes: "",
  });
  const [massoSelecionadoId, setMassoSelecionadoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const massagemSelecionada = MASSAGENS.find((m) => m.id === tipo);
  const variacaoSelecionada = variacaoIdx !== null ? massagemSelecionada?.variacoes[variacaoIdx] : null;

  const handleSelecionarTipo = (id: string) => {
    setTipo(id);
    setVariacaoIdx(null);
    setEtapa("busca");
  };

  // Profissionais da cidade selecionada (premium primeiro)
  const { data: profissionais } = useQuery({
    queryKey: ["massoterapeutas", regiao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("massoterapeutas")
        .select("*")
        .eq("ativo", true)
        .eq("cidade", regiao)
        .order("premium", { ascending: false })
        .order("avaliacao", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!regiao,
  });

  // Carrega anamnese existente quando entra na etapa
  useEffect(() => {
    if (etapa !== "anamnese" || !user) return;
    supabase.from("anamneses").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setAnamnese({
          nome: data.nome || "", idade: data.idade || "", contato: data.contato || "",
          queixa: data.queixa || "", historico: data.historico || "", doencas: data.doencas || "",
          medicamentos: data.medicamentos || "", cirurgias: data.cirurgias || "", alergias: data.alergias || "",
          habitos: data.habitos || "", contraindicacoes: data.contraindicacoes || "",
        });
      }
    });
  }, [etapa, user]);

  const continuarParaAnamnese = () => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/" } });
      return;
    }
    setEtapa("anamnese");
  };

  const salvarAnamneseEContinuar = async () => {
    if (!user) return;
    setSalvando(true);
    const { error } = await supabase.from("anamneses").upsert({
      user_id: user.id, ...anamnese,
    }, { onConflict: "user_id" });
    setSalvando(false);
    if (error) { toast.error("Erro ao salvar anamnese: " + error.message); return; }
    toast.success("Anamnese salva");
    setEtapa("pagamento");
  };

  const confirmarAgendamento = async () => {
    if (!user || !variacaoSelecionada || !massagemSelecionada) return;
    setSalvando(true);
    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id,
      massoterapeuta_id: massoSelecionadoId,
      tipo_massagem: massagemSelecionada.nome,
      duracao: variacaoSelecionada.duracao,
      valor: variacaoSelecionada.valor,
      cidade: regiao,
      forma_pagamento: pagamento,
    });
    setSalvando(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Agendamento confirmado!");
    qc.invalidateQueries({ queryKey: ["admin", "agendamentos"] });
    setEtapa("concluido");
  };

  return (
    <Card className="shadow-[var(--shadow-soft)] border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" /> Buscar massoterapeuta
        </CardTitle>
        <CardDescription>Selecione sua região, o tipo de massagem e a duração desejada.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Região</Label>
          <Select value={regiao} onValueChange={setRegiao}>
            <SelectTrigger><SelectValue placeholder="Escolha sua cidade" /></SelectTrigger>
            <SelectContent>
              {REGIOES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de massagem</Label>
          <div className="grid sm:grid-cols-3 gap-2">
            {MASSAGENS.map(m => (
              <button
                key={m.id}
                onClick={() => handleSelecionarTipo(m.id)}
                className={`text-left rounded-lg border p-3 transition-all ${tipo === m.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
              >
                <div className="font-medium text-sm">{m.nome}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {massagemSelecionada && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Clock className="h-4 w-4" /> Duração e valor</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {massagemSelecionada.variacoes.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => { setVariacaoIdx(idx); setEtapa("busca"); }}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-all ${variacaoIdx === idx ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {v.duracao}
                  </span>
                  <span className="font-semibold text-sm flex items-center gap-1">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    R$ {v.valor}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {regiao && profissionais && profissionais.length > 0 && (
          <div className="space-y-2">
            <Label>Massoterapeuta (opcional)</Label>
            <div className="space-y-2">
              {profissionais.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setMassoSelecionadoId(massoSelecionadoId === p.id ? null : p.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${massoSelecionadoId === p.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {p.nome}
                        {p.premium && <Badge style={{ background: "var(--gradient-premium)", color: "white", border: "none" }} className="text-[10px]"><Sparkles className="h-2.5 w-2.5 mr-0.5" />Premium</Badge>}
                      </div>
                      {p.bio && <div className="text-xs text-muted-foreground mt-0.5">{p.bio}</div>}
                    </div>
                    <div className="text-xs flex items-center gap-1 text-amber-600 shrink-0"><Star className="h-3 w-3 fill-current" />{p.avaliacao}</div>
                  </div>
                  {p.telefone && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone className="h-3 w-3" />{p.telefone}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full h-11"
          disabled={!regiao || !tipo || variacaoIdx === null}
          onClick={continuarParaAnamnese}
        >
          {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : user ? "Continuar para anamnese" : "Entrar para continuar"}
        </Button>

        {etapa !== "busca" && variacaoSelecionada && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <strong>{massagemSelecionada?.nome}</strong> ({variacaoSelecionada.duracao}) — <strong>R$ {variacaoSelecionada.valor}</strong> em <strong>{regiao}</strong>
            </div>
          </div>
        )}

        {etapa === "anamnese" && (
          <AnamneseForm
            anamnese={anamnese}
            setAnamnese={setAnamnese}
            onContinuar={salvarAnamneseEContinuar}
            salvando={salvando}
          />
        )}

        {etapa === "pagamento" && variacaoSelecionada && (
          <PagamentoForm
            valor={variacaoSelecionada.valor}
            pagamento={pagamento}
            setPagamento={setPagamento}
            onConfirmar={confirmarAgendamento}
            salvando={salvando}
          />
        )}

        {etapa === "concluido" && (
          <div className="rounded-lg p-5 text-sm flex items-start gap-3 border-2 border-primary/30" style={{ background: "color-mix(in oklab, var(--primary) 8%, transparent)" }}>
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-primary">Agendamento concluído!</div>
              <div className="text-muted-foreground">
                Em breve um massoterapeuta de <strong>{regiao}</strong> entrará em contato com <strong>{anamnese.nome || "você"}</strong>. Pagamento: <strong>{pagamento}</strong>.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type AnamneseData = {
  nome: string; idade: string; contato: string;
  queixa: string; historico: string; doencas: string;
  medicamentos: string; cirurgias: string; alergias: string;
  habitos: string; contraindicacoes: string;
};

function AnamneseForm({
  anamnese, setAnamnese, onContinuar,
}: {
  anamnese: AnamneseData;
  setAnamnese: React.Dispatch<React.SetStateAction<AnamneseData>>;
  onContinuar: () => void;
}) {
  const set = (k: keyof AnamneseData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setAnamnese(prev => ({ ...prev, [k]: e.target.value }));

  const valido = anamnese.nome && anamnese.idade && anamnese.contato && anamnese.queixa;

  return (
    <div
      className="rounded-xl border-2 border-primary/30 p-5 space-y-5"
      style={{ background: "color-mix(in oklab, var(--primary) 4%, transparent)" }}
    >
      <div className="flex items-center gap-2 text-primary">
        <ClipboardList className="h-5 w-5" />
        <h3 className="font-display text-xl font-semibold">Ficha de Anamnese</h3>
      </div>
      <p className="text-sm text-muted-foreground -mt-3">
        Suas respostas ajudam o profissional a oferecer um atendimento seguro e personalizado.
      </p>

      <Section title="Dados pessoais">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Nome"><Input value={anamnese.nome} onChange={set("nome")} placeholder="Seu nome" /></Field>
          <Field label="Idade"><Input type="number" value={anamnese.idade} onChange={set("idade")} placeholder="Ex: 32" /></Field>
          <Field label="Contato"><Input value={anamnese.contato} onChange={set("contato")} placeholder="(85) 9 9999-9999" /></Field>
        </div>
      </Section>

      <Section title="Queixa principal">
        <Textarea value={anamnese.queixa} onChange={set("queixa")} placeholder="Dor, tensão, estresse, desconforto..." />
      </Section>

      <Section title="Histórico de saúde">
        <Textarea value={anamnese.historico} onChange={set("historico")} placeholder="Condições anteriores relevantes" />
      </Section>

      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="Doenças atuais ou anteriores">
          <Textarea value={anamnese.doencas} onChange={set("doencas")} placeholder="Diabetes, hipertensão, etc." />
        </Section>
        <Section title="Uso de medicamentos">
          <Textarea value={anamnese.medicamentos} onChange={set("medicamentos")} placeholder="Liste os medicamentos em uso" />
        </Section>
        <Section title="Cirurgias recentes">
          <Textarea value={anamnese.cirurgias} onChange={set("cirurgias")} placeholder="Quais e quando" />
        </Section>
        <Section title="Alergias">
          <Textarea value={anamnese.alergias} onChange={set("alergias")} placeholder="Óleos, cremes, perfumes..." />
        </Section>
      </div>

      <Section title="Hábitos de vida">
        <Textarea value={anamnese.habitos} onChange={set("habitos")} placeholder="Atividade física, sono, trabalho" />
      </Section>

      <Section title="Contraindicações para a massagem">
        <Textarea value={anamnese.contraindicacoes} onChange={set("contraindicacoes")} placeholder="Algo que devamos evitar" />
      </Section>

      <Button className="w-full h-11" disabled={!valido} onClick={onContinuar}>
        Continuar para pagamento
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-primary">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PagamentoForm({
  valor, pagamento, setPagamento, onConfirmar,
}: {
  valor: number;
  pagamento: string;
  setPagamento: (v: string) => void;
  onConfirmar: () => void;
}) {
  const opcoes = [
    { id: "Pix", icon: <QrCode className="h-5 w-5" />, desc: "Pagamento instantâneo" },
    { id: "Cartão de crédito", icon: <CreditCard className="h-5 w-5" />, desc: "Parcelamento disponível" },
    { id: "Cartão de débito", icon: <CreditCard className="h-5 w-5" />, desc: "Débito à vista" },
    { id: "Espécie", icon: <Banknote className="h-5 w-5" />, desc: "Pago no atendimento" },
  ];

  return (
    <div
      className="rounded-xl border-2 border-primary/30 p-5 space-y-4"
      style={{ background: "color-mix(in oklab, var(--primary) 4%, transparent)" }}
    >
      <div className="flex items-center gap-2 text-primary">
        <Wallet className="h-5 w-5" />
        <h3 className="font-display text-xl font-semibold">Forma de pagamento</h3>
      </div>
      <div className="text-sm text-muted-foreground">
        Valor total: <strong className="text-primary">R$ {valor}</strong>
      </div>

      <RadioGroup value={pagamento} onValueChange={setPagamento} className="grid sm:grid-cols-2 gap-2">
        {opcoes.map(o => (
          <label
            key={o.id}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${pagamento === o.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
          >
            <RadioGroupItem value={o.id} />
            <span className="text-primary">{o.icon}</span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{o.id}</span>
              <span className="block text-xs text-muted-foreground">{o.desc}</span>
            </span>
          </label>
        ))}
      </RadioGroup>

      <Button className="w-full h-11" disabled={!pagamento} onClick={onConfirmar}>
        Confirmar agendamento
      </Button>
    </div>
  );
}

function MassoterapeutaPanel() {
  const [regiao, setRegiao] = useState("");
  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" /> Cadastre-se como profissional
        </CardTitle>
        <CardDescription>Receba clientes da sua região e amplie sua agenda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input placeholder="(85) 9 9999-9999" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Região de atendimento</Label>
          <Select value={regiao} onValueChange={setRegiao}>
            <SelectTrigger><SelectValue placeholder="Selecione sua cidade" /></SelectTrigger>
            <SelectContent>
              {REGIOES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Especialidades</Label>
          <div className="flex flex-wrap gap-2">
            {MASSAGENS.map(m => (
              <Badge key={m.id} variant="outline" className="cursor-pointer hover:bg-accent">{m.nome}</Badge>
            ))}
          </div>
        </div>
        <Button className="w-full h-11">Quero me cadastrar</Button>
      </CardContent>
    </Card>
  );
}

function PremiumSection() {
  return (
    <section className="container mx-auto px-6 pb-20 max-w-5xl">
      <div className="text-center mb-10">
        <Badge className="mb-3" style={{ background: "var(--gradient-premium)", color: "white", border: "none" }}>
          <Sparkles className="h-3 w-3 mr-1" /> Plano Premium
        </Badge>
        <h2 className="text-3xl font-semibold tracking-tight">Vantagens exclusivas para quem é Premium</h2>
        <p className="text-muted-foreground mt-2">Benefícios pensados para clientes e massoterapeutas.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PremiumCard
          tipo="Massoterapeuta"
          icon={<TrendingUp className="h-5 w-5" />}
          beneficios={[
            { icon: <Star className="h-4 w-4" />, title: "Mais visibilidade no app", desc: "Seus serviços aparecem primeiro nas buscas." },
            { icon: <Users className="h-4 w-4" />, title: "Mais oportunidades de clientes", desc: "Destaque garantido = mais agendamentos." },
          ]}
        />
        <PremiumCard
          tipo="Cliente"
          icon={<Gift className="h-5 w-5" />}
          beneficios={[
            { icon: <Heart className="h-4 w-4" />, title: "Massagem grátis", desc: "Após 3 meses como usuário ativo." },
            { icon: <Gift className="h-4 w-4" />, title: "Cupons de desconto", desc: "Descontos exclusivos em sessões selecionadas." },
          ]}
        />
      </div>
    </section>
  );
}

function PremiumCard({ tipo, icon, beneficios }: { tipo: string; icon: React.ReactNode; beneficios: { icon: React.ReactNode; title: string; desc: string }[] }) {
  return (
    <Card className="relative overflow-hidden border-2">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--gradient-premium)" }} />
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon} Para {tipo}</div>
        <CardTitle className="text-2xl">Premium {tipo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {beneficios.map((b, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/40 flex items-center justify-center text-accent-foreground shrink-0">{b.icon}</div>
            <div>
              <div className="font-medium">{b.title}</div>
              <div className="text-sm text-muted-foreground">{b.desc}</div>
            </div>
          </div>
        ))}
        <Button className="w-full mt-2" style={{ background: "var(--gradient-premium)", color: "white" }}>
          Assinar Premium
        </Button>
      </CardContent>
    </Card>
  );
}

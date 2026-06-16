import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Heart, Search, Star, Gift, TrendingUp, Users, CheckCircle2, Clock, Wallet } from "lucide-react";

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
  { id: "anti-estresse", nome: "Anti-stresse", desc: "Alívio profundo da tensão acumulada" },
  { id: "relaxante", nome: "Massagem Relaxante", desc: "Tranquilidade e bem-estar para corpo e mente" },
  { id: "ventosa", nome: "Ventosa", desc: "Terapia milenar para circulação e dores" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-30 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">zenfit</span>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">Maciço de Baturité · CE</Badge>
        </div>
      </header>

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
  const [regiao, setRegiao] = useState("");
  const [tipo, setTipo] = useState("");
  const [enviado, setEnviado] = useState(false);

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" /> Buscar massoterapeuta
        </CardTitle>
        <CardDescription>Selecione sua região e o tipo de massagem desejado.</CardDescription>
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
                onClick={() => setTipo(m.id)}
                className={`text-left rounded-lg border p-3 transition-all ${tipo === m.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
              >
                <div className="font-medium text-sm">{m.nome}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <Button
          className="w-full h-11"
          disabled={!regiao || !tipo}
          onClick={() => setEnviado(true)}
        >
          Buscar profissionais
        </Button>

        {enviado && regiao && tipo && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              Buscando massoterapeutas de <strong>{MASSAGENS.find(m => m.id === tipo)?.nome}</strong> em <strong>{regiao}</strong>...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  HandHeart,
  Leaf,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  User,
  UserRound,
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
import { ThemeToggle } from "@/components/theme-toggle";
import { ZenFitWordmark } from "@/components/zenfit-logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import {
  CIDADES,
  cidadeLabel,
  digitosWhatsApp,
  emailDoWhatsApp,
  formatarWhatsApp,
  whatsAppValido,
} from "@/lib/zenfit";
import { cn } from "@/lib/utils";

/** Aceita só caminhos internos, para não virar um redirecionamento aberto. */
const destinoSeguro = (r: unknown) =>
  typeof r === "string" && r.startsWith("/") && !r.startsWith("//") && !r.startsWith("/auth")
    ? r
    : "/painel";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: destinoSeguro(s.redirect) }),
  head: () => ({
    meta: [
      { title: "Entrar · ZenFit" },
      { name: "description", content: "Conectando você ao alívio e bem-estar na sua cidade." },
    ],
  }),
  component: AuthPage,
});

const FOTOS = [
  // Massoterapeuta realizando massagem nas costas
  "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1400&q=70",
  // Massagem relaxante com óleo
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=70",
  // Liberação/terapia manual
  "https://images.unsplash.com/photo-1611073615830-9f76902c10fe?auto=format&fit=crop&w=1400&q=70",
];

type Perfil = "cliente" | "massoterapeuta";
type Modo = "entrar" | "cadastrar";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect });
    });
  }, [navigate, redirect]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <PainelMarca />
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <ThemeToggle className="absolute top-4 right-4" />
        <FormularioAcesso redirect={redirect} />
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lado esquerdo: fotos + marca
// ---------------------------------------------------------------------------

function PainelMarca() {
  return (
    <section
      className="relative overflow-hidden min-h-[300px] lg:min-h-screen flex items-center justify-center text-white"
      style={{ background: "oklch(0.25 0.05 158)" }}
    >
      <div aria-hidden className="absolute inset-0">
        {FOTOS.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            className="zf-slide absolute inset-0 h-full w-full object-cover"
          />
        ))}
      </div>
      {/* Camada verde translúcida para dar leitura ao texto */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.24 0.06 158 / 0.72) 0%, oklch(0.3 0.08 152 / 0.62) 45%, oklch(0.2 0.05 160 / 0.9) 100%)",
        }}
      />

      <div className="relative z-10 px-6 py-12 text-center max-w-md">
        <div className="mx-auto mb-5 h-16 w-16 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <Leaf className="h-8 w-8" strokeWidth={1.8} />
        </div>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight">ZenFit</h1>
        <p className="mt-4 text-lg sm:text-xl text-white/90 leading-relaxed">
          Conectando você ao alívio e bem-estar na sua cidade
        </p>
        <div className="mt-8 hidden sm:flex flex-wrap justify-center gap-2 text-xs">
          {["Massagem relaxante", "Ventosaterapia", "Liberação miofascial"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1 backdrop-blur-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <p className="absolute bottom-5 inset-x-0 z-10 hidden lg:flex items-center justify-center gap-1.5 text-xs text-white/75">
        <MapPin className="h-3.5 w-3.5" /> {CIDADES.join(" · ")} — CE
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Lado direito: formulário
// ---------------------------------------------------------------------------

function FormularioAcesso({ redirect }: { redirect: string }) {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil>("cliente");
  const [modo, setModo] = useState<Modo>("cadastrar");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cadastro = modo === "cadastrar";
  // No login aceitamos também o e-mail de contas antigas.
  const loginPorEmail = !cadastro && whatsapp.includes("@");

  const entrar = async () => {
    const email = loginPorEmail ? whatsapp.trim() : emailDoWhatsApp(whatsapp);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "WhatsApp ou senha incorretos. Ainda não tem conta? Toque em “Criar conta”."
          : error.message,
      );
      return false;
    }
    toast.success("Que bom ter você de volta!");
    return true;
  };

  const cadastrar = async () => {
    const telefone = formatarWhatsApp(whatsapp);
    const { data, error } = await supabase.auth.signUp({
      email: emailDoWhatsApp(whatsapp),
      password: senha,
      options: { data: { nome: nome.trim(), tipo: perfil, cidade, telefone } },
    });
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "Este WhatsApp já tem conta. Toque em “Entrar”."
          : error.message,
      );
      return false;
    }
    const userId = data.user?.id;
    if (userId && data.session) {
      // O gatilho do banco cria o perfil; completamos com WhatsApp e cidade.
      await supabase
        .from("profiles")
        .update({ telefone, cidade, nome: nome.trim() })
        .eq("user_id", userId);
      if (perfil === "massoterapeuta") {
        await supabase.from("massoterapeutas").update({ telefone, cidade }).eq("user_id", userId);
      }
    }
    toast.success(
      perfil === "cliente"
        ? "Conta criada! Vamos cuidar de você."
        : "Cadastro criado! Complete seu perfil profissional.",
    );
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPorEmail && !whatsAppValido(whatsapp)) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }
    if (cadastro && !cidade) {
      toast.error("Escolha sua cidade para encontrarmos profissionais perto de você.");
      return;
    }
    setEnviando(true);
    const ok = cadastro ? await cadastrar() : await entrar();
    setEnviando(false);
    if (ok) navigate({ to: redirect });
  };

  return (
    <div className="w-full max-w-md">
      <div className="lg:hidden mb-6 text-center">
        <ZenFitWordmark className="text-3xl" />
      </div>

      <div className="rounded-2xl border bg-card text-card-foreground shadow-[var(--shadow-soft)] p-6 sm:p-8">
        <h2 className="text-2xl sm:text-[1.7rem] font-semibold leading-tight">
          Bem-vindo(a) ao ZenFit!
        </h2>
        <p className="text-muted-foreground mt-1">Identifique-se</p>

        {/* Perfil */}
        <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Tipo de perfil">
          <OpcaoPerfil
            ativo={perfil === "cliente"}
            onClick={() => setPerfil("cliente")}
            icon={<UserRound className="h-5 w-5" />}
            titulo="Sou Cliente"
          />
          <OpcaoPerfil
            ativo={perfil === "massoterapeuta"}
            onClick={() => setPerfil("massoterapeuta")}
            icon={<HandHeart className="h-5 w-5" />}
            titulo="Sou Massoterapeuta"
          />
        </div>

        {/* Já tem conta? */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
          <span className="text-sm text-muted-foreground pl-1">Já tem conta?</span>
          <div className="flex rounded-lg bg-background p-1 shadow-sm">
            {(["entrar", "cadastrar"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                aria-pressed={modo === m}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md font-medium transition-colors",
                  modo === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {cadastro && (
            <Campo id="nome" label="Nome completo ou apelido" icon={<User className="h-4 w-4" />}>
              <Input
                id="nome"
                required
                autoComplete="name"
                placeholder="Ex: Ana Dev"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-11 pl-9"
              />
            </Campo>
          )}

          <Campo
            id="whatsapp"
            label={cadastro ? "WhatsApp" : "WhatsApp (ou e-mail, para contas antigas)"}
            icon={<MessageCircle className="h-4 w-4" />}
          >
            <Input
              id="whatsapp"
              required
              inputMode={loginPorEmail ? "email" : "tel"}
              autoComplete={loginPorEmail ? "email" : "tel-national"}
              placeholder="Ex: (85) 9 9999-9999"
              value={whatsapp}
              onChange={(e) => {
                const v = e.target.value;
                setWhatsapp(!cadastro && /[a-z@]/i.test(v) ? v : formatarWhatsApp(v));
              }}
              className="h-11 pl-9"
            />
          </Campo>

          {cadastro && (
            <Campo id="cidade" label="Cidade / Localidade" icon={<MapPin className="h-4 w-4" />}>
              <Select value={cidade} onValueChange={setCidade}>
                <SelectTrigger id="cidade" className="h-11 pl-9 w-full">
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
            </Campo>
          )}

          <Campo
            id="senha"
            label={cadastro ? "Crie uma senha" : "Senha"}
            icon={<Lock className="h-4 w-4" />}
          >
            <Input
              id="senha"
              type="password"
              required
              minLength={6}
              autoComplete={cadastro ? "new-password" : "current-password"}
              placeholder="Mínimo de 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-11 pl-9"
            />
          </Campo>

          {cadastro && (
            <p className="text-xs text-muted-foreground">
              {perfil === "cliente"
                ? "Usamos sua cidade para mostrar apenas massoterapeutas que atendem perto de você."
                : "Clientes da sua cidade vão encontrar você e chamar direto no seu WhatsApp."}
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={enviando}>
            {enviando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {cadastro ? "Iniciar Jornada" : "Acessar Plataforma"}
          </Button>
        </form>

        <GoogleButton />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {digitosWhatsApp(whatsapp).length > 0 && !loginPorEmail
          ? "Seu WhatsApp é seu login."
          : "Atendimentos em Aracoiaba, Aratuba, Itapiúna, Baturité e Capistrano."}
      </p>
    </div>
  );
}

function OpcaoPerfil({
  ativo,
  onClick,
  icon,
  titulo,
}: {
  ativo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  titulo: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-all",
        ativo
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {icon}
      <span className="text-center leading-tight">{titulo}</span>
    </button>
  );
}

function Campo({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const entrarGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    if (result.error) {
      toast.error("Erro ao entrar com Google");
      setLoading(false);
    }
  };
  return (
    <>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">ou</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full h-11"
        onClick={entrarGoogle}
        disabled={loading}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Continuar com Google
      </Button>
    </>
  );
}

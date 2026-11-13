import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, LogOut, Moon, Save, SlidersHorizontal, UserRound } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { definirTema } from "@/components/theme-toggle";
import { usePerfil } from "@/hooks/use-perfil";
import { supabase } from "@/integrations/supabase/client";
import { CIDADES, cidadeLabel, formatarWhatsApp, whatsAppValido } from "@/lib/zenfit";

export const Route = createFileRoute("/_authenticated/painel/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · ZenFit" }] }),
  component: Configuracoes,
});

function Configuracoes() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-muted-foreground">Conta e preferências</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Configurações</h1>
      </div>
      <DadosPessoais />
      <Preferencias />
      <Seguranca />
    </div>
  );
}

function Bloco({
  icon,
  titulo,
  desc,
  children,
}: {
  icon: React.ReactNode;
  titulo: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-7 space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="font-sans text-lg font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DadosPessoais() {
  const perfil = usePerfil();
  const qc = useQueryClient();
  const [nome, setNome] = useState(perfil.nome);
  const [telefone, setTelefone] = useState(
    perfil.telefone ? formatarWhatsApp(perfil.telefone) : "",
  );
  const [cidade, setCidade] = useState(perfil.cidade);
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe seu nome ou apelido.");
    if (!whatsAppValido(telefone)) return toast.error("Informe um WhatsApp válido com DDD.");
    if (!cidade) return toast.error("Escolha sua cidade.");
    setSalvando(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome: nome.trim(), telefone, cidade })
      .eq("user_id", perfil.userId);
    if (!error && perfil.tipo === "massoterapeuta") {
      await supabase
        .from("massoterapeutas")
        .update({ nome: nome.trim(), telefone, cidade })
        .eq("user_id", perfil.userId);
      qc.invalidateQueries({ queryKey: ["meu-cadastro", perfil.userId] });
    }
    setSalvando(false);
    if (error) return toast.error("Não foi possível salvar: " + error.message);
    qc.invalidateQueries({ queryKey: ["perfil", perfil.userId] });
    toast.success("Dados atualizados!");
  };

  return (
    <Bloco
      icon={<UserRound className="h-5 w-5" />}
      titulo="Dados pessoais"
      desc="Nome, WhatsApp e a cidade usada para filtrar os profissionais."
    >
      <form onSubmit={salvar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-nome">Nome completo ou apelido</Label>
            <Input
              id="c-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-whats">WhatsApp</Label>
            <Input
              id="c-whats"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(formatarWhatsApp(e.target.value))}
              className="h-11"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-cidade">Cidade / Região</Label>
          <Select value={cidade} onValueChange={setCidade}>
            <SelectTrigger id="c-cidade" className="h-11 w-full">
              <SelectValue placeholder="Escolha sua cidade" />
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
        <p className="text-xs text-muted-foreground">
          Para entrar na plataforma, continue usando o WhatsApp informado no cadastro.
        </p>
        <Button type="submit" disabled={salvando} className="h-11">
          {salvando ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar dados
        </Button>
      </form>
    </Bloco>
  );
}

function Preferencias() {
  const [escuro, setEscuro] = useState(false);
  useEffect(() => setEscuro(document.documentElement.classList.contains("dark")), []);

  return (
    <Bloco
      icon={<SlidersHorizontal className="h-5 w-5" />}
      titulo="Preferências"
      desc="Aparência da plataforma neste dispositivo."
    >
      <label className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3 cursor-pointer">
        <span className="flex items-center gap-3 text-sm">
          <Moon className="h-4 w-4 text-muted-foreground" />
          <span>
            <span className="block font-medium">Modo escuro</span>
            <span className="block text-xs text-muted-foreground">
              Tons de verde mais escuros, confortáveis à noite.
            </span>
          </span>
        </span>
        <Switch
          checked={escuro}
          onCheckedChange={(v) => {
            setEscuro(v);
            definirTema(v);
          }}
        />
      </label>
    </Bloco>
  );
}

function Seguranca() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [salvando, setSalvando] = useState(false);

  const trocar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres.");
    if (senha !== confirma) return toast.error("As senhas não conferem.");
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) return toast.error("Não foi possível trocar a senha: " + error.message);
    setSenha("");
    setConfirma("");
    toast.success("Senha alterada!");
  };

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: "/painel" } });
  };

  return (
    <Bloco
      icon={<KeyRound className="h-5 w-5" />}
      titulo="Conta e segurança"
      desc="Troque sua senha ou saia da plataforma."
    >
      <form onSubmit={trocar} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="c-senha">Nova senha</Label>
          <Input
            id="c-senha"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-confirma">Confirmar senha</Label>
          <Input
            id="c-confirma"
            type="password"
            autoComplete="new-password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            className="h-11"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={salvando || !senha} className="h-11">
          {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Trocar senha
        </Button>
      </form>
      <div className="border-t pt-4">
        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={sair}>
          <LogOut className="h-4 w-4 mr-2" /> Sair da conta
        </Button>
      </div>
    </Bloco>
  );
}

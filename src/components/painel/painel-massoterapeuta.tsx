import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Save } from "lucide-react";
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
import { PremiumSection } from "@/components/premium-section";
import { ProfissionalCard, type Profissional } from "@/components/profissional-card";
import { supabase } from "@/integrations/supabase/client";
import {
  CIDADES,
  ESPECIALIDADES,
  cidadeLabel,
  formatarWhatsApp,
  whatsAppValido,
} from "@/lib/zenfit";
import { cn } from "@/lib/utils";

type Form = {
  nome: string;
  telefone: string;
  cidade: string;
  bio: string;
  especialidades: string[];
};

export function PainelMassoterapeuta({ userId, nome }: { userId: string; nome: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data: cadastro, isLoading } = useQuery({
    queryKey: ["meu-cadastro", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("massoterapeutas")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profissional | null;
    },
  });

  useEffect(() => {
    if (cadastro && !form) {
      setForm({
        nome: cadastro.nome,
        telefone: cadastro.telefone ? formatarWhatsApp(cadastro.telefone) : "",
        cidade: cadastro.cidade,
        bio: cadastro.bio ?? "",
        especialidades: cadastro.especialidades,
      });
    }
  }, [cadastro, form]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!cadastro || !form) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground max-w-lg mx-auto">
        Não encontramos seu cadastro profissional. Fale com a equipe ZenFit para ativá-lo.
      </div>
    );
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));
  const alternarEsp = (e: string) =>
    set(
      "especialidades",
      form.especialidades.includes(e)
        ? form.especialidades.filter((x) => x !== e)
        : [...form.especialidades, e],
    );

  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!whatsAppValido(form.telefone)) {
      toast.error("Informe um WhatsApp válido com DDD — é por ele que os clientes falam com você.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase
      .from("massoterapeutas")
      .update({
        nome: form.nome.trim(),
        telefone: form.telefone,
        cidade: form.cidade,
        bio: form.bio.trim() || null,
        especialidades: form.especialidades,
      })
      .eq("user_id", userId);
    if (!error) {
      await supabase
        .from("profiles")
        .update({ nome: form.nome.trim(), telefone: form.telefone, cidade: form.cidade })
        .eq("user_id", userId);
    }
    setSalvando(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Perfil atualizado!");
    qc.invalidateQueries({ queryKey: ["meu-cadastro", userId] });
    qc.invalidateQueries({ queryKey: ["perfil", userId] });
  };

  const previa: Profissional = { ...cadastro, ...form, bio: form.bio || null };
  const primeiroNome = (form.nome || nome).split(" ")[0];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-muted-foreground">Painel do massoterapeuta</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Olá, {primeiroNome}!</h1>
        <p className="mt-2 text-muted-foreground">
          Clientes de <strong className="text-foreground">{cidadeLabel(form.cidade)}</strong>{" "}
          encontram você aqui e chamam direto no seu WhatsApp.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form
          onSubmit={salvar}
          className="rounded-3xl border bg-card p-5 sm:p-8 space-y-5 shadow-[var(--shadow-soft)]"
        >
          <h2 className="text-xl font-semibold">Seu perfil profissional</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-nome">Nome ou apelido</Label>
              <Input
                id="m-nome"
                required
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-whats">WhatsApp</Label>
              <Input
                id="m-whats"
                inputMode="tel"
                required
                placeholder="(85) 9 9999-9999"
                value={form.telefone}
                onChange={(e) => set("telefone", formatarWhatsApp(e.target.value))}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-cidade">Cidade onde atende</Label>
            <Select value={form.cidade} onValueChange={(v) => set("cidade", v)}>
              <SelectTrigger id="m-cidade" className="h-11 w-full">
                <SelectValue />
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

          <div className="space-y-2">
            <Label>Especialidades</Label>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map((e) => {
                const ativo = form.especialidades.includes(e);
                return (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => alternarEsp(e)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      ativo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              A triagem do ZenFit indica você quando o sintoma do cliente combina com suas
              especialidades.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-bio">Sobre você</Label>
            <Textarea
              id="m-bio"
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Formação, experiência, se atende em domicílio..."
              className="min-h-24"
            />
          </div>

          <Button type="submit" className="w-full h-11 font-semibold" disabled={salvando}>
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar perfil
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" /> Como os clientes veem você
          </div>
          <ProfissionalCard p={previa} mensagem="Olá! Encontrei você no ZenFit." />
        </div>
      </div>

      <PremiumSection tipo="massoterapeuta" />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";

const REGIOES = ["Aracoiaba", "Aratuba", "Itapiúna", "Baturité", "Capistrano"];

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto p-10 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold mt-4">Acesso restrito</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão de administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-semibold">Painel administrativo</h1>
        </div>

        <Tabs defaultValue="massoterapeutas">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="massoterapeutas">Massoterapeutas</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="anamneses">Anamneses</TabsTrigger>
          </TabsList>
          <TabsContent value="massoterapeutas" className="mt-4"><MassoterapeutasAdmin /></TabsContent>
          <TabsContent value="usuarios" className="mt-4"><UsuariosAdmin /></TabsContent>
          <TabsContent value="agendamentos" className="mt-4"><AgendamentosAdmin /></TabsContent>
          <TabsContent value="anamneses" className="mt-4"><AnamnesesAdmin /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MassoterapeutasAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "massoterapeutas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("massoterapeutas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [novo, setNovo] = useState({ nome: "", cidade: REGIOES[0], telefone: "", bio: "", premium: false });

  const criar = async () => {
    if (!novo.nome) return toast.error("Informe o nome");
    const { error } = await supabase.from("massoterapeutas").insert({ ...novo, especialidades: [] });
    if (error) return toast.error(error.message);
    toast.success("Massoterapeuta criado");
    setNovo({ nome: "", cidade: REGIOES[0], telefone: "", bio: "", premium: false });
    qc.invalidateQueries({ queryKey: ["admin", "massoterapeutas"] });
    qc.invalidateQueries({ queryKey: ["massoterapeutas"] });
  };

  const remover = async (id: string) => {
    if (!confirm("Remover este profissional?")) return;
    const { error } = await supabase.from("massoterapeutas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["admin", "massoterapeutas"] });
  };

  const togglePremium = async (id: string, premium: boolean) => {
    await supabase.from("massoterapeutas").update({ premium }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "massoterapeutas"] });
  };
  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from("massoterapeutas").update({ ativo }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "massoterapeutas"] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />Novo massoterapeuta</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Nome</Label><Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Cidade</Label>
            <Select value={novo.cidade} onValueChange={(v) => setNovo({ ...novo, cidade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REGIOES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Telefone</Label><Input value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} /></div>
          <div className="space-y-1.5 flex items-end gap-2"><div className="flex-1"><Label>Premium</Label><div className="h-10 flex items-center"><Switch checked={novo.premium} onCheckedChange={(v) => setNovo({ ...novo, premium: v })} /></div></div></div>
          <div className="sm:col-span-2 space-y-1.5"><Label>Bio</Label><Textarea value={novo.bio} onChange={(e) => setNovo({ ...novo, bio: e.target.value })} /></div>
          <Button className="sm:col-span-2" onClick={criar}>Adicionar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Profissionais cadastrados</CardTitle><CardDescription>{data?.length ?? 0} no total</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cidade</TableHead><TableHead>Premium</TableHead><TableHead>Ativo</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {data?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nome}</TableCell>
                      <TableCell>{m.cidade}</TableCell>
                      <TableCell><Switch checked={m.premium} onCheckedChange={(v) => togglePremium(m.id, v)} /></TableCell>
                      <TableCell><Switch checked={m.ativo} onCheckedChange={(v) => toggleAtivo(m.id, v)} /></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => remover(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsuariosAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const togglePremium = async (id: string, premium: boolean) => {
    await supabase.from("profiles").update({ premium }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Usuários</CardTitle><CardDescription>{data?.length ?? 0} cadastrados</CardDescription></CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Tipo</TableHead><TableHead>Cidade</TableHead><TableHead>Premium</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.nome}</TableCell>
                    <TableCell className="text-xs">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{u.tipo}</Badge></TableCell>
                    <TableCell>{u.cidade ?? "—"}</TableCell>
                    <TableCell><Switch checked={u.premium} onCheckedChange={(v) => togglePremium(u.id, v)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgendamentosAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "agendamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agendamentos").select("*, massoterapeutas(nome)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Agendamentos</CardTitle><CardDescription>{data?.length ?? 0} registros</CardDescription></CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Massagem</TableHead><TableHead>Duração</TableHead><TableHead>Valor</TableHead><TableHead>Cidade</TableHead><TableHead>Pagamento</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs">{new Date(a.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{a.tipo_massagem}</TableCell>
                    <TableCell>{a.duracao}</TableCell>
                    <TableCell>R$ {Number(a.valor).toFixed(2)}</TableCell>
                    <TableCell>{a.cidade}</TableCell>
                    <TableCell>{a.forma_pagamento}</TableCell>
                    <TableCell><Badge>{a.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnamnesesAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "anamneses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("anamneses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Anamneses</CardTitle><CardDescription>{data?.length ?? 0} registros</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data?.map((a) => (
          <div key={a.id} className="rounded-lg border p-3 text-sm">
            <div className="font-medium">{a.nome} <span className="text-xs text-muted-foreground">· {a.idade} anos · {a.contato}</span></div>
            <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div><strong>Queixa:</strong> {a.queixa || "—"}</div>
              <div><strong>Histórico:</strong> {a.historico || "—"}</div>
              <div><strong>Doenças:</strong> {a.doencas || "—"}</div>
              <div><strong>Medicamentos:</strong> {a.medicamentos || "—"}</div>
              <div><strong>Cirurgias:</strong> {a.cirurgias || "—"}</div>
              <div><strong>Alergias:</strong> {a.alergias || "—"}</div>
              <div><strong>Hábitos:</strong> {a.habitos || "—"}</div>
              <div><strong>Contraindicações:</strong> {a.contraindicacoes || "—"}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
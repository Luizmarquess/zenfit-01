import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  dores: z.string().min(3, "Descreva suas dores ou queixas"),
  preferencia: z.string(),
  regiao: z.string().min(1, "Escolha sua região"),
});

// Função pública (sem login): lê apenas a view pública de massoterapeutas
// (sem telefone) e devolve recomendações geradas pela IA.
export const recomendarMassoterapeutas = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;

    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient(url, key, {
      auth: { persistSession: false },
      // Chaves sb_ não são JWTs: enviar só apikey, sem Authorization bearer.
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: profissionais, error } = await supabasePublic
      .from("massoterapeutas_public")
      .select("id, nome, cidade, bio, especialidades, premium, avaliacao")
      .eq("cidade", data.regiao)
      .eq("ativo", true)
      .order("premium", { ascending: false })
      .order("avaliacao", { ascending: false });

    if (error) throw new Error("Não foi possível carregar os profissionais da região.");
    if (!profissionais || profissionais.length === 0) {
      return {
        resumo: "Ainda não há massoterapeutas cadastrados nesta região. Tente outra cidade próxima.",
        recomendacoes: [],
      };
    }

    const servicos = [
      {
        nome: "Massagem Relaxante",
        descricao: "Tranquilidade e bem-estar para corpo e mente",
        variacoes: [
          { duracao: "30 min", valor: 60 },
          { duracao: "1 hora", valor: 100 },
        ],
      },
      {
        nome: "Massagem Antiestresse",
        descricao: "Alívio profundo da tensão acumulada",
        variacoes: [
          { duracao: "40 min", valor: 80 },
          { duracao: "1 hora", valor: 120 },
        ],
      },
      {
        nome: "Massagem Esportiva",
        descricao: "Recuperação muscular e performance",
        variacoes: [
          { duracao: "50 min", valor: 110 },
          { duracao: "1h30", valor: 160 },
        ],
      },
    ];

    const { gerarRecomendacoes } = await import("./ai/recomendacoes.server");
    const resultado = await gerarRecomendacoes({
      dores: data.dores,
      preferencia: data.preferencia,
      regiao: data.regiao,
      massoterapeutas: profissionais,
      servicos,
    });

    return resultado;
  });

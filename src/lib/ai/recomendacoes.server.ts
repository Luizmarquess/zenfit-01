import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, type ModelMessage } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./run-id.ts";

const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const recomendacaoSchema = z.object({
  resumo: z.string().describe("Resumo curto e acolhedor da análise do pedido do cliente, em português."),
  recomendacoes: z
    .array(
      z.object({
        massoterapeuta_id: z.string().describe("ID exato do massoterapeuta escolhido da lista fornecida."),
        nome: z.string().describe("Nome do massoterapeuta."),
        motivo: z.string().describe("Por que este profissional é adequado para as dores e preferências do cliente."),
        servico_sugerido: z.string().describe("Nome exato de um dos serviços disponíveis."),
        duracao_sugerida: z.string().describe("Duração exata de uma das variações do serviço sugerido."),
        valor_estimado: z.number().describe("Valor em reais da variação sugerida."),
      }),
    )
    .max(3),
});

export type RecomendacaoResult = z.infer<typeof recomendacaoSchema>;

export async function gerarRecomendacoes(input: {
  dores: string;
  preferencia: string;
  regiao: string;
  massoterapeutas: {
    id: string;
    nome: string;
    cidade: string;
    bio: string | null;
    especialidades: string[];
    premium: boolean;
    avaliacao: number | null;
  }[];
  servicos: { nome: string; descricao: string; variacoes: { duracao: string; valor: number }[] }[];
}): Promise<RecomendacaoResult> {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

  const runIdFetch = createLovableAiGatewayRunIdFetch(undefined);
  const provider = createOpenAI({
    baseURL: GATEWAY_BASE_URL,
    apiKey: lovableApiKey,
    headers: { "Lovable-API-Key": lovableApiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const instructions = `Você é o assistente de recomendação do zenfit, um marketplace de massoterapia da região de Aracoiaba, Aratuba, Itapiúna, Baturité e Capistrano (Ceará, Brasil).
Sua tarefa é analisar as dores e preferências do cliente e recomendar até 3 massoterapeutas da lista fornecida, escolhendo para cada um o serviço e a duração mais adequados.
Regras:
- Recomende APENAS massoterapeutas da lista fornecida, usando o ID exato.
- Escolha APENAS serviços e durações da lista de serviços disponíveis, com nomes e valores exatos.
- Considere as dores relatadas, a preferência de massagem, a região, as especialidades, a avaliação e o selo premium de cada profissional.
- Seja acolhedor e objetivo. Responda sempre em português brasileiro.
- Se nenhum profissional for adequado, retorne uma lista vazia e explique no resumo.`;

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Dados do cliente:
- Região: ${input.regiao}
- Dores e queixas: ${input.dores}
- Preferência de massagem: ${input.preferencia || "Sem preferência"}

Massoterapeutas disponíveis:
${JSON.stringify(input.massoterapeutas, null, 2)}

Serviços disponíveis:
${JSON.stringify(input.servicos, null, 2)}`,
    },
  ];

  const result = streamText({
    model: provider.responses(MODEL),
    instructions,
    messages,
    output: Output.object({ schema: recomendacaoSchema }),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const output = await result.output;
  if (!output) throw new Error("A IA não retornou recomendações. Tente novamente.");
  return output;
}

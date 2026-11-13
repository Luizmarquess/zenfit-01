// Dados e regras de negócio compartilhados do ZenFit.

export const CIDADES = ["Aracoiaba", "Aratuba", "Itapiúna", "Baturité", "Capistrano"] as const;
export const UF = "CE";

export const cidadeLabel = (c: string) => `${c} - ${UF}`;

/** Remove acentos e deixa minúsculo, para comparar textos livres. */
export const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

/** Só os dígitos do número nacional (DDD + número), sem o 55 do país. */
export function digitosWhatsApp(valor: string) {
  let d = valor.replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
  return d.slice(0, 11);
}

/** Máscara progressiva: (85) 9 9999-9999 */
export function formatarWhatsApp(valor: string) {
  const d = digitosWhatsApp(valor);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

export const whatsAppValido = (valor: string) => digitosWhatsApp(valor).length >= 10;

/**
 * O login é feito pelo WhatsApp: geramos um e-mail interno estável a partir
 * do número, já que o Supabase Auth exige e-mail ou telefone verificado.
 */
export const emailDoWhatsApp = (valor: string) => `wa${digitosWhatsApp(valor)}@zenfit.app`;

export function linkWhatsApp(telefone: string, mensagem: string) {
  return `https://wa.me/55${digitosWhatsApp(telefone)}?text=${encodeURIComponent(mensagem)}`;
}

// ---------------------------------------------------------------------------
// Técnicas e triagem
// ---------------------------------------------------------------------------

export type Tecnica = {
  id: string;
  nome: string;
  resumo: string;
  beneficios: string[];
  /** Palavras (sem acento) que indicam esta técnica no relato do cliente. */
  sinais: { termo: string; peso: number }[];
  /** Trechos que, nas especialidades do profissional, indicam que ele atende esta técnica. */
  especialidades: string[];
};

export const TECNICAS: Tecnica[] = [
  {
    id: "terapeutica",
    nome: "Massagem Terapêutica",
    resumo: "Manobras firmes e direcionadas para aliviar dores musculares e melhorar a mobilidade.",
    beneficios: ["Alívio de dores nas costas e lombar", "Melhora da postura", "Mais mobilidade"],
    sinais: [
      { termo: "dor ", peso: 1 },
      { termo: "dores", peso: 1 },
      { termo: "costas", peso: 2 },
      { termo: "lombar", peso: 3 },
      { termo: "coluna", peso: 3 },
      { termo: "ombro", peso: 2 },
      { termo: "pescoco", peso: 2 },
      { termo: "ciatic", peso: 3 },
      { termo: "postura", peso: 2 },
      { termo: "torcicolo", peso: 3 },
      { termo: "sentado", peso: 1 },
    ],
    especialidades: ["terapeut", "miofascial", "antiestresse", "esportiva"],
  },
  {
    id: "miofascial",
    nome: "Liberação Miofascial",
    resumo: "Pressão sustentada sobre a fáscia para desfazer nós, contraturas e pontos de tensão.",
    beneficios: [
      "Desfaz nós e contraturas",
      "Reduz rigidez muscular",
      "Recupera a amplitude de movimento",
    ],
    sinais: [
      { termo: "tensao", peso: 2 },
      { termo: "tenso", peso: 2 },
      { termo: "no nas", peso: 3 },
      { termo: "nos nas", peso: 3 },
      { termo: "nodulo", peso: 3 },
      { termo: "contratura", peso: 4 },
      { termo: "travad", peso: 3 },
      { termo: "rigid", peso: 3 },
      { termo: "duro", peso: 2 },
      { termo: "fascia", peso: 4 },
      { termo: "gatilho", peso: 4 },
    ],
    especialidades: ["miofascial", "terapeut", "esportiva"],
  },
  {
    id: "antiestresse",
    nome: "Massagem Antiestresse",
    resumo: "Ritmo envolvente que reduz a tensão acumulada pelo estresse do dia a dia.",
    beneficios: [
      "Diminui o estresse e a ansiedade",
      "Melhora a qualidade do sono",
      "Alivia a tensão no pescoço e ombros",
    ],
    sinais: [
      { termo: "estress", peso: 4 },
      { termo: "ansie", peso: 4 },
      { termo: "nervos", peso: 3 },
      { termo: "insonia", peso: 3 },
      { termo: "dormir", peso: 2 },
      { termo: "sono", peso: 2 },
      { termo: "preocupa", peso: 2 },
      { termo: "trabalho", peso: 1 },
      { termo: "dor de cabeca", peso: 2 },
      { termo: "enxaqueca", peso: 2 },
    ],
    especialidades: ["antiestresse", "relaxante"],
  },
  {
    id: "relaxante",
    nome: "Massagem Relaxante",
    resumo: "Movimentos suaves e contínuos para relaxar corpo e mente.",
    beneficios: ["Relaxamento profundo", "Sensação de bem-estar", "Reduz o cansaço"],
    sinais: [
      { termo: "relax", peso: 4 },
      { termo: "cansa", peso: 2 },
      { termo: "exaust", peso: 2 },
      { termo: "descans", peso: 3 },
      { termo: "bem-estar", peso: 2 },
      { termo: "bem estar", peso: 2 },
      { termo: "mimo", peso: 2 },
    ],
    especialidades: ["relaxante", "antiestresse"],
  },
  {
    id: "ventosa",
    nome: "Ventosaterapia",
    resumo: "Ventosas criam sucção na pele, ativam a circulação e soltam a musculatura profunda.",
    beneficios: [
      "Ativa a circulação sanguínea",
      "Alivia dores musculares profundas",
      "Ajuda na recuperação",
    ],
    sinais: [
      { termo: "ventosa", peso: 6 },
      { termo: "circula", peso: 3 },
      { termo: "dor muscular", peso: 2 },
      { termo: "pesad", peso: 1 },
    ],
    especialidades: ["ventosa"],
  },
  {
    id: "esportiva",
    nome: "Massagem Esportiva",
    resumo: "Foco em recuperação muscular, prevenção de lesões e desempenho.",
    beneficios: ["Recuperação pós-treino", "Previne lesões", "Reduz câimbras e fadiga"],
    sinais: [
      { termo: "treino", peso: 4 },
      { termo: "academia", peso: 4 },
      { termo: "corrid", peso: 3 },
      { termo: "futebol", peso: 3 },
      { termo: "esporte", peso: 4 },
      { termo: "atleta", peso: 4 },
      { termo: "caimbra", peso: 3 },
      { termo: "musculacao", peso: 4 },
      { termo: "bike", peso: 2 },
      { termo: "pedal", peso: 2 },
    ],
    especialidades: ["esportiva", "miofascial"],
  },
  {
    id: "drenagem",
    nome: "Drenagem Linfática",
    resumo: "Toques leves e ritmados que estimulam o sistema linfático e reduzem o inchaço.",
    beneficios: [
      "Reduz inchaço e retenção de líquido",
      "Sensação de leveza nas pernas",
      "Auxilia no pós-operatório (com liberação médica)",
    ],
    sinais: [
      { termo: "inchac", peso: 5 },
      { termo: "inchad", peso: 5 },
      { termo: "retencao", peso: 5 },
      { termo: "liquido", peso: 3 },
      { termo: "pernas pesadas", peso: 5 },
      { termo: "pos-operatorio", peso: 4 },
      { termo: "pos operatorio", peso: 4 },
      { termo: "celulite", peso: 3 },
    ],
    especialidades: ["drenagem"],
  },
  {
    id: "reflexologia",
    nome: "Reflexologia",
    resumo: "Pressão em pontos dos pés e mãos ligados a diferentes regiões do corpo.",
    beneficios: ["Alívio de dores nos pés", "Relaxamento geral", "Equilíbrio do corpo"],
    sinais: [
      { termo: "pes ", peso: 2 },
      { termo: "pe ", peso: 2 },
      { termo: "calcanhar", peso: 3 },
      { termo: "fascite", peso: 3 },
      { termo: "reflexo", peso: 5 },
    ],
    especialidades: ["reflexo"],
  },
];

const ALERTAS = [
  "peito",
  "febre",
  "fratura",
  "trombose",
  "gravid",
  "gestante",
  "formigamento",
  "desmaio",
  "falta de ar",
];

export type ResultadoTriagem = {
  principal: Tecnica;
  alternativa: Tecnica | null;
  /** Termos do relato que levaram à recomendação principal. */
  termos: string[];
  /** true quando nada específico foi reconhecido e usamos a sugestão padrão. */
  generico: boolean;
  alertaSaude: boolean;
};

export function triagem(texto: string): ResultadoTriagem {
  // Só letras/números separados por espaço, para casar termos no início das palavras.
  const t = ` ${normalizar(texto).replace(/[^a-z0-9-]+/g, " ")} `;
  const casa = (termo: string) => t.includes(` ${termo}`);
  const pontuadas = TECNICAS.map((tec) => {
    const achados = tec.sinais.filter((s) => casa(s.termo));
    return {
      tec,
      score: achados.reduce((acc, s) => acc + s.peso, 0),
      termos: achados.map((s) => s.termo.trim()),
    };
  }).sort((a, b) => b.score - a.score);

  const [primeira, segunda] = pontuadas;
  const generico = primeira.score === 0;
  const relaxante = TECNICAS.find((x) => x.id === "relaxante")!;

  return {
    principal: generico ? relaxante : primeira.tec,
    alternativa: !generico && segunda.score > 0 ? segunda.tec : null,
    termos: generico ? [] : primeira.termos,
    generico,
    alertaSaude: ALERTAS.some(casa),
  };
}

/** O profissional atende a técnica, olhando para as especialidades cadastradas? */
export function atendeTecnica(especialidades: string[], tecnica: Tecnica) {
  const esp = especialidades.map(normalizar);
  return esp.some((e) => tecnica.especialidades.some((alvo) => e.includes(alvo)));
}

/** Rótulos oferecidos ao massoterapeuta ao escolher suas especialidades. */
export const ESPECIALIDADES = [
  "Relaxante",
  "Antiestresse",
  "Terapêutica",
  "Liberação Miofascial",
  "Ventosa",
  "Esportiva",
  "Drenagem Linfática",
  "Reflexologia",
];

export const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

// ---------------------------------------------------------------------------
// Catálogo de massagens: durações e preços
// ---------------------------------------------------------------------------

export type Variacao = { minutos: number; valor: number };

export type Servico = {
  id: string;
  nome: string;
  /** Técnica da triagem a que este serviço corresponde. */
  tecnicaId: string;
  /** Trechos que, nas especialidades do profissional, indicam que ele oferece o serviço. */
  tags: string[];
  variacoes: Variacao[];
};

export const SERVICOS: Servico[] = [
  {
    id: "relaxante",
    nome: "Massagem Relaxante",
    tecnicaId: "relaxante",
    tags: ["relaxante"],
    variacoes: [
      { minutos: 30, valor: 40 },
      { minutos: 60, valor: 70 },
    ],
  },
  {
    id: "antiestresse",
    nome: "Massagem Antiestresse",
    tecnicaId: "antiestresse",
    tags: ["antiestresse"],
    variacoes: [
      { minutos: 40, valor: 55 },
      { minutos: 60, valor: 75 },
    ],
  },
  {
    id: "terapeutica",
    nome: "Massagem Terapêutica",
    tecnicaId: "terapeutica",
    tags: ["terapeut"],
    variacoes: [
      { minutos: 50, valor: 80 },
      { minutos: 80, valor: 110 },
    ],
  },
  {
    id: "miofascial",
    nome: "Liberação Miofascial",
    tecnicaId: "miofascial",
    tags: ["miofascial"],
    variacoes: [{ minutos: 50, valor: 90 }],
  },
  {
    id: "ventosa",
    nome: "Ventosaterapia",
    tecnicaId: "ventosa",
    tags: ["ventosa"],
    variacoes: [
      { minutos: 40, valor: 70 },
      { minutos: 60, valor: 90 },
    ],
  },
  {
    id: "esportiva",
    nome: "Massagem Esportiva",
    tecnicaId: "esportiva",
    tags: ["esportiva"],
    variacoes: [
      { minutos: 50, valor: 90 },
      { minutos: 90, valor: 140 },
    ],
  },
  {
    id: "drenagem",
    nome: "Drenagem Linfática",
    tecnicaId: "drenagem",
    tags: ["drenagem"],
    variacoes: [{ minutos: 60, valor: 90 }],
  },
  {
    id: "reflexologia",
    nome: "Reflexologia",
    tecnicaId: "reflexologia",
    tags: ["reflexo"],
    variacoes: [{ minutos: 40, valor: 60 }],
  },
];

/** Serviços que o profissional oferece, a partir das especialidades. Sem especialidades = catálogo completo. */
export function servicosDoProfissional(especialidades: string[]) {
  const esp = especialidades.map(normalizar);
  if (esp.length === 0) return SERVICOS;
  const ofertados = SERVICOS.filter((s) => esp.some((e) => s.tags.some((t) => e.includes(t))));
  return ofertados.length ? ofertados : SERVICOS;
}

export const formatarPreco = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;
export const formatarDuracao = (min: number) => `${min} min`;

// ---------------------------------------------------------------------------
// Ficha de anamnese
// ---------------------------------------------------------------------------

export type SimNao = "sim" | "nao" | "";
export type Pergunta = { resposta: SimNao; detalhe: string };

export type Anamnese = {
  idade: string;
  queixa: string;
  alergias: Pergunta;
  lesao: Pergunta;
  gestante: SimNao;
  medicamentos: Pergunta;
  cirurgias: Pergunta;
  doencas: Pergunta;
  observacoes: string;
};

export const anamneseVazia = (): Anamnese => ({
  idade: "",
  queixa: "",
  alergias: { resposta: "", detalhe: "" },
  lesao: { resposta: "", detalhe: "" },
  gestante: "",
  medicamentos: { resposta: "", detalhe: "" },
  cirurgias: { resposta: "", detalhe: "" },
  doencas: { resposta: "", detalhe: "" },
  observacoes: "",
});

/** "Sim: óleo de amêndoas" / "Não" — formato gravado no banco e enviado ao profissional. */
export const textoPergunta = (p: Pergunta) =>
  p.resposta === "sim" ? (p.detalhe.trim() ? `Sim: ${p.detalhe.trim()}` : "Sim") : "Não";

export function lerPergunta(texto: string | null | undefined): Pergunta {
  if (!texto) return { resposta: "", detalhe: "" };
  if (/^n[aã]o/i.test(texto)) return { resposta: "nao", detalhe: "" };
  return { resposta: "sim", detalhe: texto.replace(/^sim:?\s*/i, "") };
}

/** Pares [pergunta, resposta] da ficha, para o comprovante e para o profissional. */
export function linhasAnamnese(f: Anamnese): [string, string][] {
  return [
    ["Idade", f.idade ? `${f.idade} anos` : "—"],
    ["O que sente", f.queixa.trim() || "—"],
    ["Alergias", textoPergunta(f.alergias)],
    ["Lesão crônica ou dor aguda", textoPergunta(f.lesao)],
    ["Gestante", f.gestante === "sim" ? "Sim" : "Não"],
    ["Medicamento contínuo", textoPergunta(f.medicamentos)],
    ["Cirurgia recente", textoPergunta(f.cirurgias)],
    ["Pressão, diabetes ou circulação", textoPergunta(f.doencas)],
    ...(f.observacoes.trim() ? [["Observações", f.observacoes.trim()] as [string, string]] : []),
  ];
}

// ---------------------------------------------------------------------------
// Datas e horários (Ceará: UTC-3, sem horário de verão)
// ---------------------------------------------------------------------------

export const FUSO = "America/Fortaleza";
const OFFSET = "-03:00";

export const HORARIOS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

/** "2026-11-14" no fuso do Ceará. */
const diaISO = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(d);

/** Próximos `n` dias a partir de hoje (exceto domingos). */
export function proximosDias(n = 14) {
  const dias: { iso: string; semana: string; dia: string; mes: string }[] = [];
  const agora = Date.now();
  for (let i = 0; dias.length < n && i < n * 2; i++) {
    const d = new Date(agora + i * 86_400_000);
    const iso = diaISO(d);
    const meio = new Date(`${iso}T12:00:00${OFFSET}`);
    if (meio.getUTCDay() === 0) continue;
    const fmt = (o: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...o }).format(meio);
    dias.push({
      iso,
      semana: fmt({ weekday: "short" }).replace(".", ""),
      dia: fmt({ day: "2-digit" }),
      mes: fmt({ month: "short" }).replace(".", ""),
    });
  }
  return dias;
}

export const dataHoraISO = (dia: string, hora: string) =>
  new Date(`${dia}T${hora}:00${OFFSET}`).toISOString();

export const inicioDoDia = (dia: string) => new Date(`${dia}T00:00:00${OFFSET}`).toISOString();
export const fimDoDia = (dia: string) => new Date(`${dia}T23:59:59${OFFSET}`).toISOString();

export function formatarDataHora(iso: string | null, estilo: "longo" | "curto" = "longo") {
  if (!iso) return "Data a combinar";
  const d = new Date(iso);
  const data = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    ...(estilo === "longo"
      ? { weekday: "long", day: "2-digit", month: "long", year: "numeric" }
      : { day: "2-digit", month: "2-digit", year: "numeric" }),
  }).format(d);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${data} às ${hora}`;
}

/** Código curto e legível do comprovante, derivado do id do agendamento. */
export const codigoComprovante = (id: string) =>
  `ZF-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

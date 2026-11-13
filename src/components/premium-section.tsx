import {
  BadgeCheck,
  BarChart3,
  Gift,
  Heart,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Beneficio = { icon: React.ReactNode; title: string; desc: string };

const BENEFICIOS = {
  massoterapeuta: [
    {
      icon: <Star className="h-4 w-4" />,
      title: "Destaque no topo",
      desc: "Aparece primeiro nos resultados da sua cidade.",
    },
    {
      icon: <BadgeCheck className="h-4 w-4" />,
      title: "Selo de verificação",
      desc: "Mais credibilidade e confiança para os clientes.",
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      title: "Ferramentas avançadas",
      desc: "Faturamento e estatísticas de acesso ao perfil.",
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: "Mais oportunidades",
      desc: "Destaque garantido = mais clientes no seu WhatsApp.",
    },
  ],
  cliente: [
    {
      icon: <Heart className="h-4 w-4" />,
      title: "Massagem grátis",
      desc: "Após 3 meses como usuário ativo.",
    },
    {
      icon: <Gift className="h-4 w-4" />,
      title: "Cupons de desconto",
      desc: "Descontos exclusivos em sessões selecionadas.",
    },
  ],
} satisfies Record<string, Beneficio[]>;

/** Mostra o plano Premium do perfil logado (cliente ou massoterapeuta). */
export function PremiumSection({ tipo }: { tipo: "cliente" | "massoterapeuta" }) {
  const ehProfissional = tipo === "massoterapeuta";
  const beneficios = BENEFICIOS[tipo];

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-card p-6 sm:p-8">
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: "var(--gradient-premium)" }}
      />
      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-center">
        <div>
          <Badge
            className="mb-3 border-none text-amber-950"
            style={{ background: "var(--gradient-premium)" }}
          >
            <Sparkles className="h-3 w-3 mr-1" /> Plano Premium
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
            {ehProfissional ? (
              <TrendingUp className="h-6 w-6 text-amber-600" />
            ) : (
              <Gift className="h-6 w-6 text-amber-600" />
            )}
            Premium {ehProfissional ? "Massoterapeuta" : "Cliente"}
          </h2>
          {ehProfissional ? (
            <>
              <p className="mt-2 text-3xl font-semibold text-amber-600 dark:text-amber-400">
                R$ 29,99/mês
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mantém a comissão de 15% por venda, com vantagens exclusivas.
              </p>
            </>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Vantagens para quem cuida do corpo com frequência.
            </p>
          )}
          <Button
            className="mt-5 font-semibold border-none text-amber-950 hover:opacity-90"
            style={{ background: "var(--gradient-premium)" }}
          >
            Assinar Premium
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {beneficios.map((b) => (
            <div key={b.title} className="flex gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                {b.icon}
              </div>
              <div>
                <div className="font-medium text-amber-800 dark:text-amber-300">{b.title}</div>
                <div className="text-sm text-muted-foreground">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

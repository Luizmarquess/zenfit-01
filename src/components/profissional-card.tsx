import { MapPin, MessageCircle, Sparkles, Star, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { cidadeLabel, iniciais, linkWhatsApp, whatsAppValido } from "@/lib/zenfit";
import { cn } from "@/lib/utils";

/** `foto_url` chega com a migração de fotos; até lá o cartão usa as iniciais. */
export type Profissional = Tables<"massoterapeutas"> & { foto_url?: string | null };

export function ProfissionalCard({
  p,
  indicado,
  mensagem = "Olá! Encontrei você no ZenFit.",
  acao,
}: {
  p: Profissional;
  /** Nome da técnica recomendada, quando o profissional a atende. */
  indicado?: string | null;
  mensagem?: string;
  /** Substitui o botão de WhatsApp no rodapé (ex.: opções de agendamento). */
  acao?: React.ReactNode;
}) {
  const temWhats = !!p.telefone && whatsAppValido(p.telefone);

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-5 transition-shadow hover:shadow-[var(--shadow-soft)]",
        indicado && "border-primary/50 ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 rounded-2xl">
          {p.foto_url && (
            <AvatarImage src={p.foto_url} alt={`Foto de ${p.nome}`} className="object-cover" />
          )}
          <AvatarFallback
            className="rounded-2xl text-lg font-semibold text-white"
            style={{ background: "var(--gradient-hero)" }}
          >
            {iniciais(p.nome)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-sans text-base font-semibold truncate">{p.nome}</h3>
            {p.premium && (
              <Badge
                className="text-[10px] border-none text-amber-950"
                style={{ background: "var(--gradient-premium)" }}
              >
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Premium
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {cidadeLabel(p.cidade)}
            </span>
            {p.avaliacao != null && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                {Number(p.avaliacao).toFixed(1)}
              </span>
            )}
          </div>
          {indicado && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <ThumbsUp className="h-3 w-3" /> Indicado para {indicado}
            </div>
          )}
        </div>
      </div>

      {p.especialidades.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.especialidades.map((e) => (
            <Badge key={e} variant="secondary" className="font-normal">
              {e}
            </Badge>
          ))}
        </div>
      )}

      {p.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.bio}</p>}

      <div className="mt-auto pt-4">
        {acao ? (
          acao
        ) : temWhats ? (
          <Button asChild className="w-full h-11 font-semibold">
            <a href={linkWhatsApp(p.telefone!, mensagem)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" /> Chamar no WhatsApp
            </a>
          </Button>
        ) : (
          <Button disabled variant="outline" className="w-full h-11">
            WhatsApp ainda não informado
          </Button>
        )}
      </div>
    </article>
  );
}

import { createContext, useContext } from "react";

export type PerfilAtual = {
  userId: string;
  tipo: "cliente" | "massoterapeuta";
  nome: string;
  telefone: string;
  cidade: string;
  isAdmin: boolean;
};

export const PerfilContext = createContext<PerfilAtual | null>(null);

/** Perfil do usuário logado, disponível em todas as páginas do painel. */
export function usePerfil() {
  const p = useContext(PerfilContext);
  if (!p) throw new Error("usePerfil precisa estar dentro do layout do painel");
  return p;
}

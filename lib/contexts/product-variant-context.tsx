"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Product } from "@/lib/interface";

/**
 * Seleção de liga/dificuldade na página de produto, do lado do cliente.
 *
 * Antes isto vivia em `searchParams` (`?league=...&difficulty=...`), o que tinha
 * dois problemas:
 *
 *  1. Ler `searchParams` numa página torna a rota dinâmica. As duas rotas de
 *     produto declaravam `generateStaticParams` e `revalidate`, mas nada disso
 *     valia: elas não apareciam no prerender-manifest e serviam
 *     `Cache-Control: private, no-store` em toda visita.
 *  2. Não funcionava. O dropdown navegava para `/products/<nome>?league=X`, e
 *     essa rota faz `permanentRedirect` para a URL canônica **descartando a
 *     query** — o usuário voltava para a mesma liga padrão.
 *
 * Agora o servidor manda todas as variantes (uma linha por liga ativa, é um
 * punhado) junto com a página estática, e a troca acontece em memória. O gráfico
 * de histórico lê a mesma seleção daqui, então preço e gráfico não divergem.
 */

export type ProductVariantContextValue = {
  variants: Product[];
  selected: Product;
  league: string;
  difficulty: string;
  leagueOptions: string[];
  difficultyOptions: string[];
  setLeague: (league: string) => void;
  setDifficulty: (difficulty: string) => void;
};

const ProductVariantContext = createContext<ProductVariantContextValue | null>(null);

/**
 * Devolve `null` fora do provider — a rota legada `/products/[name]` (produtos
 * sem `url_slug`) renderiza o `ProductDetail` sem variantes, e nesse caso o
 * componente cai de volta na prop `product`.
 */
export const useProductVariant = () => useContext(ProductVariantContext);

const pick = (
  variants: Product[],
  fallback: Product,
  league: string,
  difficulty: string,
): Product =>
  variants.find((v) => v.league === league && v.difficulty === difficulty) ??
  variants.find((v) => v.league === league) ??
  fallback;

export function ProductVariantProvider({
  variants,
  initial,
  children,
}: {
  variants: Product[];
  initial: Product;
  children: React.ReactNode;
}) {
  const [league, setLeagueState] = useState(initial.league);
  const [difficulty, setDifficultyState] = useState(initial.difficulty);

  // Derivadas das variantes, não fixas. O catálogo hoje só tem linhas
  // `softcore`; listar "hardcore" num select que não muda nada era ruído.
  const leagueOptions = useMemo(
    () => Array.from(new Set(variants.map((v) => v.league).filter(Boolean))),
    [variants],
  );
  const difficultyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .filter((v) => v.league === league)
            .map((v) => v.difficulty)
            .filter(Boolean),
        ),
      ),
    [variants, league],
  );

  const setLeague = useCallback(
    (next: string) => {
      setLeagueState(next);
      // Trocar de liga pode invalidar a dificuldade atual (nem toda liga tem
      // hardcore). Sem isto a seleção cairia no fallback em silêncio.
      const available = variants.filter((v) => v.league === next).map((v) => v.difficulty);
      setDifficultyState((current) =>
        available.includes(current) ? current : (available[0] ?? current),
      );
    },
    [variants],
  );

  const value = useMemo<ProductVariantContextValue>(
    () => ({
      variants,
      selected: pick(variants, initial, league, difficulty),
      league,
      difficulty,
      leagueOptions,
      difficultyOptions,
      setLeague,
      setDifficulty: setDifficultyState,
    }),
    [variants, initial, league, difficulty, leagueOptions, difficultyOptions, setLeague],
  );

  return (
    <ProductVariantContext.Provider value={value}>
      {children}
    </ProductVariantContext.Provider>
  );
}

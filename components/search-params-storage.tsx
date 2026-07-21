"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const PERSISTED_KEYS = [
  "gameVersion",
  "league",
  "difficulty",
  "category",
  "search",
] as const;

/**
 * Persiste os filtros da listagem em localStorage para restaurar a navegação
 * do usuário entre visitas.
 *
 * Le os params por conta própria em vez de recebe-los do servidor: a página de
 * produtos passou a ser estática, e ler `searchParams` no server component a
 * tornaria dinâmica de novo — que é exatamente o que estamos eliminando.
 */
export function SearchParamsStorage() {
  return (
    <Suspense fallback={null}>
      <SearchParamsStorageInner />
    </Suspense>
  );
}

function SearchParamsStorageInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();

    PERSISTED_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });

    localStorage.setItem("productSearchParams", params.toString());
  }, [searchParams]);

  return null;
}

"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import PatchCard from "./PatchCard"
import type { PatchData } from "@/types"

interface PatchInfoProps {
  /**
   * Patch da liga corrente, vindo do Sanity via `getCurrentPatch`.
   *
   * Este conteúdo já morou em `messages/*.json`, o que fazia o site anunciar a
   * liga errada até alguém lembrar de editar os dois arquivos de tradução — em
   * 28/07/2026 ele ainda mostrava "Keepers of the Flame" (3.27), três ligas
   * atrás. Como as páginas que renderizam isto são Server Components, os dados
   * descem por prop e este componente fica só com a apresentação.
   */
  patch?: PatchData | null
}

export default function PatchInfo({ patch }: PatchInfoProps) {
  const t = useTranslations("PatchInfo")

  if (!patch) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">{t("noPatchInformationAvailable")}</p>
        </CardContent>
      </Card>
    )
  }

  const labels = {
    keyFeatures: t("keyFeatures"),
    keyChanges: t("keyChanges"),
  }

  return (
    <div className="space-y-4">
      <PatchCard patch={patch} labels={labels} />
    </div>
  )
}

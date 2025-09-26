"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import PatchCard from "./PatchCard"
import type { PatchData } from "@/types"

// Fonte única da verdade sobre quais patches existem.
// Para adicionar um novo patch, basta adicionar sua chave aqui e nos arquivos JSON.
const PATCH_KEYS = ["path-of-exile-1", "path-of-exile-2"]
console.log(PATCH_KEYS) 

interface PatchInfoProps {
  gameVersion?: string // ex: "path-of-exile-1"
}

export default function PatchInfo({ gameVersion }: PatchInfoProps) {
  console.log(gameVersion)
  const t = useTranslations("PatchInfo")

  // Carrega todos os dados dos patches do arquivo de tradução de uma vez
  const allPatches: PatchData[] = PATCH_KEYS.map(key => ({
    id: key,
    ...t.raw(`patches.${key}`) // t.raw() é perfeito para buscar objetos/arrays do JSON
  }))

  // Filtra os patches a serem exibidos. Se gameVersion não for fornecido, mostra todos.
  const patchesToShow = gameVersion
    ? allPatches.filter(p => p.id === gameVersion)
    : allPatches

  if (patchesToShow.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">{t("noPatchInformationAvailable")}</p>
        </CardContent>
      </Card>
    )
  }
  
  // Labels traduzidas que serão passadas para o componente filho
  const labels = {
      keyFeatures: t("keyFeatures"),
      keyChanges: t("keyChanges")
  }

  return (
    <div className="space-y-4">
      {patchesToShow.map((patch) => (
        <PatchCard key={patch.id} patch={patch} labels={labels} />
      ))}
    </div>
  )
}
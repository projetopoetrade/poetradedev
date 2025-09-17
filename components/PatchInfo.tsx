"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocale, useTranslations } from "next-intl"

interface PatchInfoProps {
  gameVersion?: string
}

interface PatchData {
  version: string
  title: string
  date: string
  description: string
  changes: string[]
  features?: {
    title: string
    description: string
  }[]
}

const patchDataEn: Record<string, PatchData> = {
  "poe2": {
    version: "2.0",
    title: "Path of Exile 2",
    date: "December 6, 2024",
    description: "Path of Exile 2 is a free-to-play MMORPG developed and published by Grinding Gear Games. The sequel to 2013's Path of Exile, launching in paid Early Access on Windows PC, PlayStation 5, and Xbox Series X and Series S.",
    changes: [
      "New Campaign with six acts",
      "12 Character Classes with three Ascendancy subclasses each",
      "Over 100 endgame maps",
      "Hundreds of equipment base types",
      "Customizable Skill System with Dual-Specialisation",
      "Brand new graphics engine with high-fidelity visuals"
    ],
    features: [
      {
        title: "New Campaign",
        description: "Takes place several years after the events of the first game, featuring new areas, towns, and characters."
      },
      {
        title: "League Mechanics",
        description: "Continues the tradition of temporary challenge leagues with unique mechanics and rewards."
      },
      {
        title: "Equipment System",
        description: "Features hundreds of equipment base types with magical modifiers and unique variants with ancient powers."
      },
      {
        title: "Customizable Skill System",
        description: "Any class can use any Skill Gem, modified with up to 5 Support Gems. Dual-Specialisation allows switching between two fighting styles."
      }
    ]
  },
  "0.2.0": {
    version: "0.2.0",
    title: "Dawn of the Hunt League",
    date: "April 4, 2025",
    description: "The first major content update for Path of Exile 2 Early Access, introducing new classes, Ascendancy system, Unique Items, and endgame improvements.",
    changes: [
      "New Huntress class - spear-wielding Azmeri warrior",
      "5 new Ascendancy classes",
      "100+ New Support Gems",
      "100+ New Unique Items",
      "Azmerian Wisps mechanic",
      "Seven new endgame maps",
      "Rogue Exiles encounters",
      "Endgame Corruption system"
    ]
  },
  "3.25": {
    version: "3.25",
    title: "Settlers of Kalguur",
    date: "July 26, 2024",
    description: "In Settlers of Kalguur, players help Kalguuran pioneers build the town of Kingsmarch and establish trade between Wraeclast and their homeland.",
    changes: [
      "New Settlers of Kalguur Challenge League",
      "Resource gathering and town building mechanics",
      "New Currency Trade Market with Black Market NPC",
      "Gladiator Ascendancy Class rework",
      "New Warden class replacing Raider Ascendancy",
      "6th Map Device Slot",
      "New encounters in Tier 16 and Tier 17 Maps",
      "Improved loading times and performance"
    ]
  }
}

const patchDataPt: Record<string, PatchData> = {
  "poe2": {
    version: "2.0",
    title: "Path of Exile 2",
    date: "6 de dezembro de 2024",
    description: "Path of Exile 2 é um ARPG gratuito desenvolvido e publicado pela Grinding Gear Games. Continuação do Path of Exile de 2013, lançado em Acesso Antecipado pago para PC, PlayStation 5 e Xbox Series X|S.",
    changes: [
      "Nova Campanha com seis atos",
      "12 Classes com três Ascendências cada",
      "Mais de 100 mapas de fim de jogo",
      "Centenas de bases de equipamentos",
      "Sistema de Habilidades personalizável com Dupla Especialização",
      "Novo motor gráfico com visuais de alta fidelidade"
    ],
    features: [
      {
        title: "Nova Campanha",
        description: "Se passa vários anos após os eventos do primeiro jogo, com novas áreas, cidades e personagens."
      },
      {
        title: "Mecânicas de Liga",
        description: "Mantém a tradição de ligas temporárias de desafios com mecânicas e recompensas únicas."
      },
      {
        title: "Sistema de Equipamentos",
        description: "Centenas de bases de equipamentos com modificadores mágicos e variantes únicas com poderes ancestrais."
      },
      {
        title: "Sistema de Habilidades Personalizável",
        description: "Qualquer classe pode usar qualquer Gema de Habilidade, modificada por até 5 Gemas de Suporte. A Dupla Especialização permite alternar entre dois estilos de luta."
      }
    ]
  },
  "0.2.0": {
    version: "0.2.0",
    title: "Liga Aurora da Caça",
    date: "4 de abril de 2025",
    description: "A primeira grande atualização de conteúdo do Acesso Antecipado de Path of Exile 2, trazendo novas classes, sistema de Ascendência, Itens Únicos e melhorias no endgame.",
    changes: [
      "Nova classe Caçadora – guerreira Azmeri com lança",
      "5 novas classes de Ascendência",
      "100+ novas Gemas de Suporte",
      "100+ novos Itens Únicos",
      "Mecânica de Espíritos Azmerianos",
      "Sete novos mapas de endgame",
      "Encontros com Renegados Exilados",
      "Sistema de Corrupção no endgame"
    ]
  },
  "3.25": {
    version: "3.25",
    title: "Settlers of Kalguur",
    date: "26 de julho de 2024",
    description: "Em Settlers of Kalguur, os jogadores ajudam pioneiros Kalguuranos a construir a cidade de Kingsmarch e estabelecer comércio entre Wraeclast e sua terra natal.",
    changes: [
      "Nova Liga de Desafio Settlers of Kalguur",
      "Coleta de recursos e mecânicas de construção de cidade",
      "Novo Mercado de Trocas com NPC Black Market",
      "Retrabalho da Ascendência Gladiador",
      "Nova classe Warden substituindo a Ascendência Raider",
      "6º slot no Map Device",
      "Novos encontros em Mapas Tier 16 e Tier 17",
    ]
  }
}

export default function PatchInfo({ gameVersion }: PatchInfoProps) {
  const locale = useLocale()
  const t = useTranslations("PatchInfo");
  const selectedData = locale === "pt-br" ? patchDataPt : patchDataEn
  const patches = gameVersion 
    ? [selectedData[gameVersion]].filter(Boolean)
    : Object.values(selectedData)

  if (patches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">{t("no-patch-information-available")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 ">
      {patches.map((patch) => (
        <Card key={patch.version}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                {patch.title}
              </CardTitle>
              <Badge variant="secondary">{patch.version}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{patch.date}</p>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{patch.description}</p>
            
            {patch.features && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Key Features:</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {patch.features.map((feature, index) => (
                    <div key={index} className="bg-muted/50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">{feature.title}</h5>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold">Key Changes:</h4>
              <ul className="list-disc pl-4 space-y-1">
                {patch.changes.map((change, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 
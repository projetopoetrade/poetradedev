"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PatchData } from "@/types" // Vamos criar este tipo em breve

interface PatchCardProps {
  patch: PatchData
  labels: {
    keyFeatures: string
    keyChanges: string
  }
}

export default function PatchCard({ patch, labels }: PatchCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{patch.title}</CardTitle>
          <Badge variant="secondary">{patch.version}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{patch.date}</p>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{patch.description}</p>
        
        {patch.features && patch.features.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3">{labels.keyFeatures}</h4>
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
          <h4 className="font-semibold">{labels.keyChanges}</h4>
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
  )
}
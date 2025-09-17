import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface CurrencyInfoProps {
  gameVersion?: string
}

interface CurrencyData {
  id: string
  name: string
  description: string
  imageUrl: string
  gameVersion: string
  uses: string[]
}

const currencyData: Record<string, CurrencyData[]> = {
  "path-of-exile-2": [
    {
      id: "chaos-orb",
      name: "Chaos Orb",
      description: "Reforges a rare item with new random modifiers.",
      imageUrl: "/images/chaos-orb.webp",
      gameVersion: "path-of-exile-2",
      uses: [
        "Reforges a rare item with new random modifiers",
        "Used in various crafting recipes",
        "Common trading currency"
      ]
    },
    {
      id: "exalted-orb",
      name: "Exalted Orb",
      description: "Adds a new random modifier to a rare item.",
      imageUrl: "/images/exalted-orb.webp",
      gameVersion: "poe2",
      uses: [
        "Adds a new random modifier to a rare item",
        "Used in high-end crafting",
        "Premium trading currency"
      ]
    }
  ],
  "path-of-exile-1": [
    {
      id: "divine-orb",
      name: "Divine Orb",
      description: "A highly sought-after Path of Exile currency item that perfects item modifiers, making it one of the most valuable trading currencies in the game's economy. Essential for both high-end trading and crafting.",
      imageUrl: "/images/divine-orb.webp",
      gameVersion: "path-of-exile-1",
      uses: [
        "Perfects item modifier values for maximum trading value",
        "Primary currency for high-end item trading",
        "Essential for trading perfect end-game equipment",
        "Used in bulk trading for high-value items",
        "Key currency for item flipping and market trading"
      ]
    },
    {
      id: "chaos-orb",
      name: "Chaos Orb",
      description: "A fundamental Path of Exile currency item that completely rerolls all random modifiers on a rare item, essential for crafting and item modification.",
      imageUrl: "/images/chaos-orb.webp",
      gameVersion: "path-of-exile-1",
      uses: [
        "Rerolls all random modifiers on a rare item for better stats",
        "Primary trading currency in Path of Exile economy",
        "Used for crafting and modifying rare items",
        "Essential for item crafting and trading",
        "Common currency for vendor recipes"
      ]
    },

    {
      id: "mirror-of-kalandra",
      name: "Mirror of Kalandra",
      description: "The most valuable and rarest currency item in Path of Exile, capable of creating an exact mirrored copy of any item, including all its modifiers and values.",
      imageUrl: "/images/mirror-of-kalandra.webp",
      gameVersion: "3.25",
      uses: [
        "Creates an exact mirrored copy of any item",
        "Most valuable currency item in Path of Exile",
        "Used for duplicating perfect end-game items",
        "Essential for high-end item replication",
        "Ultimate currency for item duplication"
      ]
    },
    {
      id: "exalted-orb",
      name: "Exalted Orb",
      description: "A premium Path of Exile currency that adds a powerful new random modifier to rare items, crucial for high-end crafting and item optimization.",
      imageUrl: "/images/exalted-orb.webp",
      gameVersion: "path-of-exile-1",
      uses: [
        "Adds a new random modifier to rare items",
        "Premium trading currency for high-value items",
        "Essential for crafting perfect end-game gear",
        "Used in advanced crafting strategies",
        "Key currency for item optimization"
      ]
    },
    

  ]
}

export function CurrencyInfo({ gameVersion }: CurrencyInfoProps) {
  const currencies = gameVersion 
    ? currencyData[gameVersion] || []
    : Object.values(currencyData).flat()

  if (currencies.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No currency information available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {currencies.map((currency) => (
        <Card key={currency.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                {currency.name}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src={currency.imageUrl}
                  alt={`${currency.name} icon ${currency.gameVersion} PathOfTrade.net`}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </div>
              <div className="flex-1 space-y-4">
                <p className="text-muted-foreground">{currency.description}</p>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Common Uses:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {currency.uses.map((use, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

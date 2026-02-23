'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface HistoryPoint {
    date: string
    rawTimestamp: string
    chaos: number
    divine: number
    usd: number | null
}

export default function PriceHistoryChart({ productSlug, league }: { productSlug: string, league?: string }) {
    const [data, setData] = useState<HistoryPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [itemName, setItemName] = useState('')
    const [leagueName, setLeagueName] = useState('')

    useEffect(() => {
        async function fetchHistory() {
            try {
                const query = league ? `?league=${encodeURIComponent(league)}` : ''
                const res = await fetch(`/api/products/${productSlug}/history${query}`)
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('History not available for this item.')
                        return
                    }
                    throw new Error('Failed to fetch history')
                }
                const json = await res.json()
                setItemName(json.itemName)
                setLeagueName(json.leagueName)
                // Simple outlier check to avoid Recharts crashing due to extreme drops (e.g. 600k -> 4 chaos)
                // Filter out points where the chaos value is completely disproportionate or NaN
                let rawData = json.history || []

                // If it's a high-value item, ignore sudden near-zero values
                const maxChaos = Math.max(...rawData.map((d: any) => d.chaos || 0))
                if (maxChaos > 1000) {
                    rawData = rawData.filter((d: any) => d.chaos > (maxChaos * 0.05)) // Ignore drops of >95%
                }

                setData(rawData)
            } catch (err) {
                console.error(err)
                setError('Error loading chart data.')
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [productSlug, league])

    if (loading) {
        return (
            <div className="w-full h-[300px] border border-border/40 rounded-lg p-4 flex flex-col gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="flex-1 w-full" />
            </div>
        )
    }

    if (error || data.length === 0) {
        return null // Omit chart if no data or error
    }

    // Se a moeda mais forte do item for Divine, mostramos o gráfico de divine_value. Senão, de chaos_value.
    // Regra simples: Se o item chegou a custar > 1 Divine repetidas vezes, focamos na linha Divine.
    const hasDivineValue = data.some(d => (d.divine || 0) > 0.5)
    const dataKey = hasDivineValue ? 'divine' : 'chaos'
    const strokeColor = hasDivineValue ? '#fbbf24' : '#a1a1aa' // amber-400 : zinc-400
    const labelText = hasDivineValue ? 'Divine Orbs' : 'Chaos Orbs'

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border/40 p-3 rounded-lg shadow-xl text-sm z-50">
                    <p className="font-semibold mb-1 text-popover-foreground">{label}</p>
                    <div className="space-y-1">
                        <p className="text-amber-400">
                            {Number(payload[0].value).toFixed(2)} {labelText}
                        </p>
                        {payload[0].payload.usd != null && !isNaN(payload[0].payload.usd) && (
                            <p className="text-muted-foreground text-xs">
                                ~${Number(payload[0].payload.usd).toFixed(2)} USD
                            </p>
                        )}
                    </div>
                </div>
            )
        }
        return null
    }

    // Pular exibição de eixos X muito espremidos.
    const minTickGap = 40

    return (
        <div className="w-full bg-card/30 border border-border/40 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-white/5 transition-colors"
            >
                <span className="text-base font-semibold tracking-tight text-card-foreground">Price History</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
            <div className="px-4 sm:px-6 pb-6 space-y-4">
                <p className="text-sm text-muted-foreground -mt-1">
                    {itemName} price evolution in {leagueName} league (poe.ninja data)
                </p>
            <div className="h-[250px] sm:h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={minTickGap}
                            tickMargin={10}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => {
                                if (typeof val !== 'number' || isNaN(val)) return '';
                                return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0);
                            }}
                            domain={['auto', 'auto']}
                            padding={{ top: 20, bottom: 20 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={strokeColor}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            </div>
            )}
        </div>
    )
}

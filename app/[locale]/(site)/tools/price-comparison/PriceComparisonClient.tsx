"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface PriceData {
  name: string;
  icon: string;
  ninjaChaos: number;
  exchangeChaos: number | null;
  difference: number | null;
  differencePercent: number | null;
  ninjaListingCount: number | null;
  exchangeListingCount: number | null;
}

interface Props {
  locale: string;
  initialGame: string;
  initialLeague?: string;
}

export default function PriceComparisonClient({ locale, initialGame, initialLeague }: Props) {
  const [game, setGame] = useState(initialGame);
  const [league, setLeague] = useState(initialLeague || "");
  const [leagues, setLeagues] = useState<{ name: string; gameVersion: string }[]>([]);
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "difference">("difference");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/tools/leagues")
      .then((res) => res.json())
      .then((data) => {
        const activeLeagues = (data.leagues || []).filter(
          (l: { isActive: boolean }) => l.isActive
        );
        setLeagues(activeLeagues);
        if (!league && activeLeagues.length > 0) {
          const defaultLeague = activeLeagues.find(
            (l: { gameVersion: string }) => 
              l.gameVersion === (game === "poe1" ? "path-of-exile-1" : "path-of-exile-2")
          );
          if (defaultLeague) setLeague(defaultLeague.name);
        }
      });
  }, [game, league]);

  const fetchData = useCallback(async () => {
    if (!league) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `/api/tools/price-comparison?game=${game}&league=${encodeURIComponent(league)}`
      );
      
      if (!res.ok) throw new Error("Failed to fetch data");
      
      const result = await res.json();
      setData(result.items || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [game, league]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "name") {
      return sortDir === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    const aVal = a.differencePercent ?? -Infinity;
    const bVal = b.differencePercent ?? -Infinity;
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (column: "name" | "difference") => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === "pt-br" ? "Filtros" : "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === "pt-br" ? "Jogo" : "Game"}
              </label>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poe1">Path of Exile 1</SelectItem>
                  <SelectItem value="poe2">Path of Exile 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === "pt-br" ? "Liga" : "League"}
              </label>
              <Select value={league} onValueChange={setLeague}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={locale === "pt-br" ? "Selecione..." : "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {leagues
                    .filter((l) => 
                      l.gameVersion === (game === "poe1" ? "path-of-exile-1" : "path-of-exile-2")
                    )
                    .map((l) => (
                      <SelectItem key={l.name} value={l.name}>
                        {l.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading 
                ? (locale === "pt-br" ? "Carregando..." : "Loading...") 
                : (locale === "pt-br" ? "Atualizar" : "Refresh")}
            </Button>
          </div>

          {lastUpdate && (
            <p className="text-sm text-muted-foreground mt-4">
              {locale === "pt-br" ? "Última atualização:" : "Last update:"}{" "}
              {lastUpdate.toLocaleTimeString(locale)}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 text-destructive p-4">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">
                    <button 
                      onClick={() => toggleSort("name")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      {locale === "pt-br" ? "Item" : "Item"}
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    poe.ninja (Chaos)
                  </th>
                  <th className="text-right p-4 font-medium">
                    Currency Exchange (Chaos)
                  </th>
                  <th className="text-right p-4 font-medium">
                    <button 
                      onClick={() => toggleSort("difference")}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      {locale === "pt-br" ? "Diferença" : "Difference"}
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    {locale === "pt-br" ? "Status" : "Status"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedData.map((item) => (
                  <tr key={item.name} className="hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.icon ? (
                          <Image 
                            src={item.icon} 
                            alt={item.name} 
                            width={32} 
                            height={32}
                            className="rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded" />
                        )}
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="text-right p-4 font-mono">
                      {item.ninjaChaos.toFixed(2)}
                      {item.ninjaListingCount && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({item.ninjaListingCount.toLocaleString()})
                        </span>
                      )}
                    </td>
                    <td className="text-right p-4 font-mono">
                      {item.exchangeChaos !== null ? (
                        <>
                          {item.exchangeChaos.toFixed(2)}
                          {item.exchangeListingCount && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({item.exchangeListingCount.toLocaleString()})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-right p-4 font-mono">
                      {item.differencePercent !== null ? (
                        <span
                          className={
                            item.differencePercent > 5
                              ? "text-green-500"
                              : item.differencePercent < -5
                              ? "text-red-500"
                              : ""
                          }
                        >
                          {item.differencePercent > 0 ? "+" : ""}
                          {item.differencePercent.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-right p-4">
                      {item.differencePercent !== null && (
                        <Badge
                          variant={
                            Math.abs(item.differencePercent) > 10
                              ? "destructive"
                              : Math.abs(item.differencePercent) > 5
                              ? "default"
                              : "secondary"
                          }
                        >
                          {Math.abs(item.differencePercent) > 10 ? (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {locale === "pt-br" ? "Grande diferença" : "Large gap"}
                            </>
                          ) : item.differencePercent > 5 ? (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {locale === "pt-br" ? "Ninja maior" : "Ninja higher"}
                            </>
                          ) : item.differencePercent < -5 ? (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {locale === "pt-br" ? "Exchange maior" : "Exchange higher"}
                            </>
                          ) : (
                            <>
                              <Minus className="h-3 w-3 mr-1" />
                              {locale === "pt-br" ? "Similar" : "Similar"}
                            </>
                          )}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}

                {sortedData.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      {locale === "pt-br" 
                        ? "Nenhum dado encontrado. Selecione uma liga e clique em Atualizar."
                        : "No data found. Select a league and click Refresh."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          <strong>{locale === "pt-br" ? "Fontes:" : "Sources:"}</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>poe.ninja:</strong>{" "}
            {locale === "pt-br" 
              ? "Preços agregados do trade site, atualizados frequentemente"
              : "Aggregated prices from trade site, updated frequently"}
          </li>
          <li>
            <strong>Currency Exchange:</strong>{" "}
            {locale === "pt-br"
              ? "API oficial do PoE para bulk exchange (trocas em massa)"
              : "Official PoE API for bulk exchange trades"}
          </li>
        </ul>
        <p className="mt-2">
          {locale === "pt-br"
            ? "Diferenças grandes podem indicar oportunidades de arbitragem ou liquidez diferente entre os mercados."
            : "Large differences may indicate arbitrage opportunities or different market liquidity."}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { LeagueAdmin } from "./dashboardTypes";

interface ManageLeaguesViewProps {
  onLeagueDeleted: () => void;
}

export default function ManageLeaguesView({ onLeagueDeleted }: ManageLeaguesViewProps) {
  const [leaguesList, setLeaguesList] = useState<LeagueAdmin[]>([]);
  const [leaguesListLoading, setLeaguesListLoading] = useState(false);
  const [leaguesGameVersionFilter, setLeaguesGameVersionFilter] = useState<
    "all" | "path-of-exile-1" | "path-of-exile-2"
  >("all");
  const [repricingLeague, setRepricingLeague] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    setLeaguesListLoading(true);
    try {
      const res = await fetch("/api/admin/leagues/all", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch leagues");
      const data = await res.json();
      setLeaguesList(data);
    } catch (e) {
      console.error("Erro ao buscar ligas:", e);
      toast.error("Erro ao carregar ligas");
    } finally {
      setLeaguesListLoading(false);
    }
  };

  const handleLeagueToggle = async (
    id: string,
    field: "isActive" | "is_published",
    value: boolean,
  ) => {
    // Optimistic update
    setLeaguesList((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    );
    try {
      const res = await fetch("/api/admin/leagues/all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update league");
    } catch {
      // Rollback on error
      setLeaguesList((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: !value } : l)),
      );
      toast.error("Erro ao atualizar liga");
    }
  };

  // Âncora e margem são numéricas, então não usam o caminho otimista dos
  // toggles: um valor inválido aqui reprecificaria o catálogo inteiro.
  const handlePricingSave = async (
    id: string,
    field: "divine_usd" | "price_markup",
    raw: string,
  ) => {
    const value = raw.trim() === "" ? null : Number(raw.replace(",", "."));
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch("/api/admin/leagues/all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update league");
      setLeaguesList((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
      );
      toast.success("Precificação atualizada");
    } catch {
      toast.error("Erro ao salvar precificação");
    }
  };

  const handleReprice = async (name: string, gameVersion: string) => {
    setRepricingLeague(name);
    try {
      const res = await fetch("/api/admin/products/reprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league: name, gameVersion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reprice");
      toast.success(
        `${data.repriced} produtos reprecificados` +
          (data.lockedSkipped ? ` · ${data.lockedSkipped} travados` : "") +
          (data.unmatchedCount ? ` · ${data.unmatchedCount} sem cotação` : ""),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reprecificar");
    } finally {
      setRepricingLeague(null);
    }
  };

  const handleLeagueDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Tem certeza que deseja deletar a liga "${name}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/leagues/delete?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete league");
      setLeaguesList((prev) => prev.filter((l) => l.id !== id));
      toast.success(`Liga "${name}" deletada com sucesso`);
      onLeagueDeleted();
    } catch {
      toast.error("Erro ao deletar liga");
    }
  };

  const filteredLeagues =
    leaguesGameVersionFilter === "all"
      ? leaguesList
      : leaguesList.filter(
          (l) => l.gameVersion === leaguesGameVersionFilter,
        );

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-card-foreground">
              Gerenciar Ligas
              {leaguesList.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredLeagues.length} de {leaguesList.length})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={leaguesGameVersionFilter}
                onValueChange={(v) =>
                  setLeaguesGameVersionFilter(
                    v as "all" | "path-of-exile-1" | "path-of-exile-2",
                  )
                }
              >
                <SelectTrigger className="w-44 bg-card border-border text-card-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todas as versões</SelectItem>
                  <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
                  <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLeagues}
                disabled={leaguesListLoading}
                className="border-border text-foreground hover:bg-accent"
              >
                {leaguesListLoading ? "Carregando..." : "Atualizar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leaguesListLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredLeagues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma liga encontrada.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredLeagues.map((league) => (
                <div
                  key={league.id}
                  className="p-4 border border-border rounded-lg bg-muted/20 flex flex-col gap-3"
                >
                  {/* Header da liga */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-card-foreground truncate">
                          {league.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={
                            league.gameVersion === "path-of-exile-2"
                              ? "border-blue-500/40 text-blue-400 text-[10px]"
                              : "border-amber-500/40 text-amber-400 text-[10px]"
                          }
                        >
                          {league.gameVersion === "path-of-exile-2"
                            ? "PoE 2"
                            : "PoE 1"}
                        </Badge>
                        {league.difficulty && (
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground text-[10px]"
                          >
                            {league.difficulty}
                          </Badge>
                        )}
                      </div>
                      {/* Metadados */}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {league.league_slug && (
                          <span>
                            <span className="text-foreground/50">slug:</span>{" "}
                            <code className="text-[11px] bg-muted px-1 rounded">
                              {league.league_slug}
                            </code>
                          </span>
                        )}
                        {league.poe_ninja_name && (
                          <span>
                            <span className="text-foreground/50">poe.ninja:</span>{" "}
                            {league.poe_ninja_name}
                          </span>
                        )}
                        {league.updated_at && (
                          <span>
                            <span className="text-foreground/50">atualizada:</span>{" "}
                            {new Date(league.updated_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botão deletar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleLeagueDelete(league.id, league.name)
                      }
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      Deletar
                    </Button>
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap gap-6 pt-1 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`active-${league.id}`}
                        checked={league.isActive}
                        onCheckedChange={(v) =>
                          handleLeagueToggle(league.id, "isActive", v)
                        }
                      />
                      <Label
                        htmlFor={`active-${league.id}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Liga ativa
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`published-${league.id}`}
                        checked={league.is_published}
                        onCheckedChange={(v) =>
                          handleLeagueToggle(league.id, "is_published", v)
                        }
                      />
                      <Label
                        htmlFor={`published-${league.id}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Publicada
                      </Label>
                    </div>
                  </div>

                  {/* Precificação ancorada em divine.
                      preço = valor do item em divine × divine_usd × (1 + markup) */}
                  <div className="flex flex-wrap items-end gap-4 pt-3 border-t border-border/50">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`divine-${league.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        Divine em USD
                      </Label>
                      <Input
                        // Remonta quando o valor salvo muda, senão o
                        // defaultValue de um input não-controlado fica velho.
                        key={`divine-${league.id}-${league.divine_usd}`}
                        id={`divine-${league.id}`}
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="0.34"
                        defaultValue={league.divine_usd ?? ""}
                        onBlur={(e) => {
                          if (e.target.value === String(league.divine_usd ?? "")) return;
                          handlePricingSave(league.id, "divine_usd", e.target.value);
                        }}
                        className="h-8 w-28"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`markup-${league.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        Markup
                      </Label>
                      <Input
                        key={`markup-${league.id}-${league.price_markup}`}
                        id={`markup-${league.id}`}
                        type="number"
                        step="0.05"
                        min="0"
                        placeholder="0.5"
                        defaultValue={league.price_markup ?? ""}
                        onBlur={(e) => {
                          if (e.target.value === String(league.price_markup ?? "")) return;
                          handlePricingSave(league.id, "price_markup", e.target.value);
                        }}
                        className="h-8 w-24"
                      />
                    </div>

                    {league.divine_usd != null && (
                      <p className="text-xs text-muted-foreground pb-2">
                        divine na loja:{" "}
                        <span className="text-foreground font-medium">
                          $
                          {(
                            league.divine_usd * (1 + (league.price_markup ?? 0))
                          ).toFixed(4)}
                        </span>{" "}
                        <span className="text-foreground/50">
                          ({((league.price_markup ?? 0) * 100).toFixed(0)}% sobre o mercado)
                        </span>
                      </p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        repricingLeague !== null || league.divine_usd == null
                      }
                      onClick={() => handleReprice(league.name, league.gameVersion)}
                      className="ml-auto"
                    >
                      {repricingLeague === league.name
                        ? "Recalculando..."
                        : "Recalcular preços"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

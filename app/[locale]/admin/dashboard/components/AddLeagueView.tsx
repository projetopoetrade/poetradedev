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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AddLeagueViewProps {
  onSuccess: () => void;
}

export default function AddLeagueView({ onSuccess }: AddLeagueViewProps) {
  const [leagueForm, setLeagueForm] = useState<{
    name: string;
    imageUrl: string;
    gameVersion: "path-of-exile-1" | "path-of-exile-2";
    description: string;
    cloneFromLeague?: string;
    league_slug: string;
    isActive: boolean;
    is_published: boolean;
    difficulty: string;
    poe_ninja_name: string;
  }>({
    name: "",
    imageUrl: "",
    gameVersion: "path-of-exile-1",
    description: "",
    cloneFromLeague: "",
    league_slug: "",
    isActive: true,
    is_published: false,
    difficulty: "softcore",
    poe_ninja_name: "",
  });

  const [availableLeaguesForFilter, setAvailableLeaguesForFilter] = useState<
    Array<{ id: string; name: string; gameVersion: string }>
  >([]);
  const [loadingLeaguesForFilter, setLoadingLeaguesForFilter] = useState(false);

  useEffect(() => {
    fetchLeaguesForFilter(leagueForm.gameVersion);
  }, [leagueForm.gameVersion]);

  const fetchLeaguesForFilter = async (gameVersion: string) => {
    if (gameVersion === "All Versions") {
      setAvailableLeaguesForFilter([]);
      return;
    }

    setLoadingLeaguesForFilter(true);
    try {
      console.log("Fetching leagues for filter gameVersion:", gameVersion);

      // Try using the existing getLeagues function first
      try {
        const { getLeagues } = await import("@/app/actions");
        const leagues = await getLeagues(
          gameVersion as "path-of-exile-1" | "path-of-exile-2",
        );
        console.log("Leagues for filter from getLeagues:", leagues);
        setAvailableLeaguesForFilter(leagues || []);
        return;
      } catch (importError) {
        console.log("getLeagues not available for filter, trying API...");
      }

      // Fallback to API
      const response = await fetch(
        `/api/admin/leagues?gameVersion=${gameVersion}`,
      );
      console.log("Filter response status:", response.status);

      if (response.ok) {
        const leagues = await response.json();
        console.log("Leagues for filter fetched from API:", leagues);
        setAvailableLeaguesForFilter(leagues);
      } else {
        const errorData = await response.json();
        console.error("Error response for filter:", errorData);
      }
    } catch (error) {
      console.error("Error fetching leagues for filter:", error);
    } finally {
      setLoadingLeaguesForFilter(false);
    }
  };

  const handleLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/leagues/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leagueForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add league");
      }

      setLeagueForm({
        name: "",
        imageUrl: "",
        gameVersion: "path-of-exile-1",
        description: "",
        cloneFromLeague: "",
        league_slug: "",
        isActive: true,
        is_published: false,
        difficulty: "softcore",
        poe_ninja_name: "",
      });
      toast.success("League added successfully!");

      // Clone products if requested
      if (leagueForm.cloneFromLeague && leagueForm.cloneFromLeague !== "None") {
        toast.info(`Cloning items from ${leagueForm.cloneFromLeague}...`, {
          duration: 5000,
        });
        try {
          const cloneRes = await fetch("/api/admin/leagues/clone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceLeague: leagueForm.cloneFromLeague,
              targetLeague: leagueForm.name,
            }),
          });
          const cloneData = await cloneRes.json();
          if (cloneRes.ok) {
            toast.success(
              `Successfully cloned ${cloneData.clonedItemsCount} items to ${leagueForm.name}!`,
            );
          } else {
            toast.error(cloneData.error || "Failed to clone items.");
          }
        } catch (cloneErr) {
          console.error("Clone error:", cloneErr);
          toast.error("Network error while cloning items.");
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error adding league: ", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add league",
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Adicionar Nova Liga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLeagueSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Nome da Liga
                </Label>
                <Input
                  id="name"
                  required
                  value={leagueForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name
                      .toLowerCase()
                      .trim()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "");
                    setLeagueForm({
                      ...leagueForm,
                      name,
                      league_slug: autoSlug,
                    });
                  }}
                  className="bg-card border-border text-card-foreground focus:border-primary"
                  placeholder="ex: Settlers of Kalguur"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="league_slug" className="text-foreground">
                  Slug da Liga
                </Label>
                <Input
                  id="league_slug"
                  required
                  value={leagueForm.league_slug}
                  onChange={(e) =>
                    setLeagueForm({
                      ...leagueForm,
                      league_slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  className="bg-card border-border text-card-foreground focus:border-primary"
                  placeholder="ex: settlers-of-kalguur"
                />
                <p className="text-xs text-muted-foreground">
                  Gerado automaticamente a partir do nome. Usado nas URLs de builds.
                </p>
              </div>

              {/* Versão do Jogo */}
              <div className="space-y-2">
                <Label className="text-foreground">Versão do Jogo</Label>
                <Select
                  value={leagueForm.gameVersion}
                  onValueChange={(
                    value: "path-of-exile-1" | "path-of-exile-2",
                  ) =>
                    setLeagueForm({ ...leagueForm, gameVersion: value })
                  }
                >
                  <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                    <SelectValue placeholder="Selecione a versão do jogo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="path-of-exile-1">
                      Path of Exile 1
                    </SelectItem>
                    <SelectItem value="path-of-exile-2">
                      Path of Exile 2
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label className="text-foreground">Dificuldade</Label>
                <Select
                  value={leagueForm.difficulty}
                  onValueChange={(value) =>
                    setLeagueForm({ ...leagueForm, difficulty: value })
                  }
                >
                  <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                    <SelectValue placeholder="Selecione a dificuldade" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="softcore">Softcore</SelectItem>
                    <SelectItem value="hardcore">Hardcore</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* URL da Imagem */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-foreground">
                  URL da Imagem
                </Label>
                <Input
                  id="imageUrl"
                  required
                  value={leagueForm.imageUrl}
                  onChange={(e) =>
                    setLeagueForm({
                      ...leagueForm,
                      imageUrl: e.target.value,
                    })
                  }
                  className="bg-card border-border text-card-foreground focus:border-primary"
                  placeholder="https://..."
                />
              </div>

              {/* poe.ninja name */}
              <div className="space-y-2">
                <Label htmlFor="poe_ninja_name" className="text-foreground">
                  Nome no poe.ninja
                </Label>
                <Input
                  id="poe_ninja_name"
                  value={leagueForm.poe_ninja_name}
                  onChange={(e) =>
                    setLeagueForm({
                      ...leagueForm,
                      poe_ninja_name: e.target.value,
                    })
                  }
                  className="bg-card border-border text-card-foreground focus:border-primary"
                  placeholder="ex: Settlers"
                />
                <p className="text-xs text-muted-foreground">
                  Nome exato usado pela API do poe.ninja para buscar preços.
                </p>
              </div>

              {/* Clone de liga */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  Clonar itens de uma liga existente (Opcional)
                </Label>
                <Select
                  value={leagueForm.cloneFromLeague}
                  onValueChange={(value) =>
                    setLeagueForm({
                      ...leagueForm,
                      cloneFromLeague: value,
                    })
                  }
                >
                  <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                    <SelectValue placeholder="Selecione uma liga (ou deixe vazio)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="None">
                      Não clonar (Liga vazia)
                    </SelectItem>
                    {availableLeaguesForFilter.map((l) => (
                      <SelectItem key={l.id} value={l.name}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Ao clonar, todos os itens da liga de origem serão
                  copiados para esta nova liga com o preço zerado e
                  pausados.
                </p>
              </div>

              {/* Descrição */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-foreground">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={leagueForm.description}
                  onChange={(e) =>
                    setLeagueForm({
                      ...leagueForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-card border border-border text-card-foreground focus:border-primary min-h-[100px] resize-y rounded-md p-2"
                  placeholder="Descrição da liga (opcional)"
                />
              </div>

              {/* Toggles: isActive + is_published */}
              <div className="md:col-span-2 flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <Switch
                    id="isActive"
                    checked={leagueForm.isActive}
                    onCheckedChange={(checked) =>
                      setLeagueForm({ ...leagueForm, isActive: checked })
                    }
                  />
                  <div>
                    <Label htmlFor="isActive" className="text-foreground font-medium cursor-pointer">
                      Liga Ativa
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Liga aparece nos filtros de produtos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="is_published"
                    checked={leagueForm.is_published}
                    onCheckedChange={(checked) =>
                      setLeagueForm({ ...leagueForm, is_published: checked })
                    }
                  />
                  <div>
                    <Label htmlFor="is_published" className="text-foreground font-medium cursor-pointer">
                      Publicada
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Liga visível publicamente no site
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-md min-w-[200px]"
              >
                Salvar Liga
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

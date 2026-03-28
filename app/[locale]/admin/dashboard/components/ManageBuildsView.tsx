"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import AscendancyImage from "@/components/Builds/AscendancyImage";
import { toast } from "sonner";
import type { Build } from "@/lib/interface";
import { Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import AddBuildView from "./AddBuildView";

interface ManageBuildsViewProps {
  onAddBuild: () => void;
}

export default function ManageBuildsView({ onAddBuild }: ManageBuildsViewProps) {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buildToDelete, setBuildToDelete] = useState<Build | null>(null);
  const [filterVersion, setFilterVersion] = useState("all");
  const [editingBuild, setEditingBuild] = useState<Build | null>(null);

  useEffect(() => {
    fetchBuilds();
  }, []);

  async function fetchBuilds() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/builds");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBuilds(data);
    } catch {
      toast.error("Erro ao carregar builds");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublished(build: Build) {
    try {
      const res = await fetch(`/api/admin/builds/${build.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !build.is_published }),
      });
      if (!res.ok) throw new Error();
      setBuilds((prev) =>
        prev.map((b) =>
          b.id === build.id ? { ...b, is_published: !b.is_published } : b,
        ),
      );
      toast.success(
        build.is_published ? "Build despublicada" : "Build publicada",
      );
    } catch {
      toast.error("Erro ao atualizar build");
    }
  }

  function confirmDelete(build: Build) {
    setBuildToDelete(build);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!buildToDelete) return;
    setDeletingId(buildToDelete.id);
    try {
      const res = await fetch(`/api/admin/builds/${buildToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setBuilds((prev) => prev.filter((b) => b.id !== buildToDelete.id));
      toast.success("Build excluída");
    } catch {
      toast.error("Erro ao excluir build");
    } finally {
      setDeletingId(null);
      setBuildToDelete(null);
    }
  }

  const filtered =
    filterVersion === "all"
      ? builds
      : builds.filter((b) => b.game_version === filterVersion);

  if (editingBuild) {
    return (
      <AddBuildView
        key={editingBuild.id}
        initialData={editingBuild}
        onSuccess={() => {
          setEditingBuild(null);
          fetchBuilds();
        }}
        onCancel={() => setEditingBuild(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Builds ({filtered.length})
          </h2>
          <Select value={filterVersion} onValueChange={setFilterVersion}>
            <SelectTrigger className="w-44 h-8 text-sm border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os jogos</SelectItem>
              <SelectItem value="path-of-exile-1">PoE 1</SelectItem>
              <SelectItem value="path-of-exile-2">PoE 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={onAddBuild}>
          <Plus className="h-4 w-4 mr-1" /> Nova Build
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma build encontrada.{" "}
            <button onClick={onAddBuild} className="text-primary underline">
              Criar a primeira
            </button>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((build) => (
            <Card key={build.id} className="bg-card border-border">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden border border-border/50">
                    <AscendancyImage
                      ascendancy={build.ascendancy}
                      imageUrl={build.image_url}
                      gameVersion={build.game_version}
                      variant="icon"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {build.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${build.is_published ? "text-green-400 border-green-500/40" : "text-gray-400 border-gray-600/40"}`}
                      >
                        {build.is_published ? "Publicada" : "Rascunho"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {build.class} · {build.ascendancy}
                      {build.league && ` · ${build.league}`}
                      {build.tags.length > 0 && ` · ${build.tags.join(", ")}`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingBuild(build)}
                      title="Editar"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublished(build)}
                      title={build.is_published ? "Despublicar" : "Publicar"}
                      className="h-8 w-8 p-0"
                    >
                      {build.is_published ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirmDelete(build)}
                      disabled={deletingId === build.id}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Build"
        description={`Tem certeza que deseja excluir "${buildToDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}

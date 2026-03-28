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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { Build } from "@/lib/interface";
import {
  BUILD_TAGS,
  getClassesForGameVersion,
} from "@/lib/builds-data";

interface AddBuildViewProps {
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: Build | null;
}

export default function AddBuildView({
  onSuccess,
  onCancel,
  initialData,
}: AddBuildViewProps) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [availableLeagues, setAvailableLeagues] = useState<{ name: string }[]>(
    [],
  );
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    game_version: initialData?.game_version ?? "path-of-exile-1",
    league: initialData?.league ?? "",
    class: initialData?.class ?? "",
    ascendancy: initialData?.ascendancy ?? "",
    main_skill: initialData?.main_skill ?? "",
    description: initialData?.description ?? "",
    pob_code: initialData?.pob_code ?? "",
    tags: initialData?.tags ?? ([] as string[]),
    difficulty: initialData?.difficulty ?? "",
    budget: initialData?.budget ?? "",
    image_url: initialData?.image_url ?? "",
    video_url: initialData?.video_url ?? "",
    guide_content: initialData?.guide_content ?? "",
    seo_title: initialData?.seo_title ?? "",
    seo_description: initialData?.seo_description ?? "",
    author: initialData?.author ?? "",
    is_published: initialData?.is_published ?? false,
  });

  // Re-sync form when switching between different builds to edit
  useEffect(() => {
    setForm({
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      game_version: initialData?.game_version ?? "path-of-exile-1",
      league: initialData?.league ?? "",
      class: initialData?.class ?? "",
      ascendancy: initialData?.ascendancy ?? "",
      main_skill: initialData?.main_skill ?? "",
      description: initialData?.description ?? "",
      pob_code: initialData?.pob_code ?? "",
      tags: initialData?.tags ?? [],
      difficulty: initialData?.difficulty ?? "",
      budget: initialData?.budget ?? "",
      image_url: initialData?.image_url ?? "",
      video_url: initialData?.video_url ?? "",
      guide_content: initialData?.guide_content ?? "",
      seo_title: initialData?.seo_title ?? "",
      seo_description: initialData?.seo_description ?? "",
      author: initialData?.author ?? "",
      is_published: initialData?.is_published ?? false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  // Fetch active leagues whenever game_version changes
  useEffect(() => {
    async function fetchLeagues() {
      setLoadingLeagues(true);
      try {
        const res = await fetch(
          `/api/admin/leagues?gameVersion=${form.game_version}`,
        );
        if (res.ok) {
          const data = await res.json();
          setAvailableLeagues(data || []);
        }
      } catch {
        // silently ignore — league field remains a free input if API fails
      } finally {
        setLoadingLeagues(false);
      }
    }
    fetchLeagues();
  }, [form.game_version]);

  const classes = getClassesForGameVersion(form.game_version);
  const selectedClass = classes.find((c) => c.name === form.class);
  const ascendancies = selectedClass?.ascendancies ?? [];

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function toggleTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.title ||
      !form.slug ||
      !form.pob_code ||
      !form.class ||
      !form.ascendancy
    ) {
      toast.error(
        "Preencha os campos obrigatórios: título, slug, classe, ascendência e código PoB",
      );
      return;
    }
    setLoading(true);
    try {
      const url = isEditing
        ? `/api/admin/builds/${initialData!.id}`
        : "/api/admin/builds";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          err.error ||
            (isEditing ? "Erro ao salvar build" : "Erro ao criar build"),
        );
      }
      toast.success(
        isEditing ? "Build atualizada!" : "Build criada com sucesso!",
      );
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {isEditing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={onCancel}
            className="hover:text-foreground transition-colors"
          >
            ← Voltar para lista
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">
            Editando: {initialData!.title}
          </span>
        </div>
      )}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (!form.slug) set("slug", autoSlug(e.target.value));
                }}
                placeholder="Ex: Hexblast Mines Saboteur"
                className="border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="hexblast-mines-saboteur"
                className="border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição curta</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Resumo de 1-2 linhas..."
              className="border-border"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Classificação PoE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Versão do Jogo *</Label>
              <Select
                value={form.game_version}
                onValueChange={(v) => {
                  set("game_version", v);
                  set("class", "");
                  set("ascendancy", "");
                }}
              >
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="path-of-exile-1">
                    Path of Exile 1
                  </SelectItem>
                  <SelectItem value="path-of-exile-2">
                    Path of Exile 2
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Liga</Label>
              <Select
                value={form.league || undefined}
                onValueChange={(v) => set("league", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="border-border">
                  <SelectValue
                    placeholder={
                      loadingLeagues
                        ? "Carregando ligas..."
                        : "Selecione a liga"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {form.league && (
                    <SelectItem value="__none__">— Remover —</SelectItem>
                  )}
                  {availableLeagues.map((l) => (
                    <SelectItem key={l.name} value={l.name}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Classe *</Label>
              <Select
                value={form.class || undefined}
                onValueChange={(v) => {
                  set("class", v);
                  set("ascendancy", "");
                }}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ascendência *</Label>
              <Select
                value={form.ascendancy || undefined}
                onValueChange={(v) => set("ascendancy", v)}
                disabled={ascendancies.length === 0}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ascendancies.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Skill Principal</Label>
              <Input
                value={form.main_skill}
                onChange={(e) => set("main_skill", e.target.value)}
                placeholder="Ex: Hexblast"
                className="border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dificuldade</Label>
              <Select
                value={form.difficulty || undefined}
                onValueChange={(v) =>
                  set("difficulty", v === "__clear__" ? "" : v)
                }
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {form.difficulty && (
                    <SelectItem
                      value="__clear__"
                      className="text-muted-foreground"
                    >
                      — Remover —
                    </SelectItem>
                  )}
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budget</Label>
              <Select
                value={form.budget || undefined}
                onValueChange={(v) => set("budget", v === "__clear__" ? "" : v)}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {form.budget && (
                    <SelectItem
                      value="__clear__"
                      className="text-muted-foreground"
                    >
                      — Remover —
                    </SelectItem>
                  )}
                  <SelectItem value="cheap">Barato</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="expensive">Caro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {BUILD_TAGS.map((tag) => (
                <label
                  key={tag.value}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Checkbox
                    checked={form.tags.includes(tag.value)}
                    onCheckedChange={() => toggleTag(tag.value)}
                  />
                  <span className="text-sm text-foreground/80">
                    {tag.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Path of Building
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>
              Código PoB *{" "}
              <span className="text-xs text-muted-foreground">
                (base64 do Path of Building)
              </span>
            </Label>
            <Textarea
              value={form.pob_code}
              onChange={(e) => set("pob_code", e.target.value)}
              rows={4}
              placeholder="Cole o código PoB aqui..."
              className="border-border font-mono text-xs"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Mídia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              URL da Imagem{" "}
              <span className="text-xs text-muted-foreground">
                (opcional — fallback: CDN poecdn.com)
              </span>
            </Label>
            <Input
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://..."
              className="border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>URL do Vídeo (YouTube)</Label>
            <Input
              value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="border-border"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Guia (Markdown)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.guide_content}
            onChange={(e) => set("guide_content", e.target.value)}
            rows={8}
            placeholder="# Guia da Build&#10;&#10;## Mecânica principal..."
            className="border-border font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            SEO & Publicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>SEO Title</Label>
            <Input
              value={form.seo_title}
              onChange={(e) => set("seo_title", e.target.value)}
              placeholder="Deixe vazio para usar o título"
              className="border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>SEO Description</Label>
            <Textarea
              value={form.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
              rows={2}
              className="border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Autor</Label>
            <Input
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              className="border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_published"
              checked={form.is_published}
              onCheckedChange={(v) => set("is_published", !!v)}
            />
            <Label htmlFor="is_published">Publicar imediatamente</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Salvando..."
            : isEditing
              ? "Salvar Alterações"
              : "Criar Build"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel ?? onSuccess}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

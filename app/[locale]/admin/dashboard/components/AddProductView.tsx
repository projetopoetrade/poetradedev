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
import { toast } from "sonner";
import { newProduct } from "@/app/actions";
import type { Product } from "@/lib/interface";

function generateSlug(
  name: string,
  gameVersion: string,
  league: string,
  difficulty: string,
) {
  return `${name}-${gameVersion}-${league}-${difficulty}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function AddProductView() {
  const [productForm, setProductForm] = useState<Product>({
    name: "",
    league: "",
    category: "",
    slug: "",
    description: "",
    price: 0,
    gameVersion: "path-of-exile-1",
    imgUrl: "",
    difficulty: "",
    alt: "",
  });

  const [availableLeagues, setAvailableLeagues] = useState<
    Array<{ id: string; name: string; gameVersion: string }>
  >([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  useEffect(() => {
    if (productForm.gameVersion) {
      fetchLeaguesForProduct(productForm.gameVersion);
    }
  }, [productForm.gameVersion]);

  const fetchLeaguesForProduct = async (gameVersion: string) => {
    setLoadingLeagues(true);
    try {
      console.log("Fetching leagues for gameVersion:", gameVersion);

      // Try using the existing getLeagues function first
      try {
        const { getLeagues } = await import("@/app/actions");
        const leagues = await getLeagues(
          gameVersion as "path-of-exile-1" | "path-of-exile-2",
        );
        console.log("Leagues from getLeagues:", leagues);
        setAvailableLeagues(leagues || []);
        return;
      } catch (importError) {
        console.log("getLeagues not available, trying API...");
      }

      // Fallback to API
      const response = await fetch(
        `/api/admin/leagues?gameVersion=${gameVersion}`,
      );
      console.log("Response status:", response.status);

      if (response.ok) {
        const leagues = await response.json();
        console.log("Leagues fetched from API:", leagues);
        setAvailableLeagues(leagues);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
      }
    } catch (error) {
      console.error("Error fetching leagues:", error);
    } finally {
      setLoadingLeagues(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await newProduct(productForm);
      setProductForm({
        name: "",
        league: "",
        slug: "",
        category: "",
        description: "",
        price: 0,
        gameVersion: "path-of-exile-1",
        imgUrl: "",
        difficulty: "",
        alt: "",
      });
      toast.success("Product added successfully!");
    } catch (error) {
      console.error("Error adding product: ", error);
      toast.error("Failed to add product");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Adicionar Novo Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProductSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Nome do Produto
                </Label>
                <Input
                  id="name"
                  required
                  value={productForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setProductForm({
                      ...productForm,
                      name: newName,
                      slug: generateSlug(
                        newName,
                        productForm.gameVersion,
                        productForm.league,
                        productForm.difficulty,
                      ),
                    });
                  }}
                  className="bg-card border-border text-card-foreground focus:border-primary"
                  placeholder="Digite o nome do produto"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Liga</Label>
                <Select
                  value={productForm.league}
                  onValueChange={(value) => {
                    setProductForm({
                      ...productForm,
                      league: value,
                      slug: generateSlug(
                        productForm.name,
                        productForm.gameVersion,
                        value,
                        productForm.difficulty,
                      ),
                    });
                  }}
                  disabled={loadingLeagues}
                >
                  <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                    <SelectValue
                      placeholder={
                        loadingLeagues
                          ? "Carregando ligas..."
                          : "Selecione a liga"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableLeagues.map((league) => (
                      <SelectItem key={league.id} value={league.name}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-foreground">
                  Slug
                </Label>
                <Input
                  id="slug"
                  required
                  value={productForm.slug}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      slug: e.target.value,
                    })
                  }
                  className="bg-card border-border text-card-foreground focus:border-primary"
                  placeholder="Slug gerado automaticamente"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-foreground">
                  Preço
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="bg-card border-border text-card-foreground focus:border-primary pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imgUrl" className="text-foreground">
                  URL da Imagem
                </Label>
                <Input
                  id="imgUrl"
                  required
                  value={productForm.imgUrl}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      imgUrl: e.target.value,
                    })
                  }
                  className="bg-card border-border text-card-foreground focus:border-primary"
                  placeholder="Digite a URL da imagem"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Versão do Jogo</Label>
                <Select
                  value={
                    productForm.gameVersion as
                      | "path-of-exile-1"
                      | "path-of-exile-2"
                  }
                  onValueChange={(
                    value: "path-of-exile-1" | "path-of-exile-2",
                  ) => {
                    setProductForm({
                      ...productForm,
                      gameVersion: value,
                      slug: generateSlug(
                        productForm.name,
                        value,
                        productForm.league,
                        productForm.difficulty,
                      ),
                    });
                  }}
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

              <div className="space-y-2">
                <Label className="text-foreground">Categoria</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(value) =>
                    setProductForm({ ...productForm, category: value })
                  }
                >
                  <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="items">Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Dificuldade</Label>
                <Select
                  value={productForm.difficulty}
                  onValueChange={(value) => {
                    setProductForm({
                      ...productForm,
                      difficulty: value,
                      slug: generateSlug(
                        productForm.name,
                        productForm.gameVersion,
                        productForm.league,
                        value,
                      ),
                    });
                  }}
                >
                  <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                    <SelectValue placeholder="Selecione a dificuldade" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="softcore">Softcore</SelectItem>
                    <SelectItem value="hardcore">Hardcore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="alt" className="text-foreground">
                  Alt da Imagem
                </Label>
                <Textarea
                  id="alt"
                  value={productForm.alt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setProductForm({
                      ...productForm,
                      alt: e.target.value,
                    })
                  }
                  className="w-full bg-card border border-border text-card-foreground focus:border-primary min-h-[100px] resize-y rounded-md p-2"
                  placeholder="Digite o alt da imagem"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-md min-w-[200px]"
              >
                Salvar Produto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

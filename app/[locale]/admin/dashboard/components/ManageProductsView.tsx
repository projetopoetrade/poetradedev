"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getProducts } from "@/app/actions";
import type { Product } from "@/lib/interface";

export default function ManageProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [selectedGameVersion, setSelectedGameVersion] =
    useState<string>("All Versions");
  const [selectedLeague, setSelectedLeague] = useState<string>("All Leagues");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<string>("All Difficulties");

  const [availableLeaguesForFilter, setAvailableLeaguesForFilter] = useState<
    Array<{ id: string; name: string; gameVersion: string }>
  >([]);
  const [loadingLeaguesForFilter, setLoadingLeaguesForFilter] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedGameVersion) {
      fetchLeaguesForFilter(selectedGameVersion);
    }
  }, [selectedGameVersion]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setProductsLoading(false);
    }
  };

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

  const filterProducts = (products: Product[]): Product[] => {
    return products.filter((product) => {
      const gameVersionMatch =
        selectedGameVersion === "All Versions" ||
        product.gameVersion === selectedGameVersion;
      const leagueMatch =
        selectedLeague === "All Leagues" || product.league === selectedLeague;
      const difficultyMatch =
        selectedDifficulty === "All Difficulties" ||
        product.difficulty === selectedDifficulty;
      return gameVersionMatch && leagueMatch && difficultyMatch;
    });
  };

  const filteredProducts = filterProducts(products);

  const handleUpdatePrice = async (productId: number) => {
    const price = newPrice;
    if (isNaN(price) || price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    setUpdatingId(productId);
    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, price }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update price");
      }

      setProducts(
        products.map((product) =>
          product.id === productId ? { ...product, price } : product,
        ),
      );
      toast.success("Price updated successfully");
      setNewPrice(0);
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update price",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(
        `/api/admin/products/delete?id=${productId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      setProducts(products.filter((product) => product.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product",
      );
    }
  };

  const handleClearFilters = () => {
    setSelectedGameVersion("All Versions");
    setSelectedLeague("All Leagues");
    setSelectedDifficulty("All Difficulties");
  };

  const handleToggleStock = async (
    productId: number,
    currentStock: boolean,
  ) => {
    const newStockValue = !currentStock;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, in_stock: newStockValue } : p,
      ),
    );
    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, in_stock: newStockValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update stock");
      }
      toast.success(
        `Produto marcado como ${newStockValue ? "Em Estoque" : "Sem Estoque"}`,
      );
    } catch (error) {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, in_stock: currentStock } : p,
        ),
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update stock",
      );
    }
  };

  if (productsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Gerenciar Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={selectedGameVersion}
                onValueChange={setSelectedGameVersion}
              >
                <SelectTrigger className="bg-card border-border text-card-foreground">
                  <SelectValue placeholder="Versão do Jogo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="All Versions">
                    Todas as Versões
                  </SelectItem>
                  <SelectItem value="path-of-exile-1">
                    Path of Exile 1
                  </SelectItem>
                  <SelectItem value="path-of-exile-2">
                    Path of Exile 2
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedLeague}
                onValueChange={setSelectedLeague}
                disabled={loadingLeaguesForFilter}
              >
                <SelectTrigger className="bg-card border-border text-card-foreground">
                  <SelectValue
                    placeholder={
                      loadingLeaguesForFilter
                        ? "Carregando ligas..."
                        : "Liga"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="All Leagues">
                    Todas as Ligas
                  </SelectItem>
                  {availableLeaguesForFilter.map((league) => (
                    <SelectItem key={league.id} value={league.name}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger className="bg-card border-border text-card-foreground">
                  <SelectValue placeholder="Dificuldade" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="All Difficulties">
                    Todas as Dificuldades
                  </SelectItem>
                  <SelectItem value="softcore">Softcore</SelectItem>
                  <SelectItem value="hardcore">Hardcore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
              >
                Limpar Filtros
              </Button>
            </div>

            {/* Lista de produtos */}
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border border-border rounded-lg bg-muted/20"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-card-foreground">
                          {product.name}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            product.in_stock !== false
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}
                        >
                          {product.in_stock !== false
                            ? "Em Estoque"
                            : "Sem Estoque"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preço atual: ${product.price} | {product.league} |{" "}
                        {product.difficulty}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Stock toggle */}
                      <Button
                        onClick={() =>
                          product.id &&
                          handleToggleStock(
                            product.id,
                            product.in_stock !== false,
                          )
                        }
                        size="sm"
                        className={
                          product.in_stock !== false
                            ? "bg-red-700 hover:bg-red-800 text-white font-semibold"
                            : "bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                        }
                      >
                        {product.in_stock !== false
                          ? "Tirar do Estoque"
                          : "Colocar em Estoque"}
                      </Button>

                      {/* Price update */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            placeholder="Novo preço"
                            value={newPrice}
                            onChange={(e) =>
                              setNewPrice(Number(e.target.value))
                            }
                            className="w-24 pl-7 bg-card border-border text-card-foreground focus:border-primary"
                          />
                        </div>
                        <Button
                          onClick={() =>
                            product.id && handleUpdatePrice(product.id)
                          }
                          disabled={updatingId === product.id}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {updatingId === product.id
                            ? "Atualizando..."
                            : "Atualizar"}
                        </Button>
                      </div>

                      <Button
                        onClick={() =>
                          product.id && handleDeleteProduct(product.id)
                        }
                        size="sm"
                        variant="destructive"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum produto encontrado
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

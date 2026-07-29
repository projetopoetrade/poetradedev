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
  const [bulkListing, setBulkListing] = useState(false);
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

      // A rota trava a linha ao receber um preço manual — reflita isso aqui,
      // senão o badge de "travado" só apareceria no próximo refresh.
      setProducts(
        products.map((product) =>
          product.id === productId
            ? { ...product, price, price_locked: true }
            : product,
        ),
      );
      toast.success("Preço atualizado e travado contra o recálculo");
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

  // Destaque: o produto sobe para o bloco do topo da /products e sai da grade
  // normal. `featured_order` é a posição manual dentro do bloco; sem ordem, o
  // item cai no fim dele, ordenado por preço.
  const handleToggleFeatured = async (
    productId: number,
    currentFeatured: boolean,
  ) => {
    const nextFeatured = !currentFeatured;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              is_featured: nextFeatured,
              featured_order: nextFeatured ? p.featured_order : null,
            }
          : p,
      ),
    );
    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, is_featured: nextFeatured }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update featured");
      }
      toast.success(
        nextFeatured
          ? "Produto no bloco Destaque — ele sai da grade normal"
          : "Produto de volta à listagem normal",
      );
    } catch (error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_featured: currentFeatured } : p,
        ),
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update featured",
      );
    }
  };

  const handleFeaturedOrder = async (
    productId: number,
    previousOrder: number | null | undefined,
    raw: string,
  ) => {
    const nextOrder = raw.trim() === "" ? null : Number(raw);
    if (nextOrder !== null && (!Number.isInteger(nextOrder) || nextOrder < 0)) {
      toast.error("A posição precisa ser um número inteiro a partir de 0");
      return;
    }
    if ((previousOrder ?? null) === nextOrder) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, featured_order: nextOrder } : p,
      ),
    );
    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, featured_order: nextOrder }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order");
      }
      toast.success(
        nextOrder === null
          ? "Sem posição fixa — vai para o fim do Destaque"
          : `Posição ${nextOrder} no Destaque`,
      );
    } catch (error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, featured_order: previousOrder ?? null }
            : p,
        ),
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update order",
      );
    }
  };

  // Destravar devolve o item ao preço automático; ele só volta a valer no
  // próximo "Recalcular preços" da liga.
  const handleToggleLock = async (productId: number, currentLocked: boolean) => {
    const nextLocked = !currentLocked;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price_locked: nextLocked } : p)),
    );
    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, price_locked: nextLocked }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update lock");
      }
      toast.success(
        nextLocked
          ? "Preço travado — o recálculo vai ignorar este item"
          : "Preço destravado — volta ao automático no próximo recálculo",
      );
    } catch (error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, price_locked: currentLocked } : p,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Failed to update lock");
    }
  };

  const handleBulkListing = async (isListed: boolean) => {
    if (selectedLeague === "All Leagues") {
      toast.error("Selecione uma liga primeiro");
      return;
    }
    const verb = isListed ? "publicar" : "despublicar";
    if (!confirm(`Tem certeza que deseja ${verb} TODO o catálogo de "${selectedLeague}"?`))
      return;

    setBulkListing(true);
    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league: selectedLeague,
          // Sem isto, "Standard" atingiria os catálogos de PoE 1 e 2 juntos.
          gameVersion:
            selectedGameVersion === "All Versions" ? undefined : selectedGameVersion,
          is_listed: isListed,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed bulk update");
      toast.success(
        `${data.affected} produtos ${isListed ? "publicados" : "despublicados"}` +
          (data.onlyPriced ? " (só os que têm preço)" : ""),
      );
      await fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed bulk update");
    } finally {
      setBulkListing(false);
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

            <div className="flex justify-between items-center gap-3 flex-wrap">
              {/* Publicação em massa. Só habilita com uma liga escolhida — é a
                  operação da virada de liga, quando o clone cria o catálogo
                  inteiro despublicado. */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => handleBulkListing(true)}
                  disabled={bulkListing || selectedLeague === "All Leagues"}
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                >
                  {bulkListing ? "Aplicando..." : "Publicar liga inteira"}
                </Button>
                <Button
                  onClick={() => handleBulkListing(false)}
                  disabled={bulkListing || selectedLeague === "All Leagues"}
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground hover:bg-accent"
                >
                  Despublicar liga inteira
                </Button>
                {selectedLeague === "All Leagues" && (
                  <span className="text-xs text-muted-foreground">
                    selecione uma liga para publicar em massa
                  </span>
                )}
              </div>

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
                        {product.is_listed === false && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                            Não publicado
                          </span>
                        )}
                        {product.price_locked && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                            Preço travado
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                            Destaque
                            {product.featured_order != null
                              ? ` #${product.featured_order}`
                              : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preço atual: ${product.price} | {product.league} |{" "}
                        {product.difficulty}
                        {product.price_divine != null && (
                          <>
                            {" "}
                            |{" "}
                            <span className="text-foreground/70">
                              {product.price_divine.toFixed(4)} div
                            </span>
                          </>
                        )}
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

                      {/* Destaque */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() =>
                            product.id &&
                            handleToggleFeatured(
                              product.id,
                              product.is_featured === true,
                            )
                          }
                          size="sm"
                          variant="outline"
                          className={
                            product.is_featured
                              ? "border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
                              : "border-border text-foreground hover:bg-accent"
                          }
                        >
                          {product.is_featured
                            ? "Tirar do Destaque"
                            : "Destacar"}
                        </Button>

                        {product.is_featured && (
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="ordem"
                            defaultValue={product.featured_order ?? ""}
                            title="Posição no bloco Destaque — menor aparece primeiro. Vazio = fim do bloco."
                            onBlur={(e) =>
                              product.id &&
                              handleFeaturedOrder(
                                product.id,
                                product.featured_order,
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                            }}
                            className="w-20 bg-background border-border"
                          />
                        )}
                      </div>

                      {/* Trava de preço: só faz sentido oferecer "destravar",
                          já que travar acontece sozinho ao editar o preço. */}
                      {product.price_locked && (
                        <Button
                          onClick={() =>
                            product.id && handleToggleLock(product.id, true)
                          }
                          size="sm"
                          variant="outline"
                          className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                        >
                          Destravar preço
                        </Button>
                      )}

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

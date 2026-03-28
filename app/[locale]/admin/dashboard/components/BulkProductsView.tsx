"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { newProduct } from "@/app/actions";
import type { Product } from "@/lib/interface";
import { Plus, Download, Upload, Trash2 } from "lucide-react";

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

export default function BulkProductsView() {
  const [bulkProducts, setBulkProducts] = useState<Product[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split("\n").filter((line) => line.trim());

        // Remove a primeira linha (cabeçalho) se existir
        const dataLines = lines.length > 1 ? lines.slice(1) : lines;

        const products: Product[] = dataLines.map((line, index) => {
          const [
            name,
            category,
            price,
            league,
            difficulty,
            gameVersion,
            description,
            imgUrl,
          ] = line.split(",").map((item) => item.trim());

          return {
            name: name || `Produto ${index + 1}`,
            category: category || "currency",
            price: parseFloat(price) || 0,
            league: league || "Standard",
            difficulty: difficulty || "softcore",
            gameVersion:
              (gameVersion as "path-of-exile-1" | "path-of-exile-2") ||
              "path-of-exile-1",
            description: description || "",
            imgUrl: imgUrl || "",
            slug: generateSlug(
              name || `produto-${index + 1}`,
              gameVersion || "path-of-exile-1",
              league || "Standard",
              difficulty || "softcore",
            ),
            alt: name || `Produto ${index + 1}`,
          };
        });

        setBulkProducts(products);
        toast.success(`${products.length} produtos carregados do arquivo`);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Erro ao processar arquivo. Verifique o formato.");
      }
    };
    reader.readAsText(file);
  };

  const handleBulkCreate = async () => {
    if (bulkProducts.length === 0) {
      toast.error("Nenhum produto para criar");
      return;
    }

    setBulkLoading(true);
    setBulkProgress({ current: 0, total: bulkProducts.length });
    setBulkResults({ success: 0, failed: 0, errors: [] });

    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < bulkProducts.length; i++) {
      try {
        await newProduct(bulkProducts[i]);
        success++;
        setBulkProgress({ current: i + 1, total: bulkProducts.length });
      } catch (error) {
        failed++;
        const errorMsg = `Produto ${i + 1} (${bulkProducts[i].name}): ${error instanceof Error ? error.message : "Erro desconhecido"}`;
        errors.push(errorMsg);
        console.error(`Error creating product ${i + 1}:`, error);
      }
    }

    setBulkResults({ success, failed, errors });
    setBulkLoading(false);

    if (success > 0) {
      toast.success(`${success} produtos criados com sucesso`);
    }
    if (failed > 0) {
      toast.error(`${failed} produtos falharam`);
    }

    // Clear the products list after processing
    setBulkProducts([]);
  };

  const downloadTemplate = () => {
    const template =
      "Nome,Categoria,Preço,Liga,Dificuldade,Versão do Jogo,Descrição,URL da Imagem\n" +
      "Divine Orb,currency,10,Standard,softcore,path-of-exile-1,Moeda divina,https://example.com/divine-orb.png\n" +
      "Exalted Orb,currency,5,Standard,softcore,path-of-exile-1,Moeda exaltada,https://example.com/exalted-orb.png";

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-produtos.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearBulkProducts = () => {
    setBulkProducts([]);
    setBulkResults({ success: 0, failed: 0, errors: [] });
    setBulkProgress({ current: 0, total: 0 });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Criar Produtos em Massa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">
                Como usar:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  Baixe o template CSV clicando em "Baixar Template"
                </li>
                <li>Preencha o arquivo com os dados dos produtos</li>
                <li>
                  Faça upload do arquivo usando o botão "Selecionar
                  Arquivo"
                </li>
                <li>Revise os produtos carregados</li>
                <li>Clique em "Criar Produtos" para processar</li>
              </ol>
            </div>

            {/* Template Download */}
            <div className="flex gap-3">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Template
              </Button>
              <Button
                onClick={() =>
                  document.getElementById("bulk-file-input")?.click()
                }
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Selecionar Arquivo
              </Button>
              <input
                id="bulk-file-input"
                type="file"
                accept=".csv"
                onChange={handleBulkFileUpload}
                className="hidden"
              />
            </div>

            {/* Progress */}
            {bulkLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando produtos...</span>
                  <span>
                    {bulkProgress.current} / {bulkProgress.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {bulkResults.success > 0 || bulkResults.failed > 0 ? (
              <div className="space-y-2">
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">
                    ✓ {bulkResults.success} sucessos
                  </span>
                  <span className="text-red-600">
                    ✗ {bulkResults.failed} falhas
                  </span>
                </div>
                {bulkResults.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <h4 className="font-semibold text-red-800 mb-2">
                      Erros:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {bulkResults.errors
                        .slice(0, 5)
                        .map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      {bulkResults.errors.length > 5 && (
                        <li>
                          ... e mais {bulkResults.errors.length - 5} erros
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {/* Products List */}
            {bulkProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-foreground">
                    Produtos Carregados ({bulkProducts.length})
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkCreate}
                      disabled={bulkLoading}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {bulkLoading ? "Criando..." : "Criar Produtos"}
                    </Button>
                    <Button
                      onClick={clearBulkProducts}
                      variant="outline"
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpar
                    </Button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <div className="grid grid-cols-1 gap-2 p-4">
                    {bulkProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded border"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {product.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.category} • ${product.price} •{" "}
                            {product.league} • {product.difficulty}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {product.gameVersion === "path-of-exile-1"
                            ? "POE 1"
                            : "POE 2"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

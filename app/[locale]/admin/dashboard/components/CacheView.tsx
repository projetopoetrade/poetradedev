"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RevalidateCacheButton from "@/components/revalidate-cache-button";

export default function CacheView() {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Gerenciar Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground mb-4">
              Use os botões abaixo para limpar o cache de diferentes tipos
              de conteúdo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <RevalidateCacheButton
                type="post"
                label="Limpar Cache do Blog"
                variant="outline"
              />
              <RevalidateCacheButton
                type="product"
                label="Limpar Cache de Produtos"
                variant="outline"
              />
              <RevalidateCacheButton
                type="author"
                label="Limpar Cache de Autores"
                variant="outline"
              />
              <RevalidateCacheButton
                type="category"
                label="Limpar Cache de Categorias"
                variant="outline"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

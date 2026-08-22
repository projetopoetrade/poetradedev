"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/contexts/currency-context";
import { useCart } from "@/lib/contexts/cart-context";
import Filters from "../app/[locale]/(site)/products/[name]/filters";
import type { Product } from "@/lib/interface";
import { CurrencyInfo } from "./currency-info";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useProductVariant } from "@/lib/contexts/product-variant-context";

interface ProductDetailProps {
  product: Product;
  currentGameVersion: 'path-of-exile-1' | 'path-of-exile-2';
  currentLeague: string;
  currentDifficulty: string;
  gameVersionOptions: { value: string; label: string; }[];
  leagueOptions: string[];
  difficultyOptions: string[];
  productName: string;
  seoTitle?: string;
  /** `url_slug` canônico — habilita a troca de versão do jogo no Filters. */
  urlSlug?: string;
  locale?: string;
}

export default function ProductDetail({
  product: initialProduct,
  currentGameVersion,
  currentLeague,
  currentDifficulty,
  gameVersionOptions,
  leagueOptions,
  difficultyOptions,
  productName,
  seoTitle,
  urlSlug,
  locale: localeProp,
}: ProductDetailProps) {
  // Variante selecionada no cliente (liga/dificuldade). Fora do provider — a
  // rota legada `/products/[name]`, para produtos sem `url_slug` — o hook
  // devolve null e caímos nas props do servidor, que era o comportamento antigo.
  const variant = useProductVariant();
  const product = variant?.selected ?? initialProduct;
  const activeLeague = variant?.league ?? currentLeague;
  const activeDifficulty = variant?.difficulty ?? currentDifficulty;
  const activeLeagueOptions = variant?.leagueOptions ?? leagueOptions;
  const activeDifficultyOptions = variant?.difficultyOptions ?? difficultyOptions;

  // Pedido mínimo calibrado para valer ~1 divine (ver migration
  // 20260728020000_add_min_quantity.sql). Um Scroll of Wisdom exige milhares de
  // unidades; um Mirror, uma só.
  const minQty = Math.max(1, product.min_quantity ?? 1);
  const [count, setCount] = useState(minQty);
  const { formatPrice, convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuantityLoading, setIsQuantityLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("ProductCard");
  const locale = useLocale();

  const increment = () => {
    if (isQuantityLoading) return;
    setIsQuantityLoading(true);
    try {
      setCount((prev) => prev + 1);
    } finally {
      setIsQuantityLoading(false);
    }
  };

  const decrement = () => {
    if (isQuantityLoading) return;
    setIsQuantityLoading(true);
    try {
      setCount((prev) => Math.max(minQty, prev - 1));
    } finally {
      setIsQuantityLoading(false);
    }
  };

  // Enquanto digita não travamos no mínimo — com mínimos de milhares, corrigir a
  // cada tecla tornaria o campo inutilizável. O ajuste acontece no blur e, por
  // garantia, antes de mandar pro carrinho.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isQuantityLoading) return;
    setIsQuantityLoading(true);
    try {
      setCount(Math.max(0, parseInt(e.target.value) || 0));
    } finally {
      setIsQuantityLoading(false);
    }
  };

  const handleInputBlur = () => setCount((prev) => Math.max(minQty, prev));

  const handleBuyNow = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      addToCart(product, Math.max(minQty, count));
      router.push('/cart');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to add to cart');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = () => {
    const quantity = Math.max(minQty, count);
    addToCart(product, quantity);

    // Show success toast
    toast.success(t('itemAddedToCart'), {
      description: t('itemAddedDescription', {
        quantity,
        productName: product.name
      }),
      icon: <Check className="h-5 w-5" />,
      duration: 3000,
    });

    setCount(minQty);
  };

  const handleBackToProducts = () => {
    const savedParams = localStorage.getItem('productSearchParams');
    if (savedParams) {
      router.push(`/products?${savedParams}`);
    } else {
      router.push('/products');
    }
  };

  // Calculate display price
  const displayPrice = convertPrice(product.price);
  const totalPrice = displayPrice * count;

  // in_stock defaults to true for products that predate the column
  const isInStock = product.in_stock !== false;

  return (
      <div className="p-6 md:p-8 flex flex-col">
        {/* h1 do produto; mantém o SEO title completo como rótulo acessível */}
        <div className="flex items-start gap-3 mb-4">
          <h1 className="text-3xl font-bold" title={seoTitle || product.name}>
            {product.name}
          </h1>
          {!isInStock && (
            <span className="shrink-0 mt-1.5 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/30">
              Out of Stock
            </span>
          )}
        </div>



        {/* Game Version, League and Difficulty Filters */}
        <div className="">
          <Filters
            gameVersionOptions={gameVersionOptions}
            leagueOptions={activeLeagueOptions}
            difficultyOptions={activeDifficultyOptions}
            currentGameVersion={currentGameVersion}
            currentLeague={activeLeague}
            currentDifficulty={activeDifficulty}
            onLeagueChange={variant?.setLeague}
            onDifficultyChange={variant?.setDifficulty}
            urlSlug={urlSlug}
            locale={localeProp ?? locale}
          />
        </div>

        <div className="mt-4">
          {/* Quantity controls */}
          <div className="flex items-center justify-center mb-3">
            <Button
              variant="outline"
              size="icon"
              className="flex-none h-10"
              onClick={decrement}
              disabled={isQuantityLoading || count <= minQty}
              aria-label="Decrease quantity"
            >
              <Minus />
            </Button>
            <Input
              className="shrink text-center text-xl w-24 mx-2 h-10 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              type="number"
              placeholder={String(minQty)}
              value={count}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={isQuantityLoading}
              min={minQty}
            />
            <Button
              variant="outline"
              size="icon"
              className="flex-none h-10"
              onClick={increment}
              disabled={isQuantityLoading}
              aria-label="Increase quantity"
            >
              <Plus />
            </Button>
          </div>

          {minQty > 1 && (
            <p className="text-sm text-muted-foreground">
              {/* Estava fixo em português; num site com locale EN o texto saía
                  em pt-BR e o número no formato brasileiro. */}
              {t("minimumOrder", { quantity: minQty.toLocaleString(locale) })}
            </p>
          )}

          {/* Price display — escondido quando sem estoque ou sem preço definido */}
          {isInStock && product.price > 0 && (
            <div className="flex items-baseline justify-center mb-6">
              <span className="text-3xl font-bold text-primary">{formatPrice(totalPrice)}</span>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">
              {error}
            </div>
          )}

          {!isInStock && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-950/40 border border-red-700/40 text-sm text-red-300 text-center">
              This item is temporarily out of stock. Check back soon or{" "}
              <a href="https://discord.gg/pathoftrade" className="underline hover:text-red-100" target="_blank" rel="noopener noreferrer">contact support</a>.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 mb-8">
            <Button
              className="flex-1 h-12 bg-green-500 text-black hover:bg-green-600 hover:text-white text-base font-bold"
              disabled={count === 0 || isProcessing || !isInStock}
              onClick={handleBuyNow}
            >
              {isProcessing ? 'Processing...' : 'Buy Now'}
            </Button>
            <Button
              variant="outline"
              className="shrink-0 h-10 px-5 font-medium"
              disabled={count === 0 || !isInStock}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
          </div>


        </div>


      </div>
  );
} 
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/contexts/currency-context";
import { useCart } from "@/lib/contexts/cart-context";
import Filters from "../app/[locale]/(site)/products/[name]/filters";
import type { Product } from "@/lib/interface";
import { CurrencyInfo } from "./currency-info";

interface ProductDetailProps {
  product: Product;
  currentGameVersion: 'path-of-exile-1' | 'path-of-exile-2';
  currentLeague: string;
  currentDifficulty: string;
  gameVersionOptions: { value: string; label: string; }[];
  leagueOptions: string[];
  difficultyOptions: string[];
  productName: string;
}

export default function ProductDetail({
  product,
  currentGameVersion,
  currentLeague,
  currentDifficulty,
  gameVersionOptions,
  leagueOptions,
  difficultyOptions,
  productName,
}: ProductDetailProps) {
  const [count, setCount] = useState(1);
  const { formatPrice, convertPrice } = useCurrency();
  const { addToCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuantityLoading, setIsQuantityLoading] = useState(false);
  const router = useRouter();

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
      setCount((prev) => Math.max(0, prev - 1));
    } finally {
      setIsQuantityLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isQuantityLoading) return;
    setIsQuantityLoading(true);
    try {
      const value = parseInt(e.target.value) || 0;
      setCount(Math.max(0, value));
    } finally {
      setIsQuantityLoading(false);
    }
  };

  const handleBuyNow = async () => {
    setError(null);
    setIsProcessing(true);
    
    try {
      addToCart(product, count);
      router.push('/cart');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to add to cart');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, count);
    setCount(1);
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

  return (
    
    <div className="p-6 md:p-8 flex flex-col">
      {/* Back to Products button */}
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-muted"
          onClick={handleBackToProducts}
        >
          Back to Products
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
      
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-md text-sm font-medium">
          {currentGameVersion === 'path-of-exile-1' ? 'POE 1' : 'POE 2'}
        </span>
      </div>

      {/* Game Version, League and Difficulty Filters */}
      <div className="">
        <Filters 
          productName={productName}
          gameVersionOptions={gameVersionOptions}
          leagueOptions={leagueOptions}
          difficultyOptions={difficultyOptions}
          currentGameVersion={currentGameVersion}
          currentLeague={currentLeague}
          currentDifficulty={currentDifficulty}
        />
      </div>

      <div className="mt-auto">
        {/* Quantity controls */}
        <div className="flex items-center justify-center mb-3">
          <Button
            variant="outline"
            size="icon"
            className="flex-none h-10"
            onClick={decrement}
            disabled={isQuantityLoading || count === 0}
          >
            <Minus />
          </Button>
          <Input
            className="shrink text-center text-xl w-24 mx-2 h-10 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            type="number"
            placeholder="1"
            value={count}
            onChange={handleInputChange}
            disabled={isQuantityLoading}
            min="0"
          />
          <Button
            variant="outline"
            size="icon"
            className="flex-none h-10"
            onClick={increment}
            disabled={isQuantityLoading}
          >
            <Plus />
          </Button>
        </div>

        {/* Price display */}
        <div className="flex items-baseline justify-center mb-6">
          <span className="text-3xl font-bold text-primary">{formatPrice(totalPrice)}</span>
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button
            className="bg-green-500 text-black hover:bg-green-600 hover:text-white text-md font-bold"
            disabled={count === 0 || isProcessing}
            onClick={handleBuyNow}
          >
            {isProcessing ? 'Processing...' : 'Buy Now'}
          </Button>
          <Button
            variant="outline"
            className="font-bold"
            disabled={count === 0}
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </div>


      </div>


    </div>
  );
} 
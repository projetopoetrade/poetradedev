"use client";
import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { useState } from "react";
import { Minus, Plus, Info } from "lucide-react";
import { Input } from "./ui/input";
import type { Product } from "@/lib/interface";
import { useCurrency } from "@/lib/contexts/currency-context";
import { useCart } from "@/lib/contexts/cart-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";



interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("ProductCard");
  const [count, setCount] = useState(1);
  const { formatPrice, currency, convertPrice } = useCurrency();
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
      // Add to cart with original price
      addToCart(product, count);
      router.push('/cart');
    } catch (error) {
      console.error('Error:', error);
      setError(t('addToCartError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = () => {
    // Add to cart with original price
    addToCart(product, count);
    setCount(1);
  };

  // Calculate display price
  const displayPrice = convertPrice(product.price);
  const totalPrice = displayPrice * count;

  // Create URL with parameters
  const productDetailUrl = `/products/${encodeURIComponent(product.name)}?gameVersion=${encodeURIComponent(product.gameVersion)}&league=${encodeURIComponent(product.league)}&difficulty=${encodeURIComponent(product.difficulty)}`;

  return (
    <Card className="inline-block max-w-70 bg-black/10 min-w-40 overflow-hidden shadow-md hover:shadow-lg transition-shadow m-3 outline-none ">
      <CardContent className="flex flex-col mt-4">
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-20 md:w-20 mb-4 rounded-lg overflow-hidden mx-auto">
          <Link href={productDetailUrl} className="relative block w-full h-full">
            <Image
              src={product.imgUrl}
              alt={product.alt || product.name}
              fill                
              sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 80px"
              className="object-contain hover:scale-105 transition-transform duration-300"
              quality={100}
              priority
              onError={(e) => {                                   
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.png'; // Fallback image
                target.alt = t('placeholderImageAlt');
              }}
            />
          </Link>
        </div>

        <CardFooter className="flex flex-col items-center">
          <Link 
            href={productDetailUrl}
            className="hover:text-indigo-600 transition-colors duration-200"
          >
            <h2 className="text-lg md:text-xl text-center">{product.name}</h2>
          </Link>

          {/* Quantity controls */}
          <div className="flex my-1 ">
            <Button
              variant="outline"
              size="icon"
              className="flex-none h-8"
              onClick={decrement}
              disabled={isQuantityLoading || count === 0}
              aria-label={t('decrementQuantity')}
            >
              <Minus />
            </Button>
            <Input
              className="shrink text-center text-xl w-24 mx-1 h-8 appearance-none mb-2 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              type="number"
              placeholder="1"
              value={count}
              onChange={handleInputChange}
              disabled={isQuantityLoading}
              min="0"
              aria-label={t('quantityInput')}
            />
            <Button
              variant="outline"
              size="icon"
              className="flex-none h-8"
              onClick={increment}
              disabled={isQuantityLoading}
              aria-label={t('incrementQuantity')}
            >
              <Plus />
            </Button>
          </div>

          {/* Price and buttons */}
          <span className="text-xl font-bold text-primary inline-flex mb-3">
            {formatPrice(totalPrice)}
          </span>
          
          {error && (
            <div className="text-red-500 text-sm mb-2 text-center">
              {error}
            </div>
          )}
          
          <div className="flex flex-wrap min-w-64 justify-center gap-2 mb-2">
            <Button
              className="bg-green-500 min-w-28  text-black hover:bg-green-600 hover:scale-105 transition-transform duration-300 hover:text-white text-md font-bold rounded-sm  "
              disabled={count === 0 || isProcessing}
              onClick={handleBuyNow}
            >
              {isProcessing ? t('processing') : t('buyNow')}
            </Button>
            <Button
              variant="outline"
              className="rounded-sm min-w-28  hover:scale-105 transition-transform duration-300 font-bold "
              disabled={count === 0}
              onClick={handleAddToCart}
            >
              {t('addToCart')}
            </Button>
          </div>
          
          <Link href={productDetailUrl} className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm mt-2">
            <Info className="h-4 w-4 mr-1" /> {t('viewDetails')}
          </Link>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

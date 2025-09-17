"use client";
import { useCart } from "@/lib/contexts/cart-context";
import { Button } from "./ui/button";
import { useCurrency } from "@/lib/contexts/currency-context";
import { Minus, Plus, Trash2, ShoppingCart, Store } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartDropdown() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const { formatPrice, currency, convertPrice } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a simple button during server-side rendering and initial client render
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Shopping Cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-4">
        {items.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">No items in your cart</p>
            <Link href="/products" className="inline-block">
              <Button variant="outline" className="w-full border-2 border-zinc-700 hover:bg-zinc-900 hover:text-white transition-colors">
                <Store className="mr-2 h-4 w-4" />
                Go to Products
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="max-h-[300px] overflow-y-auto space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                      src={item.product.imgUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover object-center rounded-md"
                      sizes="64px"
                      quality={95}
                      priority
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {convertPrice(item.product.price)} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.product.id!, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.product.name}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.product.id!, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.product.name}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-600"
                      onClick={() => removeFromCart(item.product.id!)}
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Total:</span>
                <span className="font-bold">{formatPrice(totalPrice)}</span>
              </div>
              <div className="space-y-2">
                <Link href="/cart" className="block">
                  <Button className="w-full bg-black border text-white hover:bg-white hover:text-black font-bold transition-colors duration-200">
                    Checkout
                  </Button>
                </Link>
                <span className="block text-xs text-muted-foreground text-center">
                  <Link href="/products" className="inline-block text-zinc-600 hover:text-white font-medium transition-colors">
                    Go to Products
                  </Link>
                </span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
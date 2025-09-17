"use client";
import { useCart } from "@/lib/contexts/cart-context";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useCurrency } from "@/lib/contexts/currency-context";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  if (items.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Your Cart</h2>
        <p>Your cart is empty</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Your Cart</h2>
        <Button
          variant="outline"
          onClick={clearCart}
          className="text-red-500 hover:text-red-600"
        >
          Clear Cart
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="relative h-20 w-20">
              <Image
                src={item.product.imgUrl}
                alt={item.product.name}
                fill
                className="object-cover rounded-md"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold">{item.product.name}</h3>
              <p className="text-sm text-gray-500">
                {formatPrice(item.product.price)} each
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateQuantity(item.product.id!, item.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateQuantity(item.product.id!, item.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromCart(item.product.id!)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-xl font-bold">{formatPrice(totalPrice)}</span>
        </div>
        <Button className="w-full">Checkout</Button>
      </div>
    </Card>
  );
} 
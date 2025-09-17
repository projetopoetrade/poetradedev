"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCurrency } from './currency-context';
import type { Product } from '@/lib/interface';

interface CartItem {
  product: Product;
  quantity: number;
  currency: string;
  priceInCurrency: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CART_STORAGE_KEY = 'cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

// Separate hook into its own named function
function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Main component in PascalCase
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const { currency, convertPrice } = useCurrency();

  // Update prices when currency changes
  useEffect(() => {
    setItems(currentItems => 
      currentItems.map(item => ({
        ...item,
        currency,
        priceInCurrency: convertPrice(item.product.price)
      }))
    );
  }, [currency, convertPrice]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleStorageChange(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY && event.newValue !== null) {
        try {
          const newCart = JSON.parse(event.newValue);
          setItems(newCart);
        } catch (error) {
          console.error('Error syncing cart between tabs:', error);
        }
      }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToCart = (product: Product, quantity: number) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return currentItems.map(item =>
          item.product.id === product.id
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                currency,
                priceInCurrency: convertPrice(product.price)
              }
            : item
        );
      }
      
      return [...currentItems, { 
        product, 
        quantity,
        currency,
        priceInCurrency: convertPrice(product.price)
      }];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.priceInCurrency * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Export the hook separately
export const useCart = useCartContext; 
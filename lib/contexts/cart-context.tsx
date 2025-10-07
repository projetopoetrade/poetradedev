"use client";
import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode, 
  useCallback, 
  useMemo 
} from 'react';
import { useCurrency } from './currency-context'; // Certifique-se que o caminho está correto
import type { Product } from '@/lib/interface'; // Certifique-se que o caminho está correto

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

function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { currency, convertPrice } = useCurrency();

  // Efeito para atualizar preços quando a moeda muda
  useEffect(() => {
    if (items.length > 0) {
      setItems(currentItems => 
        currentItems.map(item => ({
          ...item,
          currency,
          priceInCurrency: convertPrice(item.product.price)
        }))
      );
    }
  }, [currency, convertPrice, items.length]); // Adicionado items.length para segurança

  // Efeito para carregar o carrinho do localStorage na inicialização
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Efeito para salvar o carrinho no localStorage sempre que os itens mudam
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  // Efeito para sincronizar o carrinho entre abas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleStorageChange(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY && event.newValue !== null) {
        try {
          setItems(JSON.parse(event.newValue));
        } catch (error) {
          console.error('Error syncing cart between tabs:', error);
        }
      }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ✅ Funções memoizadas com useCallback para garantir referência estável
  const addToCart = useCallback((product: Product, quantity: number) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id);
      
      const priceInCurrency = convertPrice(product.price);

      if (existingItem) {
        return currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, priceInCurrency, currency }
            : item
        );
      }
      
      return [...currentItems, { product, quantity, currency, priceInCurrency }];
    });
  }, [currency, convertPrice]);

  const removeFromCart = useCallback((productId: number) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Valores calculados
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.priceInCurrency * item.quantity), 0);
  
  // ✅ Objeto de valor memoizado com useMemo para otimizar re-renderizações
  const value = useMemo(() => ({
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  }), [items, totalItems, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook customizado exportado para uso nos componentes
export const useCart = useCartContext;
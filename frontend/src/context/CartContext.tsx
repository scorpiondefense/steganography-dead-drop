"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import { CartItemWithPainting } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface CartContextType {
  items: CartItemWithPainting[];
  loading: boolean;
  addToCart: (paintingId: string) => Promise<void>;
  removeFromCart: (paintingId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  loading: false,
  addToCart: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  refresh: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemWithPainting[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<CartItemWithPainting[]>("/api/cart");
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = async (paintingId: string) => {
    await api.post("/api/cart", { painting_id: paintingId });
    await refresh();
  };

  const removeFromCart = async (paintingId: string) => {
    await api.delete(`/api/cart/${paintingId}`);
    await refresh();
  };

  const clearCart = async () => {
    await api.delete("/api/cart");
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{ items, loading, addToCart, removeFromCart, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

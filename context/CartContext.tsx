import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { getUserCartItems, CartItem } from '../backend/supabaseItems';

interface CartContextType {
  cartCount: number;
  updateCartCount: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  updateCartCount: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { user } = useUser();

  const updateCartCount = async () => {
    if (user?.id) {
      const result = await getUserCartItems(user.id);
      if (result.success) {
        setCartCount(result.data.length);
      }
    }
  };

  // Update cart count when user changes
  useEffect(() => {
    updateCartCount();
  }, [user?.id]);

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
}; 
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { isProductLiked } from '../backend/supabaseItems';

interface LikesContextType {
  showLikes: boolean;
  setShowLikes: (show: boolean) => void;
  exitFromLikes: () => void;
  likedProductIds: Set<number>;
  addLikedProduct: (productId: number) => void;
  removeLikedProduct: (productId: number) => void;
  isProductLikedById: (productId: number) => boolean;
  loadLikedStateForProducts: (productIds: number[]) => Promise<void>;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export const useLikes = () => {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
};

interface LikesProviderProps {
  children: ReactNode;
}

export const LikesProvider: React.FC<LikesProviderProps> = ({ children }) => {
  const [showLikes, setShowLikes] = useState(false);
  const [likedProductIds, setLikedProductIds] = useState<Set<number>>(new Set());
  const { user } = useUser();

  const exitFromLikes = () => {
    setShowLikes(false);
  };

  const addLikedProduct = (productId: number) => {
    setLikedProductIds(prev => new Set([...prev, productId]));
  };

  const removeLikedProduct = (productId: number) => {
    setLikedProductIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const isProductLikedById = (productId: number) => {
    return likedProductIds.has(productId);
  };

  const loadLikedStateForProducts = async (productIds: number[]) => {
    if (!user?.id) return;
    
    try {
      const newLikedProducts = new Set<number>();
      
      // Check each product if it's liked
      for (const productId of productIds) {
        const isLiked = await isProductLiked(user.id, productId);
        if (isLiked) {
          newLikedProducts.add(productId);
        }
      }
      
      // Update the liked products set
      setLikedProductIds(prev => new Set([...prev, ...newLikedProducts]));
    } catch (error) {
      console.error('Error loading liked products state:', error);
    }
  };

  // Clear liked products when user signs out
  useEffect(() => {
    if (!user) {
      setLikedProductIds(new Set());
    }
  }, [user]);

  return (
    <LikesContext.Provider 
      value={{ 
        showLikes, 
        setShowLikes, 
        exitFromLikes,
        likedProductIds,
        addLikedProduct,
        removeLikedProduct,
        isProductLikedById,
        loadLikedStateForProducts
      }}
    >
      {children}
    </LikesContext.Provider>
  );
}; 
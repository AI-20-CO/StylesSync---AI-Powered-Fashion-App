import React, { createContext, useContext, useState, useCallback } from 'react';

interface ItemsContextType {
  itemsCount: number;
  refreshItemsCount: () => void;
  incrementItemsCount: () => void;
  decrementItemsCount: () => void;
  setItemsCount: (count: number) => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const useItems = () => {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
};

interface ItemsProviderProps {
  children: React.ReactNode;
}

export const ItemsProvider: React.FC<ItemsProviderProps> = ({ children }) => {
  const [itemsCount, setItemsCountState] = useState(0);

  const refreshItemsCount = useCallback(() => {
    // This will trigger a re-render and cause components to fetch fresh data
    setItemsCountState(prev => prev);
  }, []);

  const incrementItemsCount = useCallback(() => {
    setItemsCountState(prev => prev + 1);
  }, []);

  const decrementItemsCount = useCallback(() => {
    setItemsCountState(prev => Math.max(0, prev - 1));
  }, []);

  const setItemsCount = useCallback((count: number) => {
    setItemsCountState(count);
  }, []);

  const value = {
    itemsCount,
    refreshItemsCount,
    incrementItemsCount,
    decrementItemsCount,
    setItemsCount,
  };

  return (
    <ItemsContext.Provider value={value}>
      {children}
    </ItemsContext.Provider>
  );
}; 
import React, { createContext, useContext, useState } from 'react';

export interface StylePreferences {
  gender: string;
  age: string;
  height: string;
  length: string;
  waist: string;
  bust: string;
  size: string;
  style: string;
  occasion: string;
  fit: string;
}

interface StylePreferencesContextType {
  preferences: StylePreferences | null;
  setPreferences: (preferences: StylePreferences) => void;
  clearPreferences: () => void;
  hasPreferences: boolean;
}

const StylePreferencesContext = createContext<StylePreferencesContextType | undefined>(undefined);

export const StylePreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferencesState] = useState<StylePreferences | null>(null);

  const setPreferences = (newPreferences: StylePreferences) => {
    setPreferencesState(newPreferences);
    console.log('Set style preferences:', newPreferences);
  };

  const clearPreferences = () => {
    setPreferencesState(null);
    console.log('Cleared style preferences');
  };

  const hasPreferences = preferences !== null;

  return (
    <StylePreferencesContext.Provider value={{
      preferences,
      setPreferences,
      clearPreferences,
      hasPreferences,
    }}>
      {children}
    </StylePreferencesContext.Provider>
  );
};

export const useStylePreferences = (): StylePreferencesContextType => {
  const context = useContext(StylePreferencesContext);
  if (context === undefined) {
    throw new Error('useStylePreferences must be used within a StylePreferencesProvider');
  }
  return context;
}; 
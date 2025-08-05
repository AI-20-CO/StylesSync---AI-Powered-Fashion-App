import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AIAnalysisContextType {
  isAIAnalysisActive: boolean;
  setAIAnalysisActive: (active: boolean) => void;
}

const AIAnalysisContext = createContext<AIAnalysisContextType | undefined>(undefined);

export const useAIAnalysis = () => {
  const context = useContext(AIAnalysisContext);
  if (context === undefined) {
    throw new Error('useAIAnalysis must be used within an AIAnalysisProvider');
  }
  return context;
};

interface AIAnalysisProviderProps {
  children: ReactNode;
}

export const AIAnalysisProvider: React.FC<AIAnalysisProviderProps> = ({ children }) => {
  const [isAIAnalysisActive, setIsAIAnalysisActive] = useState(false);

  const setAIAnalysisActive = (active: boolean) => {
    setIsAIAnalysisActive(active);
  };

  return (
    <AIAnalysisContext.Provider value={{ isAIAnalysisActive, setAIAnalysisActive }}>
      {children}
    </AIAnalysisContext.Provider>
  );
}; 
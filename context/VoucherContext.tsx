import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  discountAmount?: number;
  discountPercentage?: number;
  expiryDate: string;
  isUsed: boolean;
  color: [string, string];
}

interface VoucherContextType {
  activeVoucher: Voucher | null;
  setActiveVoucher: (voucher: Voucher | null) => void;
  applyVoucher: (voucher: Voucher) => void;
  clearVoucher: () => void;
  calculateDiscount: (originalAmount: number) => { finalAmount: number; discountAmount: number };
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

interface VoucherProviderProps {
  children: ReactNode;
}

export const VoucherProvider: React.FC<VoucherProviderProps> = ({ children }) => {
  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(null);

  const applyVoucher = (voucher: Voucher) => {
    setActiveVoucher(voucher);
  };

  const clearVoucher = () => {
    setActiveVoucher(null);
  };

  const calculateDiscount = (originalAmount: number) => {
    if (!activeVoucher) {
      return { finalAmount: originalAmount, discountAmount: 0 };
    }

    let discountAmount = 0;
    
    // Handle different voucher types
    if (activeVoucher.code.toLowerCase() === 'first') {
      // Testing mode voucher - set total to 0.01
      return { finalAmount: 0.01, discountAmount: originalAmount - 0.01 };
    } else if (activeVoucher.discountPercentage) {
      // Percentage discount
      discountAmount = (originalAmount * activeVoucher.discountPercentage) / 100;
    } else if (activeVoucher.discountAmount) {
      // Fixed amount discount
      discountAmount = activeVoucher.discountAmount;
    }

    const finalAmount = Math.max(0.01, originalAmount - discountAmount); // Minimum 0.01
    return { finalAmount, discountAmount };
  };

  const value: VoucherContextType = {
    activeVoucher,
    setActiveVoucher,
    applyVoucher,
    clearVoucher,
    calculateDiscount,
  };

  return (
    <VoucherContext.Provider value={value}>
      {children}
    </VoucherContext.Provider>
  );
};

export const useVoucher = (): VoucherContextType => {
  const context = useContext(VoucherContext);
  if (context === undefined) {
    throw new Error('useVoucher must be used within a VoucherProvider');
  }
  return context;
}; 
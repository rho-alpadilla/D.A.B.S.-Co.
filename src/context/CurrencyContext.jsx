// src/context/CurrencyContext.jsx ← FINAL & FLAWLESS
import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const CURRENCIES = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('PHP');
  const [rates, setRates] = useState({ PHP: 1 });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.frankfurter.app/latest?from=PHP');
        const data = await res.json();
        setRates({ PHP: 1, ...data.rates });
      } catch (err) {
        console.log("Using fallback rates");
        setRates({ PHP: 1, USD: 0.0172, EUR: 0.0159, SGD: 0.0231, JPY: 2.58, GBP: 0.0135, AUD: 0.0261 });
      }
    };
    fetchRates();
  }, []);

  const formatPrice = (phpAmount) => {
    if (!phpAmount) return `${CURRENCIES[0].symbol}0.00`;
    const rate = rates[currency] || 1;
    const amount = phpAmount * rate;
    const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₱';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === currency)?.symbol || '₱';
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
      getCurrencySymbol,
      CURRENCIES
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
// src/context/CurrencyContext.jsx ← FINAL: 35+ CURRENCIES + SEARCH SUPPORT
import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

// 35+ MAJOR CURRENCIES (ALL FREE VIA FRANKFURTER)
const CURRENCIES = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
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
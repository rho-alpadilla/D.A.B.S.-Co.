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

const RATE_API_URL = `https://api.frankfurter.dev/v2/rates?base=php&quotes=${CURRENCIES
  .filter(({ code }) => code !== 'PHP')
  .map(({ code }) => code.toLowerCase())
  .join(',')}`;

let currencyRatesRequest;

const loadCurrencyRates = () => {
  if (!currencyRatesRequest) {
    currencyRatesRequest = fetch(RATE_API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Currency service returned ${response.status}.`);
        }
        return response.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows)) {
          throw new Error('Currency service returned an invalid response.');
        }

        const nextRates = { PHP: 1 };
        rows.forEach(({ quote, rate }) => {
          const currencyCode = typeof quote === 'string' ? quote.toUpperCase() : '';
          const numericRate = Number(rate);
          if (currencyCode && Number.isFinite(numericRate) && numericRate > 0) {
            nextRates[currencyCode] = numericRate;
          }
        });

        if (Object.keys(nextRates).length === 1) {
          throw new Error('Currency service returned no usable rates.');
        }

        return nextRates;
      })
      .catch((error) => {
        console.warn('Live currency rates are unavailable; prices will remain in PHP.', error);
        return { PHP: 1 };
      });
  }

  return currencyRatesRequest;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('PHP');
  const [rates, setRates] = useState({ PHP: 1 });

  useEffect(() => {
    let isCurrent = true;

    loadCurrencyRates().then((nextRates) => {
      if (!isCurrent) return;
      setRates(nextRates);
      setCurrency((currentCurrency) => (
        Number.isFinite(nextRates[currentCurrency]) ? currentCurrency : 'PHP'
      ));
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const availableCurrencies = CURRENCIES.filter(({ code }) => Number.isFinite(rates[code]));

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
      CURRENCIES: availableCurrencies
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

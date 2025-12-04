// src/main.jsx ← ADD CURRENCY PROVIDER HERE
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from '@/lib/firebase';
import { CartProvider } from '@/context/CartContext';
import { CurrencyProvider } from '@/context/CurrencyContext'; // ← ADD THIS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <CurrencyProvider>  {/* ← WRAP HERE */}
          <App />
        </CurrencyProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
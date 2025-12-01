// src/pages/CartPage.jsx ← FINAL: PHP MAIN CURRENCY (NO MORE BUG!)
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';

// PHP IS MAIN CURRENCY — USD IS CALCULATED FROM PHP
const PHP_TO_USD = 1 / 58;
const formatPrice = (phpPrice) => {
  if (!phpPrice) return "₱0 ($0.00)";
  const usd = (phpPrice * PHP_TO_USD).toFixed(2);  // ← CENTS!
  return `₱${phpPrice.toLocaleString()} ($${usd})`;
};

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    try {
      await addDoc(collection(db, "orders"), {
        items: cartItems,
        total: cartTotal,
        buyerEmail: user?.email || "guest@dabs.co",
        buyerName: user?.displayName || "Guest Buyer",
        status: "pending",
        createdAt: new Date(),
      });

      clearCart();

      toast({
        title: "Order Placed Successfully!",
        description: "Thank you! The admin has been notified and will contact you soon.",
      });
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      console.error("Checkout error:", error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Shopping Cart - D.A.B.S. Co.</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12 min-h-[60vh]">
        <h1 className="text-3xl font-bold text-[#118C8C] mb-8">Your Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300"
          >
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-6">Your cart is empty.</p>
            <Link to="/gallery">
              <Button className="bg-[#118C8C] hover:bg-[#0d7070]">Start Shopping</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <motion.div 
                  layout
                  key={item.id} 
                  className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <ShoppingBag size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`qty-${item.id}`} className="text-sm text-gray-600">Qty:</label>
                        <input 
                          id={`qty-${item.id}`}
                          type="number" 
                          min="1" 
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      {/* PHP MAIN + USD WITH CENTS — FIXED FOREVER */}
                      <p className="font-bold text-[#118C8C]">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white p-6 rounded-xl shadow-md h-fit border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (Est.)</span>
                  <span>{formatPrice(cartTotal * 0.08)}</span>
                </div>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                <span>Total</span>
                <span>{formatPrice(cartTotal * 1.08)}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-3 h-auto">
                Proceed to Checkout
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <p className="text-xs text-center text-gray-400 mt-4">
                Secure checkout powered by Stripe (Placeholder)
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPage;
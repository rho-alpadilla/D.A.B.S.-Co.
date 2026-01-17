// src/pages/CartPage.jsx ← FINAL: BANK TRANSFER + GCASH QR AFTER CHECKOUT
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trash2, ArrowRight, ShoppingBag, Copy, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Admin's payment details (hardcoded for now — you can move to Firestore later)
  const paymentDetails = {
    bankName: "BDO Unibank",
    accountName: "DABS Co. (John Doe)",
    accountNumber: "0012-3456-7890-1234",
    gcashName: "John Doe (DABS Co.)",
    gcashNumber: "0917-123-4567",
    gcashQR: "https://your-gcash-qr-link.com/qr.png" // ← REPLACE WITH YOUR REAL QR IMAGE URL
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    try {
      const docRef = await addDoc(collection(db, "orders"), {
        items: cartItems,
        total: cartTotal,
        buyerEmail: user?.email || "guest@dabs.co",
        buyerName: user?.displayName || "Guest Buyer",
        status: "pending",
        createdAt: new Date(),
      });

      clearCart();
      setOrderId(docRef.id);
      setOrderPlaced(true);

      toast({
        title: "Order Placed!",
        description: "Thank you! Please complete payment using the details below.",
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

  const copyAccount = () => {
    navigator.clipboard.writeText(paymentDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Account number copied." });
  };

  return (
    <>
      <Helmet>
        <title>Shopping Cart - D.A.B.S. Co.</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12 min-h-[60vh]">
        <h1 className="text-3xl font-bold text-[#118C8C] mb-8">Your Shopping Cart</h1>

        {cartItems.length === 0 && !orderPlaced ? (
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
        ) : orderPlaced ? (
          // PAYMENT INSTRUCTIONS SCREEN
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-3xl mx-auto border border-[#118C8C]/20"
          >
            <div className="text-center mb-10">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-3xl font-bold text-[#118C8C] mb-4">Thank You!</h2>
              <p className="text-lg text-gray-700 mb-2">
                Your order has been placed successfully.
              </p>
              <p className="text-sm text-gray-500">
                Order ID: <span className="font-mono font-bold">{orderId?.slice(0,8)}</span>
              </p>
            </div>

            <div className="space-y-10">
              {/* BANK TRANSFER */}
              <div className="border-l-4 border-[#118C8C] pl-6">
                <h3 className="text-2xl font-bold text-[#118C8C] mb-4">Bank Transfer</h3>
                <div className="space-y-4 text-gray-700">
                  <p>Send the total amount to the following account:</p>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <p className="font-semibold">Bank: <span className="font-bold">{paymentDetails.bankName}</span></p>
                    <p className="font-semibold mt-2">
                      Account Name: <span className="font-bold">{paymentDetails.accountName}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="font-semibold">Account Number: 
                        <span className="font-mono font-bold ml-2">{paymentDetails.accountNumber}</span>
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyAccount}
                        className="flex items-center gap-2"
                      >
                        {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Please include your Order ID <strong>{orderId?.slice(0,8)}</strong> in the payment reference.
                  </p>
                </div>
              </div>

              {/* GCASH QR */}
              <div className="border-l-4 border-[#118C8C] pl-6">
                <h3 className="text-2xl font-bold text-[#118C8C] mb-4">GCash / E-Wallet</h3>
                <div className="space-y-4 text-gray-700">
                  <p>Scan the QR code below to pay via GCash (or Maya):</p>
                  <div className="bg-gray-50 p-6 rounded-xl text-center">
                    <img 
                      src={paymentDetails.gcashQR} 
                      alt="GCash QR Code" 
                      className="mx-auto w-64 h-64 object-contain rounded-lg shadow-md"
                    />
                    <p className="mt-4 font-semibold">
                      GCash Name: <span className="font-bold">{paymentDetails.gcashName}</span><br />
                      Number: <span className="font-mono">{paymentDetails.gcashNumber}</span>
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    After payment, please send proof to admin via message or email.
                  </p>
                </div>
              </div>

              <div className="text-center mt-10">
                <p className="text-lg font-medium text-gray-800 mb-4">
                  Admin will confirm your order within 24 hours.
                </p>
                <Link to="/gallery">
                  <Button className="bg-[#118C8C] hover:bg-[#0d7070] px-10">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          // NORMAL CART VIEW
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
                Secure checkout via Bank Transfer / GCash
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPage;
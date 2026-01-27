// src/pages/CheckoutPage.jsx ← FINAL: EDITABLE CHECKOUT (ADD/REMOVE/QUANTITY/CHECKBOX) + PLACE ORDER
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Trash2, Plus, Minus, ShoppingBag, Square, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';

const CheckoutPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Track checked items (default: all checked)
  const [checkedIds, setCheckedIds] = useState(() => cartItems.map(item => item.id));

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Hardcoded payment details (move to Firestore later)
  const paymentDetails = {
    bankName: "BDO Unibank",
    accountName: "DABS Co. (John Doe)",
    accountNumber: "0012-3456-7890-1234",
    gcashName: "John Doe (DABS Co.)",
    gcashNumber: "0917-123-4567",
    gcashQR: "https://your-gcash-qr-link.com/qr.png" // ← REPLACE WITH REAL QR URL
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const copyAccount = () => {
    navigator.clipboard.writeText(paymentDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Account number copied." });
  };

  // Toggle checkbox
  const toggleChecked = (id) => {
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Select All / Deselect All
  const toggleAll = () => {
    if (checkedIds.length === cartItems.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(cartItems.map(item => item.id));
    }
  };

  // Subtotal for checked items
  const selectedTotal = useMemo(() => {
    return cartItems
      .filter(item => checkedIds.includes(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems, checkedIds]);

  const allChecked = checkedIds.length === cartItems.length && cartItems.length > 0;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (checkedIds.length === 0) return;

    setLoading(true);
    try {
      const orderedItems = cartItems.filter(item => checkedIds.includes(item.id));

      const docRef = await addDoc(collection(db, "orders"), {
        items: orderedItems,
        total: selectedTotal,
        grandTotal: selectedTotal * 1.08, // example 8% tax
        shippingInfo: formData,
        buyerEmail: user?.email || formData.email || "guest@dabs.co",
        buyerName: user?.displayName || `${formData.firstName} ${formData.lastName}` || "Guest Buyer",
        status: "pending",
        createdAt: serverTimestamp(),
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
        title: "Order Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      console.error("Order error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-12 max-w-4xl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-[#118C8C]/20">
          <div className="text-center mb-10">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-3xl font-bold text-[#118C8C] mb-4">Thank You!</h2>
            <p className="text-lg text-gray-700 mb-2">Your order has been placed successfully.</p>
            <p className="text-sm text-gray-500">
              Order ID: <span className="font-mono font-bold">{orderId?.slice(0,8)}</span>
            </p>
          </div>

          <div className="space-y-10">
            {/* Bank Transfer */}
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

            {/* GCash QR */}
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
              <Link to="/buyer-dashboard">
                <Button className="bg-[#118C8C] hover:bg-[#0d7070] px-10">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Helmet><title>Checkout - D.A.B.S. Co.</title></Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#118C8C] mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editable Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Order Summary</h2>
                <div className="flex items-center gap-2">
                  <button onClick={toggleAll}>
                    {allChecked ? (
                      <CheckSquare size={20} className="text-[#118C8C]" />
                    ) : (
                      <Square size={20} className="text-gray-400" />
                    )}
                  </button>
                  <span className="text-sm font-medium">
                    {allChecked ? 'Deselect All' : 'Select All'}
                  </span>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <p className="text-gray-500">No items in cart.</p>
              ) : (
                <div className="space-y-6">
                  {cartItems.map(item => {
                    const isChecked = checkedIds.includes(item.id);
                    return (
                      <div key={item.id} className="flex gap-4 border-b pb-4 items-start">
                        {/* Checkbox */}
                        <button onClick={() => toggleChecked(item.id)}>
                          {isChecked ? (
                            <CheckSquare size={20} className="text-[#118C8C] mt-1" />
                          ) : (
                            <Square size={20} className="text-gray-400 mt-1" />
                          )}
                        </button>

                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">Price: {formatPrice(item.price)}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-4 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>

                          {/* Price */}
                          <p className="font-bold text-[#118C8C] min-w-[80px] text-right">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (selected)</span>
                  <span>{formatPrice(selectedTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (Est. 8%)</span>
                  <span>{formatPrice(selectedTotal * 0.08)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                  <span>Grand Total</span>
                  <span>{formatPrice(selectedTotal * 1.08)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping + Payment Form */}
          <div className="space-y-6">
            <form onSubmit={handlePlaceOrder} className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none md:col-span-2"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none md:col-span-2"
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none"
                />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="Zip Code"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none"
                />
              </div>

              <h2 className="text-2xl font-bold mt-8 mb-6">Payment Information</h2>
              <input
                type="text"
                name="cardNumber"
                placeholder="Card Number"
                value={formData.cardNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none mb-6"
              />

              <Button 
                type="submit" 
                className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-4 text-lg"
                disabled={loading || checkedIds.length === 0 || cartItems.length === 0}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </Button>
            </form>

            <p className="text-sm text-gray-500 text-center">
              Secure checkout via Bank Transfer / GCash. Admin will confirm within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
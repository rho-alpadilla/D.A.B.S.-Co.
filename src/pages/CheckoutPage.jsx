// src/pages/CheckoutPage.jsx ← FIXED: ADDRESS NOW IDENTICAL TO PROFILE (real-time sync + same parsing/save)
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Trash2, Plus, Minus, ShoppingBag, Square, CheckSquare, Edit, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// ALL COUNTRIES (copied from ProfilePage)
const ALL_COUNTRIES = [
  { name: "Philippines", code: "PH", flag: "https://flagcdn.com/ph.svg", callingCode: "+63" },
  { name: "United States", code: "US", flag: "https://flagcdn.com/us.svg", callingCode: "+1" },
  { name: "United Kingdom", code: "GB", flag: "https://flagcdn.com/gb.svg", callingCode: "+44" },
  { name: "Canada", code: "CA", flag: "https://flagcdn.com/ca.svg", callingCode: "+1" },
  { name: "Australia", code: "AU", flag: "https://flagcdn.com/au.svg", callingCode: "+61" },
  { name: "Germany", code: "DE", flag: "https://flagcdn.com/de.svg", callingCode: "+49" },
  { name: "France", code: "FR", flag: "https://flagcdn.com/fr.svg", callingCode: "+33" },
  { name: "Japan", code: "JP", flag: "https://flagcdn.com/jp.svg", callingCode: "+81" },
  { name: "Singapore", code: "SG", flag: "https://flagcdn.com/sg.svg", callingCode: "+65" },
  { name: "South Korea", code: "KR", flag: "https://flagcdn.com/kr.svg", callingCode: "+82" },
  { name: "India", code: "IN", flag: "https://flagcdn.com/in.svg", callingCode: "+91" },
  { name: "Malaysia", code: "MY", flag: "https://flagcdn.com/my.svg", callingCode: "+60" },
  { name: "Thailand", code: "TH", flag: "https://flagcdn.com/th.svg", callingCode: "+66" },
  { name: "Indonesia", code: "ID", flag: "https://flagcdn.com/id.svg", callingCode: "+62" },
  { name: "Vietnam", code: "VN", flag: "https://flagcdn.com/vn.svg", callingCode: "+84" },
];

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

const CheckoutPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [checkedIds, setCheckedIds] = useState(() => cartItems.map(item => item.id));
  const [deliveryMethod, setDeliveryMethod] = useState('courier');
  const [paymentMethod, setPaymentMethod] = useState('bank');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    countryObj: ALL_COUNTRIES[0],
    email: user?.email || '',
  });

  const [editAddress, setEditAddress] = useState(false);
  const [isAddressCountryOpen, setIsAddressCountryOpen] = useState(false);
  const [addressCountrySearch, setAddressCountrySearch] = useState("");

  const countries = ALL_COUNTRIES;
  const filteredAddressCountries = countries.filter(country =>
    country.name.toLowerCase().includes(addressCountrySearch.toLowerCase())
  );

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);

  const bankDetails = {
    bankName: "BDO Unibank",
    accountName: "DABS Co. (D-A-B-S Company)",
    accountNumber: "0012-3456-7890-1234",
  };

  // Fetch & pre-fill from profile — now using onSnapshot like ProfilePage
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const addr = data.addresses?.[0] || {};

        // Exact same name parsing as ProfilePage
        const fullName = data.fullName || data.displayName || user.email.split('@')[0];
        const [firstName = '', ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        // Exact same phone parsing as ProfilePage
        let phoneNumber = '';
        let phoneCountry = ALL_COUNTRIES[0];
        if (data.phone) {
          const match = data.phone.match(/^(\+\d+)\s*(.*)$/);
          if (match) {
            const code = match[1];
            phoneCountry = countries.find(c => c.callingCode === code) || ALL_COUNTRIES[0];
            phoneNumber = match[2];
          } else {
            phoneNumber = data.phone;
          }
        }

        // Exact same country matching as ProfilePage
        let countryObj = ALL_COUNTRIES[0];
        if (addr.country) {
          countryObj = countries.find(c => c.name === addr.country) || ALL_COUNTRIES[0];
        }

        setFormData({
          firstName,
          lastName,
          phone: phoneNumber,
          street: addr.street || '',
          city: addr.city || '',
          stateProvince: addr.stateProvince || '',
          postalCode: addr.postalCode || '',
          countryObj,
          email: user.email || '',
        });
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectCountry = (country) => {
    setFormData(prev => ({ ...prev, countryObj: country }));
    setIsAddressCountryOpen(false);
    setAddressCountrySearch("");
  };

  // Save is now identical to ProfilePage's handleSave
  const saveAddressToProfile = async () => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone ? `${formData.countryObj.callingCode} ${formData.phone}` : '',
        addresses: [{
          street: formData.street,
          city: formData.city,
          stateProvince: formData.stateProvince,
          postalCode: formData.postalCode,
          country: formData.countryObj.name,
          isDefault: true
        }]
      });
      toast({ title: "Profile Updated", description: "Address changes saved." });
    } catch (err) {
      toast({ title: "Save Failed", description: "Could not update profile.", variant: "destructive" });
      console.error("Profile update error:", err);
    }
  };

  const copyAccount = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Account number copied." });
  };

  const toggleChecked = (id) => {
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (checkedIds.length === cartItems.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(cartItems.map(item => item.id));
    }
  };

  const selectedTotal = useMemo(() => {
    const total = cartItems
      .filter(item => checkedIds.includes(item.id))
      .reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    return total || 0;
  }, [cartItems, checkedIds]);

  const grandTotal = selectedTotal; // Tax removed

  const createOrderInFirestore = async (status = "pending") => {
    await saveAddressToProfile();

    setLoading(true);
    try {
      const orderedItems = cartItems.filter(item => checkedIds.includes(item.id));

      const docRef = await addDoc(collection(db, "orders"), {
        items: orderedItems,
        total: selectedTotal,
        grandTotal,
        deliveryMethod,
        paymentMethod,
        shippingInfo: {
          ...formData,
          country: formData.countryObj.name
        },
        buyerEmail: user?.email || formData.email || "guest@dabs.co",
        buyerName: `${formData.firstName} ${formData.lastName}`.trim() || "Guest Buyer",
        status,
        createdAt: serverTimestamp(),
      });

      clearCart();
      setOrderId(docRef.id);
      setOrderPlaced(true);

      toast({
        title: status === "paid" ? "Payment Successful" : "Order Placed!",
        description: status === "paid"
          ? "Your PayPal payment was processed. Order confirmed!"
          : "Order created. Please complete payment.",
      });

      return docRef.id;
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      console.error("Order error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (checkedIds.length === 0) {
      toast({ title: "No Items Selected", description: "Please select at least one item.", variant: "destructive" });
      return;
    }

    if (grandTotal <= 0) {
      toast({ title: "Invalid Total", description: "Order total must be greater than 0.", variant: "destructive" });
      return;
    }

    if (paymentMethod === 'bank') {
      await createOrderInFirestore("pending");
    } else {
      setShowPayPal(true);
      toast({
        title: "Ready to Pay",
        description: "Please complete payment with PayPal below.",
      });
    }
  };

  const handlePaypalApproval = async (data, actions) => {
    try {
      const order = await actions.order.capture();
      console.log("PayPal capture success:", order);

      const newOrderId = await createOrderInFirestore("paid");

      if (newOrderId) {
        await updateDoc(doc(db, "orders", newOrderId), {
          paymentId: order.id,
          paidAt: serverTimestamp(),
        });
      }

      setShowPayPal(false);
    } catch (err) {
      console.error("Capture failed:", err);
      toast({ title: "Payment Capture Failed", description: "Payment approved but could not be captured.", variant: "destructive" });
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
            <div className="border-l-4 border-[#118C8C] pl-6">
              <h3 className="text-2xl font-bold text-[#118C8C] mb-4">Next Steps</h3>
              <p className="text-gray-700 mb-4">
                {paymentMethod === 'bank'
                  ? "Please transfer the total amount to the BDO account shown below. Include your Order ID in the reference."
                  : "Your PayPal payment has been processed. Admin will confirm shortly."}
              </p>
            </div>

            {paymentMethod === 'bank' && (
              <div className="p-6 bg-gray-50 rounded-lg">
                <p className="font-semibold mb-2">Bank Details:</p>
                <p>Bank: <strong>{bankDetails.bankName}</strong></p>
                <p>Account Name: <strong>{bankDetails.accountName}</strong></p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="font-semibold">Account Number:</p>
                  <span className="font-mono">{bankDetails.accountNumber}</span>
                  <Button variant="outline" size="sm" onClick={copyAccount} className="flex items-center gap-2">
                    {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Include your Order ID <strong>{orderId?.slice(0,8)}</strong> in the reference.
                </p>
              </div>
            )}

            <div className="text-center mt-10">
              <p className="text-lg font-medium text-gray-800 mb-4">
                Admin will confirm your order within 24 hours.
              </p>
              <Button 
                onClick={() => navigate('/buyer-dashboard')}
                className="bg-[#118C8C] hover:bg-[#0d7070] px-10"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Helmet><title>Checkout - D.A.B.S. Co.</title></Helmet>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-3xl font-bold text-[#118C8C] mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT + CENTER */}
          <div className="lg:col-span-2 space-y-8">
            {/* Address Block */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Shipping Address</h2>
                <button 
                  onClick={() => {
                    if (editAddress) saveAddressToProfile();
                    setEditAddress(!editAddress);
                  }}
                  className="text-[#118C8C] hover:underline flex items-center gap-1"
                >
                  <Edit size={16} /> {editAddress ? 'Done' : 'Edit'}
                </button>
              </div>

              {editAddress ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none" />
                  <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none" />
                  <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none md:col-span-2" />
                  <input type="text" name="street" placeholder="Street Address" value={formData.street} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none md:col-span-2" />
                  <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none" />
                  <input type="text" name="stateProvince" placeholder="State / Province" value={formData.stateProvince} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none" />
                  <input type="text" name="postalCode" placeholder="Postal / ZIP Code" value={formData.postalCode} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-[#118C8C] focus:outline-none" />

                  <div className="md:col-span-2 relative">
                    <label className="text-lg font-medium text-gray-700 mb-2 block">Country</label>
                    <button
                      type="button"
                      onClick={() => setIsAddressCountryOpen(!isAddressCountryOpen)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img src={formData.countryObj.flag} alt="" className="w-8 h-6 rounded" />
                        <span className="font-medium">{formData.countryObj.name}</span>
                      </div>
                      <ChevronDown size={20} />
                    </button>

                    {isAddressCountryOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b">
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={addressCountrySearch}
                            onChange={(e) => setAddressCountrySearch(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg"
                            autoFocus
                          />
                        </div>
                        {filteredAddressCountries.map(country => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => selectCountry(country)}
                            className="w-full text-left px-5 py-4 hover:bg-gray-50 flex items-center gap-4"
                          >
                            <img src={country.flag} alt="" className="w-10 h-7 rounded" />
                            <span>{country.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">
                    {formData.firstName} {formData.lastName} • {formData.phone || 'Not provided'}
                  </p>
                  <p className="text-gray-700">
                    {formData.street || 'No street'}, {formData.city || ''}, {formData.stateProvince || ''} {formData.postalCode || ''}
                  </p>
                  <div className="flex items-center gap-3">
                    <img src={formData.countryObj.flag} alt="" className="w-10 h-7 rounded shadow" />
                    <p className="text-gray-700 font-medium">{formData.countryObj.name}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm mt-2">
                    <span className="font-bold">HOME</span>
                  </div>

                  {(!formData.firstName || formData.firstName.length < 2) && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3 text-sm text-orange-800">
                      <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                      <p>Please update the recipient's name to the correct format to expedite delivery.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Delivery Option</h3>
                <div className="space-y-4">
                  <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${deliveryMethod === 'courier' ? 'border-[#118C8C] bg-[#118C8C]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="deliveryMethod" value="courier" checked={deliveryMethod === 'courier'} onChange={() => setDeliveryMethod('courier')} className="w-5 h-5 text-[#118C8C]" />
                    <div>
                      <p className="font-medium">Courier Shipping (Seller Drop-Off)</p>
                      <p className="text-sm text-gray-600">Seller packs and drops off at courier. Tracking provided.</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-[#118C8C] bg-[#118C8C]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} className="w-5 h-5 text-[#118C8C]" />
                    <div>
                      <p className="font-medium">Local Pickup</p>
                      <p className="text-sm text-gray-600">Pick up from our local point in Quezon City. Schedule via chat.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              {cartItems.length === 0 ? (
                <p className="text-gray-500">No items in cart.</p>
              ) : (
                <div className="space-y-6">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-4 border-b pb-4">
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
                        <div className="flex items-center border rounded">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                            <Minus size={16} />
                          </button>
                          <span className="px-4 font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100">
                            <Plus size={16} />
                          </button>
                        </div>

                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>

                        <p className="font-bold text-[#118C8C] min-w-[80px] text-right">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal ({checkedIds.length} Items)</span>
                  <span>{formatPrice(selectedTotal)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6">Select Payment Method</h2>

              <div className="space-y-4">
                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-[#118C8C] bg-[#118C8C]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} className="w-5 h-5 text-[#118C8C]" />
                  <div className="flex-grow">
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-sm text-gray-600">Transfer to our BDO account</p>
                  </div>
                  {paymentMethod === 'bank' && <CheckCircle size={20} className="text-[#118C8C]" />}
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'border-[#118C8C] bg-[#118C8C]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value="paypal" checked={paymentMethod === 'paypal'} onChange={() => setPaymentMethod('paypal')} className="w-5 h-5 text-[#118C8C]" />
                  <div className="flex-grow">
                    <p className="font-medium">PayPal</p>
                    <p className="text-sm text-gray-600">Pay securely via PayPal</p>
                  </div>
                  {paymentMethod === 'paypal' && <CheckCircle size={20} className="text-[#118C8C]" />}
                </label>
              </div>

              {paymentMethod === 'paypal' && showPayPal && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <p className="font-semibold mb-4 text-center text-lg">Complete Payment with PayPal</p>
                  <PayPalScriptProvider options={{
                    "client-id": PAYPAL_CLIENT_ID,
                    currency: "PHP",
                    intent: "capture",
                    environment: "sandbox"
                  }}>
                    <PayPalButtons
                      style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
                      createOrder={(data, actions) => {
                        if (grandTotal <= 0) {
                          toast({ title: "Invalid Amount", description: "Total must be greater than 0.", variant: "destructive" });
                          return Promise.reject(new Error("Invalid amount"));
                        }
                        return actions.order.create({
                          purchase_units: [{
                            amount: {
                              value: grandTotal.toFixed(2),
                              currency_code: "PHP"
                            },
                            description: `Order from D.A.B.S. Co.`
                          }]
                        });
                      }}
                      onApprove={handlePaypalApproval}
                      onError={(err) => {
                        console.error("PayPal error:", err);
                        toast({ title: "PayPal Error", description: "Something went wrong. Try Bank Transfer instead.", variant: "destructive" });
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6">Order Detail</h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal ({checkedIds.length} Items)</span>
                  <span>{formatPrice(selectedTotal)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {!orderPlaced && (
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={loading || checkedIds.length === 0 || grandTotal <= 0 || !deliveryMethod || !paymentMethod}
                  className="w-full mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 text-lg"
                >
                  {loading ? "Placing Order..." : "PLACE ORDER NOW"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
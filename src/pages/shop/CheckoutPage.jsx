// src/pages/CheckoutPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Copy,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Edit,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  onSnapshot,
  updateDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';
import { createNotification, createNotificationsForUsers } from '@/lib/notifications';
import PurchasePageHero from '@/components/shop/PurchasePageHero';
import { getAvailableStock } from '@/lib/stock';
// ALL COUNTRIES (copied from ProfilePage)
const ALL_COUNTRIES = [
  { name: 'Philippines', code: 'PH', flag: 'https://flagcdn.com/ph.svg', callingCode: '+63' },
  { name: 'United States', code: 'US', flag: 'https://flagcdn.com/us.svg', callingCode: '+1' },
  { name: 'United Kingdom', code: 'GB', flag: 'https://flagcdn.com/gb.svg', callingCode: '+44' },
  { name: 'Canada', code: 'CA', flag: 'https://flagcdn.com/ca.svg', callingCode: '+1' },
  { name: 'Australia', code: 'AU', flag: 'https://flagcdn.com/au.svg', callingCode: '+61' },
  { name: 'Germany', code: 'DE', flag: 'https://flagcdn.com/de.svg', callingCode: '+49' },
  { name: 'France', code: 'FR', flag: 'https://flagcdn.com/fr.svg', callingCode: '+33' },
  { name: 'Japan', code: 'JP', flag: 'https://flagcdn.com/jp.svg', callingCode: '+81' },
  { name: 'Singapore', code: 'SG', flag: 'https://flagcdn.com/sg.svg', callingCode: '+65' },
  { name: 'South Korea', code: 'KR', flag: 'https://flagcdn.com/kr.svg', callingCode: '+82' },
  { name: 'India', code: 'IN', flag: 'https://flagcdn.com/in.svg', callingCode: '+91' },
  { name: 'Malaysia', code: 'MY', flag: 'https://flagcdn.com/my.svg', callingCode: '+60' },
  { name: 'Thailand', code: 'TH', flag: 'https://flagcdn.com/th.svg', callingCode: '+66' },
  { name: 'Indonesia', code: 'ID', flag: 'https://flagcdn.com/id.svg', callingCode: '+62' },
  { name: 'Vietnam', code: 'VN', flag: 'https://flagcdn.com/vn.svg', callingCode: '+84' },
];

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

const CheckoutPage = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    validateCartItems,
  } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [checkedIds, setCheckedIds] = useState(() => cartItems.map((item) => item.id));
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
  const [addressCountrySearch, setAddressCountrySearch] = useState('');

  const countries = ALL_COUNTRIES;
  const filteredAddressCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(addressCountrySearch.toLowerCase())
  );

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);

  const bankDetails = {
    bankName: 'BDO Unibank',
    accountName: 'DABS Co. (D-A-B-S Company)',
    accountNumber: '0012-3456-7890-1234',
  };

  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const addr = data.addresses?.[0] || {};

        const fullName = data.fullName || data.displayName || user.email.split('@')[0];
        const [firstName = '', ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        let phoneNumber = '';
        let phoneCountry = ALL_COUNTRIES[0];
        if (data.phone) {
          const match = data.phone.match(/^(\+\d+)\s*(.*)$/);
          if (match) {
            const code = match[1];
            phoneCountry = countries.find((c) => c.callingCode === code) || ALL_COUNTRIES[0];
            phoneNumber = match[2];
          } else {
            phoneNumber = data.phone;
          }
        }

        let countryObj = ALL_COUNTRIES[0];
        if (addr.country) {
          countryObj = countries.find((c) => c.name === addr.country) || ALL_COUNTRIES[0];
        }

        setFormData({
          firstName,
          lastName,
          phone: phoneNumber,
          street: addr.street || '',
          city: addr.city || '',
          stateProvince: addr.stateProvince || '',
          postalCode: addr.postalCode || '',
          countryObj: phoneCountry && addr.country ? countryObj : countryObj,
          email: user.email || '',
        });
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectCountry = (country) => {
    setFormData((prev) => ({ ...prev, countryObj: country }));
    setIsAddressCountryOpen(false);
    setAddressCountrySearch('');
  };

  const saveAddressToProfile = async () => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone ? `${formData.countryObj.callingCode} ${formData.phone}` : '',
        addresses: [
          {
            street: formData.street,
            city: formData.city,
            stateProvince: formData.stateProvince,
            postalCode: formData.postalCode,
            country: formData.countryObj.name,
            isDefault: true,
          },
        ],
      });
      toast({ title: 'Profile Updated', description: 'Address changes saved.' });
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: 'Could not update profile.',
        variant: 'destructive',
      });
      console.error('Profile update error:', err);
    }
  };

  const copyAccount = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Account number copied.' });
  };

  const selectedTotal = useMemo(() => {
    const total = cartItems
      .filter((item) => checkedIds.includes(item.id))
      .reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    return total || 0;
  }, [cartItems, checkedIds]);

  const grandTotal = selectedTotal;

  const validateSelectedStock = async () => {
    try {
      const selectedItems = cartItems.filter((item) => checkedIds.includes(item.id));
      const validation = await validateCartItems(selectedItems);

      if (!validation.isValid) {
        toast({
          title: 'Stock changed',
          description: validation.issues[0] || 'Please review your cart before placing the order.',
          variant: 'destructive',
        });
        return null;
      }

      return validation.items;
    } catch (error) {
      console.error('Stock validation failed:', error);
      toast({
        title: 'Unable to verify stock',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const createOrderInFirestore = async (status = 'pending') => {
    setLoading(true);
    try {
      const orderedItems = await validateSelectedStock();

      if (!orderedItems) {
        return null;
      }

      await saveAddressToProfile();

 const docRef = await addDoc(collection(db, 'orders'), {
  items: orderedItems,
  total: selectedTotal,
  grandTotal,
  deliveryMethod,
  paymentMethod,
  shippingInfo: {
    ...formData,
    country: formData.countryObj.name,
  },
  buyerId: user?.uid || null,
  buyerEmail: user?.email || formData.email || 'guest@dabs.co',
  buyerName: `${formData.firstName} ${formData.lastName}`.trim() || 'Guest Buyer',
  status,
  createdAt: serverTimestamp(),
});

      clearCart();
      setOrderId(docRef.id);
      setOrderPlaced(true);

      await createNotification({
        uid: user?.uid,
        type: 'order',
        title: status === 'paid' ? 'Order Confirmed' : 'Order Placed',
        body:
          status === 'paid'
            ? `Your order #${docRef.id.slice(0, 8)} was placed and payment was received.`
            : `Your order #${docRef.id.slice(0, 8)} was placed successfully.`,
        link: '/buyer-dashboard',
        orderId: docRef.id,
      });

 

      toast({
        title: status === 'paid' ? 'Payment Successful' : 'Order Placed!',
        description:
          status === 'paid'
            ? 'Your PayPal payment was processed. Order confirmed!'
            : 'Order created. Please complete payment.',
      });

      return docRef.id;
    } catch (error) {
      toast({
        title: 'Order Failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
      console.error('Order error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (checkedIds.length === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select at least one item.',
        variant: 'destructive',
      });
      return;
    }

    if (grandTotal <= 0) {
      toast({
        title: 'Invalid Total',
        description: 'Order total must be greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (!(await validateSelectedStock())) {
      return;
    }

    if (paymentMethod === 'bank') {
      await createOrderInFirestore('pending');
    } else {
      setShowPayPal(true);
      toast({
        title: 'Ready to Pay',
        description: 'Please complete payment with PayPal below.',
      });
    }
  };

  const handlePaypalApproval = async (data, actions) => {
    try {
      const order = await actions.order.capture();
      console.log('PayPal capture success:', order);

      const newOrderId = await createOrderInFirestore('paid');

      if (newOrderId) {
        await updateDoc(doc(db, 'orders', newOrderId), {
          paymentId: order.id,
          paidAt: serverTimestamp(),
        });
      }

      setShowPayPal(false);
    } catch (err) {
      console.error('Capture failed:', err);
      toast({
        title: 'Payment Capture Failed',
        description: 'Payment approved but could not be captured.',
        variant: 'destructive',
      });
    }
  };

  if (orderPlaced) {
    return (
      <>
        <Helmet>
          <title>Checkout - D.A.B.S. Co.</title>
        </Helmet>

        <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
            <Grainient
              color1="#5C2D91"
              color2="#7B3FA0"
              color3="#C9A0DC"
              timeSpeed={0.25}
              colorBalance={-0.06}
              warpStrength={1.5}
              warpFrequency={3.8}
              warpSpeed={2}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={1}
              rotationAmount={500}
              noiseScale={2}
              grainAmount={0.1}
              grainScale={2}
              grainAnimated={false}
              contrast={1.5}
              gamma={1}
              saturation={1}
              centerX={0}
              centerY={0}
              zoom={0.9}
            />

            <div className="absolute inset-0 pointer-events-none">
              <Particles
                particleCount={180}
                particleSpread={10}
                speed={0.1}
                particleColors={['#FAF8FF', '#E8D8F3', '#C9A0DC']}
                moveParticlesOnHover
                particleHoverFactor={1}
                alphaParticles={false}
                particleBaseSize={120}
                sizeRandomness={1.4}
                cameraDistance={53}
                disableRotation={false}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 container mx-auto max-w-4xl px-5 py-14 sm:px-8 md:py-20"
          >
            <div className="rounded-[2rem] border border-white/45 bg-white/95 p-7 shadow-2xl shadow-[#2D0E5A]/30 backdrop-blur-md md:p-12">
              <div className="text-center mb-10">
                <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                <h2 className="mb-4 font-artisan-display text-4xl font-bold text-[#2A1739]">Thank You!</h2>
                <p className="text-lg text-gray-700 mb-2">Your order has been placed successfully.</p>
                <p className="text-sm text-gray-500">
                  Order ID: <span className="font-mono font-bold">{orderId?.slice(0, 8)}</span>
                </p>
              </div>

              <div className="space-y-10">
                <div className="border-l-4 border-[#7B3FA0] pl-6">
                  <h3 className="mb-4 font-artisan-display text-3xl font-bold text-[#5C2D91]">Next Steps</h3>
                  <p className="text-gray-700 mb-4">
                    {paymentMethod === 'bank'
                      ? 'Please transfer the total amount to the BDO account shown below. Include your Order ID in the reference.'
                      : 'Your PayPal payment has been processed. Admin will confirm shortly.'}
                  </p>
                </div>

                {paymentMethod === 'bank' && (
                  <div className="rounded-2xl bg-[#FAF6FC] p-6">
                    <p className="font-semibold mb-2">Bank Details:</p>
                    <p>
                      Bank: <strong>{bankDetails.bankName}</strong>
                    </p>
                    <p>
                      Account Name: <strong>{bankDetails.accountName}</strong>
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <p className="font-semibold">Account Number:</p>
                      <span className="font-mono">{bankDetails.accountNumber}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAccount}
                        className="flex items-center gap-2 rounded-xl"
                      >
                        {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      Include your Order ID <strong>{orderId?.slice(0, 8)}</strong> in the reference.
                    </p>
                  </div>
                )}

                <div className="text-center mt-10">
                  <p className="text-lg font-medium text-gray-800 mb-4">
                    Admin will confirm your order within 24 hours.
                  </p>
                  <Button
                    onClick={() => navigate('/buyer-dashboard')}
                    className="rounded-2xl bg-[#5C2D91] px-10 hover:bg-[#4A2578]"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - D.A.B.S. Co.</title>
      </Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#5C2D91"
            color2="#7B3FA0"
            color3="#C9A0DC"
            timeSpeed={0.25}
            colorBalance={-0.06}
            warpStrength={1.5}
            warpFrequency={3.8}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={1}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={180}
              particleSpread={10}
              speed={0.1}
              particleColors={['#FAF8FF', '#E8D8F3', '#C9A0DC']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={120}
              sizeRandomness={1.4}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <PurchasePageHero
              eyebrow="Secure checkout"
              title="Confirm your order"
              description="Add your delivery details, choose a payment method, and review every item before placing your order."
            />
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
            <div className="space-y-8">
              <div className="rounded-[2rem] border border-white/45 bg-white/95 p-6 shadow-xl shadow-[#2D0E5A]/15 backdrop-blur-md">
                <div className="flex justify-between items-center mb-4 gap-4">
                  <h2 className="font-artisan-display text-3xl font-bold text-[#2A1739]">Shipping Address</h2>
                  <button
                    onClick={() => {
                      if (editAddress) saveAddressToProfile();
                      setEditAddress(!editAddress);
                    }}
                    className="flex shrink-0 items-center gap-1 font-semibold text-[#5C2D91] hover:underline"
                  >
                    <Edit size={16} /> {editAddress ? 'Done' : 'Edit'}
                  </button>
                </div>

                {editAddress ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFDFF] px-4 py-3 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFDFF] px-4 py-3 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15"
                    />
                    <input
                      type="text"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFDFF] px-4 py-3 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15 md:col-span-2"
                    />
                    <input
                      type="text"
                      name="street"
                      placeholder="Street Address"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFDFF] px-4 py-3 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15 md:col-span-2"
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFDFF] px-4 py-3 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15"
                    />
                    <input
                      type="text"
                      name="stateProvince"
                      placeholder="State / Province"
                      value={formData.stateProvince}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFDFF] px-4 py-3 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15"
                    />
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="Postal / ZIP Code"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFDFF] px-4 py-3 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15"
                    />

                    <div className="md:col-span-2 relative">
                      <label className="text-lg font-medium text-gray-700 mb-2 block">Country</label>
                      <button
                        type="button"
                        onClick={() => setIsAddressCountryOpen(!isAddressCountryOpen)}
                      className="flex w-full items-center justify-between rounded-2xl border-2 border-[#DCCBE7] bg-[#FAF6FC] px-5 py-4 text-[#2A1739] transition hover:bg-[#F0E6F7]"
                      >
                        <div className="flex items-center gap-3">
                          <img src={formData.countryObj.flag} alt="" className="w-8 h-6 rounded" />
                          <span className="font-medium">{formData.countryObj.name}</span>
                        </div>
                        <ChevronDown size={20} />
                      </button>

                      {isAddressCountryOpen && (
                        <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-[#DCCBE7] bg-white shadow-2xl">
                          <div className="p-4 border-b">
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={addressCountrySearch}
                              onChange={(e) => setAddressCountrySearch(e.target.value)}
                              className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFDFF] px-4 py-3 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15"
                              autoFocus
                            />
                          </div>
                          {filteredAddressCountries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => selectCountry(country)}
                              className="flex w-full items-center gap-4 px-5 py-4 text-left text-[#2A1739] hover:bg-[#FAF6FC]"
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
                      {formData.street || 'No street'}, {formData.city || ''}, {formData.stateProvince || ''}{' '}
                      {formData.postalCode || ''}
                    </p>
                    <div className="flex items-center gap-3">
                      <img src={formData.countryObj.flag} alt="" className="w-10 h-7 rounded shadow" />
                      <p className="text-gray-700 font-medium">{formData.countryObj.name}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm mt-2">
                      <span className="font-bold">HOME</span>
                    </div>

                    {(!formData.firstName || formData.firstName.length < 2) && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3 text-sm text-orange-800">
                        <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                        <p>Please update the recipient&apos;s name to the correct format to expedite delivery.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Delivery Option</h3>
                  <div className="space-y-4">
                    <label
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] duration-200 ${
                        deliveryMethod === 'courier'
                          ? 'border-[#5C2D91] bg-[#F0E6F7]'
                          : 'border-[#E6DDEB] hover:border-[#C992D8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="courier"
                        checked={deliveryMethod === 'courier'}
                        onChange={() => setDeliveryMethod('courier')}
                        className="h-5 w-5 text-[#5C2D91]"
                      />
                      <div>
                        <p className="font-medium">Courier Shipping (Seller Drop-Off)</p>
                        <p className="text-sm text-gray-600">
                          Seller packs and drops off at courier. Tracking provided.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] duration-200 ${
                        deliveryMethod === 'pickup'
                          ? 'border-[#5C2D91] bg-[#F0E6F7]'
                          : 'border-[#E6DDEB] hover:border-[#C992D8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="pickup"
                        checked={deliveryMethod === 'pickup'}
                        onChange={() => setDeliveryMethod('pickup')}
                        className="h-5 w-5 text-[#5C2D91]"
                      />
                      <div>
                        <p className="font-medium">Local Pickup</p>
                        <p className="text-sm text-gray-600">
                          Pick up from our local point in Quezon City. Schedule via chat.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/45 bg-white/95 p-6 shadow-xl shadow-[#2D0E5A]/15 backdrop-blur-md">
                <h2 className="mb-6 font-artisan-display text-3xl font-bold text-[#2A1739]">Order Summary</h2>

                {cartItems.length === 0 ? (
                  <p className="text-gray-500">No items in cart.</p>
                ) : (
                  <div className="space-y-6">
                    {cartItems.map((item) => {
                      const availableStock = getAvailableStock(item);

                      return (
                      <div key={item.id} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b pb-4 sm:flex">
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-grow">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">Price: {formatPrice(item.price)}</p>
                          <p className="mt-1 text-xs text-artisan-text-muted">
                            {availableStock > 0 ? `${availableStock} available` : 'Sold out'}
                          </p>
                        </div>

                        <div className="col-span-2 flex flex-wrap items-center justify-between gap-4 sm:col-auto sm:justify-end">
                          <div className="flex items-center border rounded-xl">
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
                              disabled={item.quantity >= availableStock}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={18} />
                          </button>

                          <p className="min-w-[80px] text-right font-bold text-[#5C2D91]">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                      );
                    })}
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

            <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-[2rem] border border-white/45 bg-white/95 p-6 shadow-xl shadow-[#2D0E5A]/15 backdrop-blur-md">
                <h2 className="mb-6 font-artisan-display text-3xl font-bold text-[#2A1739]">Select Payment Method</h2>

                <div className="space-y-4">
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] duration-200 ${
                      paymentMethod === 'bank'
                        ? 'border-[#5C2D91] bg-[#F0E6F7]'
                        : 'border-[#E6DDEB] hover:border-[#C992D8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="h-5 w-5 text-[#5C2D91]"
                    />
                    <div className="flex-grow">
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-gray-600">Transfer to our BDO account</p>
                    </div>
                    {paymentMethod === 'bank' && <CheckCircle size={20} className="text-[#5C2D91]" />}
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] duration-200 ${
                      paymentMethod === 'paypal'
                        ? 'border-[#5C2D91] bg-[#F0E6F7]'
                        : 'border-[#E6DDEB] hover:border-[#C992D8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="h-5 w-5 text-[#5C2D91]"
                    />
                    <div className="flex-grow">
                      <p className="font-medium">PayPal</p>
                      <p className="text-sm text-gray-600">Pay securely via PayPal</p>
                    </div>
                    {paymentMethod === 'paypal' && <CheckCircle size={20} className="text-[#5C2D91]" />}
                  </label>
                </div>

                {paymentMethod === 'paypal' && showPayPal && (
                  <div className="mt-6 rounded-2xl bg-[#FAF6FC] p-6">
                    <p className="font-semibold mb-4 text-center text-lg">Complete Payment with PayPal</p>
                    <PayPalScriptProvider
                      options={{
                        'client-id': PAYPAL_CLIENT_ID,
                        currency: 'PHP',
                        intent: 'capture',
                        environment: 'sandbox',
                      }}
                    >
                      <PayPalButtons
                        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
                        createOrder={(data, actions) => {
                          if (grandTotal <= 0) {
                            toast({
                              title: 'Invalid Amount',
                              description: 'Total must be greater than 0.',
                              variant: 'destructive',
                            });
                            return Promise.reject(new Error('Invalid amount'));
                          }
                          return actions.order.create({
                            purchase_units: [
                              {
                                amount: {
                                  value: grandTotal.toFixed(2),
                                  currency_code: 'PHP',
                                },
                                description: 'Order from D.A.B.S. Co.',
                              },
                            ],
                          });
                        }}
                        onApprove={handlePaypalApproval}
                        onError={(err) => {
                          console.error('PayPal error:', err);
                          toast({
                            title: 'PayPal Error',
                            description: 'Something went wrong. Try Bank Transfer instead.',
                            variant: 'destructive',
                          });
                        }}
                      />
                    </PayPalScriptProvider>
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-white/25 bg-[#2D0E5A]/95 p-6 text-white shadow-2xl shadow-[#2D0E5A]/35 backdrop-blur-md">
                <h2 className="mb-6 font-artisan-display text-3xl font-bold text-white">Order Detail</h2>
                <div className="space-y-3 text-white/85">
                  <div className="flex justify-between">
                    <span>Subtotal ({checkedIds.length} Items)</span>
                    <span>{formatPrice(selectedTotal)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/20 pt-3 text-xl font-bold text-white">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {!orderPlaced && (
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={
                      loading ||
                      checkedIds.length === 0 ||
                      grandTotal <= 0 ||
                      !deliveryMethod ||
                      !paymentMethod
                    }
                    className="mt-8 w-full rounded-2xl bg-[#F0E6F7] py-4 text-lg font-bold text-[#4A2578] hover:bg-white"
                  >
                    {loading ? 'Placing Order...' : 'PLACE ORDER NOW'}
                  </Button>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;

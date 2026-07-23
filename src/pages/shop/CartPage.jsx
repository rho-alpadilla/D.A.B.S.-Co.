import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trash2, ArrowRight, ShoppingBag, Square, CheckSquare, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validPrev = prev.filter((id) => cartItems.some((item) => item.id === id));
      const newIds = cartItems
        .filter((item) => !validPrev.includes(item.id))
        .map((item) => item.id);
      return [...validPrev, ...newIds];
    });
  }, [cartItems]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map((item) => item.id));
    }
  };

  const selectedTotal = useMemo(() => {
    return cartItems
      .filter((item) => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems, selectedIds]);

  const allSelected = selectedIds.length === cartItems.length && cartItems.length > 0;

  const handleProceedToCheckout = () => {
    if (selectedIds.length === 0) return;

    const selectedItems = cartItems.filter((item) => selectedIds.includes(item.id));
    navigate('/checkout', { state: { selectedItems } });
  };

  return (
    <>
      <Helmet>
        <title>Shopping Cart - D.A.B.S. Co.</title>
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

        <div className="relative z-10 container mx-auto min-h-[60vh] max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 rounded-[2rem] border border-white/45 bg-white/95 p-6 shadow-xl shadow-[#2D0E5A]/20 backdrop-blur-md md:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F0E6F7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#5C2D91]">
                  <Sparkles size={14} />
                  Your Cart
                </div>

                <h1 className="font-artisan-display text-4xl font-bold text-[#2A1739] md:text-5xl">
                  Your Shopping Cart
                </h1>

                <p className="text-gray-600 mt-2">
                  Review your selected handmade items before checkout.
                </p>
              </div>

              <Link to="/pending-orders" className="w-full sm:w-auto">
                <Button className="h-12 w-full rounded-2xl bg-[#5C2D91] px-5 py-0 text-white hover:bg-[#4A2578]">
                  View My Orders
                </Button>
              </Link>
            </div>
          </motion.div>

          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[2rem] border border-white/45 bg-white/95 py-14 text-center shadow-xl shadow-[#2D0E5A]/20 backdrop-blur-md"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#F0E6F7]">
                <ShoppingBag size={42} className="text-[#5C2D91]" />
              </div>

              <p className="text-gray-600 text-lg mb-6">Your cart is empty.</p>

              <Link to="/gallery">
                <Button className="rounded-2xl bg-[#5C2D91] text-white hover:bg-[#4A2578]">
                  Start Shopping
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]">
              <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/45 bg-white/95 px-4 py-3 shadow-lg shadow-[#2D0E5A]/10 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <button onClick={toggleSelectAll}>
                      {allSelected ? (
                        <CheckSquare size={20} className="text-[#5C2D91]" />
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </span>
                  </div>

                  <span className="text-sm text-gray-500">
                    {selectedIds.length} of {cartItems.length} selected
                  </span>
                </div>

                {cartItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      className="grid grid-cols-[auto_6rem_minmax(0,1fr)] items-start gap-4 rounded-3xl border border-white/45 bg-white/95 p-4 shadow-lg shadow-[#2D0E5A]/10 backdrop-blur-md sm:flex sm:p-5"
                    >
                      <button onClick={() => toggleSelect(item.id)}>
                        {isSelected ? (
                          <CheckSquare size={20} className="mt-1 text-[#5C2D91]" />
                        ) : (
                          <Square size={20} className="text-gray-400 mt-1" />
                        )}
                      </button>

                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#F5EFF8]">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={32} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex justify-between items-start gap-3">
                          <h3 className="font-artisan-display text-xl font-bold text-[#2A1739]">{item.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <p className="text-sm text-gray-500 capitalize">{item.category}</p>

                        <div className="flex justify-between items-end mt-3 gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <label htmlFor={`qty-${item.id}`} className="text-sm text-gray-600">
                              Qty:
                            </label>
                            <input
                              id={`qty-${item.id}`}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.id, parseInt(e.target.value) || 1)
                              }
                              className="w-16 rounded-xl border border-[#DCCBE7] bg-white px-2 py-1 text-sm text-[#2A1739] focus:border-[#5C2D91] focus:outline-none"
                            />
                          </div>

                          <p className="font-bold text-[#5C2D91]">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <aside className="h-fit rounded-[2rem] border border-white/25 bg-[#2D0E5A]/95 p-6 text-white shadow-2xl shadow-[#2D0E5A]/35 backdrop-blur-md lg:sticky lg:top-24">
                <h2 className="mb-4 font-artisan-display text-3xl font-bold text-white">Selected Summary</h2>

                <div className="mb-6 space-y-3 border-b border-white/20 pb-6">
                  <div className="flex justify-between text-white/85">
                    <span>Subtotal (selected)</span>
                    <span>{formatPrice(selectedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-white/85">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="mb-6 flex justify-between text-xl font-bold text-white">
                  <span>Total (est.)</span>
                  <span>{formatPrice(selectedTotal)}</span>
                </div>

                <Button
                  onClick={handleProceedToCheckout}
                  className="h-14 w-full rounded-2xl bg-[#F0E6F7] px-5 py-0 font-bold text-[#4A2578] hover:bg-white"
                  disabled={selectedIds.length === 0}
                >
                  Proceed to Checkout
                  <ArrowRight size={18} className="ml-2" />
                </Button>

                {selectedIds.length === 0 && (
                  <p className="mt-2 text-center text-xs text-[#F7C4D0]">
                    Select at least one item to proceed
                  </p>
                )}

                <p className="mt-4 text-center text-xs text-white/70">
                  Secure checkout via Bank Transfer / GCash
                </p>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;

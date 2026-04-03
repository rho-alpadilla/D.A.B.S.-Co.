import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trash2, ArrowRight, ShoppingBag, Square, CheckSquare, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import Grainient from '@/components/ui-bits/Grainient';
import Particles from '@/components/ui-bits/Particles';

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

      <div className="relative min-h-screen bg-[#daf0ee] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#118c8c"
            color2="#118c8c"
            color3="#fbfe9f"
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
              particleCount={400}
              particleSpread={10}
              speed={0.1}
              particleColors={['#faf8f1', '#118c8c', '#f1bb19']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={150}
              sizeRandomness={1.7}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 rounded-3xl bg-white/90 backdrop-blur-md border border-white/30 shadow-lg p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#118C8C]/15 bg-[#118C8C]/8 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#118C8C] mb-3">
                  <Sparkles size={14} />
                  Your Cart
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-[#118C8C]">
                  Your Shopping Cart
                </h1>

                <p className="text-gray-600 mt-2">
                  Review your selected handmade items before checkout.
                </p>
              </div>

              <Link to="/pending-orders">
                <Button className="bg-[#118C8C] hover:bg-[#0d7070] rounded-2xl">
                  View My Orders
                </Button>
              </Link>
            </div>
          </motion.div>

          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-14 bg-white/90 backdrop-blur-md rounded-3xl border border-white/30 shadow-lg"
            >
              <div className="w-20 h-20 rounded-full bg-[#118C8C]/10 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={42} className="text-[#118C8C]" />
              </div>

              <p className="text-gray-600 text-lg mb-6">Your cart is empty.</p>

              <Link to="/gallery">
                <Button className="bg-[#118C8C] hover:bg-[#0d7070] rounded-2xl">
                  Start Shopping
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4 bg-white/85 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <button onClick={toggleSelectAll}>
                      {allSelected ? (
                        <CheckSquare size={20} className="text-[#118C8C]" />
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
                      className="flex gap-4 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/30 items-start"
                    >
                      <button onClick={() => toggleSelect(item.id)}>
                        {isSelected ? (
                          <CheckSquare size={20} className="text-[#118C8C] mt-1" />
                        ) : (
                          <Square size={20} className="text-gray-400 mt-1" />
                        )}
                      </button>

                      <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
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

                      <div className="flex-grow flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-3">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
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
                              className="w-16 border border-gray-300 rounded-xl px-2 py-1 text-sm bg-white"
                            />
                          </div>

                          <p className="font-bold text-[#118C8C]">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-md h-fit border border-white/30">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Selected Summary</h2>

                <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal (selected)</span>
                    <span>{formatPrice(selectedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                  <span>Total (est.)</span>
                  <span>{formatPrice(selectedTotal)}</span>
                </div>

                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-3 h-auto rounded-2xl"
                  disabled={selectedIds.length === 0}
                >
                  Proceed to Checkout
                  <ArrowRight size={18} className="ml-2" />
                </Button>

                {selectedIds.length === 0 && (
                  <p className="text-xs text-center text-red-500 mt-2">
                    Select at least one item to proceed
                  </p>
                )}

                <p className="text-xs text-center text-gray-400 mt-4">
                  Secure checkout via Bank Transfer / GCash
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;
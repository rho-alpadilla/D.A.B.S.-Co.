import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trash2, ArrowRight, ShoppingBag, Square, CheckSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import PurchasePageHero from '@/components/shop/PurchasePageHero';
import { getAvailableStock } from '@/lib/stock';

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

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10 container mx-auto min-h-[60vh] max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <PurchasePageHero
              eyebrow="Your cart"
              title="Your shopping cart"
              description="Review the handmade pieces you want to order, then continue when you are ready."
              action={(
                <Link to="/pending-orders" className="block w-full md:w-auto">
                  <Button variant="outline" className="h-12 w-full rounded-2xl px-5 md:w-auto">
                    View my orders
                  </Button>
                </Link>
              )}
            />
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
                  const availableStock = getAvailableStock(item);
                  const canRequestMore = item.quantity >= availableStock;
                  const customOrderQuery = new URLSearchParams({
                    productId: item.id,
                    productName: item.name || 'Selected product',
                    quantity: String(Math.max((item.quantity || 0) + 1, 1)),
                  }).toString();

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      className="artisan-card-hover grid grid-cols-[auto_6rem_minmax(0,1fr)] items-start gap-4 rounded-3xl border border-white/45 bg-white/95 p-4 shadow-lg shadow-[#2D0E5A]/10 backdrop-blur-md sm:flex sm:p-5"
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
                            className="rounded-lg p-1 text-red-400 transition-colors hover:text-red-600"
                            aria-label={`Remove ${item.name} from cart`}
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
                              max={Math.max(availableStock, 1)}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.id, parseInt(e.target.value) || 1)
                              }
                              className="w-16 rounded-xl border border-[#DCCBE7] bg-white px-2 py-1 text-sm text-[#2A1739] focus:border-[#5C2D91] focus:outline-none"
                            />
                            <span className="text-xs text-artisan-text-muted">
                              {availableStock > 0 ? `${availableStock} available` : 'Sold out'}
                            </span>
                          </div>

                          <p className="font-bold tabular-nums text-[#5C2D91]">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>

                        {canRequestMore && (
                          <Link
                            to={`/contact?${customOrderQuery}`}
                            className="mt-3 w-fit text-xs font-semibold text-artisan-primary underline-offset-4 transition-colors hover:text-artisan-primary-mid hover:underline"
                          >
                            Request additional pieces
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <aside className="h-fit rounded-[2rem] border border-white/25 bg-[#2D0E5A]/95 p-6 text-white shadow-2xl shadow-[#2D0E5A]/35 backdrop-blur-md lg:sticky lg:top-24">
                <h2 className="mb-4 font-nunito text-3xl font-bold text-white">Selected Summary</h2>

                <div className="mb-6 space-y-3 border-b border-white/20 pb-6">
                  <div className="flex justify-between text-white/85">
                    <span>Subtotal (selected)</span>
                    <span className="tabular-nums">{formatPrice(selectedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-white/85">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="mb-6 flex justify-between text-xl font-bold text-white">
                  <span>Total (est.)</span>
                  <span className="tabular-nums">{formatPrice(selectedTotal)}</span>
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

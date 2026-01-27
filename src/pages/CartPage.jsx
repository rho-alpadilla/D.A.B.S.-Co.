// src/pages/CartPage.jsx ← UPDATED: CHECKBOX SELECTION + SELECTED SUBTOTAL + PASS TO CHECKOUT
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trash2, ArrowRight, ShoppingBag, Square, CheckSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  // Track selected item IDs (default: all selected)
  const [selectedIds, setSelectedIds] = useState(() => cartItems.map(item => item.id));

  // Toggle individual item
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Select All / Deselect All
  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map(item => item.id));
    }
  };

  // Calculate subtotal for selected items only
  const selectedTotal = useMemo(() => {
    return cartItems
      .filter(item => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems, selectedIds]);

  const allSelected = selectedIds.length === cartItems.length && cartItems.length > 0;

  const handleProceedToCheckout = () => {
    if (selectedIds.length === 0) return;

    // Filter only selected items
    const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));

    // Navigate to checkout and pass selected items via state
    navigate('/checkout', { state: { selectedItems } });
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
              {/* Select All Toggle */}
              <div className="flex items-center justify-between mb-4">
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
                    className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 items-start"
                  >
                    {/* Checkbox */}
                    <button onClick={() => toggleSelect(item.id)}>
                      {isSelected ? (
                        <CheckSquare size={20} className="text-[#118C8C] mt-1" />
                      ) : (
                        <Square size={20} className="text-gray-400 mt-1" />
                      )}
                    </button>

                    <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
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
                );
              })}
            </div>

            {/* Mini Summary + Proceed Button */}
            <div className="bg-white p-6 rounded-xl shadow-md h-fit border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Selected Summary</h2>
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
                className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-3 h-auto"
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
    </>
  );
};

export default CartPage;
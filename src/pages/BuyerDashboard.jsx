// src/pages/BuyerDashboard.jsx
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, Heart, LogOut, ArrowRight, Clock } from 'lucide-react';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, cartCount } = useCart();

  const handleLogout = () => signOut(auth).then(() => navigate('/login'));

  // Fake recent orders (you can replace with real Firestore later)
  const recentOrders = [
    { id: 'ORD001', date: 'Mar 15, 2025', total: 85.00, status: 'Shipped' },
    { id: 'ORD002', date: 'Mar 10, 2025', total: 45.00, status: 'Delivered' },
  ];

  const savedItems = [
    { id: 1, name: 'Floral Crochet Tote', price: 65 },
    { id: 2, name: 'Custom Needlepoint Portrait', price: 120 },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#118C8C] rounded-full border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Helmet><title>My Account - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Welcome Header */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-10 text-center">
            <div className="w-24 h-24 bg-[#118C8C] rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user.email.split('@')[0]}!</h1>
            <p className="text-gray-600 mt-2">Here’s your D.A.B.S. Co. account at a glance</p>
          </div>

          {/* My Cart Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShoppingBag className="text-[#118C8C]" size={32} />
                My Cart ({cartCount} items)
              </h2>
              <Button asChild>
                <Link to="/cart" className="flex items-center gap-2">
                  Go to Cart <ArrowRight size={18} />
                </Link>
              </Button>
            </div>

            {cartItems.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <Button asChild size="lg" className="mt-4 bg-[#118C8C]">
                  <Link to="/pricelists">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-6 border-b last:border-0 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-[#118C8C]">${item.price * item.quantity}</p>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <div className="p-4 bg-gray-50 text-center">
                    <Link to="/cart" className="text-[#118C8C] font-medium hover:underline">
                      + {cartItems.length - 3} more items
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Package className="text-[#F2BB16]" size={32} />
              Recent Orders
            </h2>
            <div className="bg-white rounded-xl shadow-sm">
              {recentOrders.map(order => (
                <div key={order.id} className="p-6 border-b last:border-0 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Order #{order.id}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Clock size={14} /> {order.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                    <p className="font-bold mt-1">${order.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved for Later */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Heart className="text-red-500" size={32} />
              Saved for Later
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {savedItems.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4" />
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xl font-bold text-[#118C8C] mt-2">${item.price}</p>
                  <Button className="mt-4 w-full bg-[#118C8C]">Add to Cart</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div className="text-center mt-12">
            <Button onClick={handleLogout} variant="outline" size="lg" className="text-red-600 hover:bg-red-50">
              <LogOut className="mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuyerDashboard;
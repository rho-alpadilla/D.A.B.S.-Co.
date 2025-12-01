// src/pages/BuyerDashboard.jsx ← FINAL: REAL ORDERS FROM FIRESTORE + LIVE STATUS
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, Heart, LogOut, ArrowRight, Clock, CheckCircle, Truck } from 'lucide-react';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, cartCount } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch REAL orders for this user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("buyerEmail", "==", user.email),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleLogout = () => signOut(auth).then(() => navigate('/login'));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={20} />;
      case 'processing': return <Truck className="text-blue-500" size={20} />;
      default: return <Clock className="text-yellow-500" size={20} />;
    }
  };

  return (
    <>
      <Helmet><title>My Account - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Welcome */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-10 text-center">
            <div className="w-24 h-24 bg-[#118C8C] rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user.email.split('@')[0]}!</h1>
            <p className="text-gray-600 mt-2">Here’s your order history and cart</p>
          </div>

          {/* My Cart */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShoppingBag className="text-[#118C8C]" size={32} />
                My Cart ({cartCount} items)
              </h2>
              <Button asChild>
                <Link to="/cart">Go to Cart <ArrowRight size={18} /></Link>
              </Button>
            </div>

            {cartItems.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <Button asChild size="lg" className="mt-6 bg-[#118C8C]">
                  <Link to="/gallery">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm">
                {cartItems.slice(0, 3).map(item => (
                  <div key={item.id} className="p-6 border-b last:border-0 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">x{item.quantity}</p>
                    </div>
                    <p className="font-bold text-[#118C8C]">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <div className="p-4 bg-gray-50 text-center">
                    <Link to="/cart" className="text-[#118C8C] hover:underline">
                      + {cartItems.length - 3} more items
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* REAL ORDERS FROM FIRESTORE */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Package className="text-[#F2BB16]" size={32} />
              My Orders
            </h2>

            {orders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No orders yet</p>
                <Button asChild size="lg" className="mt-6 bg-[#118C8C]">
                  <Link to="/gallery">Browse Products</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {orders.map(order => (
                  <div key={order.id} className="p-6 border-b last:border-0 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          {getStatusIcon(order.status)} {order.createdAt?.toDate?.().toLocaleDateString() || "Recent"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status || "Pending"}
                        </span>
                        <p className="font-bold text-2xl text-[#F2BB16] mt-2">
                          ₱{(order.total || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Items:</p>
                      <ul className="text-sm">
                        {order.items?.map((item, i) => (
                          <li key={i}>• {item.name} x{item.quantity}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="text-center mt-16">
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
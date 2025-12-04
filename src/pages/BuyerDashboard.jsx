// src/pages/BuyerDashboard.jsx ← FINAL: PROFILE PIC + @username
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, Mail, LogOut, ArrowRight, Clock, CheckCircle, Truck, Send, X, Circle } from 'lucide-react';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, cartCount } = useCart();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [photoURL, setPhotoURL] = useState(""); // ← LIVE PROFILE PIC

  // Fetch username + photoURL from Firestore
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUsername(data.username || user.email.split('@')[0]);
        setPhotoURL(data.photoURL || "");
      }
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const qOrders = query(
      collection(db, "orders"),
      where("buyerEmail", "==", user.email),
      orderBy("createdAt", "desc")
    );
    const unsubOrders = onSnapshot(qOrders, snap => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qMessages = query(
      collection(db, "messages"),
      where("buyerEmail", "==", user.email),
      orderBy("createdAt", "desc")
    );
    const unsubMessages = onSnapshot(qMessages, snap => {
      const allMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const grouped = {};
      allMessages.forEach(msg => {
        const key = msg.subject || "No Subject";
        if (!grouped[key]) {
          grouped[key] = { subject: key, messages: [], latestDate: msg.createdAt };
        }
        grouped[key].messages.push(msg);
        if (msg.createdAt > grouped[key].latestDate) {
          grouped[key].latestDate = msg.createdAt;
        }
      });

      const convos = Object.values(grouped).sort((a, b) =>
        (b.latestDate?.toDate?.() || 0) - (a.latestDate?.toDate?.() || 0)
      );

      setConversations(convos);
      setLoading(false);
    });

    return () => { unsubOrders(); unsubMessages(); };
  }, [user]);

  const handleLogout = () => signOut(auth).then(() => navigate('/login'));

  const openConversation = (convo) => {
    setSelectedConversation(convo);
    setReplyText("");
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    try {
      await addDoc(collection(db, "messages"), {
        buyerEmail: user.email,
        buyerName: user.displayName || "Guest",
        subject: selectedConversation.subject,
        message: replyText,
        status: "unread",
        createdAt: serverTimestamp(),
        isAdminReply: false
      });

      setReplyText("");
      alert("Reply sent!");
    } catch (err) {
      alert("Failed to send reply");
    }
  };

  const getSenderName = (msg) => {
    if (msg.isAdminReply === true) return "Admin";
    if (msg.isAdminReply === false) return "You";
    return msg.buyerEmail === user?.email ? "You" : "Admin";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={20} />;
      case 'processing': return <Truck className="text-blue-500" size={20} />;
      default: return <Clock className="text-yellow-500" size={20} />;
    }
  };

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

  return (
    <>
      <Helmet><title>My Account - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Welcome — PROFILE PIC + @username */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-10 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {photoURL ? (
                  <img 
                    src={photoURL} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-[#118C8C] rounded-full flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
                    {username[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Welcome back, <span className="text-[#118C8C]">@{username}</span>!
                </h1>
                <p className="text-gray-600 mt-2">Your orders and messages</p>
              </div>
            </div>
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
                    <p className="font-bold text-[#118C8C]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
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

          {/* Orders */}
          <div className="mb-12">
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
              <div className="bg-white rounded-xl shadow-sm">
                {orders.map(order => (
                  <div key={order.id} className="p-6 border-b last:border-0 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          {getStatusIcon(order.status)} {order.createdAt?.toDate?.().toLocaleDateString()}
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
                          {formatPrice(order.total || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Mail className="text-[#118C8C]" size={32} />
              Messages
            </h2>

            {conversations.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <Mail size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No messages yet</p>
                <Button asChild size="lg" className="mt-6 bg-[#118C8C]">
                  <Link to="/contact">Send a Message</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm">
                {conversations.map(convo => (
                  <div
                    key={convo.subject}
                    onClick={() => openConversation(convo)}
                    className="p-6 border-b last:border-0 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {convo.messages.some(m => m.status === "unread") ? (
                        <Circle className="text-blue-500" size={12} fill="currentColor" />
                      ) : (
                        <Circle className="text-gray-400" size={12} />
                      )}
                      <div>
                        <p className="font-bold">{convo.subject}</p>
                        <p className="text-sm text-gray-600">
                          Latest: {convo.latestDate?.toDate?.().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400" size={20} />
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

      {/* FULL CONVERSATION MODAL */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-[#118C8C]">{selectedConversation.subject}</h2>
                <Button variant="ghost" onClick={() => setSelectedConversation(null)}>
                  <X size={24} />
                </Button>
              </div>

              <div className="space-y-6">
                {selectedConversation.messages
                  .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
                  .map(msg => (
                    <div
                      key={msg.id}
                      className={`p-6 rounded-lg ${
                        getSenderName(msg) === "You" ? "bg-gray-50 ml-auto max-w-md" : "bg-blue-50 mr-auto max-w-md"
                      }`}
                    >
                      <p className="text-sm font-medium mb-2">
                        {getSenderName(msg)} • {msg.createdAt?.toDate?.().toLocaleString()}
                      </p>
                      <p className="text-gray-800">{msg.message}</p>
                    </div>
                  ))}

                <div className="mt-8">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full px-4 py-3 border rounded-lg h-32"
                  />
                  <div className="flex justify-end gap-4 mt-4">
                    <Button variant="outline" onClick={() => setSelectedConversation(null)}>
                      Cancel
                    </Button>
                    <Button onClick={sendReply} className="bg-[#118C8C]">
                      <Send className="mr-2" /> Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyerDashboard;
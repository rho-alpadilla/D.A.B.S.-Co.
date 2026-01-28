// src/pages/BuyerDashboard.jsx ← FINAL: CANCEL ORDER WITH REASON SELECTION + REFLECTS IN ADMIN
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, Package, Mail, LogOut, ArrowRight, 
  Clock, CheckCircle, Truck, Send, X, Circle, AlertCircle, Star, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// STATUS BADGE
const getStatusBadge = (status) => {
  const styles = {
    "Paid / Processing": "bg-blue-100 text-blue-700",
    "Cancellation Requested": "bg-orange-100 text-orange-700",
    "Cancelled – Pending Refund": "bg-red-100 text-red-700",
    "Refunded": "bg-purple-100 text-purple-700",
    "completed": "bg-green-100 text-green-700",
    "processing": "bg-blue-100 text-blue-700",
    "pending": "bg-yellow-100 text-yellow-700",
    "cancelled": "bg-gray-100 text-gray-700"
  };

  const icons = {
    "Paid / Processing": <Clock className="text-blue-600" size={18} />,
    "Cancellation Requested": <AlertCircle className="text-orange-600" size={18} />,
    "Cancelled – Pending Refund": <AlertCircle className="text-red-600" size={18} />,
    "Refunded": <CheckCircle className="text-purple-600" size={18} />,
    "completed": <CheckCircle className="text-green-600" size={18} />,
    "processing": <Truck className="text-blue-600" size={18} />,
    "pending": <Clock className="text-yellow-600" size={18} />,
  };

  const key = status || "pending";
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${styles[key] || "bg-gray-100 text-gray-700"}`}>
      {icons[key] || <Clock size={18} />}
      {key}
    </span>
  );
};

// CANCEL REASONS
const CANCEL_REASONS = [
  "Changed my mind",
  "Found a better price elsewhere",
  "Wrong size/color selected",
  "Accidental order",
  "Shipping takes too long",
  "Other"
];

const BuyerDashboard = () => {
  const { toast } = useToast();
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

  const [visibleCounts, setVisibleCounts] = useState({
    all: 5,
    pending: 5,
    completed: 5,
    cancelled: 5
  });

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  // Fetch username
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUsername(docSnap.data().username || user.email.split('@')[0]);
      }
    });
    return () => unsub();
  }, [user]);

  // Load orders
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("buyerEmail", "==", user.email),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [user]);

  // Load messages (unchanged)
  useEffect(() => {
    if (!user) return;

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

    return () => unsubMessages();
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
      toast({ title: "Reply Sent", description: "Your message has been sent." });
    } catch (err) {
      toast({ title: "Failed", description: "Could not send reply.", variant: "destructive" });
    }
  };

  // Cancel order
  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setSelectedReason("");
    setOtherReason("");
    setCancelModalOpen(true);
  };

  const confirmCancellation = async () => {
    if (!orderToCancel || !selectedReason) return;

    const reason = selectedReason === "Other" ? otherReason.trim() : selectedReason;

    if (selectedReason === "Other" && !reason) {
      toast({ title: "Reason Required", description: "Please specify your reason.", variant: "destructive" });
      return;
    }

    try {
      await updateDoc(doc(db, "orders", orderToCancel.id), {
        status: "Cancellation Requested",
        cancelReason: reason,
        cancellationRequestedAt: serverTimestamp(),
        cancellationRequestedBy: "buyer"
      });

      toast({
        title: "Cancellation Requested",
        description: "Your request has been sent to the admin team.",
      });

      setCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      console.error("Cancel error:", err);
      toast({
        title: "Failed",
        description: "Could not request cancellation. Try again.",
        variant: "destructive"
      });
    }
  };

  // Helpers
  const canCancel = (order) => {
    return ["pending", "Paid / Processing", "processing"].includes(order.status) && !order.cancellationRequestedAt;
  };

  // Group orders
  const pendingOrders = orders.filter(o => ["pending", "Paid / Processing", "processing", "Cancellation Requested"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "completed");
  const cancelledOrders = orders.filter(o => ["cancelled", "Cancelled – Pending Refund", "Refunded"].includes(o.status));
  const allOrders = orders;

  const loadMore = (tab) => {
    setVisibleCounts(prev => ({ ...prev, [tab]: prev[tab] + 5 }));
  };

  const loadLess = (tab) => {
    setVisibleCounts(prev => ({ ...prev, [tab]: Math.max(5, prev[tab] - 5) }));
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

          {/* Greeting */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, <span className="text-[#118C8C]">@{username}</span>!
            </h1>
            <p className="text-gray-600 mt-2">Your orders and messages</p>
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

          {/* ORDERS */}
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
              <Tabs defaultValue="all" className="bg-white rounded-xl shadow-sm">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All ({allOrders.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <OrderTable 
                    orders={allOrders} 
                    visibleCount={visibleCounts.all}
                    onLoadMore={() => loadMore('all')}
                    onLoadLess={() => loadLess('all')}
                    formatPrice={formatPrice}
                    onCancel={openCancelModal}
                    canCancel={canCancel}
                  />
                </TabsContent>
                <TabsContent value="pending">
                  <OrderTable 
                    orders={pendingOrders} 
                    visibleCount={visibleCounts.pending}
                    onLoadMore={() => loadMore('pending')}
                    onLoadLess={() => loadLess('pending')}
                    formatPrice={formatPrice}
                    onCancel={openCancelModal}
                    canCancel={canCancel}
                  />
                </TabsContent>
                <TabsContent value="completed">
                  <OrderTable 
                    orders={completedOrders} 
                    visibleCount={visibleCounts.completed}
                    onLoadMore={() => loadMore('completed')}
                    onLoadLess={() => loadLess('completed')}
                    formatPrice={formatPrice}
                    onCancel={openCancelModal}
                    canCancel={canCancel}
                  />
                </TabsContent>
                <TabsContent value="cancelled">
                  <OrderTable 
                    orders={cancelledOrders} 
                    visibleCount={visibleCounts.cancelled}
                    onLoadMore={() => loadMore('cancelled')}
                    onLoadLess={() => loadLess('cancelled')}
                    formatPrice={formatPrice}
                    onCancel={openCancelModal}
                    canCancel={canCancel}
                  />
                </TabsContent>
              </Tabs>
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
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm divide-y">
                {conversations.map(convo => {
                  const unreadCount = convo.messages.filter(m => m.status === "unread").length;
                  return (
                    <div
                      key={convo.subject}
                      onClick={() => openConversation(convo)}
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {unreadCount > 0 ? (
                            <Circle className="text-blue-500" size={12} fill="currentColor" />
                          ) : (
                            <Circle className="text-gray-400" size={12} />
                          )}
                          <div>
                            <p className="font-bold text-lg">{convo.subject}</p>
                            <p className="text-sm text-gray-600">
                              {convo.latestDate?.toDate?.().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="mr-2" size={20} /> Log Out
            </Button>
          </div>

          {/* CANCEL MODAL */}
          {cancelModalOpen && orderToCancel && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                <button 
                  onClick={() => setCancelModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-3">
                  <AlertCircle size={28} /> Cancel Order?
                </h2>

                <p className="text-gray-700 mb-6">
                  Order <strong>#{orderToCancel.id.slice(0,8)}</strong> will be cancelled.
                  This action cannot be undone.
                </p>

                <div className="mb-6">
                  <p className="font-medium mb-3">Please select a reason:</p>
                  <div className="space-y-3">
                    {CANCEL_REASONS.map(reason => (
                      <label key={reason} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="w-5 h-5 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-gray-800">{reason}</span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === "Other" && (
                    <textarea
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder="Please explain your reason..."
                      className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg resize-none h-28 focus:border-red-500 focus:ring-red-500"
                      required
                    />
                  )}
                </div>

                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCancelModalOpen(false)}
                  >
                    Nevermind
                  </Button>
                  <Button 
                    onClick={confirmCancellation}
                    disabled={!selectedReason || (selectedReason === "Other" && !otherReason.trim())}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Updated OrderTable with Cancel button
const OrderTable = ({ orders, visibleCount, onLoadMore, onLoadLess, formatPrice, onCancel, canCancel }) => {
  if (orders.length === 0) {
    return <div className="text-center py-12 text-gray-500">No orders in this category.</div>;
  }

  const displayed = orders.slice(0, visibleCount);
  const hasMore = visibleCount < orders.length;
  const hasLess = visibleCount > 5;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4 font-semibold">Order ID</th>
            <th className="p-4 font-semibold">Date</th>
            <th className="p-4 font-semibold">Items</th>
            <th className="p-4 font-semibold">Total</th>
            <th className="p-4 font-semibold">Status</th>
            <th className="p-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map(order => (
            <tr key={order.id} className="border-t hover:bg-gray-50">
              <td className="p-4 font-medium">#{order.id.slice(0,8)}</td>
              <td className="p-4">{order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</td>
              <td className="p-4">
                {order.items?.map((item, i) => (
                  <p key={i} className="text-sm">• {item.name} x{item.quantity}</p>
                )) || <p className="text-sm text-gray-500">No items</p>}
              </td>
              <td className="p-4 font-bold text-[#F2BB16]">
                {formatPrice(order.total || order.grandTotal || 0)}
              </td>
              <td className="p-4">{getStatusBadge(order.status)}</td>
              <td className="p-4 space-x-2">
                {canCancel(order) && (
                  <Button
                    onClick={() => onCancel(order)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Cancel Order
                  </Button>
                )}
                {order.cancelReason && (
                  <p className="text-xs text-gray-600 mt-2 italic">
                    Reason: {order.cancelReason}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center gap-4 py-6">
        {hasMore && (
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            className="flex items-center gap-2"
          >
            View More ({orders.length - visibleCount} remaining)
            <ChevronDown size={20} />
          </Button>
        )}
        {hasLess && (
          <Button 
            variant="outline" 
            onClick={onLoadLess}
            className="flex items-center gap-2"
          >
            View Less
            <ChevronUp size={20} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
// src/pages/BuyerDashboard.jsx ← CLEANED: REMOVED TOP PICKS + KEPT VIEW MORE/LESS
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc 
} from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, Package, Mail, LogOut, ArrowRight, 
  Clock, CheckCircle, Truck, Send, X, Circle, AlertCircle, Star, ChevronDown, ChevronUp 
} from 'lucide-react';

// STATUS BADGE FUNCTION
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
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${styles[key]}`}>
      {icons[key] || <Clock size={18} />}
      {key}
    </span>
  );
};

// REVIEW / CANCEL HELPERS
const isOrderReviewed = (order) => order.reviewed === true;
const canReview = (order) => order.status === "completed" && !isOrderReviewed(order);
const canRequestCancellation = (order) => ["Paid / Processing", "processing"].includes(order.status) && !order.cancellationRequestedAt;

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
  const [greeting] = useState("Welcome back");

  // Pagination per tab (visible count)
  const [visibleCounts, setVisibleCounts] = useState({
    all: 5,
    pending: 5,
    completed: 5,
    cancelled: 5
  });

  // REVIEW MODAL
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Fetch user data (only username now)
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUsername(data.username || user.email.split('@')[0]);
      }
    });

    return () => unsub();
  }, [user]);

  // Load orders
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

    return () => unsubOrders();
  }, [user]);

  // Load messages
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

  const requestCancellation = async (orderId) => {
    if (!confirm("Request cancellation?")) return;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "Cancellation Requested",
        cancellationRequestedAt: new Date(),
        cancellationRequestedBy: "buyer"
      });
      alert("Request sent!");
    } catch (err) {
      alert("Failed");
    }
  };

  const openReviewModal = (order) => {
    setSelectedOrderForReview(order);
    setReviewRating(5);
    setReviewComment("");
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!selectedOrderForReview || reviewRating < 1) return;
    try {
      for (const item of selectedOrderForReview.items) {
        await addDoc(collection(db, "reviews"), {
          productId: item.id,
          productName: item.name,
          orderId: selectedOrderForReview.id,
          buyerId: user.uid,
          buyerName: username,
          rating: reviewRating,
          comment: reviewComment.trim(),
          createdAt: serverTimestamp(),
          approved: true
        });
      }
      await updateDoc(doc(db, "orders", selectedOrderForReview.id), { reviewed: true });
      alert("Review submitted!");
      setReviewModalOpen(false);
      setSelectedOrderForReview(null);
    } catch (err) {
      alert("Failed");
    }
  };

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
      alert("Failed");
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

  // Group orders
  const pendingOrders = orders.filter(o => ["pending", "Paid / Processing", "processing"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "completed");
  const cancelledOrders = orders.filter(o => ["cancelled", "Cancelled – Pending Refund", "Refunded"].includes(o.status));
  const allOrders = orders;

  // Load more / less per tab
  const loadMore = (tab) => {
    setVisibleCounts(prev => ({
      ...prev,
      [tab]: prev[tab] + 5
    }));
  };

  const loadLess = (tab) => {
    setVisibleCounts(prev => ({
      ...prev,
      [tab]: Math.max(5, prev[tab] - 5)
    }));
  };

  return (
    <>
      <Helmet><title>My Account - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* SIMPLE TEXT GREETING */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              {greeting}, <span className="text-[#118C8C]">@{username}</span>!
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

          {/* ORDERS TABBED TABLE WITH VIEW MORE / VIEW LESS */}
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
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <OrderTable 
                    orders={allOrders} 
                    visibleCount={visibleCounts.all}
                    onLoadMore={() => loadMore('all')}
                    onLoadLess={() => loadLess('all')}
                    formatPrice={formatPrice}
                  />
                </TabsContent>
                <TabsContent value="pending">
                  <OrderTable 
                    orders={pendingOrders} 
                    visibleCount={visibleCounts.pending}
                    onLoadMore={() => loadMore('pending')}
                    onLoadLess={() => loadLess('pending')}
                    formatPrice={formatPrice}
                  />
                </TabsContent>
                <TabsContent value="completed">
                  <OrderTable 
                    orders={completedOrders} 
                    visibleCount={visibleCounts.completed}
                    onLoadMore={() => loadMore('completed')}
                    onLoadLess={() => loadLess('completed')}
                    formatPrice={formatPrice}
                  />
                </TabsContent>
                <TabsContent value="cancelled">
                  <OrderTable 
                    orders={cancelledOrders} 
                    visibleCount={visibleCounts.cancelled}
                    onLoadMore={() => loadMore('cancelled')}
                    onLoadLess={() => loadLess('cancelled')}
                    formatPrice={formatPrice}
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

          {/* REVIEW MODAL */}
          {reviewModalOpen && selectedOrderForReview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                <h2 className="text-2xl font-bold text-[#118C8C] mb-6">Leave a Review</h2>
                <p className="text-gray-600 mb-6">
                  Order #{selectedOrderForReview.id.slice(0, 8)} — {selectedOrderForReview.items.length} item(s)
                </p>

                <div className="mb-6">
                  <p className="font-medium mb-3">Rate your experience</p>
                  <div className="flex gap-2 justify-center">
                    {[1,2,3,4,5].map(num => (
                      <button
                        key={num}
                        onClick={() => setReviewRating(num)}
                        className="text-4xl transition-transform hover:scale-110"
                      >
                        {num <= reviewRating ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                  <p className="text-center mt-2 text-gray-600">{reviewRating} out of 5 stars</p>
                </div>

                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 border rounded-lg h-32 resize-none"
                />

                <div className="flex justify-end gap-4 mt-8">
                  <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitReview} className="bg-[#118C8C]">
                    Submit Review
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

// Reusable Order Table with View More / View Less
const OrderTable = ({ orders, visibleCount, onLoadMore, onLoadLess, formatPrice }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No orders in this category.
      </div>
    );
  }

  const displayedOrders = orders.slice(0, visibleCount);
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
          {displayedOrders.map(order => (
            <tr key={order.id} className="border-t hover:bg-gray-50">
              <td className="p-4 font-medium">#{order.id.slice(0,8)}</td>
              <td className="p-4">{order.createdAt?.toDate?.().toLocaleDateString()}</td>
              <td className="p-4">
                {order.items?.map((item, i) => (
                  <p key={i} className="text-sm">• {item.name} x{item.quantity}</p>
                ))}
              </td>
              <td className="p-4 font-bold text-[#F2BB16]">{formatPrice(order.total || 0)}</td>
              <td className="p-4">{getStatusBadge(order.status)}</td>
              <td className="p-4 space-x-2">
                {canRequestCancellation(order) && (
                  <Button
                    onClick={() => requestCancellation(order.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Cancel Request
                  </Button>
                )}
                {canReview(order) && (
                  <Button
                    onClick={() => openReviewModal(order)}
                    size="sm"
                    className="bg-[#118C8C] text-white hover:bg-[#0d7070]"
                  >
                    Review
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* VIEW MORE / VIEW LESS BUTTONS */}
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
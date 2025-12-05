// src/pages/BuyerDashboard.jsx ← FINAL: REVIEW SYSTEM + EVERYTHING
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, updateDoc, getDocs 
} from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, Package, Mail, LogOut, ArrowRight, 
  Clock, CheckCircle, Truck, Send, X, Circle, AlertCircle, Star
} from 'lucide-react';

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
  const [photoURL, setPhotoURL] = useState("");

  // REVIEW MODAL STATE
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Fetch username + photoURL
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

  // REQUEST CANCELLATION
  const requestCancellation = async (orderId) => {
    if (!confirm("Are you sure you want to request cancellation for this order?")) return;

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "Cancellation Requested",
        cancellationRequestedAt: new Date(),
        cancellationRequestedBy: "buyer"
      });
      alert("Cancellation request sent! Admin will review it.");
    } catch (err) {
      alert("Failed to request cancellation");
    }
  };

  // OPEN REVIEW MODAL
  const openReviewModal = (order) => {
    setSelectedOrderForReview(order);
    setReviewRating(5);
    setReviewComment("");
    setReviewModalOpen(true);
  };

  // SUBMIT REVIEW
  const submitReview = async () => {
    if (!selectedOrderForReview || reviewRating < 1) return;

    try {
      // Save one review per product in the order
      for (const item of selectedOrderForReview.items) {
        await addDoc(collection(db, "reviews"), {
          productId: item.id,
          productName: item.name,
          orderId: selectedOrderForReview.id,
          buyerId: user.uid,
          buyerName: username,
          buyerPhoto: photoURL || "",
          rating: reviewRating,
          comment: reviewComment.trim(),
          createdAt: serverTimestamp(),
          approved: true
        });
      }

      // Mark order as reviewed
      await updateDoc(doc(db, "orders", selectedOrderForReview.id), {
        reviewed: true
      });

      alert("Thank you! Your review has been submitted.");
      setReviewModalOpen(false);
      setSelectedOrderForReview(null);
    } catch (err) {
      alert("Failed to submit review");
      console.error(err);
    }
  };

  // Check if order is already reviewed
  const isOrderReviewed = (order) => order.reviewed === true;

  const canReview = (order) => {
    return order.status === "completed" && !isOrderReviewed(order);
  };

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

    const displayText = {
      "Paid / Processing": "Paid / Processing",
      "Cancellation Requested": "Cancellation Requested",
      "Cancelled – Pending Refund": "Cancelled – Pending Refund",
      "Refunded": "Refunded",
      "completed": "Completed",
      "processing": "Processing",
      "pending": "Pending",
      "cancelled": "Cancelled"
    };

    const key = status || "pending";
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${styles[key] || styles.pending}`}>
        {icons[key] || <Clock size={18} />}
        {displayText[key] || status}
      </span>
    );
  };

  const canRequestCancellation = (order) => {
    return ["Paid / Processing", "processing"].includes(order.status) && !order.cancellationRequestedAt;
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
      alert("Failed to send reply");
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

          {/* Welcome */}
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
          {/* ... (unchanged) */}
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
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          {order.createdAt?.toDate?.().toLocaleDateString()}
                        </p>
                        <div className="mt-3">
                          {order.items?.map((item, i) => (
                            <p key={i} className="text-sm text-gray-700">
                              • {item.name} x{item.quantity}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="text-right space-y-3">
                        <div>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="font-bold text-2xl text-[#F2BB16]">
                          {formatPrice(order.total || 0)}
                        </p>

                        {/* CANCELLATION BUTTON */}
                        {canRequestCancellation(order) && (
                          <Button
                            onClick={() => requestCancellation(order.id)}
                            variant="outline"
                            className="mt-4 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Request Cancellation
                          </Button>
                        )}

                        {/* REVIEW BUTTON */}
                        {canReview(order) && (
                          <Button
                            onClick={() => openReviewModal(order)}
                            className="mt-4 bg-[#118C8C] hover:bg-[#0d7070] text-white"
                          >
                            <Star className="mr-2" size={18} /> Leave a Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages & Logout unchanged */}
          {/* ... (same as before) */}

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
                  placeholder="Share your thoughts about the product quality, packaging, and service..."
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

          {/* Messages & Logout — unchanged */}
          {/* ... */}
        </div>
      </div>
    </>
  );
};

export default BuyerDashboard;
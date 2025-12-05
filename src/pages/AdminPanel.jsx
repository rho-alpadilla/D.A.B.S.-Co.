// src/pages/AdminPanel.jsx ← FINAL: PRO ANALYTICS + TOP/LEAST SOLD + REVENUE
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { useCurrency } from '@/context/CurrencyContext';
import { auth, db } from '@/lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, updateDoc, 
  addDoc, serverTimestamp, getDoc, increment 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import {
  Package, ShoppingCart, TrendingUp, DollarSign,
  LogOut, Lock, CheckCircle, Mail, Circle, Send, X, 
  AlertCircle, Truck, Clock, Award, Zap
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");

  // ANALYTICS DATA
  const [productStats, setProductStats] = useState([]);

  useEffect(() => {
    if (!user) return;

    const unsubRole = onSnapshot(doc(db, "users", user.uid), snap => {
      setIsAdmin(snap.exists() && snap.data()?.role === "admin");
    });

    const unsubProducts = onSnapshot(collection(db, "pricelists"), snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubMessages = onSnapshot(
      query(collection(db, "messages"), orderBy("createdAt", "desc")),
      snap => {
        const allMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const grouped = {};
        allMessages.forEach(msg => {
          const key = msg.subject || "No Subject";
          if (!grouped[key]) {
            grouped[key] = { subject: key, messages: [], latestDate: msg.createdAt, buyerEmail: msg.buyerEmail, buyerName: msg.buyerName };
          }
          grouped[key].messages.push(msg);
          if (msg.createdAt > grouped[key].latestDate) grouped[key].latestDate = msg.createdAt;
        });
        const convos = Object.values(grouped).sort((a, b) =>
          (b.latestDate?.toDate?.() || 0) - (a.latestDate?.toDate?.() || 0)
        );
        setConversations(convos);
      }
    );

    return () => { unsubRole(); unsubProducts(); unsubOrders(); unsubMessages(); };
  }, [user]);

  // === ANALYTICS: CALCULATE PRODUCT STATS ===
  useEffect(() => {
    if (orders.length === 0 || products.length === 0) return;

    const statsMap = {};

    products.forEach(p => {
      statsMap[p.id] = {
        id: p.id,
        name: p.name,
        price: p.price,
        totalSold: p.totalSold || 0,
        revenue: 0,
        imageUrl: p.imageUrl
      };
    });

    // Process completed orders only
    orders
      .filter(o => o.status === "completed")
      .forEach(order => {
        order.items?.forEach(item => {
          if (statsMap[item.id]) {
            statsMap[item.id].revenue += item.price * item.quantity;
       }});
      });

    const statsArray = Object.values(statsMap)
      .sort((a, b) => b.totalSold - a.totalSold);

    setProductStats(statsArray);
  }, [orders, products]);

  // === ORDER STATUS LOGIC (unchanged) ===
  const handleCancellation = async (orderId, action) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      if (action === "approve") {
        for (const item of order.items || []) {
          const productRef = doc(db, "pricelists", item.id);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const data = productSnap.data();
            const newStock = (data.stockQuantity || 0) + item.quantity;
            await updateDoc(productRef, { stockQuantity: newStock, inStock: true });
          }
        }
        await updateDoc(doc(db, "orders", orderId), {
          status: "Cancelled – Pending Refund",
          cancelledAt: new Date(),
          cancelledBy: "admin"
        });
        alert("Cancellation approved! Stock returned.");
      }

      if (action === "refunded") {
        await updateDoc(doc(db, "orders", orderId), { status: "Refunded", refundedAt: new Date() });
        alert("Order marked as Refunded");
      }
    } catch (err) {
      alert("Failed to process cancellation");
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      if (newStatus === "completed") {
        const promises = (order.items || []).map(async (item) => {
          const productRef = doc(db, "pricelists", item.id);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const data = productSnap.data();
            const currentStock = data.stockQuantity || 0;
            const newStock = currentStock - item.quantity;
            if (newStock < 0) throw new Error(`Not enough stock for "${item.name}"`);
            await updateDoc(productRef, {
              stockQuantity: newStock,
              inStock: newStock > 0,
              totalSold: increment(item.quantity)
            });
          }
        });
        await Promise.all(promises);
      }

      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      alert(`Order marked as ${newStatus}!`);
    } catch (err) {
      alert(err.message || "Failed to update order");
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      "pending": { text: "Pending", color: "bg-yellow-100 text-yellow-700", icon: <Clock size={16} /> },
      "processing": { text: "Processing", color: "bg-blue-100 text-blue-700", icon: <Truck size={16} /> },
      "completed": { text: "Completed", color: "bg-green-100 text-green-700", icon: <CheckCircle size={16} /> },
      "Cancellation Requested": { text: "Cancellation Requested", color: "bg-orange-100 text-orange-700", icon: <AlertCircle size={16} /> },
      "Cancelled – Pending Refund": { text: "Pending Refund", color: "bg-red-100 text-red-700", icon: <AlertCircle size={16} /> },
      "Refunded": { text: "Refunded", color: "bg-purple-100 text-purple-700", icon: <CheckCircle size={16} /> },
      "cancelled": { text: "Cancelled", color: "bg-gray-100 text-gray-700", icon: <X size={16} /> }
    };
    const item = map[status] || map.pending;
    return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${item.color}`}>{item.icon} {item.text}</span>;
  };

  // === BASIC STATS ===
  const totalIncome = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.filter(o => o.status === "completed").length;
  orders.length;
  const avgOrderValue = totalOrders > 0 ? totalIncome / totalOrders : 0;

  // === CHARTS ===
  const revenueChartData = {
    labels: productStats.slice(0, 10).map(p => p.name.length > 15 ? p.name.substring(0,15)+"..." : p.name),
    datasets: [{
      label: 'Revenue',
      data: productStats.slice(0, 10).map(p => p.revenue),
      backgroundColor: 'rgba(17, 140, 140, 0.8)',
      borderColor: '#118C8C',
      borderWidth: 2
    }]
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Admin Panel - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border-l-4 border-[#118C8C] flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-[#118C8C] font-bold">ADMIN PANEL</div>
              <h1 className="text-3xl font-bold">Store Management</h1>
            </div>
            <Button variant="outline" onClick={() => signOut(auth).then(() => navigate("/"))} className="text-red-600">
              <LogOut className="mr-2" /> Logout
            </Button>
          </motion.div>

          <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* DASHBOARD */}
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <Package className="mx-auto text-purple-500 mb-4" size={48} />
                  <p className="text-5xl font-bold">{products.length}</p>
                  <p className="text-gray-600">Total Products</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <ShoppingCart className="mx-auto text-green-500 mb-4" size={48} />
                  <p className="text-5xl font-bold">{orders.length}</p>
                  <p className="text-gray-600">Total Orders</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <CheckCircle className="mx-auto text-blue-500 mb-4" size={48} />
                  <p className="text-5xl font-bold">{orders.filter(o => o.status === "completed").length}</p>
                  <p className="text-gray-600">Completed Orders</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <DollarSign className="mx-auto text-yellow-500 mb-4" size={48} />
                  <p className="text-5xl font-bold">{formatPrice(totalIncome)}</p>
                  <p className="text-gray-600">Total Income</p>
                </div>
              </div>
            </TabsContent>

            {/* ORDERS TAB */}
            <TabsContent value="orders">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <h2 className="text-2xl font-bold text-[#118C8C]">Customer Orders</h2>
                  <p className="text-gray-600">Manage orders and cancellations</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-4 text-left">Order ID</th>
                        <th className="p-4 text-left">Customer</th>
                        <th className="p-4 text-left">Items</th>
                        <th className="p-4 text-left">Total</th>
                        <th className="p-4 text-left">Status</th>
                        <th className="p-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-t hover:bg-gray-50">
                          <td className="p-4 font-medium">#{order.id.slice(0, 8)}</td>
                          <td className="p-4">{order.buyerEmail || "Guest"}</td>
                          <td className="p-4">
                            <ul className="text-sm">
                              {order.items?.map((item, i) => (
                                <li key={i}>• {item.name} (x{item.quantity})</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-4 font-bold">{formatPrice(order.total || 0)}</td>
                          <td className="p-4">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {["pending", "processing", "completed", "cancelled"].includes(order.status || "") && (
                                <select
                                  value={order.status || "pending"}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className="px-3 py-1 border rounded text-sm"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              )}

                              {order.status === "Cancellation Requested" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCancellation(order.id, "approve")}
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  Approve Cancellation
                                </Button>
                              )}

                              {order.status === "Cancelled – Pending Refund" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCancellation(order.id, "refunded")}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  Mark as Refunded
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {orders.length === 0 && (
                    <div className="p-20 text-center text-gray-500">
                      <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
                      <p>No orders yet</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          {/* MESSAGES TAB */}
            <TabsContent value="messages">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <h2 className="text-2xl font-bold text-[#118C8C]">Customer Messages</h2>
                  <p className="text-gray-600">Click a conversation to view and reply</p>
                </div>

                {conversations.length === 0 ? (
                  <div className="p-20 text-center text-gray-500">
                    <Mail size={64} className="mx-auto mb-4 text-gray-300" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
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
                                <p className="font-bold text-lg">{convo.buyerName}</p>
                                <p className="text-sm text-gray-600">{convo.buyerEmail}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {convo.latestDate?.toDate?.().toLocaleDateString()}
                              </p>
                              <p className="font-medium text-[#118C8C]">{convo.subject}</p>
                              {unreadCount > 0 && (
                                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                  {unreadCount} new
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* FULL CONVERSATION MODAL */}
            {selectedConversation && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-[#118C8C]">{selectedConversation.subject}</h2>
                        <p className="text-gray-600 mt-2">
                          Customer: {selectedConversation.buyerName} ({selectedConversation.buyerEmail})
                        </p>
                      </div>
                      <Button variant="ghost" onClick={() => setSelectedConversation(null)}>
                        <X size={24} />
                      </Button>
                    </div>

                    <div className="space-y-6 max-h-96 overflow-y-auto">
                      {selectedConversation.messages
                        .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
                        .map(msg => (
                          <div
                            key={msg.id}
                            className={`p-6 rounded-lg ${
                              msg.isAdminReply ? "bg-blue-50 ml-auto max-w-md" : "bg-gray-50 mr-auto max-w-md"
                            }`}
                          >
                            <p className="text-sm font-medium mb-2">
                              {msg.isAdminReply ? "You (Admin)" : msg.buyerName} • {msg.createdAt?.toDate?.().toLocaleString()}
                            </p>
                            <p className="text-gray-800">{msg.message}</p>
                          </div>
                        ))}
                    </div>

                    <div className="mt-10">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full px-4 py-3 border rounded-lg h-32"
                      />
                      <div className="flex justify-end gap-4 mt-6">
                        <Button variant="outline" onClick={() => setSelectedConversation(null)}>
                          Close
                        </Button>
                        <Button onClick={sendReply} className="bg-[#118C8C]">
                          <Send className="mr-2" /> Send Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ANALYTICS TAB — NOW INSANE */}
            <TabsContent value="analytics">
              <div className="space-y-12">

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-[#118C8C] to-[#0d7070] text-white p-8 rounded-2xl shadow-xl">
                    <DollarSign size={48} className="mb-4" />
                    <p className="text-4xl font-bold">{formatPrice(totalIncome)}</p>
                    <p className="text-lg opacity-90">Total Revenue</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-8 rounded-2xl shadow-xl">
                    <ShoppingCart size={48} className="mb-4" />
                    <p className="text-4xl font-bold">{totalOrders}</p>
                    <p className="text-lg opacity-90">Total Orders</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white p-8 rounded-2xl shadow-xl">
                    <TrendingUp size={48} className="mb-4" />
                    <p className="text-4xl font-bold">{formatPrice(avgOrderValue.toFixed(0))}</p>
                    <p className="text-lg opacity-90">Avg Order Value</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-8 rounded-2xl shadow-xl">
                    <Award size={48} className="mb-4" />
                    <p className="text-4xl font-bold">{productStats[0]?.totalSold || 0}</p>
                    <p className="text-lg opacity-90">Best Seller Units</p>
                  </div>
                </div>

                {/* TOP 10 BEST SELLERS */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <h3 className="text-3xl font-bold text-[#118C8C] mb-8 flex items-center gap-3">
                    <Award className="text-yellow-500" /> Top 10 Best Sellers
                  </h3>
                  <div className="space-y-4">
                    {productStats.slice(0, 10).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-gray-400 w-8">#{i+1}</span>
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <div className="bg-gray-200 w-full h-full" />}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{p.name}</p>
                            <p className="text-sm text-gray-600">{p.totalSold} units • {formatPrice(p.revenue)} revenue</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#F2BB16]">{formatPrice(p.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LEAST 10 SOLD */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <h3 className="text-3xl font-bold text-[#118C8C] mb-8">Least Sold Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productStats.slice(-10).reverse().map((p, i) => (
                      <div key={p.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 rounded overflow-hidden">
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <div className="bg-gray-200 w-full h-full" />}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-gray-600">{p.totalSold} sold • Stock: {p.stockQuantity || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* REVENUE BY PRODUCT CHART */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <h3 className="text-3xl font-bold text-[#118C8C] mb-8">Revenue by Product (Top 10)</h3>
                  <Bar data={revenueChartData} options={{ responsive: true, plugins: { legend: { display: false }}}} />
                </div>

                {/* INCOME PREDICTION */}
                <div className="bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white p-12 rounded-3xl shadow-2xl text-center">
                  <TrendingUp size={80} className="mx-auto mb-6" />
                  <h3 className="text-4xl font-bold mb-4">Next Month Prediction</h3>
                  <p className="text-7xl font-bold">{formatPrice(Math.round(totalIncome * 1.15))}</p>
                  <p className="text-2xl mt-6 opacity-90">+15% growth estimate</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
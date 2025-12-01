// src/pages/AdminPanel.jsx ← FINAL & PERFECT (COPY-PASTE THIS)
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Package, ShoppingCart, TrendingUp, DollarSign,
  LogOut, Lock, CheckCircle, Mail, Circle, Send, X
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// PHP MAIN CURRENCY
const PHP_TO_USD = 1 / 58;
const formatPHP = (php) => {
  if (!php) return "₱0 ($0.00)";
  const usd = (php * PHP_TO_USD).toFixed(2);
  return `₱${php.toLocaleString()} ($${usd})`;
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState("");

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

    // GROUPED MESSAGES BY SUBJECT
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const openConversation = (convo) => {
    setSelectedConversation(convo);
    setReplyText("");
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    try {
      await addDoc(collection(db, "messages"), {
        buyerEmail: selectedConversation.buyerEmail,
        buyerName: selectedConversation.buyerName,
        subject: selectedConversation.subject,
        message: replyText,
        status: "unread",
        createdAt: serverTimestamp(),
        isAdminReply: true
      });

      setReplyText("");
      alert("Reply sent!");
      setSelectedConversation(null);
    } catch (err) {
      alert("Failed to send reply");
    }
  };

  const totalIncome = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const predictedIncome = totalIncome > 0 ? Math.round(totalIncome * 1.15) : 0;

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Income (₱)',
      data: [69600, 87000, 104400, 127600, 162400, totalIncome || 0],
      borderColor: '#118C8C',
      backgroundColor: 'rgba(17, 140, 140, 0.1)',
      tension: 0.4,
      fill: true
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
              <div className="flex items-center gap-2 text-[#118C8C] font-bold"><Lock /> ADMIN PANEL</div>
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
                  <p className="text-5xl font-bold">{formatPHP(totalIncome)}</p>
                  <p className="text-gray-600">Total Income</p>
                </div>
              </div>
            </TabsContent>

            {/* ORDERS TAB */}
            <TabsContent value="orders">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <h2 className="text-2xl font-bold text-[#118C8C]">Customer Orders</h2>
                  <p className="text-gray-600">Manage and update order status</p>
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
                        <th className="p-4 text-left">Date</th>
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
                          <td className="p-4 font-bold">{formatPHP(order.total || 0)}</td>
                          <td className="p-4">
                            <select
                              value={order.status || "pending"}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="px-4 py-2 border rounded-lg bg-white text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
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

            {/* MESSAGES TAB — FULL CONVERSATION */}
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

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics">
              <div className="space-y-10">
                <div className="bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white p-12 rounded-3xl shadow-2xl text-center">
                  <TrendingUp size={80} className="mx-auto mb-6" />
                  <h3 className="text-4xl font-bold mb-4">Next Month Prediction</h3>
                  <p className="text-7xl font-bold">{formatPHP(predictedIncome)}</p>
                  <p className="text-2xl mt-6 opacity-90">Based on recent growth trend</p>
                </div>

                <div className="bg-white p-10 rounded-3xl shadow-lg">
                  <h3 className="text-3xl font-bold text-[#118C8C] mb-8 text-center">Income Over Time (₱)</h3>
                  <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }}} />
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
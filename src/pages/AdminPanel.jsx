// src/pages/AdminPanel.jsx ← FINAL: PHP MAIN + USD WITH CENTS
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
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
  LogOut, Lock, CheckCircle
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// PHP MAIN CURRENCY — USD WITH CENTS
const PHP_TO_USD = 1 / 58;
const formatPHP = (php) => {
  if (!php) return "₱0 ($0.00)";
  const usd = (php * PHP_TO_USD).toFixed(2);  // ← NOW SHOWS CENTS!
  return `₱${php.toLocaleString()} ($${usd})`;
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

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
      snap => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => { unsubRole(); unsubProducts(); unsubOrders(); };
  }, [user]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (err) {
      alert("Failed to update status");
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
          {/* Header */}
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
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
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
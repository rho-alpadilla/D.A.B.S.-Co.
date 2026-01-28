// src/pages/AdminPanel.jsx ← CLEANED: MESSAGES TAB REMOVED (now in ChatWidget only)
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { useCurrency } from '@/context/CurrencyContext';
import { auth, db } from '@/lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, updateDoc, 
  getDoc, increment 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Package, ShoppingCart, TrendingUp, DollarSign,
  LogOut, Lock, CheckCircle, Mail, Circle, Send, X, 
  AlertCircle, Truck, Clock, Award, Zap
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend);

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
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

    return () => { unsubRole(); unsubProducts(); unsubOrders(); };
  }, [user]);

  // ANALYTICS: PRODUCT STATS
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

    orders
      .filter(o => o.status === "completed")
      .forEach(order => {
        order.items?.forEach(item => {
          if (statsMap[item.id]) {
            statsMap[item.id].revenue += item.price * item.quantity;
          }
        });
      });

    const statsArray = Object.values(statsMap)
      .sort((a, b) => b.totalSold - a.totalSold);

    setProductStats(statsArray);
  }, [orders, products]);

  // ORDER STATUS LOGIC
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

  // BASIC STATS
  const totalIncome = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.filter(o => o.status === "completed").length;
  const avgOrderValue = totalOrders > 0 ? totalIncome / totalOrders : 0;

  // CHARTS
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

            {/* ANALYTICS TAB */}
<TabsContent value="analytics">
  <div className="space-y-8">
    {/* SUMMARY CARDS - compact & responsive */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-[#118C8C] to-[#0d7070] text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
        <DollarSign size={36} className="mb-3 opacity-90" />
        <p className="text-3xl font-bold">{formatPrice(totalIncome)}</p>
        <p className="text-sm opacity-90 mt-1">Total Revenue</p>
      </div>
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
        <ShoppingCart size={36} className="mb-3 opacity-90" />
        <p className="text-3xl font-bold">{totalOrders}</p>
        <p className="text-sm opacity-90 mt-1">Total Orders</p>
      </div>
      <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
        <TrendingUp size={36} className="mb-3 opacity-90" />
        <p className="text-3xl font-bold">{formatPrice(avgOrderValue.toFixed(0))}</p>
        <p className="text-sm opacity-90 mt-1">Avg Order Value</p>
      </div>
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
        <Award size={36} className="mb-3 opacity-90" />
        <p className="text-3xl font-bold">{productStats[0]?.totalSold || 0}</p>
        <p className="text-sm opacity-90 mt-1">Best Seller Units</p>
      </div>
    </div>

    {/* BEST + LEAST SELLERS - side-by-side, compact */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 10 Best Sellers */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-[#118C8C] mb-4 flex items-center gap-2">
          <Award className="text-yellow-500" size={24} /> Top 10 Best Sellers
        </h3>
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {productStats.slice(0, 10).map((p, i) => (
            <div 
              key={p.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg font-bold text-gray-400 w-6 shrink-0">#{i+1}</span>
                <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Img</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-600">{p.totalSold} units • {formatPrice(p.revenue)}</p>
                </div>
              </div>
              <p className="text-base font-bold text-[#F2BB16] whitespace-nowrap ml-3">
                {formatPrice(p.price)}
              </p>
            </div>
          ))}
          {productStats.length === 0 && (
            <p className="text-center text-gray-500 py-8">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Least Sold */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-[#118C8C] mb-4">Least Sold Products</h3>
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {productStats.slice(-10).reverse().map(p => (
            <div 
              key={p.id} 
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm"
            >
              <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-600">
                  {p.totalSold} sold • Stock: {p.stockQuantity || 0}
                </p>
              </div>
            </div>
          ))}
          {productStats.length === 0 && (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </div>
      </div>
    </div>

    {/* REVENUE CHART */}
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-[#118C8C] mb-4">Revenue by Product (Top 10)</h3>
      <div className="h-72">
        <Bar 
          data={revenueChartData} 
          options={{ 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true }
            }
          }} 
        />
      </div>
    </div>

    {/* INCOME PREDICTION - standout card */}
    <div className="bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white p-10 rounded-3xl shadow-2xl text-center border border-white/20">
      <TrendingUp size={64} className="mx-auto mb-4 opacity-90" />
      <h3 className="text-3xl font-bold mb-3">Next Month Forecast</h3>
      <p className="text-6xl font-extrabold">{formatPrice(Math.round(totalIncome * 1.15))}</p>
      <p className="text-xl mt-4 opacity-90">+15% estimated growth based on current trends</p>
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
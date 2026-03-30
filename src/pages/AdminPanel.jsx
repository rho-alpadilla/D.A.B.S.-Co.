// src/pages/AdminPanel.jsx
// UPDATED: Dashboard upgraded + Analytics upgraded (Date range filter + Revenue over time line chart + defendable forecast)
// UPDATED UI: Recent Orders section modernized into cards with summary chips
// UPDATED UI: Orders tab now has search + status filters + order details drawer
// UPDATED UI: Drawer now shows shipping address + payment method + delivery method

import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Package, ShoppingCart, TrendingUp, DollarSign,
  LogOut, CheckCircle, X,
  AlertCircle, Truck, Clock, Award,
  ArrowRight, User, CalendarDays, CreditCard, Search, Filter,
  Eye, X as CloseIcon, Mail, Hash, Box, ReceiptText,
  MapPin, Phone, Wallet
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [rangeDays, setRangeDays] = useState(30);
  const [tab, setTab] = useState("dashboard");
  const [productStats, setProductStats] = useState([]);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

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
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${item.color}`}>
        {item.icon} {item.text}
      </span>
    );
  };

  const completedOrders = useMemo(
    () => orders.filter(o => o.status === "completed"),
    [orders]
  );

  const filteredCompletedOrders = useMemo(() => {
    if (rangeDays === "all") return completedOrders;
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    return completedOrders.filter(o => {
      const d = o.createdAt?.toDate?.();
      return d && d.getTime() >= cutoff;
    });
  }, [completedOrders, rangeDays]);

  const totalIncome = useMemo(() => {
    return filteredCompletedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [filteredCompletedOrders]);

  const totalOrdersCompleted = useMemo(() => filteredCompletedOrders.length, [filteredCompletedOrders]);
  const avgOrderValue = totalOrdersCompleted > 0 ? totalIncome / totalOrdersCompleted : 0;

  useEffect(() => {
    if (products.length === 0) {
      setProductStats([]);
      return;
    }

    const statsMap = {};
    products.forEach(p => {
      statsMap[p.id] = {
        id: p.id,
        name: p.name,
        price: p.price,
        totalSold: 0,
        revenue: 0,
        imageUrl: p.imageUrl,
        stockQuantity: p.stockQuantity
      };
    });

    filteredCompletedOrders.forEach(order => {
      order.items?.forEach(item => {
        if (statsMap[item.id]) {
          statsMap[item.id].totalSold += item.quantity;
          statsMap[item.id].revenue += item.price * item.quantity;
        }
      });
    });

    const statsArray = Object.values(statsMap).sort((a, b) => b.totalSold - a.totalSold);
    setProductStats(statsArray);
  }, [filteredCompletedOrders, products]);

  const revenueChartData = useMemo(() => {
    const top = productStats.slice(0, 10);
    return {
      labels: top.map(p => p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name),
      datasets: [{
        label: 'Revenue',
        data: top.map(p => p.revenue),
        backgroundColor: 'rgba(17, 140, 140, 0.8)',
        borderColor: '#118C8C',
        borderWidth: 2
      }]
    };
  }, [productStats]);

  const revenueOverTimeData = useMemo(() => {
    const map = new Map();

    filteredCompletedOrders.forEach(o => {
      const d = o.createdAt?.toDate?.();
      if (!d) return;
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + (o.total || 0));
    });

    const labels = Array.from(map.keys()).sort();
    const values = labels.map(k => map.get(k));

    return {
      labels,
      datasets: [{
        label: "Daily Revenue",
        data: values,
        borderColor: "#118C8C",
        backgroundColor: "rgba(17, 140, 140, 0.15)",
        tension: 0.3,
        fill: true
      }]
    };
  }, [filteredCompletedOrders]);

  const forecast = useMemo(() => {
    const days = rangeDays === "all" ? 30 : rangeDays;

    const baselineOrders = rangeDays === "all"
      ? completedOrders.filter(o => {
          const d = o.createdAt?.toDate?.();
          return d && d.getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
        })
      : filteredCompletedOrders;

    const baseRevenue = baselineOrders.reduce((s, o) => s + (o.total || 0), 0);
    const avgDaily = days > 0 ? baseRevenue / days : 0;

    const growth = 0.15;
    const nextMonth = avgDaily * 30 * (1 + growth);

    return {
      avgDaily,
      nextMonth,
      growthPct: growth * 100,
      baseDays: days
    };
  }, [rangeDays, filteredCompletedOrders, completedOrders]);

  const formatDateTime = (ts) => {
    const d = ts?.toDate?.();
    if (!d) return "N/A";
    return d.toLocaleString();
  };

  const formatShortDate = (ts) => {
    const d = ts?.toDate?.();
    if (!d) return "N/A";
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortTime = (ts) => {
    const d = ts?.toDate?.();
    if (!d) return "";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPaymentMethod = (value) => {
    if (!value) return "Not specified";
    const map = {
      bank: "Bank Transfer",
      paypal: "PayPal",
      cod: "Cash on Delivery"
    };
    return map[value] || value.charAt(0).toUpperCase() + value.slice(1);
  };

  const formatDeliveryMethod = (value) => {
    if (!value) return "Not specified";
    const map = {
      courier: "Courier Shipping",
      pickup: "Local Pickup"
    };
    return map[value] || value.charAt(0).toUpperCase() + value.slice(1);
  };

  const formatFullShippingAddress = (shippingInfo) => {
    if (!shippingInfo) return "No shipping address saved.";
    const parts = [
      shippingInfo.street,
      shippingInfo.city,
      shippingInfo.stateProvince,
      shippingInfo.postalCode,
      shippingInfo.country,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : "No shipping address saved.";
  };

  const completedCountAll = completedOrders.length;
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const processingCount = orders.filter(o => o.status === "processing").length;
  const cancelledCount = orders.filter(o =>
    ["cancelled", "Cancelled – Pending Refund", "Refunded"].includes(o.status)
  ).length;
  const cancellationRequestedCount = orders.filter(o => o.status === "Cancellation Requested").length;

  const outOfStockCount = products.filter(p => (p.stockQuantity ?? 0) <= 0).length;
  const lowStockCount = products.filter(p => {
    const s = p.stockQuantity ?? 0;
    return s > 0 && s <= 5;
  }).length;

  const recentOrders = orders.slice(0, 8);
  const totalAllOrders = orders.length || 1;
  const pct = (n) => Math.round((n / totalAllOrders) * 100);

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        orderStatusFilter === 'all' ? true : (order.status || '') === orderStatusFilter;

      if (!matchesStatus) return false;
      if (!term) return true;

      const shortId = order.id?.slice(0, 8).toLowerCase() || '';
      const fullId = order.id?.toLowerCase() || '';
      const buyerEmail = (order.buyerEmail || 'guest').toLowerCase();
      const itemsText = (order.items || [])
        .map((item) => `${item.name || ''} ${item.quantity || ''}`)
        .join(' ')
        .toLowerCase();

      return (
        shortId.includes(term) ||
        fullId.includes(term) ||
        buyerEmail.includes(term) ||
        itemsText.includes(term)
      );
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const orderStatusOptions = [
    'all',
    'pending',
    'processing',
    'completed',
    'cancelled',
    'Cancellation Requested',
    'Cancelled – Pending Refund',
    'Refunded'
  ];

  const selectedOrderLive =
    selectedOrder ? orders.find((order) => order.id === selectedOrder.id) || selectedOrder : null;

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

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="space-y-6">
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
                    <p className="text-5xl font-bold">{completedCountAll}</p>
                    <p className="text-gray-600">Completed Orders</p>
                  </div>

                  <div className="bg-white p-8 rounded-xl shadow text-center">
                    <DollarSign className="mx-auto text-yellow-500 mb-4" size={48} />
                    <p className="text-5xl font-bold">
                      {formatPrice(
                        completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                      )}
                    </p>
                    <p className="text-gray-600">Total Income (All-Time)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="p-6 md:p-7 border-b bg-gradient-to-r from-[#118C8C]/10 via-white to-[#F2BB16]/10">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#118C8C]/10 text-[#118C8C] text-xs font-bold mb-3">
                            <ShoppingCart size={14} />
                            Live Order Feed
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                          <p className="text-gray-600 text-sm mt-1">
                            Latest customer activity with quick actions for fast admin work.
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setTab("orders")}
                          className="text-[#118C8C] border-[#118C8C] rounded-xl"
                        >
                          View all
                          <ArrowRight className="ml-2" size={16} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                        <div className="rounded-2xl bg-white border border-gray-100 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shown here</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{recentOrders.length}</p>
                          <p className="text-sm text-gray-500 mt-1">Most recent orders</p>
                        </div>

                        <div className="rounded-2xl bg-white border border-gray-100 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pending</p>
                          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
                          <p className="text-sm text-gray-500 mt-1">Orders waiting for action</p>
                        </div>

                        <div className="rounded-2xl bg-white border border-gray-100 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Processing</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">{processingCount}</p>
                          <p className="text-sm text-gray-500 mt-1">Orders currently being handled</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 md:p-6 space-y-4 bg-gray-50/60">
                      {recentOrders.length > 0 ? (
                        recentOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="inline-flex items-center rounded-full bg-[#118C8C]/10 text-[#118C8C] px-3 py-1 text-xs font-bold">
                                        #{order.id.slice(0, 8)}
                                      </span>
                                      {getStatusBadge(order.status)}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                      <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                                          <User size={18} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Customer</p>
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {order.buyerEmail || "Guest"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                                          <CalendarDays size={18} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Date</p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {formatShortDate(order.createdAt)}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            {formatShortTime(order.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 lg:text-right">
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-[#118C8C]/8 px-4 py-3">
                                      <CreditCard className="text-[#118C8C]" size={18} />
                                      <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total</p>
                                        <p className="text-lg font-bold text-gray-900">
                                          {formatPrice(order.total || 0)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="flex items-center justify-between gap-3 mb-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                      Items ({order.items?.length || 0})
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatDateTime(order.createdAt)}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {order.items?.length ? (
                                      order.items.slice(0, 4).map((item, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-medium"
                                        >
                                          {item.name} × {item.quantity}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-gray-500">No items listed</span>
                                    )}

                                    {(order.items?.length || 0) > 4 && (
                                      <span className="inline-flex items-center rounded-full bg-[#F2BB16]/15 text-[#9a7400] px-3 py-1.5 text-xs font-medium">
                                        +{order.items.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="lg:w-[190px] shrink-0">
                                <div className="flex flex-col gap-2">
                                  {order.status !== "completed" && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateOrderStatus(order.id, "completed")}
                                      className="w-full bg-[#118C8C] hover:bg-[#0d7070] text-white rounded-xl"
                                    >
                                      Mark Completed
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setTab("orders");
                                      setSelectedOrder(order);
                                    }}
                                    className="w-full rounded-xl"
                                  >
                                    Open Full Order
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">
                          <ShoppingCart size={56} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-semibold text-gray-700">No recent orders yet</p>
                          <p className="text-sm mt-1">New customer orders will show up here automatically.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-[#118C8C] mb-3">Needs Attention</h3>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="text-yellow-600" size={18} />
                            <span>Pending orders</span>
                          </div>
                          <button
                            className="text-sm font-bold text-[#118C8C] hover:underline"
                            onClick={() => setTab("orders")}
                          >
                            {pendingCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="text-orange-600" size={18} />
                            <span>Cancellation requests</span>
                          </div>
                          <button
                            className="text-sm font-bold text-[#118C8C] hover:underline"
                            onClick={() => setTab("orders")}
                          >
                            {cancellationRequestedCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <X className="text-red-600" size={18} />
                            <span>Out of stock</span>
                          </div>
                          <button
                            className="text-sm font-bold text-[#118C8C] hover:underline"
                            onClick={() => setTab("analytics")}
                          >
                            {outOfStockCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="text-yellow-600" size={18} />
                            <span>Low stock (≤ 5)</span>
                          </div>
                          <button
                            className="text-sm font-bold text-[#118C8C] hover:underline"
                            onClick={() => setTab("analytics")}
                          >
                            {lowStockCount}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-[#118C8C] mb-3">Quick Actions</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <Button onClick={() => setTab("orders")} className="bg-[#118C8C] hover:bg-[#0d7070] text-white">
                          Manage Orders
                        </Button>
                        <Button variant="outline" onClick={() => setTab("analytics")}>
                          View Analytics
                        </Button>
                        <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                          Back to Top
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Tip: Use “Needs Attention” for priority tasks.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-[#118C8C] mb-3">Order Status Breakdown</h3>

                      <div className="space-y-3 text-sm">
                        {[
                          { label: "Pending", value: pendingCount, bar: "bg-yellow-400" },
                          { label: "Processing", value: processingCount, bar: "bg-blue-400" },
                          { label: "Completed", value: completedCountAll, bar: "bg-green-500" },
                          { label: "Cancelled/Refund", value: cancelledCount, bar: "bg-gray-500" },
                        ].map(row => (
                          <div key={row.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-700">{row.label}</span>
                              <span className="font-bold">{row.value} ({pct(row.value)}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${row.bar}`} style={{ width: `${pct(row.value)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gray-50 space-y-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[#118C8C]">Customer Orders</h2>
                      <p className="text-gray-600">Manage orders, cancellations, and status updates</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 min-w-[120px]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-900">{orders.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 min-w-[120px]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Showing</p>
                        <p className="text-xl font-bold text-[#118C8C]">{filteredOrders.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                    <div className="relative">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search by order ID, customer email, or item name..."
                        className="w-full border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                      />
                    </div>

                    <div className="relative">
                      <Filter
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status === 'all' ? 'All statuses' : status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-4 text-left">Date Ordered</th>
                        <th className="p-4 text-left">Order ID</th>
                        <th className="p-4 text-left">Customer</th>
                        <th className="p-4 text-left">Items</th>
                        <th className="p-4 text-left">Total</th>
                        <th className="p-4 text-left">Status</th>
                        <th className="p-4 text-left">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map(order => (
                        <tr
                          key={order.id}
                          className="border-t hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="p-4 text-sm text-gray-700">
                            {order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </td>

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
                          <td className="p-4">{getStatusBadge(order.status)}</td>
                          <td className="p-4">
                            <div
                              className="flex flex-wrap gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="mr-2" size={14} />
                                View Details
                              </Button>

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

                  {orders.length > 0 && filteredOrders.length === 0 && (
                    <div className="p-20 text-center text-gray-500">
                      <Search size={56} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-semibold text-gray-700">No matching orders</p>
                      <p className="text-sm mt-1">
                        Try a different search term or change the status filter.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-[#118C8C]">Analytics</h2>
                    <p className="text-gray-600 text-sm">
                      Showing <span className="font-bold">{rangeDays === "all" ? "All Time" : `Last ${rangeDays} Days`}</span> (completed orders)
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "7D", value: 7 },
                      { label: "30D", value: 30 },
                      { label: "90D", value: 90 },
                      { label: "All", value: "all" },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        onClick={() => setRangeDays(btn.value)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                          rangeDays === btn.value
                            ? "bg-[#118C8C] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-[#118C8C] to-[#0d7070] text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                    <DollarSign size={36} className="mb-3 opacity-90" />
                    <p className="text-3xl font-bold">{formatPrice(totalIncome)}</p>
                    <p className="text-sm opacity-90 mt-1">Total Revenue</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                    <ShoppingCart size={36} className="mb-3 opacity-90" />
                    <p className="text-3xl font-bold">{totalOrdersCompleted}</p>
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

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-xl font-bold text-[#118C8C] mb-4">Revenue Over Time</h3>
                  <div className="h-72">
                    <Line
                      data={revenueOverTimeData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Based on completed orders in the selected time range.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            <span className="text-lg font-bold text-gray-400 w-6 shrink-0">#{i + 1}</span>
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

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-xl font-bold text-[#118C8C] mb-4">Revenue by Product (Top 10)</h3>
                  <div className="h-72">
                    <Bar
                      data={revenueChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                      }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white p-10 rounded-3xl shadow-2xl text-center border border-white/20">
                  <TrendingUp size={64} className="mx-auto mb-4 opacity-90" />
                  <h3 className="text-3xl font-bold mb-3">Next Month Forecast</h3>
                  <p className="text-6xl font-extrabold">{formatPrice(Math.round(forecast.nextMonth))}</p>
                  <p className="text-xl mt-4 opacity-90">
                    Based on avg daily revenue ({formatPrice(forecast.avgDaily.toFixed(0))}) over last {forecast.baseDays} days • +{forecast.growthPct}% growth
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrderLive && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            />

            <motion.div
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
            >
              <div className="px-6 py-5 border-b bg-gradient-to-r from-[#118C8C]/10 via-white to-[#F2BB16]/10 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#118C8C]/10 text-[#118C8C] text-xs font-bold mb-3">
                    <ReceiptText size={14} />
                    Order Details
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    #{selectedOrderLive.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Full order summary and quick admin actions
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/60">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Status</p>
                    <div className="mt-2">{getStatusBadge(selectedOrderLive.status)}</div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total</p>
                    <p className="text-xl font-bold text-gray-900 mt-2">
                      {formatPrice(selectedOrderLive.total || 0)}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Items</p>
                    <p className="text-xl font-bold text-gray-900 mt-2">
                      {selectedOrderLive.items?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-lg font-bold text-[#118C8C] mb-4">Customer & Order Info</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <Mail size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Customer</p>
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {selectedOrderLive.buyerName || "Guest Buyer"}
                        </p>
                        <p className="text-sm text-gray-600 break-all mt-0.5">
                          {selectedOrderLive.buyerEmail || "Guest"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <Hash size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Order ID</p>
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {selectedOrderLive.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <CalendarDays size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Date Ordered</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(selectedOrderLive.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <Wallet size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Payment Method</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatPaymentMethod(selectedOrderLive.paymentMethod)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Delivery: {formatDeliveryMethod(selectedOrderLive.deliveryMethod)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-lg font-bold text-[#118C8C] mb-4">Shipping Address</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Recipient</p>
                        <p className="text-sm font-medium text-gray-900">
                          {`${selectedOrderLive.shippingInfo?.firstName || ""} ${selectedOrderLive.shippingInfo?.lastName || ""}`.trim() || selectedOrderLive.buyerName || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Phone</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedOrderLive.shippingInfo?.phone || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Email</p>
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {selectedOrderLive.shippingInfo?.email || selectedOrderLive.buyerEmail || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Full Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatFullShippingAddress(selectedOrderLive.shippingInfo)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-lg font-bold text-[#118C8C] mb-4">Items Ordered</h4>

                  <div className="space-y-3">
                    {selectedOrderLive.items?.length ? (
                      selectedOrderLive.items.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                              <Box size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 break-words">
                                {item.name || 'Unnamed item'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Quantity: {item.quantity || 0}
                              </p>
                              <p className="text-sm text-gray-600">
                                Unit Price: {formatPrice(item.price || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Line Total</p>
                            <p className="font-bold text-gray-900 mt-1">
                              {formatPrice((item.price || 0) * (item.quantity || 0))}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No items found for this order.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h4 className="text-lg font-bold text-[#118C8C] mb-4">Admin Actions</h4>

                  <div className="flex flex-wrap gap-3">
                    {["pending", "processing", "completed", "cancelled"].includes(selectedOrderLive.status || "") && (
                      <select
                        value={selectedOrderLive.status || "pending"}
                        onChange={(e) => updateOrderStatus(selectedOrderLive.id, e.target.value)}
                        className="px-4 py-2 border rounded-xl text-sm bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}

                    {selectedOrderLive.status !== "completed" && (
                      <Button
                        onClick={() => updateOrderStatus(selectedOrderLive.id, "completed")}
                        className="bg-[#118C8C] hover:bg-[#0d7070] text-white rounded-xl"
                      >
                        Mark Completed
                      </Button>
                    )}

                    {selectedOrderLive.status === "Cancellation Requested" && (
                      <Button
                        onClick={() => handleCancellation(selectedOrderLive.id, "approve")}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                      >
                        Approve Cancellation
                      </Button>
                    )}

                    {selectedOrderLive.status === "Cancelled – Pending Refund" && (
                      <Button
                        onClick={() => handleCancellation(selectedOrderLive.id, "refunded")}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                      >
                        Mark as Refunded
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t bg-white p-4 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedOrder(null)} className="rounded-xl">
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminPanel;
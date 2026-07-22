
// src/pages/AdminPanel.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { useCurrency } from '@/context/CurrencyContext';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  increment,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
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
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CheckCircle,
  X,
  AlertCircle,
  Truck,
  Clock,
  Award,
  ArrowRight,
  User,
  CalendarDays,
  CreditCard,
  Search,
  Filter,
  Eye,
  X as CloseIcon,
  Mail,
  Hash,
  Box,
  ReceiptText,
  MapPin,
  Phone,
  Wallet
} from "lucide-react";
import { createNotification } from '@/lib/notifications';
import AdminOverviewTab from './AdminOverviewTab';
import AdminOrdersTab from './AdminOrdersTab';
import AdminUsersTab from './AdminUsersTab';
import AdminAnalyticsTab from './AdminAnalyticsTab';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const REVIEW_ENTRY_STATUSES = ["pending", "pending_review"];
const POST_REVIEW_WORKFLOW_STATUSES = ["on_review", "payment_confirmed", "processing", "shipping", "completed", "cancelled"];

const isAwaitingReview = (status) => REVIEW_ENTRY_STATUSES.includes(status || "pending");
const isPostReviewWorkflow = (status) => POST_REVIEW_WORKFLOW_STATUSES.includes(status || "");
const isDeclinedOrder = (status) => status === "declined";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [role, setRole] = useState(null);
  const isAdmin = role === "admin";
  const isSubAdmin = role === "sub-admin";

  const subAdminAllowedStatuses = [
    "on_review",
    "payment_confirmed",
    "processing",
    "shipping"
  ];

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [rangeDays, setRangeDays] = useState(30);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [tab, setTab] = useState("dashboard");
  const [productStats, setProductStats] = useState([]);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubRole = onSnapshot(doc(db, "users", user.uid), snap => {
      if (snap.exists()) {
        setRole(snap.data()?.role || null);
      } else {
        setRole(null);
      }
    });

    const unsubProducts = onSnapshot(collection(db, "pricelists"), snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubRole();
      unsubProducts();
      unsubOrders();
    };
  }, [user]);

  const notifyBuyerStatusChange = async (order, newStatus) => {
    if (!order?.buyerId) return;

    const statusTitles = {
      pending_review: "Order Awaiting Review",
      on_review: "Order On Review",
      declined: "Order Declined",
      payment_confirmed: "Payment Confirmed",
      processing: "Order Processing",
      shipping: "Order Shipped",
      completed: "Order Completed",
      cancelled: "Order Cancelled",
    };

    await createNotification({
      uid: order.buyerId,
      type: "order",
      title: statusTitles[newStatus] || "Order Updated",
      body: `Your order #${order.id.slice(0, 8)} is now ${newStatus.replace(/_/g, " ")}.`,
      link: "/buyer-dashboard",
      orderId: order.id,
    });
  };

  const handleCancellation = async (orderId, action) => {
    if (!isAdmin) {
      alert("Permission blocked. Contact Main admin for this action.");
      return;
    }

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
        await updateDoc(doc(db, "orders", orderId), {
          status: "Refunded",
          refundedAt: new Date()
        });
        alert("Order marked as Refunded");
      }
    } catch (err) {
      alert("Failed to process cancellation");
      console.error(err);
    }
  };

  const handleReviewOrder = async (order, openDrawer = false) => {
    if (!order) return;

    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "on_review",
        reviewedAt: new Date(),
        updatedAt: new Date()
      });

      await notifyBuyerStatusChange(order, "on_review");

      if (openDrawer) {
        setTab("orders");
        setSelectedOrder({ ...order, status: "on_review" });
      }

      alert("Order is now on review.");
    } catch (err) {
      alert("Failed to mark order as on review.");
      console.error(err);
    }
  };

  const handleDeclineOrder = async (order, closeDrawer = false) => {
    if (!order) return;

    const confirmed = window.confirm(`Decline order #${order.id.slice(0, 8)}?`);
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "declined",
        declinedAt: new Date(),
        updatedAt: new Date()
      });

      await notifyBuyerStatusChange(order, "declined");

      if (closeDrawer) {
        setSelectedOrder(null);
      }

      alert("Order declined.");
    } catch (err) {
      alert("Failed to decline order.");
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentStatus = order.status || "pending";

    if (isSubAdmin && !subAdminAllowedStatuses.includes(newStatus)) {
      alert("Permission blocked. Contact Main admin for this action.");
      return;
    }

    try {
      if (newStatus === "completed" && currentStatus !== "completed") {
        const promises = (order.items || []).map(async (item) => {
          const productRef = doc(db, "pricelists", item.id);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const data = productSnap.data();
            const currentStock = data.stockQuantity || 0;
            const nextStock = currentStock - item.quantity;

            if (nextStock < 0) {
              throw new Error(`Not enough stock for "${item.name}"`);
            }

            await updateDoc(productRef, {
              stockQuantity: nextStock,
              inStock: nextStock > 0,
              totalSold: increment(item.quantity)
            });
          }
        });

        await Promise.all(promises);
      }

      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date()
      });

      await notifyBuyerStatusChange(order, newStatus);

      alert(`Order marked as ${newStatus.replace(/_/g, " ")}!`);
    } catch (err) {
      alert(err.message || "Failed to update order");
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: {
        text: "Awaiting Review",
        color: "bg-yellow-100 text-yellow-700",
        icon: <Clock size={16} />
      },
      pending_review: {
        text: "Awaiting Review",
        color: "bg-yellow-100 text-yellow-700",
        icon: <Clock size={16} />
      },
      on_review: {
        text: "On Review",
        color: "bg-blue-100 text-blue-700",
        icon: <Eye size={16} />
      },
      payment_confirmed: {
        text: "Payment Confirmed",
        color: "bg-emerald-100 text-emerald-700",
        icon: <CheckCircle size={16} />
      },
      processing: {
        text: "Processing",
        color: "bg-sky-100 text-sky-700",
        icon: <Package size={16} />
      },
      shipping: {
        text: "Shipping",
        color: "bg-cyan-100 text-cyan-700",
        icon: <Truck size={16} />
      },
      completed: {
        text: "Completed",
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle size={16} />
      },
      declined: {
        text: "Declined",
        color: "bg-red-100 text-red-700",
        icon: <X size={16} />
      },
      "Cancellation Requested": {
        text: "Cancellation Requested",
        color: "bg-orange-100 text-orange-700",
        icon: <AlertCircle size={16} />
      },
      "Cancelled – Pending Refund": {
        text: "Pending Refund",
        color: "bg-red-100 text-red-700",
        icon: <AlertCircle size={16} />
      },
      Refunded: {
        text: "Refunded",
        color: "bg-purple-100 text-purple-700",
        icon: <CheckCircle size={16} />
      },
      cancelled: {
        text: "Cancelled",
        color: "bg-gray-100 text-gray-700",
        icon: <X size={16} />
      }
    };

    const item = map[status] || map.pending;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${item.color}`}>
        {item.icon} {item.text}
      </span>
    );
  };

  const formatStatusOptionLabel = (status) => {
    const labels = {
      all: "All statuses",
      awaiting_review: "Awaiting Review",
      on_review: "On Review",
      payment_confirmed: "Payment Confirmed",
      processing: "Processing",
      shipping: "Shipping",
      completed: "Completed",
      declined: "Declined",
      cancelled: "Cancelled",
      "Cancellation Requested": "Cancellation Requested",
      "Cancelled – Pending Refund": "Pending Refund",
      Refunded: "Refunded"
    };

    return labels[status] || status;
  };

  const completedOrders = useMemo(
    () => orders.filter(o => o.status === "completed"),
    [orders]
  );

  const filteredCompletedOrders = useMemo(() => {
    if (!customStartDate || !customEndDate) {
      return [];
    }

    const start = new Date(`${customStartDate}T00:00:00`);
    const end = new Date(`${customEndDate}T23:59:59`);

    return completedOrders.filter((o) => {
      const d = o.createdAt?.toDate?.();
      return d && d >= start && d <= end;
    });
  }, [completedOrders, customStartDate, customEndDate]);

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
    if (!customStartDate || !customEndDate) {
      return {
        avgDaily: 0,
        nextMonth: 0,
        growthPct: 0,
        baseDays: 0
      };
    }

    const start = new Date(`${customStartDate}T00:00:00`);
    const end = new Date(`${customEndDate}T23:59:59`);
    const diffDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const baseRevenue = filteredCompletedOrders.reduce((s, o) => s + (o.total || 0), 0);
    const avgDaily = diffDays > 0 ? baseRevenue / diffDays : 0;

    return {
      avgDaily,
      nextMonth: avgDaily * 30,
      growthPct: 0,
      baseDays: diffDays
    };
  }, [filteredCompletedOrders, customStartDate, customEndDate]);

  const fetchUsers = async () => {
    setLoadingUsers(true);

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));

      const usersList = usersSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      console.log("Loaded users:", usersList);
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert(`Failed to load users: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (tab === "users") {
      fetchUsers();
    }
  }, [tab]);

  const makeSubAdmin = async (userId) => {
    if (!isAdmin) {
      alert("Permission blocked. Only the main admin can manage Sub-admin accounts.");
      return;
    }

    if (userId === user?.uid) {
      alert("You cannot change your own admin role here.");
      return;
    }

    const confirmed = window.confirm("Make this user a Sub-admin / Artisan?");
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        role: "sub-admin",
        promotedBy: user.uid,
        promotedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("User is now a Sub-admin.");
      fetchUsers();
    } catch (error) {
      console.error("Error making sub-admin:", error);
      alert("Failed to make user a Sub-admin.");
    }
  };

  const removeSubAdmin = async (userId) => {
    if (!isAdmin) {
      alert("Permission blocked. Only the main admin can manage Sub-admin accounts.");
      return;
    }

    if (userId === user?.uid) {
      alert("You cannot change your own admin role here.");
      return;
    }

    const confirmed = window.confirm("Remove this user's Sub-admin access?");
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        role: "buyer",
        removedBy: user.uid,
        removedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Sub-admin access removed.");
      fetchUsers();
    } catch (error) {
      console.error("Error removing sub-admin:", error);
      alert("Failed to remove Sub-admin access.");
    }
  };

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    return users.filter((u) => {
      if (!search) return true;

      return (
        u.name?.toLowerCase().includes(search) ||
        u.displayName?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.role?.toLowerCase().includes(search)
      );
    });
  }, [users, userSearch]);

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
  const awaitingReviewCount = orders.filter(o => isAwaitingReview(o.status)).length;
  const onReviewCount = orders.filter(o => o.status === "on_review").length;
  const paymentConfirmedCount = orders.filter(o => o.status === "payment_confirmed").length;
  const processingCount = orders.filter(o => o.status === "processing").length;
  const shippingCount = orders.filter(o => o.status === "shipping").length;
  const declinedCount = orders.filter(o => o.status === "declined").length;
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
        orderStatusFilter === 'all'
          ? true
          : orderStatusFilter === 'awaiting_review'
            ? isAwaitingReview(order.status)
            : (order.status || '') === orderStatusFilter;

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
    'awaiting_review',
    'on_review',
    'payment_confirmed',
    'processing',
    'shipping',
    'completed',
    'declined',
    'cancelled',
    'Cancellation Requested',
    'Cancelled – Pending Refund',
    'Refunded'
  ];

  const selectedOrderLive =
    selectedOrder ? orders.find((order) => order.id === selectedOrder.id) || selectedOrder : null;

  if (!user || (role !== "admin" && role !== "sub-admin")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You must be an admin or sub-admin to view this page.</p>
        </div>
      </div>
    );
  }


  const adminState = {
    avgOrderValue,
    awaitingReviewCount,
    cancellationRequestedCount,
    cancelledCount,
    completedCountAll,
    completedOrders,
    customEndDate,
    customStartDate,
    declinedCount,
    fetchUsers,
    filteredCompletedOrders,
    filteredOrders,
    filteredUsers,
    forecast,
    formatDateTime,
    formatDeliveryMethod,
    formatFullShippingAddress,
    formatPaymentMethod,
    formatPrice,
    formatShortDate,
    formatShortTime,
    formatStatusOptionLabel,
    getStatusBadge,
    handleCancellation,
    handleDeclineOrder,
    handleReviewOrder,
    isAdmin,
    isSubAdmin,
    loadingUsers,
    lowStockCount,
    makeSubAdmin,
    navigate,
    notifyBuyerStatusChange,
    onReviewCount,
    orderSearch,
    orderStatusFilter,
    orderStatusOptions,
    orders,
    outOfStockCount,
    paymentConfirmedCount,
    processingCount,
    productStats,
    products,
    rangeDays,
    recentOrders,
    removeSubAdmin,
    revenueChartData,
    revenueOverTimeData,
    role,
    selectedOrder,
    setCustomEndDate,
    setCustomStartDate,
    setLoadingUsers,
    setOrderSearch,
    setOrderStatusFilter,
    setOrders,
    setProductStats,
    setProducts,
    setRangeDays,
    setRole,
    setSelectedOrder,
    setTab,
    setUserSearch,
    setUsers,
    shippingCount,
    subAdminAllowedStatuses,
    tab,
    totalAllOrders,
    totalIncome,
    totalOrdersCompleted,
    updateOrderStatus,
    user,
    userSearch,
    users,
  };

  return (
    <>
      <Helmet><title>Admin Panel - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-8 flex flex-col gap-4 rounded-2xl border-l-4 border-[#118C8C] bg-white p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <div className="flex items-center gap-2 text-[#118C8C] font-bold">
                {isAdmin ? "ADMIN PANEL" : "SUB-ADMIN PANEL"}
              </div>
              <h1 className="text-3xl font-bold">Store Management</h1>
            </div>
          </motion.div>

          <div className="mb-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">Orders Banner</p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                Orders awaiting review: {awaitingReviewCount}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                New orders must be reviewed first before normal admin actions appear.
              </p>
            </div>

            <Button
              onClick={() => {
                setTab("orders");
                setOrderStatusFilter("awaiting_review");
              }}
              className="h-12 w-full rounded-xl bg-[#118C8C] px-5 py-0 text-white hover:bg-[#0d7070] md:w-auto"
            >
              Review Orders
            </Button>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <AdminOverviewTab {...adminState} />
            </TabsContent>

            <TabsContent value="orders">
              <AdminOrdersTab {...adminState} />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsersTab {...adminState} />
            </TabsContent>

            <TabsContent value="analytics">
              <AdminAnalyticsTab {...adminState} />
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
                    {isAwaitingReview(selectedOrderLive.status) ? (
                      <>
                        <Button
                          onClick={() => handleReviewOrder(selectedOrderLive, false)}
                          className="bg-[#118C8C] hover:bg-[#0d7070] text-white rounded-xl"
                        >
                          Review Order
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleDeclineOrder(selectedOrderLive, true)}
                          className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Decline
                        </Button>
                      </>
                    ) : isPostReviewWorkflow(selectedOrderLive.status) ? (
                      isAdmin ? (
                        <select
                          value={selectedOrderLive.status || "on_review"}
                          onChange={(e) => updateOrderStatus(selectedOrderLive.id, e.target.value)}
                          className="px-4 py-2 border rounded-xl text-sm bg-white"
                        >
                          <option value="on_review">On Review</option>
                          <option value="payment_confirmed">Payment Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipping">Shipping</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        subAdminAllowedStatuses.includes(selectedOrderLive.status || "on_review") ? (
                          <select
                            value={selectedOrderLive.status || "on_review"}
                            onChange={(e) => updateOrderStatus(selectedOrderLive.id, e.target.value)}
                            className="px-4 py-2 border rounded-xl text-sm bg-white"
                          >
                            <option value="on_review">On Review</option>
                            <option value="payment_confirmed">Payment Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipping">Shipping</option>
                          </select>
                        ) : (
                          <div className="px-4 py-2 border rounded-xl text-sm bg-gray-50 text-gray-500">
                            Status locked for sub-admin
                          </div>
                        )
                      )
                    ) : isDeclinedOrder(selectedOrderLive.status) ? (
                      <div className="px-4 py-2 border rounded-xl text-sm bg-red-50 text-red-600">
                        This order has been declined.
                      </div>
                    ) : null}

                    {isAdmin && selectedOrderLive.status === "Cancellation Requested" && (
                      <Button
                        onClick={() => handleCancellation(selectedOrderLive.id, "approve")}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                      >
                        Approve Cancellation
                      </Button>
                    )}

                    {isAdmin && selectedOrderLive.status === "Cancelled – Pending Refund" && (
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

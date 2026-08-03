
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
  doc,
  updateDoc,
  getDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
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
import {
  isAwaitingReview,
  isDeclinedOrder,
  isPostReviewWorkflow,
} from './orderStatus';
import { ACCOUNT_APPROVAL_STATUSES, lockAccountAfterApprovedPurchase } from '@/lib/accountLifecycle';
import {
  buildDiagnosticAnalytics,
  buildDescriptiveAnalytics,
  buildPrescriptiveRecommendations,
  buildTrendForecast,
  createProductRevenueChartData,
  createRevenueOverTimeChartData,
} from '@/lib/analytics/descriptiveAnalytics';
import { validateOrderForAnalytics } from '@/lib/analytics/orderDataQuality';
import {
  archiveOrder,
  permanentlyDeleteReviewedInvalidOrder,
  restoreArchivedOrder,
} from '@/lib/orders/orderLifecycle';
import OrderLifecycleDialog from '@/components/admin/OrderLifecycleDialog';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Title, Tooltip, Legend);

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

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderView, setOrderView] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lifecycleDialog, setLifecycleDialog] = useState(null);
  const [isLifecycleSubmitting, setIsLifecycleSubmitting] = useState(false);

  const [userSearch, setUserSearch] = useState('');
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
      collection(db, "orders"),
      (snap) => {
        const toMillis = (value) => {
          if (typeof value?.toMillis === 'function') return value.toMillis();
          if (typeof value?.toDate === 'function') return value.toDate().getTime();
          const parsed = new Date(value || 0).getTime();
          return Number.isFinite(parsed) ? parsed : 0;
        };

        setOrders(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
        );
      },
      (error) => console.error('Failed to load admin orders:', error)
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

  const handleCancellation = async (orderOrId, action) => {
    if (!isAdmin) {
      alert("Permission blocked. Contact Main admin for this action.");
      return;
    }

    const order = typeof orderOrId === 'string'
      ? orders.find((existingOrder) => existingOrder.id === orderOrId)
      : orderOrId;
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
        await updateDoc(doc(db, "orders", order.id), {
          status: "Cancelled – Pending Refund",
          cancelledAt: new Date(),
          cancelledBy: "admin"
        });
        alert("Cancellation approved! Stock returned.");
      }

      if (action === "refunded") {
        await updateDoc(doc(db, "orders", order.id), {
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

  const handleReviewDataQualityOrder = async (orderId) => {
    if (!isAdmin) {
      alert("Permission blocked. Only the main admin can review data-quality records.");
      return;
    }

    const order = orders.find((existingOrder) => existingOrder.id === orderId);
    if (!order) {
      alert("This order is no longer available. Refresh the analytics page and try again.");
      return;
    }

    const validation = validateOrderForAnalytics(order);
    if (validation.isValid) {
      alert("This order no longer has a data-quality issue.");
      return;
    }

    if (order.dataQualityReview?.reviewedBy) {
      alert(
        order.dataQualityReview.reviewedBy === user.uid
          ? "You already reviewed this data-quality record."
          : "Another main admin already reviewed this data-quality record."
      );
      return;
    }

    try {
      await updateDoc(doc(db, "orders", order.id), {
        "dataQualityReview.reviewedBy": user.uid,
        "dataQualityReview.reviewedAt": serverTimestamp(),
        updatedAt: new Date(),
      });

      setSelectedOrder(order);
      alert("Data-quality review recorded. Check the order details, then return to the analytics queue if deletion is still required.");
    } catch (error) {
      console.error("Failed to record data-quality review:", error);
      alert("Unable to record the review. Please try again.");
    }
  };

  const handleDeleteDataQualityOrder = async (orderId) => {
    if (!isAdmin) {
      alert("Permission blocked. Only the main admin can delete data-quality records.");
      return;
    }

    const order = orders.find((existingOrder) => existingOrder.id === orderId);
    if (!order) {
      alert("This order is no longer available. Refresh the analytics page and try again.");
      return;
    }

    const validation = validateOrderForAnalytics(order);
    if (validation.isValid) {
      alert("This order no longer belongs in the data-quality queue and cannot be deleted from this screen.");
      return;
    }

    if (order.dataQualityReview?.reviewedBy !== user.uid) {
      alert("Review this order first. Only the main admin who recorded the latest data-quality review can delete it.");
      return;
    }

    setLifecycleDialog({ action: 'delete', order });
  };

  const openOrderLifecycleDialog = (action, order) => {
    if (!isAdmin) {
      alert('Permission blocked. Only the main admin can manage archived orders.');
      return;
    }
    if (order) setLifecycleDialog({ action, order });
  };

  const handleLifecycleDialogConfirm = async ({ reason, confirmation }) => {
    if (!isAdmin || !user?.uid || !lifecycleDialog?.order) {
      alert('Permission blocked. Only the main admin can complete this action.');
      return;
    }

    const currentOrder = orders.find((order) => order.id === lifecycleDialog.order.id);
    if (!currentOrder) {
      alert('This order is no longer available. Refresh and try again.');
      setLifecycleDialog(null);
      return;
    }

    setIsLifecycleSubmitting(true);
    try {
      if (lifecycleDialog.action === 'archive') {
        await archiveOrder({ order: currentOrder, actorUid: user.uid, reason });
        alert(`Order #${currentOrder.id.slice(0, 8)} was archived.`);
      } else if (lifecycleDialog.action === 'restore') {
        await restoreArchivedOrder({ order: currentOrder, actorUid: user.uid, reason });
        alert(`Order #${currentOrder.id.slice(0, 8)} was restored to the active workspace.`);
      } else if (lifecycleDialog.action === 'delete') {
        await permanentlyDeleteReviewedInvalidOrder({ order: currentOrder, actorUid: user.uid, reason, confirmation });
        alert('The reviewed incomplete order was permanently deleted and its audit record was retained.');
      }
      if (selectedOrder?.id === currentOrder.id) setSelectedOrder(null);
      setLifecycleDialog(null);
    } catch (error) {
      console.error('Order lifecycle action failed:', error);
      alert(error?.message || 'Unable to complete this order action. Please try again.');
    } finally {
      setIsLifecycleSubmitting(false);
    }
  };

  const updateOrderStatus = async (orderOrId, newStatus) => {
    const order = typeof orderOrId === 'string'
      ? orders.find((existingOrder) => existingOrder.id === orderOrId)
      : orderOrId;
    if (!order) return;

    const currentStatus = order.status || "pending";

    if (isSubAdmin && !subAdminAllowedStatuses.includes(newStatus)) {
      alert("Permission blocked. Contact Main admin for this action.");
      return;
    }

    try {
      if (newStatus === "completed" && currentStatus !== "completed") {
        const analyticsValidation = validateOrderForAnalytics(order);
        if (!analyticsValidation.isValid) {
          alert(`Cannot mark this order as completed until its analytics data is complete: ${analyticsValidation.issues.map((issue) => issue.label).join(', ')}.`);
          return;
        }

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

      await updateDoc(doc(db, "orders", order.id), {
        status: newStatus,
        updatedAt: new Date()
      });

      if (
        ACCOUNT_APPROVAL_STATUSES.has(newStatus) &&
        !ACCOUNT_APPROVAL_STATUSES.has(currentStatus)
      ) {
        await lockAccountAfterApprovedPurchase(order);
      }

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
    () => orders.filter((order) => order.status === 'completed'),
    [orders]
  );

  const descriptiveAnalytics = useMemo(
    () => buildDescriptiveAnalytics({
      orders,
      products,
      startDate: customStartDate,
      endDate: customEndDate,
    }),
    [customEndDate, customStartDate, orders, products]
  );

  const diagnosticAnalytics = useMemo(
    () => buildDiagnosticAnalytics({
      orders,
      products,
      startDate: customStartDate,
      endDate: customEndDate,
    }),
    [customEndDate, customStartDate, orders, products]
  );

  const {
    averageOrderValue: avgOrderValue,
    completedOrderCount: totalOrdersCompleted,
    completedOrders: filteredCompletedOrders,
    productStats,
    totalRevenue: totalIncome,
  } = descriptiveAnalytics;

  const revenueChartData = useMemo(
    () => createProductRevenueChartData(descriptiveAnalytics.topProducts),
    [descriptiveAnalytics.topProducts]
  );

  const revenueOverTimeData = useMemo(
    () => createRevenueOverTimeChartData(descriptiveAnalytics.dailyRevenue),
    [descriptiveAnalytics.dailyRevenue]
  );

  const forecast = useMemo(
    () => buildTrendForecast({ dailyRevenue: descriptiveAnalytics.dailyRevenue }),
    [descriptiveAnalytics.dailyRevenue]
  );

  const prescriptiveRecommendations = useMemo(
    () => buildPrescriptiveRecommendations({
      descriptiveAnalytics,
      diagnosticAnalytics,
      forecast,
    }),
    [descriptiveAnalytics, diagnosticAnalytics, forecast]
  );

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
    } catch (error) {
      console.error("Error removing sub-admin:", error);
      alert("Failed to remove Sub-admin access.");
    }
  };

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
  const onReviewCount = orders.filter(o => o.status === 'on_review').length;
  const paymentConfirmedCount = orders.filter(o => o.status === 'payment_confirmed').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const shippingCount = orders.filter(o => o.status === 'shipping').length;
  const declinedCount = orders.filter(o => isDeclinedOrder(o.status)).length;
  const cancelledCount = orders.filter(o =>
    ['cancelled', 'Cancelled – Pending Refund', 'Refunded'].includes(o.status)
  ).length;
  /* Legacy client-side count retained for reference during the aggregate migration.
  const legacyCancelledCount = orders.filter(o =>
    ["cancelled", "Cancelled – Pending Refund", "Refunded"].includes(o.status)
  ).length; */
  const cancellationRequestedCount = orders.filter(o => o.status === 'Cancellation Requested').length;

  const outOfStockCount = products.filter(p => (p.stockQuantity ?? 0) <= 0).length;
  const lowStockCount = products.filter(p => {
    const s = p.stockQuantity ?? 0;
    return s > 0 && s <= 5;
  }).length;

  const recentOrders = orders.slice(0, 5);
  const totalAllOrders = orders.length;
  const pct = (n) => totalAllOrders > 0 ? Math.round((n / totalAllOrders) * 100) : 0;

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesView = orderView === 'archived'
        ? order.archive?.isArchived === true
        : order.archive?.isArchived !== true;
      if (!matchesView) return false;

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
  }, [orders, orderSearch, orderStatusFilter, orderView]);

  const archivedOrderCount = orders.filter((order) => order.archive?.isArchived === true).length;

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
  const selectedOrderDataQualityIssues = selectedOrderLive
    ? validateOrderForAnalytics(selectedOrderLive).issues
    : [];

  if (!user || (role !== "admin" && role !== "sub-admin")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-nunito text-4xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You must be an admin or sub-admin to view this page.</p>
        </div>
      </div>
    );
  }


  const adminState = {
    allTimeCompletedRevenue: completedOrders.reduce(
      (sum, order) => sum + (Number(order.total) || 0),
      0
    ),
    analyticsError: null,
    analyticsLoading: false,
    avgOrderValue,
    archivedOrderCount,
    awaitingReviewCount,
    cancellationRequestedCount,
    cancelledCount,
    completedCountAll,
    completedOrders,
    customEndDate,
    customStartDate,
    dashboardMetricsError: null,
    dashboardMetricsLoading: false,
    descriptiveAnalytics,
    diagnosticAnalytics,
    declinedCount,
    filteredCompletedOrders,
    filteredOrders,
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
    handleDeleteDataQualityOrder,
    handleReviewDataQualityOrder,
    handleReviewOrder,
    isAdmin,
    isSubAdmin,
    lowStockCount,
    makeSubAdmin,
    navigate,
    notifyBuyerStatusChange,
    openOrderLifecycleDialog,
    onReviewCount,
    orderSearch,
    orderStatusFilter,
    orderStatusOptions,
    orderView,
    orders,
    outOfStockCount,
    paymentConfirmedCount,
    processingCount,
    productStats,
    prescriptiveRecommendations,
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
    setOrderSearch,
    setOrderStatusFilter,
    setOrderView,
    setOrders,
    setProducts,
    setRangeDays,
    setRole,
    setSelectedOrder,
    setTab,
    setUserSearch,
    shippingCount,
    subAdminAllowedStatuses,
    tab,
    totalAllOrders,
    totalIncome,
    totalOrdersCompleted,
    updateOrderStatus,
    user,
    userSearch,
  };

  return (
    <>
      <Helmet><title>Admin Panel - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen py-14 sm:py-20" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="container mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/35 bg-gradient-to-br from-[#2D0E5A] via-artisan-primary to-artisan-primary-mid p-7 text-white shadow-2xl shadow-[#2D0E5A]/25 sm:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-artisan-primary-pale/25 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary-pale">
                {isAdmin ? "ADMIN PANEL" : "SUB-ADMIN PANEL"}
              </div>
              <h1 className="mt-2 font-nunito text-4xl font-bold sm:text-5xl">Store Management</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">Manage orders, customer activity, inventory, and store performance from one workspace.</p>
            </div>
            </div>
          </motion.div>

          <div className="mb-7 flex flex-col gap-4 rounded-[1.5rem] border border-amber-200/80 bg-white/95 p-5 text-artisan-text shadow-lg shadow-[#2D0E5A]/10 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Orders requiring attention</p>
              <h2 className="mt-1 font-nunito text-xl font-bold text-artisan-text">
                Orders awaiting review: {awaitingReviewCount}
              </h2>
              <p className="mt-1 text-sm text-artisan-text-muted">
                New orders must be reviewed first before normal admin actions appear.
              </p>
            </div>

            <Button
              onClick={() => {
                setTab("orders");
                setOrderStatusFilter("awaiting_review");
              }}
              className="h-12 w-full px-5 py-0 md:w-auto"
            >
              Review Orders
            </Button>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <div className="sticky top-[4.5rem] z-30 mb-8 -mx-2 overflow-x-auto px-2">
              <TabsList variant="segmented" aria-label="Admin workspace sections" className="!flex h-auto w-max min-w-max justify-start gap-2 rounded-xl border border-white/65 bg-white/90 p-2 shadow-lg shadow-[#2D0E5A]/15 backdrop-blur-md sm:w-full sm:min-w-0 sm:justify-center">
                <TabsTrigger variant="segmented" value="dashboard" className="min-w-[8.5rem] flex-1">Dashboard</TabsTrigger>
                <TabsTrigger variant="segmented" value="orders" className="min-w-[8.5rem] flex-1">Orders</TabsTrigger>
                <TabsTrigger variant="segmented" value="users" className="min-w-[8.5rem] flex-1">Users</TabsTrigger>
                <TabsTrigger variant="segmented" value="analytics" className="min-w-[8.5rem] flex-1">Analytics</TabsTrigger>
              </TabsList>
            </div>

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
              className="fixed inset-0 z-[55] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            />

            <motion.div
              className="fixed right-0 top-0 z-[60] flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
            >
              <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-[#2D0E5A] via-artisan-primary to-artisan-primary-mid px-5 py-6 text-white sm:px-7">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-artisan-primary-pale">
                    <ReceiptText size={14} />
                    Order Details
                  </div>
                  <h3 className="font-nunito text-3xl font-bold">
                    #{selectedOrderLive.id.slice(0, 8)}
                  </h3>
                  <p className="mt-1 text-sm text-white/80">
                    Full order summary and quick admin actions
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  type="button"
                  aria-label="Close order details"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto bg-artisan-primary-wash/35 p-4 sm:p-6">
                {selectedOrderDataQualityIssues.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={20} />
                      <div>
                        <p className="font-semibold">Data-quality review</p>
                        <p className="mt-1 text-sm leading-6">
                          This order has incomplete analytics data: {selectedOrderDataQualityIssues.map((issue) => issue.label).join(', ')}.
                        </p>
                        {selectedOrderLive.dataQualityReview?.reviewedBy === user.uid && (
                          <p className="mt-2 text-sm font-semibold text-emerald-800">Your review is recorded. Return to the analytics queue to delete this record if correction is not possible.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-artisan-primary/10 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Status</p>
                    <div className="mt-2">{getStatusBadge(selectedOrderLive.status)}</div>
                  </div>

                  <div className="rounded-2xl border border-artisan-primary/10 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Total</p>
                    <p className="mt-2 text-xl font-bold text-artisan-primary">
                      {formatPrice(selectedOrderLive.total || 0)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-artisan-primary/10 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Items</p>
                    <p className="mt-2 text-xl font-bold text-artisan-text">
                      {selectedOrderLive.items?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-artisan-primary/10 bg-white p-5 sm:p-6">
                  <h4 className="mb-5 font-nunito text-2xl font-bold text-artisan-text">Customer & Order Info</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                        <Mail size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Customer</p>
                        <p className="break-all text-sm font-medium text-artisan-text">
                          {selectedOrderLive.buyerName || "Guest Buyer"}
                        </p>
                        <p className="mt-0.5 break-all text-sm text-artisan-text-muted">
                          {selectedOrderLive.buyerEmail || "Guest"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                        <Hash size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Order ID</p>
                        <p className="break-all text-sm font-medium text-artisan-text">
                          {selectedOrderLive.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                        <CalendarDays size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Date Ordered</p>
                        <p className="text-sm font-medium text-artisan-text">
                          {formatDateTime(selectedOrderLive.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                        <Wallet size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Payment Method</p>
                        <p className="text-sm font-medium text-artisan-text">
                          {formatPaymentMethod(selectedOrderLive.paymentMethod)}
                        </p>
                        <p className="mt-0.5 text-xs text-artisan-text-muted">
                          Delivery: {formatDeliveryMethod(selectedOrderLive.deliveryMethod)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-artisan-primary/10 bg-white p-5 sm:p-6">
                  <h4 className="mb-5 font-nunito text-2xl font-bold text-artisan-text">Shipping Address</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Recipient</p>
                        <p className="text-sm font-medium text-artisan-text">
                          {`${selectedOrderLive.shippingInfo?.firstName || ""} ${selectedOrderLive.shippingInfo?.lastName || ""}`.trim() || selectedOrderLive.buyerName || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Phone</p>
                        <p className="text-sm font-medium text-artisan-text">
                          {selectedOrderLive.shippingInfo?.phone || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Email</p>
                        <p className="break-all text-sm font-medium text-artisan-text">
                          {selectedOrderLive.shippingInfo?.email || selectedOrderLive.buyerEmail || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Full Address</p>
                        <p className="text-sm font-medium text-artisan-text">
                          {formatFullShippingAddress(selectedOrderLive.shippingInfo)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-artisan-primary/10 bg-white p-5 sm:p-6">
                  <h4 className="mb-5 font-nunito text-2xl font-bold text-artisan-text">Items Ordered</h4>

                  <div className="space-y-3">
                    {selectedOrderLive.items?.length ? (
                      selectedOrderLive.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-artisan-primary/10 bg-artisan-primary-wash/35 p-4"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-artisan-primary/10 bg-white text-artisan-primary">
                              <Box size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-artisan-text">
                                {item.name || 'Unnamed item'}
                              </p>
                              <p className="mt-1 text-sm text-artisan-text-muted">
                                Quantity: {item.quantity || 0}
                              </p>
                              <p className="text-sm text-artisan-text-muted">
                                Unit Price: {formatPrice(item.price || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Line Total</p>
                            <p className="mt-1 font-bold text-artisan-primary">
                              {formatPrice((item.price || 0) * (item.quantity || 0))}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-artisan-text-muted">No items found for this order.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-artisan-primary/10 bg-white p-5 sm:p-6">
                  <h4 className="mb-5 font-nunito text-2xl font-bold text-artisan-text">Admin Actions</h4>

                  <div className="flex flex-wrap gap-3">
                    {isAwaitingReview(selectedOrderLive.status) ? (
                      <>
                        <Button
                          onClick={() => handleReviewOrder(selectedOrderLive, false)}
                          className="w-full sm:w-auto"
                        >
                          Review Order
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleDeclineOrder(selectedOrderLive, true)}
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 sm:w-auto"
                        >
                          Decline
                        </Button>
                      </>
                    ) : isPostReviewWorkflow(selectedOrderLive.status) ? (
                      isAdmin ? (
                        <select
                          value={selectedOrderLive.status || "on_review"}
                          onChange={(e) => updateOrderStatus(selectedOrderLive.id, e.target.value)}
                          className="w-full rounded-xl border border-artisan-border bg-white px-4 py-2 text-sm text-artisan-text outline-none focus:ring-2 focus:ring-artisan-primary/15 sm:w-auto"
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
                            className="w-full rounded-xl border border-artisan-border bg-white px-4 py-2 text-sm text-artisan-text outline-none focus:ring-2 focus:ring-artisan-primary/15 sm:w-auto"
                          >
                            <option value="on_review">On Review</option>
                            <option value="payment_confirmed">Payment Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipping">Shipping</option>
                          </select>
                        ) : (
                          <div className="w-full rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/45 px-4 py-2 text-sm text-artisan-text-muted sm:w-auto">
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

                    {isAdmin && (selectedOrderLive.archive?.isArchived ? (
                      <Button variant="outline" onClick={() => openOrderLifecycleDialog('restore', selectedOrderLive)}>
                        Restore order
                      </Button>
                    ) : ['completed', 'declined', 'cancelled', 'Refunded'].includes(selectedOrderLive.status) ? (
                      <Button variant="outline" onClick={() => openOrderLifecycleDialog('archive', selectedOrderLive)}>
                        Archive order
                      </Button>
                    ) : null)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-artisan-primary/10 bg-white p-4">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {lifecycleDialog && (
        <OrderLifecycleDialog
          action={lifecycleDialog.action}
          order={lifecycleDialog.order}
          isSubmitting={isLifecycleSubmitting}
          onClose={() => !isLifecycleSubmitting && setLifecycleDialog(null)}
          onConfirm={handleLifecycleDialogConfirm}
        />
      )}
    </>
  );
};

export default AdminPanel;

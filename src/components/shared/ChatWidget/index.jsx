
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Plus,
  Headphones,
  ShieldCheck,
  LogIn,
  Bot,
  ArrowLeft,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Expand,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  limit,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { faqs, findBestFaqMatch } from '@/data/faqs';
import { createNotification } from '@/lib/notifications';
import { buildBuyerAiCatalog, requestBuyerAiReply } from '@/lib/ai/buyerAi';
import { buildAdminAiDashboard, requestAdminAiReply } from '@/lib/ai/adminAi';
import ChatAskTab from './ChatAskTab';
import ChatSupportTab from './ChatSupportTab';
import ChatAdminAiTab from './ChatAdminAiTab';

const FAQ_WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    'Hi! I can answer factual questions based on our approved FAQs. Ask me about pricing, timelines, shipping, payments, rush orders, and more.',
};

const USER_AI_WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    'Hi! You can continue to chat with AI here. I can help with general store-related questions and guide you to support when needed.',
};

const ADMIN_AI_WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    'Admin Assistant is ready. You can ask about products, orders, stock, best sellers, revenue, and order status counts.',
};

const COMPACT_SUPPORT_MESSAGE_LIMIT = 50;
const ADMIN_AI_ORDER_WINDOW_LIMIT = 100;

const getBuyerAiErrorMessage = (code) => {
  if (code === 'AI_NOT_CONFIGURED') {
    return 'AI chat is being prepared. You can still use Factual Questions or Support Chat.';
  }

  if (code === 'AI_RATE_LIMITED') {
    return 'AI is busy right now. Please try again shortly, or use Factual Questions.';
  }

  if (code === 'UNAUTHORIZED') {
    return 'Your sign-in session has expired. Please sign in again to continue with AI chat.';
  }

  return 'AI is temporarily unavailable. Please try again, or use Factual Questions.';
};

const getAdminAiErrorMessage = (code) => {
  if (code === 'AI_NOT_CONFIGURED') {
    return 'Admin AI is being prepared. Please use the dashboard directly for now.';
  }

  if (code === 'AI_RATE_LIMITED') {
    return 'Admin AI is busy right now. Please try again shortly.';
  }

  if (code === 'UNAUTHORIZED') {
    return 'Your sign-in session has expired. Please sign in again to continue.';
  }

  if (code === 'FORBIDDEN') {
    return 'This assistant is available only to authorized staff accounts.';
  }

  return 'Admin AI is temporarily unavailable. Please try again.';
};

const getRandomFaqQuestions = (faqPool, count = 4, exclude = []) => {
  const excluded = new Set(exclude);
  const available = faqPool
    .map((faq) => faq.question)
    .filter((question) => !excluded.has(question));

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const ChatWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [shouldAnimatePanel, setShouldAnimatePanel] = useState(true);
  const chatPanelRef = useRef(null);
  const chatLauncherRef = useRef(null);
  const [activeTab, setActiveTab] = useState('ask');
  const [role, setRole] = useState(null);

  const isAdmin = role === 'admin';
  const isSubAdmin = role === 'sub-admin';
  const isAdminLike = isAdmin || isSubAdmin;

  const [askMode, setAskMode] = useState('faq');

  const [faqMessages, setFaqMessages] = useState([FAQ_WELCOME_MESSAGE]);
  const [faqInput, setFaqInput] = useState('');
  const [suggestedFaqs, setSuggestedFaqs] = useState(() =>
    getRandomFaqQuestions(faqs, 4)
  );
  const faqEndRef = useRef(null);

  const [aiMessages, setAiMessages] = useState([USER_AI_WELCOME_MESSAGE]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef(null);

  const [adminMessages, setAdminMessages] = useState([ADMIN_AI_WELCOME_MESSAGE]);
  const [adminInput, setAdminInput] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const adminEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [replyInput, setReplyInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [buyerNewChatOpen, setBuyerNewChatOpen] = useState(false);
  const [buyerSubject, setBuyerSubject] = useState('General Support');
  const [buyerMessage, setBuyerMessage] = useState('');
  const [buyerSending, setBuyerSending] = useState(false);

  const [adminProducts, setAdminProducts] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [buyerAiProducts, setBuyerAiProducts] = useState([]);

  const supportScrollRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const newChatFileInputRef = useRef(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setRole(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setRole(snap.data()?.role || null);
      } else {
        setRole(null);
      }
    });

    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeWhenClickingOutside = (event) => {
      const clickedPanel = chatPanelRef.current?.contains(event.target);
      const clickedLauncher = chatLauncherRef.current?.contains(event.target);

      if (clickedPanel || clickedLauncher) return;

      setShouldAnimatePanel(!shouldReduceMotion);
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeWhenClickingOutside);
    return () => document.removeEventListener('pointerdown', closeWhenClickingOutside);
  }, [isOpen, shouldReduceMotion]);

  useEffect(() => {
    setFaqMessages([FAQ_WELCOME_MESSAGE]);
    setFaqInput('');
    setSuggestedFaqs(getRandomFaqQuestions(faqs, 4));

    setAiMessages([USER_AI_WELCOME_MESSAGE]);
    setAiInput('');
    setAiLoading(false);
    setBuyerAiProducts([]);

    setAdminMessages([ADMIN_AI_WELCOME_MESSAGE]);
    setAdminInput('');
    setAdminLoading(false);

    setSelectedConvo(null);
    setSupportMessages([]);
    setReplyInput('');
    setBuyerNewChatOpen(false);
    setBuyerSubject('General Support');
    setBuyerMessage('');
    setSending(false);
    setUploading(false);

    setAskMode('faq');

    if (isAdminLike) {
      setActiveTab('admin-ai');
    } else {
      setActiveTab('ask');
    }
  }, [user?.uid, role, isAdminLike]);

  const refreshSuggestedFaqs = (excludeQuestion = '') => {
    setSuggestedFaqs(
      getRandomFaqQuestions(faqs, 4, excludeQuestion ? [excludeQuestion] : [])
    );
  };

  const toMillis = (ts) => {
    try {
      if (!ts) return 0;
      if (typeof ts?.toMillis === 'function') return ts.toMillis();
      if (typeof ts?.toDate === 'function') return ts.toDate().getTime();
      return 0;
    } catch {
      return 0;
    }
  };

  const formatTime = (ts) => {
    try {
      if (!ts?.toDate) return '';
      return ts.toDate().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatListTime = (millis) => {
    if (!millis) return '';
    const d = new Date(millis);
    const now = new Date();

    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (sameDay) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isSameDay = (aMillis, bMillis) => {
    const a = new Date(aMillis);
    const b = new Date(bMillis);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const dateLabel = (millis) => {
    const d = new Date(millis);
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const thatDay = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    ).getTime();
    const diffDays = Math.round((today - thatDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getDisplayName = (convo) => {
    if (!convo) return 'User';
    return (
      convo.buyerName ||
      convo.buyerEmail?.split('@')[0] ||
      convo.subject ||
      'User'
    );
  };

  const getInitials = (value = '') => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const getAvatarTone = (seed = '') => {
    const tones = [
      'bg-[#118C8C]/12 text-[#118C8C]',
      'bg-amber-100 text-amber-700',
      'bg-blue-100 text-blue-700',
      'bg-emerald-100 text-emerald-700',
      'bg-rose-100 text-rose-700',
      'bg-violet-100 text-violet-700',
    ];

    const total = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return tones[total % tones.length];
  };

  const normalizeText = (value = '') =>
    value.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const extractNumericValue = (...values) => {
    for (const value of values) {
      if (typeof value === 'number' && !Number.isNaN(value)) return value;
      if (
        typeof value === 'string' &&
        value.trim() !== '' &&
        !Number.isNaN(Number(value))
      ) {
        return Number(value);
      }
    }
    return null;
  };

  const getProductName = (product) =>
    product?.name || product?.productName || product?.title || 'Unnamed product';

  const getProductDescription = (product) =>
    product?.description || product?.details || product?.caption || '';

  const getProductPrice = (product) =>
    extractNumericValue(product?.price, product?.unitPrice, product?.amount);

  const getProductStock = (product) => {
    if (product?.inStock === false) return 0;

    return extractNumericValue(
      product?.stockQuantity,
      product?.stock,
      product?.stocks,
      product?.quantity,
      product?.inventory,
      product?.inventoryCount,
      product?.stockLeft,
      product?.availableStocks
    );
  };

  const getAnyDateMillis = (value) => {
    try {
      if (!value) return 0;
      if (typeof value?.toMillis === 'function') return value.toMillis();
      if (typeof value?.toDate === 'function') return value.toDate().getTime();
      if (typeof value === 'number') return value;
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  const getProductCreatedMillis = (product) =>
    getAnyDateMillis(
      product?.createdAt ||
        product?.addedAt ||
        product?.dateAdded ||
        product?.uploadedAt ||
        product?.timestamp
    );

  const extractOrderItems = (order) => {
    const candidates = [
      order?.items,
      order?.cartItems,
      order?.products,
      order?.orderItems,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }

    return [];
  };

  const getOrderItemName = (item) =>
    item?.name || item?.productName || item?.title || item?.product?.name || '';

  const getOrderItemQty = (item) =>
    extractNumericValue(item?.quantity, item?.qty, item?.count, 1) || 1;

  const buildBestSellerSummary = (orders) => {
    const counts = {};

    orders.forEach((order) => {
      const items = extractOrderItems(order);

      items.forEach((item) => {
        const name = getOrderItemName(item);
        if (!name) return;

        counts[name] = (counts[name] || 0) + getOrderItemQty(item);
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty], index) => `${index + 1}. ${name} (${qty} sold)`);
  };

  const buildNewArrivalSummary = (products) => {
    return [...products]
      .sort((a, b) => getProductCreatedMillis(b) - getProductCreatedMillis(a))
      .slice(0, 5)
      .map((product, index) => `${index + 1}. ${getProductName(product)}`);
  };

  const uploadAttachment = async (file) => {
    const safeName = `${Date.now()}-${file.name}`;
    const fileRef = ref(storage, `support-attachments/${safeName}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    return {
      attachmentUrl: downloadURL,
      attachmentName: file.name,
      attachmentType: file.type || 'application/octet-stream',
      attachmentSize: file.size || 0,
    };
  };

  useEffect(() => {
    if (!isOpen || !isAdminLike || activeTab !== 'admin-ai') return;

    const unsubProducts = onSnapshot(collection(db, 'pricelists'), (snap) => {
      setAdminProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubOrders = onSnapshot(
      query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(ADMIN_AI_ORDER_WINDOW_LIMIT)
      ),
      (snap) => setAdminOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [activeTab, isOpen, isAdminLike]);

  useEffect(() => {
    if (!isOpen || isAdminLike || activeTab !== 'ask' || askMode !== 'ai') {
      return undefined;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'pricelists'), limit(40)),
      (snapshot) => {
        setBuyerAiProducts(snapshot.docs.map((product) => ({ id: product.id, ...product.data() })));
      },
      (error) => {
        console.error('Buyer AI catalog could not be loaded', error?.code || 'unknown_error');
        setBuyerAiProducts([]);
      }
    );

    return () => unsubscribe();
  }, [activeTab, askMode, isAdminLike, isOpen]);

  const getAdminAssistantAnswer = (question) => {
    const q = normalizeText(question);

    if (!q) return 'Please type a question first.';

    const products = adminProducts || [];
    const orders = adminOrders || [];

    const completedOrders = orders.filter((o) => o.status === 'completed');
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const paymentConfirmedCount = orders.filter(
      (o) => o.status === 'payment_confirmed'
    ).length;
    const processingCount = orders.filter((o) => o.status === 'processing').length;
    const shippingCount = orders.filter((o) => o.status === 'shipping').length;
    const cancelledCount = orders.filter((o) =>
      ['cancelled', 'Cancelled – Pending Refund', 'Refunded'].includes(o.status)
    ).length;
    const cancellationRequestedCount = orders.filter(
      (o) => o.status === 'Cancellation Requested'
    ).length;

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue =
      completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    const outOfStockProducts = products.filter((p) => (getProductStock(p) ?? 0) <= 0);
    const lowStockProducts = products.filter((p) => {
      const stock = getProductStock(p) ?? 0;
      return stock > 0 && stock <= 5;
    });

    const bestSellers = buildBestSellerSummary(orders);
    const newArrivals = buildNewArrivalSummary(products);

    if (
      q.includes('how many products') ||
      q.includes('total products') ||
      q.includes('number of products')
    ) {
      return `You currently have ${products.length} total products.`;
    }

    if (
      q.includes('how many orders') ||
      q.includes('total orders') ||
      q.includes('number of orders')
    ) {
      return `The recent Admin AI window contains ${orders.length} of the newest orders (up to ${ADMIN_AI_ORDER_WINDOW_LIMIT}). Use the dashboard for all-time totals.`;
    }

    if (q.includes('completed orders') || q.includes('how many completed')) {
      return `The recent Admin AI window contains ${completedOrders.length} completed orders.`;
    }

    if (q.includes('pending orders') || q.includes('how many pending')) {
      return `The recent Admin AI window contains ${pendingCount} pending orders.`;
    }

    if (q.includes('payment confirmed')) {
      return `The recent Admin AI window contains ${paymentConfirmedCount} payment confirmed orders.`;
    }

    if (q.includes('processing orders') || q.includes('how many processing')) {
      return `The recent Admin AI window contains ${processingCount} processing orders.`;
    }

    if (q.includes('shipping orders') || q.includes('how many shipping')) {
      return `The recent Admin AI window contains ${shippingCount} orders currently marked as shipping.`;
    }

    if (
      q.includes('cancellation request') ||
      q.includes('cancellation requests')
    ) {
      return `The recent Admin AI window contains ${cancellationRequestedCount} cancellation requests.`;
    }

    if (
      q.includes('cancelled orders') ||
      q.includes('refund') ||
      q.includes('refunded')
    ) {
      return `The recent Admin AI window contains ${cancelledCount} cancelled or refund-related orders.`;
    }

    if (
      q.includes('total revenue') ||
      q.includes('income') ||
      q.includes('sales total')
    ) {
      return `Your current completed-order revenue is ₱${Math.round(totalRevenue).toLocaleString()}.`;
    }

    if (
      q.includes('average order') ||
      q.includes('avg order') ||
      q.includes('average order value')
    ) {
      return `Your average order value is ₱${Math.round(avgOrderValue).toLocaleString()}.`;
    }

    if (
      q.includes('best seller') ||
      q.includes('bestseller') ||
      q.includes('top selling')
    ) {
      return bestSellers.length
        ? `Recent best sellers:\n${bestSellers.join('\n')}`
        : 'There is not enough recent order data to determine best sellers.';
    }

    if (
      q.includes('new arrival') ||
      q.includes('new arrivals') ||
      q.includes('latest products')
    ) {
      return newArrivals.length
        ? `Newest products:\n${newArrivals.join('\n')}`
        : 'No recent product data is available yet.';
    }

    if (q.includes('out of stock') || q.includes('no stock')) {
      if (!outOfStockProducts.length) {
        return 'No products are currently out of stock.';
      }

      return `Out of stock products:\n${outOfStockProducts
        .slice(0, 10)
        .map((product, index) => `${index + 1}. ${getProductName(product)}`)
        .join('\n')}`;
    }

    if (
      q.includes('low stock') ||
      q.includes('stocks running low') ||
      q.includes('stock is low')
    ) {
      if (!lowStockProducts.length) {
        return 'No products are currently in low stock.';
      }

      return `Low stock products:\n${lowStockProducts
        .slice(0, 10)
        .map((product, index) => {
          const stock = getProductStock(product) ?? 0;
          return `${index + 1}. ${getProductName(product)} (${stock} left)`;
        })
        .join('\n')}`;
    }

    const matchedProduct = products.find((product) =>
      q.includes(normalizeText(getProductName(product)))
    );

    if (matchedProduct) {
      const name = getProductName(matchedProduct);
      const stock = getProductStock(matchedProduct);
      const price = getProductPrice(matchedProduct);
      const description = getProductDescription(matchedProduct);

      return [
        `${name}`,
        price !== null ? `Price: ₱${price.toLocaleString()}` : 'Price: not set',
        stock !== null ? `Stock: ${stock}` : 'Stock: not specified',
        description ? `Details: ${description}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    }

    return `I can help with products, orders, stock, best sellers, revenue, completed orders, pending orders, shipping counts, and new arrivals. Try asking something like “How many pending orders do we have?” or “What are our best sellers?”`;
  };

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return conversations;

    return conversations.filter((convo) => {
      const buyerName = (convo.buyerName || '').toLowerCase();
      const buyerEmail = (convo.buyerEmail || '').toLowerCase();
      const subject = (convo.subject || '').toLowerCase();
      const preview = (convo.lastPreview || '').toLowerCase();

      return (
        buyerName.includes(term) ||
        buyerEmail.includes(term) ||
        subject.includes(term) ||
        preview.includes(term)
      );
    });
  }, [conversations, searchTerm]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'ask' || askMode !== 'faq') return;
    faqEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [faqMessages, suggestedFaqs, isOpen, activeTab, askMode]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'ask' || askMode !== 'ai') return;
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isOpen, activeTab, askMode]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'admin-ai') return;
    adminEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adminMessages, isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'support' || !selectedConvo) {
      setShowJump(false);
      setIsNearBottom(true);
    }
  }, [isOpen, activeTab, selectedConvo]);

  useEffect(() => {
    const el = supportScrollRef.current;
    if (!el || !selectedConvo || activeTab !== 'support' || !isOpen) return;

    const handleScroll = () => {
      const threshold = 160;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = dist < threshold;
      setIsNearBottom(near);
      setShowJump(!near);
    };

    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [selectedConvo, activeTab, isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'support' || !selectedConvo) return;
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages, isNearBottom, isOpen, activeTab, selectedConvo]);

  useEffect(() => {
    if (!user?.email || activeTab !== 'support' || !isOpen) return;

    const q = isAdminLike
      ? query(
          collection(db, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(COMPACT_SUPPORT_MESSAGE_LIMIT)
        )
      : query(
          collection(db, 'messages'),
          where('buyerEmail', '==', user.email),
          orderBy('createdAt', 'desc'),
          limit(COMPACT_SUPPORT_MESSAGE_LIMIT)
        );

    const unsubscribe = onSnapshot(q, (snap) => {
      const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const grouped = {};
      messages.forEach((msg) => {
        const buyerKey = msg.buyerEmail || 'unknown';
        const subject = msg.subject || 'General Support';
        const key = isAdminLike ? `${buyerKey}-${subject}` : subject;

        const createdMillis = msg.createdAt?.toMillis?.() || 0;
        const previewText =
          msg.message ||
          msg.attachmentName ||
          (msg.attachmentUrl ? 'Attachment sent' : '');

        if (!grouped[key]) {
          grouped[key] = {
            key,
            subject,
            buyerId: msg.buyerId || null,
            buyerEmail: msg.buyerEmail,
            buyerName: msg.buyerName || buyerKey.split('@')[0],
            latestMillis: createdMillis,
            lastPreview: previewText,
            lastSenderLabel: msg.isAdminReply ? 'Admin' : 'Buyer',
            hasUnread: false,
          };
        }

        if (createdMillis >= (grouped[key].latestMillis || 0)) {
          grouped[key].latestMillis = createdMillis;
          grouped[key].lastPreview = previewText;
          grouped[key].lastSenderLabel = msg.isAdminReply ? 'Admin' : 'Buyer';
        }

        if (
          msg.status === 'unread' &&
          ((isAdminLike && !msg.isAdminReply) || (!isAdminLike && msg.isAdminReply))
        ) {
          grouped[key].hasUnread = true;
        }
      });

      const sorted = Object.values(grouped).sort(
        (a, b) => (b.latestMillis || 0) - (a.latestMillis || 0)
      );

      setConversations(sorted);
    });

    return () => unsubscribe();
  }, [user?.email, activeTab, isOpen, isAdminLike]);

  useEffect(() => {
    if (!selectedConvo || !isOpen || activeTab !== 'support') return;

    const buyerEmail = isAdminLike ? selectedConvo.buyerEmail : user?.email;
    if (!buyerEmail) return;

    const q = query(
      collection(db, 'messages'),
      where('subject', '==', selectedConvo.subject),
      where('buyerEmail', '==', buyerEmail),
      orderBy('createdAt', 'desc'),
      limit(COMPACT_SUPPORT_MESSAGE_LIMIT)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .reverse();
      setSupportMessages(msgs);

      msgs.forEach(async (msg) => {
        if (
          msg.status === 'unread' &&
          ((isAdminLike && !msg.isAdminReply) || (!isAdminLike && msg.isAdminReply))
        ) {
          try {
            await updateDoc(doc(db, 'messages', msg.id), { status: 'read' });
          } catch (err) {
            console.error('Mark read failed:', err);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [selectedConvo, isOpen, activeTab, isAdminLike, user?.email]);

  const sendSupportReply = async ({ file = null } = {}) => {
    if ((!replyInput.trim() && !file) || !selectedConvo || sending || uploading) return;

    const text = replyInput.trim();
    setReplyInput('');
    setSending(true);

    const optimisticId = `local-${Date.now()}`;
    const optimisticAttachment = file
      ? {
          attachmentName: file.name,
          attachmentType: file.type || 'application/octet-stream',
          _uploading: true,
        }
      : {};

    setSupportMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        message: text,
        isAdminReply: isAdminLike,
        status: 'unread',
        createdAt: { toDate: () => new Date(), toMillis: () => Date.now() },
        _optimistic: true,
        ...optimisticAttachment,
      },
    ]);

    try {
      const buyerEmail = isAdminLike ? selectedConvo.buyerEmail : user?.email;
      let attachmentData = null;

      if (file) {
        setUploading(true);
        attachmentData = await uploadAttachment(file);
      }

      await addDoc(collection(db, 'messages'), {
        buyerId: isAdminLike
          ? selectedConvo?.buyerId || null
          : user?.uid || null,
        buyerEmail,
        buyerName: selectedConvo.buyerName || user?.email?.split('@')[0],
        subject: selectedConvo.subject || 'General Support',
        message: text,
        status: 'unread',
        createdAt: serverTimestamp(),
        isAdminReply: isAdminLike,
        ...(isAdminLike && {
          adminEmail: user.email,
          adminName: user.displayName || 'Admin',
        }),
        ...(attachmentData || {}),
      });

      if (isAdminLike && selectedConvo?.buyerId) {
        try {
          await createNotification({
            uid: selectedConvo.buyerId,
            type: 'message',
            title: 'New Support Reply',
            body: `Admin replied to your "${selectedConvo.subject || 'General Support'}" conversation.`,
            link: '/message-center',
            subject: selectedConvo.subject || 'General Support',
          });
        } catch (notifErr) {
          console.error('buyer support notification failed:', notifErr);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('sendSupportReply failed:', err);
      setSupportMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast({
        title: 'Error',
        description: 'Failed to send.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleSupportAttachmentPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await sendSupportReply({ file });
  };

  const startBuyerChat = async (file = null) => {
    if (!user?.email) {
      toast({
        title: 'Login required',
        description: 'Please log in to contact support.',
        variant: 'destructive',
      });
      return;
    }

    if ((!buyerMessage.trim() && !file) || buyerSending) return;

    setBuyerSending(true);

    try {
      const subject = (buyerSubject || 'General Support').trim();
      let attachmentData = null;

      if (file) {
        attachmentData = await uploadAttachment(file);
      }

      await addDoc(collection(db, 'messages'), {
        buyerId: user?.uid || null,
        buyerEmail: user.email,
        buyerName: user.displayName || user.email.split('@')[0],
        subject,
        message: buyerMessage.trim(),
        status: 'unread',
        createdAt: serverTimestamp(),
        isAdminReply: false,
        ...(attachmentData || {}),
      });

      setSelectedConvo({
        key: subject,
        subject,
        buyerId: user?.uid || null,
        buyerEmail: user.email,
        buyerName: user.displayName || user.email.split('@')[0],
      });

      setBuyerMessage('');
      setBuyerSubject('General Support');
      setBuyerNewChatOpen(false);

      if (newChatFileInputRef.current) {
        newChatFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('startBuyerChat failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to start chat.',
        variant: 'destructive',
      });
    } finally {
      setBuyerSending(false);
    }
  };

  const handleNewChatAttachmentPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await startBuyerChat(file);
  };

  const sendFaqMessage = () => {
    if (!faqInput.trim()) return;

    const text = faqInput.trim();
    const userMsg = { role: 'user', content: text };
    setFaqMessages((prev) => [...prev, userMsg]);
    setFaqInput('');

    const match = findBestFaqMatch(text);

    if (match) {
      setFaqMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `${match.question}\n\n${match.answer}`,
        },
      ]);
      refreshSuggestedFaqs(match.question);
      return;
    }

    setFaqMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          'I can only answer factual questions based on our approved FAQs right now. Try another question below.',
      },
    ]);
    refreshSuggestedFaqs();
  };

  const handleSuggestedFaqClick = (question) => {
    const match = faqs.find((faq) => faq.question === question);

    setFaqMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      {
        role: 'assistant',
        content: match
          ? `${match.question}\n\n${match.answer}`
          : 'Sorry, I could not find that FAQ right now.',
      },
    ]);

    refreshSuggestedFaqs(question);
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading || !user) return;

    const text = aiInput.trim();
    const userMsg = { role: 'user', content: text };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const accessToken = await user.getIdToken();
      const answer = await requestBuyerAiReply({
        accessToken,
        question: text,
        messages: aiMessages,
        products: buildBuyerAiCatalog(buyerAiProducts),
      });

      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
        },
      ]);
    } catch (error) {
      console.error('Buyer AI request failed', error?.code || 'unknown_error');
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: getBuyerAiErrorMessage(error?.code),
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const sendAdminMessage = async () => {
    if (!adminInput.trim() || adminLoading || !user) return;

    const text = adminInput.trim();
    const userMsg = { role: 'user', content: text };

    setAdminMessages((prev) => [...prev, userMsg]);
    setAdminInput('');
    setAdminLoading(true);

    try {
      const accessToken = await user.getIdToken();
      const answer = await requestAdminAiReply({
        accessToken,
        question: text,
        messages: adminMessages,
        dashboard: buildAdminAiDashboard({
          products: adminProducts,
          orders: adminOrders,
          isMainAdmin: isAdmin,
        }),
      });

      setAdminMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
        },
      ]);
    } catch (error) {
      console.error('Admin AI request failed', error?.code || 'unknown_error');
      setAdminMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: getAdminAiErrorMessage(error?.code),
        },
      ]);
    } finally {
      setAdminLoading(false);
    }
  };

  const Bubble = ({
    isMine,
    label,
    text,
    time,
    attachmentUrl,
    attachmentName,
    attachmentType,
    isUploading = false,
  }) => {
    const base =
      'max-w-[86%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-[0_5px_14px_rgba(36,16,31,0.08)]';
    const mineStyle =
      'ml-auto rounded-br-md border-[#5C2D91]/20 bg-[#5C2D91] text-[#FAF8F1]';
    const otherStyle = 'rounded-bl-md border-[#5C2D91]/10 bg-white text-[#2D0E5A]';
    const isImage = attachmentType?.startsWith('image/');

    return (
      <div
        className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
      >
        <div className={`${base} ${isMine ? mineStyle : otherStyle}`}>
          <div className="text-[11px] opacity-80 mb-1">{label}</div>

          {text ? <div className="whitespace-pre-wrap break-words">{text}</div> : null}

          {attachmentName || attachmentUrl || isUploading ? (
            <div className={text ? 'mt-3' : ''}>
              {isUploading ? (
                <div
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 border ${
                    isMine
                      ? 'border-white/20 bg-white/10'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isMine ? 'bg-white/15' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <Paperclip size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {attachmentName || 'Uploading attachment'}
                    </p>
                    <p className="text-xs opacity-75">Uploading...</p>
                  </div>
                </div>
              ) : isImage && attachmentUrl ? (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={attachmentUrl}
                    alt={attachmentName || 'Attachment'}
                    className="max-h-56 w-auto rounded-2xl border border-black/10"
                  />
                </a>
              ) : attachmentUrl ? (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 border ${
                    isMine
                      ? 'border-white/20 bg-white/10 hover:bg-white/15'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  } transition`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isMine ? 'bg-white/15' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {attachmentName || 'Attachment'}
                    </p>
                    <p className="text-xs opacity-75">Tap to open or download</p>
                  </div>

                  <Download size={16} />
                </a>
              ) : null}
            </div>
          ) : null}

          {time && <div className="text-[11px] opacity-70 mt-2">{time}</div>}
        </div>
      </div>
    );
  };

  const renderedSupportStream = useMemo(() => {
    if (!supportMessages?.length) return [];

    const mineOf = (msg) => (isAdminLike ? !!msg.isAdminReply : !msg.isAdminReply);

    const out = [];
    let prevMillis = 0;

    for (let i = 0; i < supportMessages.length; i++) {
      const msg = supportMessages[i];
      const millis = toMillis(msg.createdAt);

      if (i === 0 || !isSameDay(prevMillis, millis)) {
        out.push({
          _type: 'date',
          id: `date-${millis}-${i}`,
          label: dateLabel(millis),
        });
      }

      const isMine = mineOf(msg);
      const label = msg.isAdminReply
        ? 'Admin'
        : isAdminLike
        ? msg.buyerName || 'Buyer'
        : 'You';
      const time = msg.createdAt?.toDate ? formatTime(msg.createdAt) : '';

      out.push({
        _type: 'msg',
        id: msg.id,
        isMine,
        label,
        text: msg.message,
        time,
        attachmentUrl: msg.attachmentUrl,
        attachmentName: msg.attachmentName,
        attachmentType: msg.attachmentType,
        isUploading: !!msg._uploading,
      });

      prevMillis = millis;
    }

    return out;
  }, [supportMessages, isAdminLike]);

  const supportLockedForGuest = !user;
  const aiLockedForGuest = !user;


  const chatState = {
    Bubble,
    activeTab,
    adminEndRef,
    adminInput,
    adminLoading,
    adminMessages,
    adminOrders,
    adminProducts,
    aiEndRef,
    aiInput,
    aiLoading,
    aiLockedForGuest,
    aiMessages,
    askMode,
    bottomRef,
    buildBestSellerSummary,
    buildNewArrivalSummary,
    buyerMessage,
    buyerNewChatOpen,
    buyerSending,
    buyerSubject,
    buyerAiProducts,
    conversations,
    dateLabel,
    extractNumericValue,
    extractOrderItems,
    faqEndRef,
    faqInput,
    faqMessages,
    fileInputRef,
    filteredConversations,
    formatListTime,
    formatTime,
    getAdminAssistantAnswer,
    getAnyDateMillis,
    getAvatarTone,
    getDisplayName,
    getInitials,
    getOrderItemName,
    getOrderItemQty,
    getProductCreatedMillis,
    getProductDescription,
    getProductName,
    getProductPrice,
    getProductStock,
    handleNewChatAttachmentPick,
    handleSuggestedFaqClick,
    handleSupportAttachmentPick,
    isAdmin,
    isAdminLike,
    isNearBottom,
    isOpen,
    isSameDay,
    isSubAdmin,
    navigate,
    newChatFileInputRef,
    normalizeText,
    refreshSuggestedFaqs,
    renderedSupportStream,
    replyInput,
    role,
    searchTerm,
    selectedConvo,
    sendAdminMessage,
    sendAiMessage,
    sendFaqMessage,
    sendSupportReply,
    sending,
    setActiveTab,
    setAdminInput,
    setAdminLoading,
    setAdminMessages,
    setAdminOrders,
    setAdminProducts,
    setAiInput,
    setAiLoading,
    setAiMessages,
    setAskMode,
    setBuyerMessage,
    setBuyerNewChatOpen,
    setBuyerSending,
    setBuyerSubject,
    setConversations,
    setFaqInput,
    setFaqMessages,
    setIsNearBottom,
    setIsOpen,
    setReplyInput,
    setRole,
    setSearchTerm,
    setSelectedConvo,
    setSending,
    setShowJump,
    setSuggestedFaqs,
    setSupportMessages,
    setUploading,
    showJump,
    startBuyerChat,
    suggestedFaqs,
    supportLockedForGuest,
    supportMessages,
    supportScrollRef,
    toMillis,
    toast,
    uploadAttachment,
    uploading,
    user,
  };

  const panelMotion = shouldReduceMotion || !shouldAnimatePanel
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.14 },
      }
    : {
        initial: { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
        animate: { opacity: 1, transform: 'translateY(0) scale(1)' },
        exit: { opacity: 0, transform: 'translateY(8px) scale(0.985)' },
        transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
      };

  const setChatOpenFromInteraction = (event, open) => {
    setShouldAnimatePanel(!shouldReduceMotion && event?.detail !== 0);
    setIsOpen(open);
  };

  return (
    <div className="chat-widget-root fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:bottom-6 sm:right-3 sm:w-[390px]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...panelMotion}
            ref={chatPanelRef}
            className="flex h-[min(600px,calc(100dvh-7rem))] w-full max-w-[390px] min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#5C2D91]/20 bg-[#FAF8F1] shadow-[0_24px_70px_rgba(45,14,90,0.24)]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/15 bg-[#5C2D91] px-4 py-3.5 text-[#FAF8F1] shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3 min-w-0">
                {activeTab === 'support' && selectedConvo && (
                  <button
                    onClick={() => {
                      setSelectedConvo(null);
                      setSupportMessages([]);
                      setReplyInput('');
                    }}
                    className="shrink-0 text-white/85 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2BB16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#5C2D91]"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F2BB16]/45 bg-[#F2BB16]/15 text-[#FCE8A0]">
                  <MessageCircle size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-nunito text-base font-bold tracking-tight">
                    D.A.B.S. Chat {isAdminLike ? '(Admin)' : ''}
                  </h3>
                  <p className="text-[11px] text-white/85 truncate">
                    {activeTab === 'ask'
                      ? askMode === 'faq'
                        ? 'Approved factual questions only'
                        : aiLockedForGuest
                        ? 'Login first to chat with AI'
                        : 'Continue to chat with AI'
                      : activeTab === 'admin-ai'
                      ? 'Internal admin tools'
                      : supportLockedForGuest
                      ? 'Login required for support'
                      : 'Support conversations'}
                  </p>
                </div>
              </div>

              <button
                onClick={(event) => setChatOpenFromInteraction(event, false)}
                aria-label="Close chat"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/85 transition-[background-color,color,transform] duration-150 hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2BB16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#5C2D91]"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="grid grid-cols-2 gap-1 border-b border-[#5C2D91]/10 bg-[#EDE0F9] p-1.5 shrink-0"
            >
              {!isAdminLike && (
                <button
                  onClick={() => {
                    setActiveTab('ask');
                    setAskMode('faq');
                  }}
                  aria-pressed={activeTab === 'ask'}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2D91]/35 ${
                    activeTab === 'ask'
                      ? 'bg-white text-[#5C2D91] shadow-[0_2px_8px_rgba(92,45,145,0.16)]'
                      : 'text-[#4A2560]/70 hover:bg-white/60 hover:text-[#2D0E5A]'
                  }`}
                >
                  Ask Questions
                </button>
              )}

              <button
                onClick={() => setActiveTab('support')}
                aria-pressed={activeTab === 'support'}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2D91]/35 ${
                  activeTab === 'support'
                    ? 'bg-white text-[#5C2D91] shadow-[0_2px_8px_rgba(92,45,145,0.16)]'
                    : 'text-[#4A2560]/70 hover:bg-white/60 hover:text-[#2D0E5A]'
                }`}
              >
                <Headphones size={16} />
                Support
              </button>

              {isAdminLike && (
                <button
                  onClick={() => setActiveTab('admin-ai')}
                  aria-pressed={activeTab === 'admin-ai'}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2D91]/35 ${
                    activeTab === 'admin-ai'
                      ? 'bg-white text-[#5C2D91] shadow-[0_2px_8px_rgba(92,45,145,0.16)]'
                      : 'text-[#4A2560]/70 hover:bg-white/60 hover:text-[#2D0E5A]'
                  }`}
                >
                  <ShieldCheck size={16} />
                  Admin AI
                </button>
              )}
            </div>

            <ChatAskTab {...chatState} />
            <ChatSupportTab {...chatState} />
            <ChatAdminAiTab {...chatState} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={chatLauncherRef}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
        onClick={(event) => setChatOpenFromInteraction(event, !isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
        className="chat-widget-launcher ml-auto flex min-h-12 min-w-12 items-center justify-center rounded-full border border-[#FCE8A0]/90 bg-[#F2BB16] p-4 text-[#2D0E5A] shadow-[0_12px_28px_rgba(45,14,90,0.28)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[#FFD55A] hover:shadow-[0_16px_34px_rgba(45,14,90,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2D91] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F1] sm:min-h-14 sm:min-w-14 sm:p-5"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
};

export default ChatWidget;

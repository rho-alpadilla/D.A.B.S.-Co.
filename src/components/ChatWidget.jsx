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
import { motion, AnimatePresence } from 'framer-motion';
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
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { faqs, findBestFaqMatch } from '@/data/faqs';
import { createNotification } from '@/lib/notifications';

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

  const [isOpen, setIsOpen] = useState(false);
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
    setFaqMessages([FAQ_WELCOME_MESSAGE]);
    setFaqInput('');
    setSuggestedFaqs(getRandomFaqQuestions(faqs, 4));

    setAiMessages([USER_AI_WELCOME_MESSAGE]);
    setAiInput('');
    setAiLoading(false);

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
    if (!isOpen || !isAdminLike) return;

    const unsubProducts = onSnapshot(collection(db, 'pricelists'), (snap) => {
      setAdminProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => setAdminOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [isOpen, isAdminLike]);

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
      return `You currently have ${orders.length} total orders.`;
    }

    if (q.includes('completed orders') || q.includes('how many completed')) {
      return `There are ${completedOrders.length} completed orders.`;
    }

    if (q.includes('pending orders') || q.includes('how many pending')) {
      return `There are ${pendingCount} pending orders.`;
    }

    if (q.includes('payment confirmed')) {
      return `There are ${paymentConfirmedCount} payment confirmed orders.`;
    }

    if (q.includes('processing orders') || q.includes('how many processing')) {
      return `There are ${processingCount} processing orders.`;
    }

    if (q.includes('shipping orders') || q.includes('how many shipping')) {
      return `There are ${shippingCount} orders currently marked as shipping.`;
    }

    if (
      q.includes('cancellation request') ||
      q.includes('cancellation requests')
    ) {
      return `There are ${cancellationRequestedCount} cancellation requests right now.`;
    }

    if (
      q.includes('cancelled orders') ||
      q.includes('refund') ||
      q.includes('refunded')
    ) {
      return `There are ${cancelledCount} cancelled/refund-related orders.`;
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
        ? `Current best sellers:\n${bestSellers.join('\n')}`
        : 'There is not enough order data yet to determine best sellers.';
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

  const getUserAiReply = (question) => {
    const q = normalizeText(question);

    if (!q) return 'Please type a message first.';

    const faqMatch = findBestFaqMatch(question);
    if (faqMatch) {
      return `${faqMatch.question}\n\n${faqMatch.answer}`;
    }

    if (
      q.includes('support') ||
      q.includes('follow up') ||
      q.includes('order concern') ||
      q.includes('payment concern') ||
      q.includes('custom concern') ||
      q.includes('problem with order')
    ) {
      return 'For account-specific, order-specific, or payment concerns, please use the Support Chat tab so our team can assist you properly.';
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return 'Hello! You can ask me about our products, pricing, shipping, timelines, and other general store-related questions.';
    }

    return 'I can help with general store questions and approved FAQ information. For factual questions, you can also use Ask Questions. For order-specific concerns, please use Support Chat.';
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
      ? query(collection(db, 'messages'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'messages'),
          where('buyerEmail', '==', user.email),
          orderBy('createdAt', 'desc')
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
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    if (!aiInput.trim() || aiLoading) return;

    const text = aiInput.trim();
    const userMsg = { role: 'user', content: text };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const answer = getUserAiReply(text);

      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
        },
      ]);
    } catch (err) {
      console.error(err);
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not respond right now. Please try again.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const sendAdminMessage = async () => {
    if (!adminInput.trim() || adminLoading) return;

    const text = adminInput.trim();
    const userMsg = { role: 'user', content: text };

    setAdminMessages((prev) => [...prev, userMsg]);
    setAdminInput('');
    setAdminLoading(true);

    try {
      const answer = getAdminAssistantAnswer(text);

      setAdminMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
        },
      ]);
    } catch (err) {
      console.error(err);
      setAdminMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I could not load the admin data right now. Please try again.',
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
      'max-w-[86%] rounded-2xl px-4 py-3 shadow-sm border text-sm leading-relaxed';
    const mineStyle =
      'bg-[#118C8C] text-white border-[#118C8C]/20 rounded-br-md ml-auto';
    const otherStyle = 'bg-white text-gray-800 border-gray-200 rounded-bl-md';
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            className="w-[390px] h-[580px] rounded-[28px] overflow-hidden shadow-2xl border border-gray-200 bg-white flex flex-col min-h-0"
          >
            <div className="bg-[#118C8C] px-4 py-3.5 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {activeTab === 'support' && selectedConvo && (
                  <button
                    onClick={() => {
                      setSelectedConvo(null);
                      setSupportMessages([]);
                      setReplyInput('');
                    }}
                    className="text-white/95 hover:text-white transition shrink-0"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}

                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <MessageCircle size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-base truncate">
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
                onClick={() => setIsOpen(false)}
                className="hover:opacity-90 transition shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`grid ${isAdminLike ? 'grid-cols-2' : 'grid-cols-2'} gap-1 bg-gray-50 p-1.5 border-b shrink-0`}
            >
              {!isAdminLike && (
                <button
                  onClick={() => {
                    setActiveTab('ask');
                    setAskMode('faq');
                  }}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    activeTab === 'ask'
                      ? 'bg-white text-[#118C8C] shadow-sm'
                      : 'text-gray-600 hover:bg-white/80'
                  }`}
                >
                  Ask Questions
                </button>
              )}

              <button
                onClick={() => setActiveTab('support')}
                className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  activeTab === 'support'
                    ? 'bg-white text-[#118C8C] shadow-sm'
                    : 'text-gray-600 hover:bg-white/80'
                }`}
              >
                <Headphones size={16} />
                Support
              </button>

              {isAdminLike && (
                <button
                  onClick={() => setActiveTab('admin-ai')}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    activeTab === 'admin-ai'
                      ? 'bg-white text-[#118C8C] shadow-sm'
                      : 'text-gray-600 hover:bg-white/80'
                  }`}
                >
                  <ShieldCheck size={16} />
                  Admin AI
                </button>
              )}
            </div>

            {!isAdminLike && activeTab === 'ask' && (
              <div className="flex-1 min-h-0 flex flex-col bg-white">
                {askMode === 'faq' && (
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                      <div className="p-3 space-y-3">
                        <div className="rounded-[22px] bg-[#118C8C]/7 border border-[#118C8C]/15 p-4">
                          <p className="text-sm font-semibold text-[#118C8C]">
                            Factual Questions Only
                          </p>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            This section answers only from the approved FAQs page.
                          </p>

                          <div className="mt-4">
                            <Button
                              type="button"
                              onClick={() => setAskMode('ai')}
                              variant="outline"
                              className="rounded-xl border-[#118C8C]/20 text-[#118C8C] hover:bg-[#118C8C]/5"
                            >
                              <Bot className="mr-2" size={16} />
                              {aiLockedForGuest
                                ? 'Login First to Chat with AI'
                                : 'Continue to Chat with AI'}
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {suggestedFaqs.map((question) => (
                            <button
                              key={`top-${question}`}
                              onClick={() => handleSuggestedFaqClick(question)}
                              className="text-sm rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                            >
                              {question}
                            </button>
                          ))}
                        </div>

                        {faqMessages.map((msg, i) => (
                          <Bubble
                            key={i}
                            isMine={msg.role === 'user'}
                            label={msg.role === 'user' ? 'You' : 'FAQ Assistant'}
                            text={msg.content}
                          />
                        ))}

                        <div className="flex flex-wrap gap-2 pt-1">
                          {suggestedFaqs.map((question) => (
                            <button
                              key={`bottom-${question}`}
                              onClick={() => handleSuggestedFaqClick(question)}
                              className="text-sm rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                            >
                              {question}
                            </button>
                          ))}
                        </div>

                        <div ref={faqEndRef} />
                      </div>
                    </div>

                    <div className="p-3 bg-white border-t shrink-0">
                      <div className="flex items-center gap-2">
                        <input
                          value={faqInput}
                          onChange={(e) => setFaqInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendFaqMessage()}
                          placeholder="Ask a factual question..."
                          className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                        />
                        <Button
                          size="icon"
                          onClick={sendFaqMessage}
                          disabled={!faqInput.trim()}
                          className="rounded-2xl bg-[#118C8C] hover:bg-[#0d7070] shrink-0"
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {askMode === 'ai' && (
                  <>
                    {aiLockedForGuest ? (
                      <div className="flex-1 min-h-0 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
                        <div className="w-full max-w-sm text-center">
                          <div className="w-16 h-16 rounded-full bg-[#118C8C]/10 text-[#118C8C] flex items-center justify-center mx-auto mb-4">
                            <LogIn size={28} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Login First
                          </h3>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            To chat with AI, login first.
                          </p>
                          <Button
                            onClick={() => navigate('/login')}
                            className="mt-5 bg-[#118C8C] hover:bg-[#0d7070] text-white rounded-2xl px-6"
                          >
                            Login to Continue
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAskMode('faq')}
                            className="mt-3 rounded-2xl"
                          >
                            <ArrowLeft className="mr-2" size={16} />
                            Back to Factual Questions
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                          <div className="p-3 space-y-3">
                            <div className="rounded-[22px] bg-[#118C8C]/7 border border-[#118C8C]/15 p-4">
                              <p className="text-sm font-semibold text-[#118C8C]">
                                AI Chat
                              </p>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                You are now chatting with AI for general store-related questions.
                              </p>

                              <div className="mt-4">
                                <Button
                                  type="button"
                                  onClick={() => setAskMode('faq')}
                                  variant="outline"
                                  className="rounded-xl border-[#118C8C]/20 text-[#118C8C] hover:bg-[#118C8C]/5"
                                >
                                  <ArrowLeft className="mr-2" size={16} />
                                  Back to Factual Questions
                                </Button>
                              </div>
                            </div>

                            {aiMessages.map((msg, i) => (
                              <Bubble
                                key={i}
                                isMine={msg.role === 'user'}
                                label={msg.role === 'user' ? 'You' : 'AI Assistant'}
                                text={msg.content}
                              />
                            ))}

                            {aiLoading && (
                              <div className="text-sm text-gray-500 px-2">Thinking…</div>
                            )}

                            <div ref={aiEndRef} />
                          </div>
                        </div>

                        <div className="p-3 bg-white border-t shrink-0">
                          <div className="flex items-center gap-2">
                            <input
                              value={aiInput}
                              onChange={(e) => setAiInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                              placeholder="Continue to chat with AI..."
                              className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                              disabled={aiLoading}
                            />
                            <Button
                              size="icon"
                              onClick={sendAiMessage}
                              disabled={aiLoading || !aiInput.trim()}
                              className="rounded-2xl bg-[#118C8C] hover:bg-[#0d7070] shrink-0"
                            >
                              <Send size={16} />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'support' && (
              <>
                {supportLockedForGuest ? (
                  <div className="flex-1 min-h-0 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
                    <div className="w-full max-w-sm text-center">
                      <div className="w-16 h-16 rounded-full bg-[#118C8C]/10 text-[#118C8C] flex items-center justify-center mx-auto mb-4">
                        <LogIn size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Login Required
                      </h3>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        Please log in first before using Support Chat.
                      </p>
                      <Button
                        onClick={() => navigate('/login')}
                        className="mt-5 bg-[#118C8C] hover:bg-[#0d7070] text-white rounded-2xl px-6"
                      >
                        Go to Login
                      </Button>
                    </div>
                  </div>
                ) : !selectedConvo ? (
                  <div className="flex-1 min-h-0 flex flex-col">
                    {!isAdminLike && (
                      <div className="px-4 pt-4 pb-3 border-b bg-white shrink-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">Support</p>
                          <Button
                            size="sm"
                            className="bg-[#118C8C] hover:bg-[#0d7070] rounded-xl"
                            onClick={() => setBuyerNewChatOpen((v) => !v)}
                          >
                            <Plus size={16} className="mr-2" />
                            New Chat
                          </Button>
                        </div>

                        {buyerNewChatOpen && (
                          <div className="mt-3 space-y-2">
                            <input
                              value={buyerSubject}
                              onChange={(e) => setBuyerSubject(e.target.value)}
                              placeholder="Subject (e.g. Order help)"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                            />
                            <textarea
                              value={buyerMessage}
                              onChange={(e) => setBuyerMessage(e.target.value)}
                              placeholder="Write your message…"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                            />

                            <input
                              ref={newChatFileInputRef}
                              type="file"
                              className="hidden"
                              onChange={handleNewChatAttachmentPick}
                            />

                            <div className="flex gap-2 justify-end flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => setBuyerNewChatOpen(false)}
                              >
                                Cancel
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => newChatFileInputRef.current?.click()}
                                disabled={buyerSending}
                              >
                                <Paperclip size={15} className="mr-2" />
                                Attach
                              </Button>

                              <Button
                                size="sm"
                                className="bg-[#118C8C] hover:bg-[#0d7070] rounded-xl"
                                onClick={() => startBuyerChat()}
                                disabled={buyerSending || (!buyerMessage.trim() && !newChatFileInputRef.current?.files?.[0])}
                              >
                                {buyerSending ? 'Sending…' : 'Start Chat'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="px-4 pt-4 pb-3 bg-white border-b space-y-3 shrink-0">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {isAdminLike
                            ? 'Customer Conversations'
                            : 'Your Conversations'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {isAdminLike
                            ? 'Tap a customer thread to open the full chat.'
                            : 'Open a support thread or start a new one.'}
                        </p>
                      </div>

                      <>
                        {isAdminLike && (
                          <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, subject, or message..."
                            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                          />
                        )}

                        <Button
                          variant="outline"
                          className="w-full rounded-2xl"
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/message-center');
                          }}
                        >
                          <Expand size={16} className="mr-2" />
                          View in Message Center
                        </Button>
                      </>
                    </div>

                    <div className="flex-1 min-h-0 p-3 overflow-y-auto bg-gradient-to-b from-gray-50 to-white space-y-2">
                      {filteredConversations.length === 0 ? (
                        <div className="text-center text-gray-500 mt-12 px-6">
                          <p className="font-medium text-gray-700">
                            {searchTerm.trim()
                              ? 'No matching conversations'
                              : 'No conversations yet'}
                          </p>
                          <p className="text-sm mt-1">
                            {searchTerm.trim()
                              ? 'Try a different name, email, subject, or keyword.'
                              : 'Customer chats will appear here.'}
                          </p>
                        </div>
                      ) : (
                        filteredConversations.map((convo) => {
                          const displayName = isAdminLike
                            ? getDisplayName(convo)
                            : convo.subject;
                          const avatarSeed = isAdminLike
                            ? convo.buyerEmail || convo.buyerName || convo.key
                            : convo.subject || convo.key;
                          const avatarTone = getAvatarTone(avatarSeed);

                          return (
                            <button
                              key={convo.key}
                              onClick={() => setSelectedConvo(convo)}
                              className="w-full text-left bg-white border border-gray-200 rounded-2xl px-3 py-3 hover:bg-gray-50 transition flex items-start gap-3 shadow-sm"
                            >
                              <div
                                className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarTone}`}
                              >
                                {getInitials(displayName)}
                                {convo.hasUnread && (
                                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                      {displayName}
                                    </p>

                                    {isAdminLike ? (
                                      <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {convo.buyerEmail || 'No email'}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-gray-500 truncate mt-0.5">
                                        D.A.B.S. Support
                                      </p>
                                    )}
                                  </div>

                                  <div className="shrink-0 text-[11px] text-gray-400 pt-0.5">
                                    {formatListTime(convo.latestMillis)}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className="inline-flex items-center rounded-full bg-[#118C8C]/10 text-[#118C8C] px-2.5 py-1 text-[11px] font-medium">
                                    {convo.subject || 'General Support'}
                                  </span>

                                  {convo.hasUnread && (
                                    <span className="inline-flex items-center rounded-full bg-red-50 text-red-600 px-2.5 py-1 text-[11px] font-medium">
                                      New
                                    </span>
                                  )}
                                </div>

                                <p className="text-sm text-gray-600 truncate mt-2">
                                  <span className="font-medium text-gray-500">
                                    {convo.lastSenderLabel}:
                                  </span>{' '}
                                  {convo.lastPreview || 'Tap to open conversation'}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col relative">
                    <div className="px-4 py-3 bg-white border-b flex items-center gap-3 shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0 ${getAvatarTone(
                          selectedConvo.buyerEmail ||
                            selectedConvo.buyerName ||
                            selectedConvo.subject
                        )}`}
                      >
                        {getInitials(
                          isAdminLike ? getDisplayName(selectedConvo) : 'Support'
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {isAdminLike
                            ? getDisplayName(selectedConvo)
                            : 'D.A.B.S. Support'}
                        </p>

                        {isAdminLike ? (
                          <p className="text-xs text-gray-500 truncate">
                            {selectedConvo.buyerEmail}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 truncate">
                            {selectedConvo.subject}
                          </p>
                        )}

                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          {isAdminLike && (
                            <span className="inline-flex items-center rounded-full bg-[#118C8C]/10 text-[#118C8C] px-2 py-0.5 text-[11px] font-medium">
                              {selectedConvo.subject}
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/message-center');
                            }}
                            className="text-[11px] font-medium text-[#118C8C] hover:underline"
                          >
                            View in Message Center
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={supportScrollRef}
                      className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50 to-white"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {renderedSupportStream.map((item) => {
                        if (item._type === 'date') {
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-center my-2"
                            >
                              <div className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-600 shadow-sm">
                                {item.label}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <Bubble
                            key={item.id}
                            isMine={item.isMine}
                            label={item.label}
                            text={item.text}
                            time={item.time}
                            attachmentUrl={item.attachmentUrl}
                            attachmentName={item.attachmentName}
                            attachmentType={item.attachmentType}
                            isUploading={item.isUploading}
                          />
                        );
                      })}

                      <div className="h-6" />
                      <div ref={bottomRef} />
                    </div>

                    {showJump && (
                      <div className="absolute bottom-[108px] right-4">
                        <button
                          onClick={() =>
                            bottomRef.current?.scrollIntoView({
                              behavior: 'smooth',
                            })
                          }
                          className="px-3 py-2 rounded-full bg-white border border-gray-200 shadow-md text-sm hover:bg-gray-50"
                        >
                          Jump to latest
                        </button>
                      </div>
                    )}

                    <div className="p-3 border-t bg-white shrink-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleSupportAttachmentPick}
                      />

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            placeholder="Type your message…"
                            onKeyDown={(e) =>
                              e.key === 'Enter' &&
                              !sending &&
                              !uploading &&
                              sendSupportReply()
                            }
                            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                            disabled={sending || uploading}
                          />

                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={sending || uploading}
                            className="rounded-2xl"
                            title="Attach image or file"
                          >
                            <Paperclip size={16} />
                          </Button>

                          <Button
                            size="icon"
                            onClick={() => sendSupportReply()}
                            disabled={sending || uploading || !replyInput.trim()}
                            className="rounded-2xl bg-[#118C8C] hover:bg-[#0d7070]"
                          >
                            <Send size={16} />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-gray-500 px-1">
                          <div className="flex items-center gap-1">
                            <ImageIcon size={13} />
                            Images
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText size={13} />
                            Files
                          </div>
                          {(sending || uploading) && (
                            <span className="text-[#118C8C] font-medium">
                              {uploading ? 'Uploading attachment...' : 'Sending...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'admin-ai' && isAdminLike && (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="px-4 pt-4 pb-3 border-b bg-white shrink-0">
                  <div className="rounded-2xl bg-[#118C8C]/7 border border-[#118C8C]/12 p-3">
                    <p className="text-sm font-semibold text-[#118C8C]">
                      Admin AI
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Ask about products, orders, stock, revenue, best sellers, and order statuses.
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50 to-white">
                  {adminMessages.map((msg, i) => (
                    <Bubble
                      key={i}
                      isMine={msg.role === 'user'}
                      label={msg.role === 'user' ? 'You' : 'Admin AI'}
                      text={msg.content}
                    />
                  ))}
                  {adminLoading && (
                    <div className="text-sm text-gray-500 px-2">Checking live admin data…</div>
                  )}
                  <div ref={adminEndRef} />
                </div>

                <div className="p-3 border-t bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      value={adminInput}
                      onChange={(e) => setAdminInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendAdminMessage()}
                      placeholder="Ask about products, orders, or analytics..."
                      className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                      disabled={adminLoading}
                    />
                    <Button
                      size="icon"
                      onClick={sendAdminMessage}
                      disabled={adminLoading || !adminInput.trim()}
                      className="rounded-2xl bg-[#118C8C] hover:bg-[#0d7070]"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#F2BB16] text-gray-900 p-5 rounded-full shadow-2xl hover:shadow-xl"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
};

export default ChatWidget;

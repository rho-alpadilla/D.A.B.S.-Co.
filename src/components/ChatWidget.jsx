// src/components/ChatWidget.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Plus,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

const ChatWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dabzzy');

  // Dabzzy AI
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hey there! I’m Dabzzy, your crafty sidekick! 🛍️✨ Ask me anything about our artisan goodies!',
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef(null);

  // Support
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [replyInput, setReplyInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Buyer: start new chat
  const [buyerNewChatOpen, setBuyerNewChatOpen] = useState(false);
  const [buyerSubject, setBuyerSubject] = useState('General Support');
  const [buyerMessage, setBuyerMessage] = useState('');
  const [buyerSending, setBuyerSending] = useState(false);

  // Admin
  const isAdmin = user?.email === 'admin@dabs.co';

  // Support scroll behavior
  const supportScrollRef = useRef(null);
  const bottomRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showJump, setShowJump] = useState(false);

  // ---------- helpers ----------
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

  const DEFAULT_STORE_KNOWLEDGE = {
    location: 'Baguio City',
    owner: 'siakniowner',
    shippingInfo:
      'For exact shipping timelines, please chat with admin in the Support tab.',
    fallbackSupport:
      'I’m not fully sure about that yet. Please chat with admin in the Support tab for a confirmed answer.',
    faqs: [
      {
        triggers: ['where are you from', 'where is dabs from', 'location', 'based in'],
        answer: 'D.A.B.S. Co is based in Baguio City.',
      },
      {
        triggers: ['who is the owner', 'who is the artist', 'owner', 'artist'],
        answer: 'The owner/artist is siakniowner.',
      },
      {
        triggers: ['how many days to ship', 'shipping days', 'when will it ship', 'how long is shipping'],
        answer:
          'For exact shipping timelines, please chat with admin in the Support tab.',
      },
    ],
  };

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

  const normalizeText = (value = '') => value.toLowerCase().trim();

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

  const buildStockSummary = (products) => {
    return products.slice(0, 20).map((product) => {
      const name = getProductName(product);
      const stock = getProductStock(product);

      if (stock === null) {
        return `${name}: stock not specified`;
      }

      return `${name}: ${stock} left`;
    });
  };

  const findProductFromQuestion = (question, products) => {
    const q = normalizeText(question);

    return products.find((product) =>
      q.includes(normalizeText(getProductName(product)))
    );
  };

  const getDirectStoreAnswer = (
    question,
    knowledge,
    products,
    bestSellers,
    newArrivals
  ) => {
    const q = normalizeText(question);

    if (!q) return null;

    for (const faq of knowledge.faqs || []) {
      const matched = (faq.triggers || []).some((trigger) =>
        q.includes(normalizeText(trigger))
      );
      if (matched) return faq.answer;
    }

    if (
      q.includes('best seller') ||
      q.includes('bestseller') ||
      q.includes('most sold') ||
      q.includes('top selling')
    ) {
      return bestSellers.length
        ? `Our current best sellers are:\n${bestSellers.join('\n')}`
        : 'I do not have enough order data yet to determine the best sellers.';
    }

    if (
      q.includes('new arrival') ||
      q.includes('new arrivals') ||
      q.includes('latest') ||
      q.includes('new product')
    ) {
      return newArrivals.length
        ? `Here are our newest arrivals:\n${newArrivals.join('\n')}`
        : 'I cannot see any new-arrival data yet.';
    }

    if (
      q.includes('stock left') ||
      q.includes('stocks left') ||
      q.includes('how many stock') ||
      q.includes('available stock') ||
      q.includes('available pieces')
    ) {
      const matchedProduct = findProductFromQuestion(question, products);

      if (matchedProduct) {
        const stock = getProductStock(matchedProduct);
        const name = getProductName(matchedProduct);

        if (stock === null) {
          return `${name} is listed, but the exact stock count is not set yet. Please chat with admin to confirm availability.`;
        }

        if (stock <= 0) {
          return `${name} is currently out of stock.`;
        }

        return `${name} currently has ${stock} stock left.`;
      }

      return 'Please mention the exact product name so I can check the stock left for that item.';
    }

    if (q.includes('ship') || q.includes('shipping') || q.includes('delivery')) {
      return knowledge.shippingInfo || DEFAULT_STORE_KNOWLEDGE.shippingInfo;
    }

    return null;
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

  // ---------- AI auto-scroll ----------
  useEffect(() => {
    if (!isOpen || activeTab !== 'dabzzy') return;
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isOpen, activeTab]);

  // Reset jump state
  useEffect(() => {
    if (!isOpen || activeTab !== 'admin' || !selectedConvo) {
      setShowJump(false);
      setIsNearBottom(true);
    }
  }, [isOpen, activeTab, selectedConvo]);

  // Track scroll position only inside support conversation
  useEffect(() => {
    const el = supportScrollRef.current;
    if (!el || !selectedConvo || activeTab !== 'admin' || !isOpen) return;

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

  // Auto-scroll only if near bottom
  useEffect(() => {
    if (!isOpen || activeTab !== 'admin' || !selectedConvo) return;
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages, isNearBottom, isOpen, activeTab, selectedConvo]);

  // ---------- SUPPORT: Load conversations ----------
  useEffect(() => {
    if (!user?.email || activeTab !== 'admin' || !isOpen) return;

    const q = isAdmin
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
        const key = isAdmin ? `${buyerKey}-${subject}` : subject;

        const createdMillis = msg.createdAt?.toMillis?.() || 0;

        if (!grouped[key]) {
          grouped[key] = {
            key,
            subject,
            buyerEmail: msg.buyerEmail,
            buyerName: msg.buyerName || buyerKey.split('@')[0],
            latestMillis: createdMillis,
            lastPreview: msg.message || '',
            lastSenderLabel: msg.isAdminReply ? 'Admin' : 'Buyer',
            hasUnread: false,
          };
        }

        if (createdMillis >= (grouped[key].latestMillis || 0)) {
          grouped[key].latestMillis = createdMillis;
          grouped[key].lastPreview = msg.message || '';
          grouped[key].lastSenderLabel = msg.isAdminReply ? 'Admin' : 'Buyer';
        }

        if (
          msg.status === 'unread' &&
          ((isAdmin && !msg.isAdminReply) || (!isAdmin && msg.isAdminReply))
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
  }, [user?.email, activeTab, isOpen, isAdmin]);

  // ---------- SUPPORT: Load selected conversation messages ----------
  useEffect(() => {
    if (!selectedConvo || !isOpen || activeTab !== 'admin') return;

    const buyerEmail = isAdmin ? selectedConvo.buyerEmail : user?.email;
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
          ((isAdmin && !msg.isAdminReply) || (!isAdmin && msg.isAdminReply))
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
  }, [selectedConvo, isOpen, activeTab, isAdmin, user?.email]);

  // ---------- Reply in existing conversation ----------
  const sendSupportReply = async () => {
    if (!replyInput.trim() || !selectedConvo || sending) return;

    const text = replyInput.trim();
    setReplyInput('');
    setSending(true);

    const optimisticId = `local-${Date.now()}`;
    setSupportMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        message: text,
        isAdminReply: isAdmin,
        status: 'unread',
        createdAt: { toDate: () => new Date(), toMillis: () => Date.now() },
        _optimistic: true,
      },
    ]);

    try {
      const buyerEmail = isAdmin ? selectedConvo.buyerEmail : user?.email;

      await addDoc(collection(db, 'messages'), {
        buyerEmail,
        buyerName: selectedConvo.buyerName || user?.email?.split('@')[0],
        subject: selectedConvo.subject || 'General Support',
        message: text,
        status: 'unread',
        createdAt: serverTimestamp(),
        isAdminReply: isAdmin,
        ...(isAdmin && {
          adminEmail: user.email,
          adminName: user.displayName || 'Admin',
        }),
      });
    } catch (err) {
      console.error(err);
      setSupportMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast({
        title: 'Error',
        description: 'Failed to send.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // ---------- Buyer: Start New Chat ----------
  const startBuyerChat = async () => {
    if (!user?.email) {
      toast({
        title: 'Login required',
        description: 'Please log in to contact support.',
        variant: 'destructive',
      });
      return;
    }

    if (!buyerMessage.trim() || buyerSending) return;

    setBuyerSending(true);
    try {
      const subject = (buyerSubject || 'General Support').trim();

      await addDoc(collection(db, 'messages'), {
        buyerEmail: user.email,
        buyerName: user.displayName || user.email.split('@')[0],
        subject,
        message: buyerMessage.trim(),
        status: 'unread',
        createdAt: serverTimestamp(),
        isAdminReply: false,
      });

      setSelectedConvo({
        key: subject,
        subject,
        buyerEmail: user.email,
        buyerName: user.displayName || user.email.split('@')[0],
      });

      setBuyerMessage('');
      setBuyerSubject('General Support');
      setBuyerNewChatOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to start chat.',
        variant: 'destructive',
      });
    } finally {
      setBuyerSending(false);
    }
  };

  // ---------- Dabzzy AI ----------
  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMsg = { role: 'user', content: aiInput };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const [pricelistsResult, ordersResult, knowledgeResult] =
        await Promise.allSettled([
          getDocs(collection(db, 'pricelists')),
          getDocs(collection(db, 'orders')),
          getDoc(doc(db, 'siteContent', 'assistantKnowledge')),
        ]);

      const products =
        pricelistsResult.status === 'fulfilled'
          ? pricelistsResult.value.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((p) => p.inStock !== false)
          : [];

      const orders =
        ordersResult.status === 'fulfilled'
          ? ordersResult.value.docs.map((d) => ({ id: d.id, ...d.data() }))
          : [];

      const firestoreKnowledge =
        knowledgeResult.status === 'fulfilled' && knowledgeResult.value.exists()
          ? knowledgeResult.value.data()
          : {};

      const storeKnowledge = {
        ...DEFAULT_STORE_KNOWLEDGE,
        ...firestoreKnowledge,
        faqs: [
          ...(DEFAULT_STORE_KNOWLEDGE.faqs || []),
          ...(Array.isArray(firestoreKnowledge?.faqs)
            ? firestoreKnowledge.faqs
            : []),
        ],
      };

      const bestSellerLines = buildBestSellerSummary(orders);
      const newArrivalLines = buildNewArrivalSummary(products);
      const stockLines = buildStockSummary(products);

      const directAnswer = getDirectStoreAnswer(
        userMsg.content,
        storeKnowledge,
        products,
        bestSellerLines,
        newArrivalLines
      );

      if (directAnswer) {
        setAiMessages((prev) => [
          ...prev,
          { role: 'assistant', content: directAnswer },
        ]);
        return;
      }

      const productsText =
        products.length > 0
          ? products
              .slice(0, 20)
              .map((p) => {
                const name = getProductName(p);
                const price = getProductPrice(p);
                const description = getProductDescription(p);
                const stock = getProductStock(p);

                return `${name}: ${
                  price !== null ? `₱${price}` : 'price not set'
                } — ${description || 'No description'} — ${
                  stock !== null ? `${stock} stock left` : 'stock not specified'
                }`;
              })
              .join(' | ')
          : 'No products available right now.';

      const bestSellerText =
        bestSellerLines.length > 0
          ? bestSellerLines.join(' | ')
          : 'Best-seller data is not available yet.';

      const newArrivalText =
        newArrivalLines.length > 0
          ? newArrivalLines.join(' | ')
          : 'New-arrival data is not available yet.';

      const stockText =
        stockLines.length > 0
          ? stockLines.join(' | ')
          : 'Stock data is not available yet.';

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `
You are Dabzzy, the assistant for D.A.B.S. Co.

Rules:
- Be warm, short, and helpful.
- Answer using the store data provided below.
- Never invent facts.
- If exact shipping or business details are not confirmed, tell the user to chat with admin in the Support tab.
- If asked about stock left, use the stock data.
- If asked about best sellers, use the sales summary.
- If asked about new arrivals, use the latest product summary.

Store facts:
- Location: ${storeKnowledge.location}
- Owner/Artist: ${storeKnowledge.owner}
- Shipping guidance: ${storeKnowledge.shippingInfo}
- Admin fallback: ${storeKnowledge.fallbackSupport}

Current products:
${productsText}

Current stock summary:
${stockText}

Best sellers:
${bestSellerText}

New arrivals:
${newArrivalText}
                `.trim(),
              },
              ...aiMessages,
              userMsg,
            ],
            max_tokens: 220,
            temperature: 0.5,
          }),
        }
      );

      if (!response.ok) throw new Error('Groq error');

      const data = await response.json();
      const content =
        data?.choices?.[0]?.message?.content ||
        storeKnowledge.fallbackSupport;

      setAiMessages((prev) => [
        ...prev,
        { role: 'assistant', content },
      ]);
    } catch (err) {
      console.error(err);
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Oops — I could not load the store details right now. Please try again, or chat with admin in the Support tab.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // ---------- bubble ----------
  const Bubble = ({ isMine, label, text, time }) => {
    const base =
      'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border text-sm leading-relaxed';
    const mineStyle =
      'bg-[#118C8C] text-white border-[#118C8C]/20 rounded-br-md ml-auto';
    const otherStyle = 'bg-white text-gray-800 border-gray-200 rounded-bl-md';

    return (
      <div
        className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
      >
        <div className={`${base} ${isMine ? mineStyle : otherStyle}`}>
          <div className="text-[11px] opacity-80 mb-1">{label}</div>
          <div className="whitespace-pre-wrap break-words">{text}</div>
          {time && <div className="text-[11px] opacity-70 mt-2">{time}</div>}
        </div>
      </div>
    );
  };

  // ---------- render support ----------
  const renderedSupportStream = useMemo(() => {
    if (!supportMessages?.length) return [];

    const mineOf = (msg) => (isAdmin ? !!msg.isAdminReply : !msg.isAdminReply);

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
        : isAdmin
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
      });

      prevMillis = millis;
    }

    return out;
  }, [supportMessages, isAdmin]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            className="w-[390px] h-[580px] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white flex flex-col min-h-0"
          >
            {/* Header */}
            <div className="bg-[#118C8C] p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {activeTab === 'admin' && selectedConvo && (
                  <button
                    onClick={() => {
                      setSelectedConvo(null);
                      setSupportMessages([]);
                      setReplyInput('');
                    }}
                    className="mr-1 text-white/95 hover:text-white hover:opacity-90 transition"
                  >
                    ← Back
                  </button>
                )}
                <MessageCircle size={22} />
                <h3 className="font-bold text-lg">
                  D.A.B.S. Chat {isAdmin && '(Admin)'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:opacity-90 transition"
              >
                <X size={20} />
              </button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 min-h-0 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1">
                <TabsTrigger value="dabzzy" className="gap-2">
                  <Sparkles size={16} /> Dabzzy AI
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2">
                  <Headphones size={16} /> Support
                </TabsTrigger>
              </TabsList>

              {/* AI */}
              <TabsContent
                value="dabzzy"
                className="m-0 flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50 to-white">
                  {aiMessages.map((msg, i) => (
                    <Bubble
                      key={i}
                      isMine={msg.role === 'user'}
                      label={msg.role === 'user' ? 'You' : 'Dabzzy AI'}
                      text={msg.content}
                    />
                  ))}
                  {aiLoading && (
                    <div className="text-sm text-gray-500 px-2">Thinking…</div>
                  )}
                  <div ref={aiEndRef} />
                </div>

                <div className="p-3 border-t bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                      placeholder="Ask Dabzzy…"
                      className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                      disabled={aiLoading}
                    />
                    <Button
                      size="icon"
                      onClick={sendAiMessage}
                      disabled={aiLoading || !aiInput.trim()}
                      className="rounded-2xl bg-[#118C8C] hover:bg-[#0d7070]"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Support */}
              <TabsContent
                value="admin"
                className="m-0 flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                {!selectedConvo ? (
                  <div className="flex-1 min-h-0 flex flex-col">
                    {!isAdmin && (
                      <div className="px-4 pt-4 pb-3 border-b bg-white">
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
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => setBuyerNewChatOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-[#118C8C] hover:bg-[#0d7070] rounded-xl"
                                onClick={startBuyerChat}
                                disabled={buyerSending || !buyerMessage.trim()}
                              >
                                {buyerSending ? 'Sending…' : 'Start Chat'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="px-4 pt-4 pb-3 bg-white border-b space-y-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {isAdmin
                            ? 'Customer Conversations'
                            : 'Your Conversations'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {isAdmin
                            ? 'Tap a customer thread to open the full chat.'
                            : 'Open a support thread or start a new one.'}
                        </p>
                      </div>

                      {isAdmin && (
                        <input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search by name, email, subject, or message..."
                          className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                        />
                      )}
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
                          const displayName = isAdmin
                            ? getDisplayName(convo)
                            : convo.subject;
                          const avatarSeed = isAdmin
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

                                    {isAdmin ? (
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
                    {/* Conversation header */}
                    <div className="px-4 py-3 bg-white border-b flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0 ${getAvatarTone(
                          selectedConvo.buyerEmail ||
                            selectedConvo.buyerName ||
                            selectedConvo.subject
                        )}`}
                      >
                        {getInitials(
                          isAdmin ? getDisplayName(selectedConvo) : 'Support'
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {isAdmin
                            ? getDisplayName(selectedConvo)
                            : 'D.A.B.S. Support'}
                        </p>

                        {isAdmin ? (
                          <p className="text-xs text-gray-500 truncate">
                            {selectedConvo.buyerEmail}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 truncate">
                            {selectedConvo.subject}
                          </p>
                        )}

                        {isAdmin && (
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-full bg-[#118C8C]/10 text-[#118C8C] px-2 py-0.5 text-[11px] font-medium">
                              {selectedConvo.subject}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
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
                          />
                        );
                      })}

                      <div className="h-6" />
                      <div ref={bottomRef} />
                    </div>

                    {/* Jump */}
                    {showJump && (
                      <div className="absolute bottom-[86px] right-4">
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

                    {/* Input */}
                    <div className="p-3 border-t bg-white">
                      <div className="flex items-center gap-2">
                        <input
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          placeholder="Type your message…"
                          onKeyDown={(e) =>
                            e.key === 'Enter' && !sending && sendSupportReply()
                          }
                          className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                          disabled={sending}
                        />
                        <Button
                          size="icon"
                          onClick={sendSupportReply}
                          disabled={sending || !replyInput.trim()}
                          className="rounded-2xl bg-[#118C8C] hover:bg-[#0d7070]"
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
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
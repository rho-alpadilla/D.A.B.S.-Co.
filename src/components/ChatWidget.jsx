// src/components/ChatWidget.jsx ← FIXED: Full access + Admin sees all messages + No crashes
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, 
  updateDoc, doc, where, getDoc 
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
    { role: 'assistant', content: 'Hey there! I’m Dabzzy, your crafty sidekick! 🛍️✨ Ask me anything about our artisan goodies!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef(null);

  // Admin Support
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [adminReply, setAdminReply] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [buyerProfiles, setBuyerProfiles] = useState({});
  const adminEndRef = useRef(null);

  const isAdmin = user?.email?.includes('@admin.dabs.com') || user?.customClaims?.admin;

  // Scroll to bottom
  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  useEffect(() => {
    adminEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

  // Fetch buyer profile (only once per email)
  const fetchBuyerProfile = useCallback(async (email) => {
    if (!email || buyerProfiles[email]) return;

    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setBuyerProfiles(prev => ({
          ...prev,
          [email]: {
            name: data.username || data.displayName || email.split('@')[0],
            photoURL: data.photoURL || null
          }
        }));
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }, [buyerProfiles]);

  // Load conversations
  useEffect(() => {
    if (!user?.email || activeTab !== 'admin' || !isOpen) return;

    let q;
    if (isAdmin) {
      q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "messages"), where("buyerEmail", "==", user.email), orderBy("createdAt", "desc"));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const grouped = {};
      messages.forEach(msg => {
        const buyerKey = msg.buyerEmail || 'unknown';
        const key = isAdmin ? `${buyerKey}-${msg.subject || 'General'}` : (msg.subject || 'General');

        if (!grouped[key]) {
          grouped[key] = {
            key,
            subject: msg.subject || 'General Support',
            buyerEmail: msg.buyerEmail,
            buyerName: msg.buyerName || buyerKey.split('@')[0],
            latestDate: msg.createdAt,
            messages: [],
            hasUnread: false
          };
          if (isAdmin && msg.buyerEmail) fetchBuyerProfile(msg.buyerEmail);
        }

        grouped[key].messages.push(msg);
        if (msg.createdAt > grouped[key].latestDate) grouped[key].latestDate = msg.createdAt;
        if (msg.status === 'unread' && ((isAdmin && !msg.isAdminReply) || (!isAdmin && msg.isAdminReply))) {
          grouped[key].hasUnread = true;
        }
      });

      const sorted = Object.values(grouped).sort((a, b) => 
        (b.latestDate?.toMillis?.() || 0) - (a.latestDate?.toMillis?.() || 0)
      );

      setConversations(sorted);

      // Auto-select first if none selected
      if (sorted.length > 0 && !selectedConvo) {
        setSelectedConvo(sorted[0]);
      }
    });

    return () => unsubscribe();
  }, [user?.email, activeTab, isOpen, isAdmin, fetchBuyerProfile, selectedConvo]);

  // Load selected conversation messages
  useEffect(() => {
    if (!selectedConvo || !isOpen || activeTab !== 'admin') return;

    const q = query(
      collection(db, "messages"),
      where("subject", "==", selectedConvo.subject),
      where("buyerEmail", "==", selectedConvo.buyerEmail),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSupportMessages(msgs);

      // Mark unread as read
      msgs.forEach(async (msg) => {
        if (msg.status === "unread" && ((isAdmin && !msg.isAdminReply) || (!isAdmin && msg.isAdminReply))) {
          try {
            await updateDoc(doc(db, "messages", msg.id), { status: "read" });
          } catch (err) {
            console.error("Mark read failed:", err);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [selectedConvo, isOpen, activeTab, isAdmin]);

  // Send reply
  const sendAdminReply = async () => {
    if (!adminReply.trim() || !selectedConvo || adminLoading) return;

    setAdminLoading(true);
    try {
      await addDoc(collection(db, "messages"), {
        buyerEmail: selectedConvo.buyerEmail,
        buyerName: selectedConvo.buyerName,
        subject: selectedConvo.subject,
        message: adminReply.trim(),
        status: "unread",
        createdAt: serverTimestamp(),
        isAdminReply: isAdmin,
        ...(isAdmin && { adminEmail: user.email, adminName: user.displayName || "Admin" })
      });

      setAdminReply('');
      toast({ title: "Sent!", description: isAdmin ? "Reply sent" : "Message sent" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to send", variant: "destructive" });
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Dabzzy AI send
  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const snapshot = await getDocs(collection(db, 'pricelists'));
      const products = snapshot.docs.map(d => d.data()).filter(p => p.inStock !== false);
      const productsText = products.length > 0
        ? products.map(p => `${p.name}: ₱${p.price} — ${p.description}`).join(' | ')
        : 'No products available right now.';

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `You are Dabzzy, a super fun and crafty assistant for D.A.B.S. Co. Current products: ${productsText}. Be short, warm, playful, use emojis!` },
            ...aiMessages,
            userMsg
          ],
          max_tokens: 180,
          temperature: 0.8,
        }),
      });

      if (!response.ok) throw new Error('Groq error');
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Dabzzy is having a hiccup. Try again! 🛠️' }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 h-[500px] mb-4 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#118C8C] p-4 flex justify-between items-center text-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <MessageCircle size={24} />
                <h3 className="font-bold text-lg">D.A.B.S. Chat {isAdmin && '(Admin)'}</h3>
              </div>
              <button onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dabzzy">Dabzzy AI</TabsTrigger>
                <TabsTrigger value="admin">Support</TabsTrigger>
              </TabsList>

              {/* Dabzzy Tab */}
              <TabsContent value="dabzzy" className="flex-1 flex flex-col m-0">
                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`mb-3 p-3 rounded-lg max-w-[85%] ${
                        msg.role === 'user' ? 'bg-[#118C8C] text-white ml-auto' : 'bg-white border'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                  {aiLoading && <p className="text-sm text-gray-500">Thinking...</p>}
                  <div ref={aiEndRef} />
                </div>
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <input
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && sendAiMessage()}
                      placeholder="Ask Dabzzy..."
                      className="flex-1 border rounded-full px-4 py-2 text-sm"
                      disabled={aiLoading}
                    />
                    <Button size="icon" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Admin Support Tab */}
              <TabsContent value="admin" className="flex-1 flex flex-col m-0">
                {!selectedConvo ? (
                  <div className="flex-1 p-4 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <p className="text-center text-gray-500 mt-10">No conversations yet</p>
                    ) : (
                      conversations.map(convo => (
                        <div
                          key={convo.key}
                          onClick={() => setSelectedConvo(convo)}
                          className="p-4 bg-white rounded-lg mb-3 cursor-pointer hover:bg-gray-50 flex items-center gap-4 border"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                            {convo.photoURL ? (
                              <img src={convo.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                                {convo.buyerName?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{convo.buyerName}</p>
                            <p className="text-sm text-gray-600 truncate">{convo.subject}</p>
                          </div>
                          {convo.hasUnread && <div className="w-3 h-3 bg-red-500 rounded-full" />}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-white border-b flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedConvo(null)}>
                        ← Back
                      </Button>
                      <div className="text-center flex-1">
                        <p className="font-medium">{selectedConvo.buyerName}</p>
                        <p className="text-xs text-gray-500">{selectedConvo.subject}</p>
                      </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {supportMessages.length === 0 ? (
                        <p className="text-center text-gray-500">No messages yet</p>
                      ) : (
                        supportMessages.map(msg => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg max-w-[85%] ${
                              msg.isAdminReply ? 'ml-auto bg-[#118C8C] text-white' : 'bg-gray-100'
                            }`}
                          >
                            <p className="text-xs opacity-70 mb-1">
                              {msg.isAdminReply ? 'Admin' : selectedConvo.buyerName}
                            </p>
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                      <div ref={adminEndRef} />
                    </div>

                    <div className="p-3 border-t bg-white">
                      <div className="flex gap-2">
                        <input
                          value={adminReply}
                          onChange={e => setAdminReply(e.target.value)}
                          placeholder="Type your message..."
                          onKeyPress={e => e.key === 'Enter' && !adminLoading && sendAdminReply()}
                          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]"
                          disabled={adminLoading}
                        />
                        <Button 
                          size="icon" 
                          onClick={sendAdminReply} 
                          disabled={adminLoading || !adminReply.trim()}
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#F2BB16] text-gray-900 p-5 rounded-full shadow-2xl hover:shadow-xl"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
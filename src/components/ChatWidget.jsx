// src/components/ChatWidget.jsx ← FIXED: Admin sees all user messages + profiles + real-time sync
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc, where, getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

const ChatWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dabzzy');

  // Dabzzy AI (unchanged)
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', content: 'Hey there! I’m Dabzzy, your crafty sidekick! 🛍️✨ Ask me anything about our artisan goodies!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef(null);

  // Admin Support
  const [conversations, setConversations] = useState([]); // array of convo objects
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [adminReply, setAdminReply] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [buyerProfiles, setBuyerProfiles] = useState({}); // cache: email → {name, photoURL}
  const adminEndRef = useRef(null);

  const isAdmin = user?.email?.includes('@admin.dabs.com') || user?.customClaims?.admin;

  // Scroll helpers
  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  useEffect(() => {
    adminEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

  // Fetch buyer profiles (name + photo) for admin view
  const fetchBuyerProfile = useCallback(async (email) => {
    if (!email || buyerProfiles[email]) return;

    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDoc = snap.docs[0].data();
        setBuyerProfiles(prev => ({
          ...prev,
          [email]: {
            name: userDoc.username || userDoc.displayName || email.split('@')[0],
            photoURL: userDoc.photoURL || null
          }
        }));
      }
    } catch (err) {
      console.error("Failed to fetch buyer profile:", err);
    }
  }, [buyerProfiles]);

  // Load conversations (different query for admin vs buyer)
  useEffect(() => {
    if (!user?.email || activeTab !== 'admin' || !isOpen) return;

    let q;
    if (isAdmin) {
      // Admin: all messages
      q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    } else {
      // Buyer: only own messages
      q = query(collection(db, "messages"), where("buyerEmail", "==", user.email), orderBy("createdAt", "desc"));
    }

    const unsubscribe = onSnapshot(q, async (snap) => {
      const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const grouped = {};
      const profilePromises = [];

      messages.forEach(msg => {
        const buyerKey = msg.buyerEmail || 'unknown';
        const key = isAdmin 
          ? `${buyerKey} - ${msg.subject || "General Support"}`
          : msg.subject || "General Support";

        if (!grouped[key]) {
          grouped[key] = {
            key,
            subject: msg.subject || "General Support",
            buyerEmail: msg.buyerEmail,
            buyerName: msg.buyerName || buyerKey.split('@')[0],
            latestDate: msg.createdAt,
            messages: [],
            hasUnread: false
          };

          // Fetch profile if admin
          if (isAdmin && msg.buyerEmail) {
            profilePromises.push(fetchBuyerProfile(msg.buyerEmail));
          }
        }

        grouped[key].messages.push(msg);

        if (msg.createdAt > grouped[key].latestDate) {
          grouped[key].latestDate = msg.createdAt;
        }

        // Unread check
        if (msg.status === "unread") {
          if (isAdmin && !msg.isAdminReply) grouped[key].hasUnread = true;
          if (!isAdmin && msg.isAdminReply) grouped[key].hasUnread = true;
        }
      });

      // Wait for profile fetches
      await Promise.all(profilePromises);

      // Apply profiles to convos
      const sorted = Object.values(grouped).map(convo => {
        if (isAdmin && convo.buyerEmail && buyerProfiles[convo.buyerEmail]) {
          const profile = buyerProfiles[convo.buyerEmail];
          convo.buyerName = profile.name;
          convo.photoURL = profile.photoURL;
        }
        return convo;
      }).sort((a, b) => (b.latestDate?.toDate?.() || 0) - (a.latestDate?.toDate?.() || 0));

      setConversations(sorted);

      // Auto-select first convo if none selected
      if (sorted.length > 0 && !selectedConvo) {
        setSelectedConvo(sorted[0]);
      }
    });

    return () => unsubscribe();
  }, [user?.email, activeTab, isOpen, isAdmin, fetchBuyerProfile, buyerProfiles, selectedConvo]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvo || !isOpen || activeTab !== 'admin') return;

    const q = query(
      collection(db, "messages"),
      where("subject", "==", selectedConvo.subject),
      where("buyerEmail", "==", selectedConvo.buyerEmail),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSupportMessages(messages);

      // Mark unread messages as read
      messages.forEach(async (msg) => {
        if (msg.status === "unread") {
          const shouldMark = isAdmin ? !msg.isAdminReply : msg.isAdminReply;
          if (shouldMark) {
            try {
              await updateDoc(doc(db, "messages", msg.id), { status: "read" });
            } catch (err) {
              console.error("Mark read error:", err);
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [selectedConvo, isOpen, activeTab, isAdmin]);

  // Send reply (buyer or admin)
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
        adminEmail: isAdmin ? user.email : null,
        adminName: isAdmin ? (user.displayName || "Admin") : null
      });

      setAdminReply('');
      toast({ title: "Sent", description: isAdmin ? "Reply sent to user" : "Message sent to admin" });
    } catch (err) {
      toast({ title: "Failed", description: "Could not send", variant: "destructive" });
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Dabzzy AI send (unchanged)
  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const snapshot = await getDocs(collection(db, 'pricelists'));
      const products = snapshot.docs.map(doc => doc.data()).filter(p => p.inStock !== false);
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

      if (!response.ok) throw new Error(`Groq ${response.status}`);
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Oopsie! Dabzzy is having a tiny hiccup. Try again! 🛠️' }]);
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
                <h3 className="font-bold text-lg">D.A.B.S. Chat {isAdmin && '(Admin Mode)'}</h3>
              </div>
              <button onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dabzzy">Dabzzy AI</TabsTrigger>
                <TabsTrigger value="admin">Admin Support</TabsTrigger>
              </TabsList>

              {/* Dabzzy Tab */}
              <TabsContent value="dabzzy" className="flex-1 flex flex-col m-0">
                {/* ... your existing Dabzzy content ... */}
              </TabsContent>

              {/* Admin Support Tab */}
              <TabsContent value="admin" className="flex-1 flex flex-col m-0">
                {!selectedConvo ? (
                  <div className="flex-1 p-4 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <p className="text-center text-gray-500 mt-10">No conversations yet</p>
                    ) : (
                      <div className="space-y-3">
                        {conversations.map((convo) => (
                          <div
                            key={convo.key}
                            onClick={() => setSelectedConvo(convo)}
                            className="p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50 flex items-center gap-4"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {convo.photoURL ? (
                                <img src={convo.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">
                                  {convo.buyerName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{convo.buyerName}</p>
                              <p className="text-sm text-gray-600 truncate">{convo.subject}</p>
                            </div>
                            {convo.hasUnread && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="p-3 bg-white border-b flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedConvo(null)}>
                        ← Back
                      </Button>
                      <div className="text-center">
                        <p className="font-medium">{selectedConvo.buyerName}</p>
                        <p className="text-xs text-gray-500">{selectedConvo.subject}</p>
                      </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {supportMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.isAdminReply
                              ? 'ml-auto bg-[#118C8C] text-white'
                              : 'bg-gray-100'
                          }`}
                        >
                          <p className="text-xs opacity-70 mb-1">
                            {msg.isAdminReply ? 'Admin' : selectedConvo.buyerName}
                          </p>
                          <p>{msg.message}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                      <div ref={adminEndRef} />
                    </div>

                    <div className="p-3 border-t bg-white">
                      <div className="flex gap-2">
                        <input
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          placeholder="Type your message..."
                          onKeyPress={(e) => e.key === 'Enter' && sendAdminReply()}
                          className="flex-1 border rounded-full px-4 py-2"
                          disabled={adminLoading}
                        />
                        <Button onClick={sendAdminReply} disabled={adminLoading || !adminReply.trim()}>
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

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#F2BB16] text-gray-900 p-5 rounded-full shadow-2xl"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
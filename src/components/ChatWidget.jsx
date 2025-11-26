import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Welcome to D.A.B.S. Co. Ask me anything about our artisan crafts!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      //  Fetch live pricelists from Firestore
      const snapshot = await getDocs(collection(db, 'pricelists'));
      const products = snapshot.docs
        .map(doc => doc.data())
        .filter(p => p.inStock !== false);
      const productsText = products.length > 0
        ? products.map(p => `${p.name}: $${p.price} — ${p.description}`).join(' | ')
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
            { 
              role: 'system', 
              content: `You are a friendly sales assistant for D.A.B.S. Co. Current products: ${productsText}. 
                        Answer questions about products, prices, availability, and orders. Be short and warm.`
            },
            ...messages,
            userMessage
          ],
          max_tokens: 180,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error(`Groq ${response.status}`);
      const data = await response.json();
      const aiReply = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I’m having trouble right now. Try again in a moment!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = e => e.key === 'Enter' && !isLoading && sendMessage();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* ... your existing beautiful UI stays 100% the same ... */}
      {/* (I kept everything from the toggle button to the input exactly as you had it) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 mb-4 overflow-hidden flex flex-col"
          >
            <div className="bg-[#118C8C] p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold">D.A.B.S. Assistant</h3>
                <p className="text-xs opacity-80">Ask about products or orders</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
                <X size={18} />
              </button>
            </div>

            <div className="h-80 bg-gray-50 p-4 overflow-y-auto">
              <div className="flex flex-col gap-3">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg shadow-sm border border-gray-100 max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-[#118C8C] text-white rounded-tr-none ml-auto'
                        : 'bg-white rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </motion.div>
                ))}
                {isLoading && <div className="text-sm text-gray-500">Thinking…</div>}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#118C8C] disabled:opacity-50"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-9 w-9 rounded-full bg-[#118C8C] hover:bg-[#0d7070] disabled:opacity-50"
                >
                  <Send size={16} />
                </Button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-2">Powered by Groq + Firebase</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#F2BB16] text-gray-900 p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
                <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100 max-w-[85%]">
                  <p className="text-sm text-gray-800">Hi there! 👋 How can I help you find the perfect handmade item today?</p>
                </div>
                <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100 max-w-[85%]">
                  <p className="text-sm text-gray-800">I can help with custom commission questions too!</p>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#118C8C]"
                />
                <Button size="icon" className="h-9 w-9 rounded-full bg-[#118C8C] hover:bg-[#0d7070]">
                  <Send size={16} />
                </Button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-2">
                AI Assistant (Placeholder)
              </p>
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
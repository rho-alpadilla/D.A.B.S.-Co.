import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Plus,
  Sparkles,
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

// Receives every field the ChatWidget controller (ChatWidget/index.jsx) computes,
// spread from its 'chatState' object. Trim to only what this tab actually uses
// once you've confirmed it renders correctly (delete the rest).
const ChatAdminAiTab = (props) => {
  const {
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
    getUserAiReply,
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
  } = props;

  return (
    <>
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
    </>
  );
};

export default ChatAdminAiTab;

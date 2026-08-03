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

// Receives every field the ChatWidget controller (ChatWidget/index.jsx) computes,
// spread from its 'chatState' object. Trim to only what this tab actually uses
// once you've confirmed it renders correctly (delete the rest).
const ChatAskTab = (props) => {
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
                          <h3 className="font-nunito text-xl font-bold text-gray-900">
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
    </>
  );
};

export default ChatAskTab;

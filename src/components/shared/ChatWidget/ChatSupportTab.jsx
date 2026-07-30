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
const ChatSupportTab = (props) => {
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
    </>
  );
};

export default ChatSupportTab;

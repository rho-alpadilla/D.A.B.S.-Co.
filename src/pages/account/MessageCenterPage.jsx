import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth, db, storage } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  MessageCircle,
} from 'lucide-react';

const MessageCenterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [role, setRole] = useState(null);

  const [selectedConvo, setSelectedConvo] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentMessages, setRecentMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);
  const [visibleConversationCount, setVisibleConversationCount] = useState(5);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const threadScrollRef = useRef(null);
  const latestThreadMessageIdRef = useRef(null);
  const shouldScrollToBottomRef = useRef(false);

  const isAdmin = role === 'admin';
  const isSubAdmin = role === 'sub-admin';
  const isAdminLike = isAdmin || isSubAdmin;

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setRole(snap.data()?.role || null);
      } else {
        setRole(null);
      }
    });

    return () => unsub();
  }, [user?.uid]);

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

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const thatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
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
    return convo.buyerName || convo.buyerEmail?.split('@')[0] || convo.subject || 'User';
  };

  const getInitials = (value = '') => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const getAvatarTone = (seed = '') => {
    const tones = [
      'bg-artisan-primary-wash text-artisan-primary',
      'bg-amber-100 text-amber-700',
      'bg-blue-100 text-blue-700',
      'bg-emerald-100 text-emerald-700',
      'bg-rose-100 text-rose-700',
      'bg-violet-100 text-violet-700',
    ];

    const total = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return tones[total % tones.length];
  };

  useEffect(() => {
    if (!user?.email || role === null) return undefined;

    setMessagesLoading(true);
    setMessagesError(null);

    const source = isAdminLike
      ? collection(db, 'messages')
      : query(collection(db, 'messages'), where('buyerEmail', '==', user.email));

    return onSnapshot(
      source,
      (snapshot) => {
        const nextMessages = snapshot.docs
          .map((messageDoc) => ({ id: messageDoc.id, ...messageDoc.data() }))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        setRecentMessages(nextMessages);
        setMessagesLoading(false);
      },
      (error) => {
        console.error('Messages could not be loaded:', error);
        setMessagesError('Messages could not be loaded. Please try again.');
        setMessagesLoading(false);
      }
    );
  }, [isAdminLike, role, user?.email]);

  const threadMessagesNewestFirst = useMemo(() => {
    if (!selectedConvo) return [];

    return recentMessages.filter((message) => (
      (message.subject || 'General Support') === selectedConvo.subject &&
      (!isAdminLike || message.buyerEmail === selectedConvo.buyerEmail)
    ));
  }, [isAdminLike, recentMessages, selectedConvo]);

  const conversations = useMemo(() => {
    const grouped = {};

    recentMessages.forEach((msg) => {
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
          buyerId: msg.buyerId || (!isAdminLike ? user?.uid || null : null),
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

    return Object.values(grouped).sort(
      (a, b) => (b.latestMillis || 0) - (a.latestMillis || 0)
    );
  }, [isAdminLike, recentMessages, user?.uid]);

  const supportMessages = useMemo(
    () => [...threadMessagesNewestFirst].reverse(),
    [threadMessagesNewestFirst]
  );

  useEffect(() => {
    if (!selectedConvo) return;

    shouldScrollToBottomRef.current = true;
    latestThreadMessageIdRef.current = null;
  }, [selectedConvo?.key]);

  useEffect(() => {
    const unreadMessages = threadMessagesNewestFirst.filter((msg) => (
      msg.status === 'unread' &&
      ((isAdminLike && !msg.isAdminReply) || (!isAdminLike && msg.isAdminReply))
    ));

    if (!unreadMessages.length) return;

    const markMessagesRead = async () => {
      try {
        const batch = writeBatch(db);
        unreadMessages.forEach((message) => {
          batch.update(doc(db, 'messages', message.id), { status: 'read' });
        });
        await batch.commit();
      } catch (error) {
        console.error('Mark messages read failed:', error);
      }
    };

    markMessagesRead();
  }, [isAdminLike, threadMessagesNewestFirst]);

  useEffect(() => {
    const latestMessageId = threadMessagesNewestFirst[0]?.id;
    const hasNewLatestMessage =
      latestMessageId && latestMessageId !== latestThreadMessageIdRef.current;

    if (shouldScrollToBottomRef.current || hasNewLatestMessage) {
      const threadScroller = threadScrollRef.current;
      if (threadScroller) {
        threadScroller.scrollTo({
          top: threadScroller.scrollHeight,
          behavior: 'smooth',
        });
      }
      shouldScrollToBottomRef.current = false;
    }

    latestThreadMessageIdRef.current = latestMessageId || null;
  }, [threadMessagesNewestFirst]);

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
    setVisibleConversationCount(5);
  }, [searchTerm]);

  const visibleConversations = filteredConversations.slice(0, visibleConversationCount);

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

  const sendSupportReply = async ({ text = '', file = null } = {}) => {
    if ((!text.trim() && !file) || !selectedConvo || sending || uploading) return;

    setSending(true);

    try {
      let attachmentData = null;

      if (file) {
        setUploading(true);
        attachmentData = await uploadAttachment(file);
        setUploading(false);
      }

await addDoc(collection(db, 'messages'), {
  buyerId: selectedConvo?.buyerId || user?.uid || null,
  buyerEmail: isAdminLike ? selectedConvo.buyerEmail : user.email,
  buyerName:
    selectedConvo.buyerName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User',
  subject: selectedConvo.subject || 'General Support',
  message: text.trim(),
  status: 'unread',
  createdAt: serverTimestamp(),
  isAdminReply: isAdminLike,
  ...(isAdminLike && {
    adminEmail: user?.email || '',
    adminName: user?.displayName || 'Admin',
  }),
  ...(attachmentData || {}),
});

      setReplyInput('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Send support reply failed:', err);
      alert('Failed to send message or attachment.');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleAttachmentPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await sendSupportReply({
      text: replyInput,
      file,
    });
  };

  const Bubble = ({ msg, isMine }) => {
    const isImage = msg.attachmentType?.startsWith('image/');
    const label = msg.isAdminReply
      ? 'Admin'
      : isAdminLike
      ? msg.buyerName || 'Buyer'
      : msg.isAdminReply
      ? 'Support'
      : 'You';

    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm border ${
            isMine
              ? 'border-artisan-primary/20 bg-gradient-to-br from-artisan-primary to-artisan-primary-mid text-white'
              : 'border-artisan-primary/15 bg-white text-artisan-text'
          }`}
        >
          <div className="text-[11px] opacity-75 mb-1">{label}</div>

          {msg.message ? (
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {msg.message}
            </div>
          ) : null}

          {msg.attachmentUrl ? (
            <div className={`${msg.message ? 'mt-3' : ''}`}>
              {isImage ? (
                <a
                  href={msg.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={msg.attachmentUrl}
                    alt={msg.attachmentName || 'Attachment'}
                    className="max-h-72 w-auto rounded-2xl border border-black/10"
                  />
                </a>
              ) : (
                <a
                  href={msg.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 border ${
                    isMine
                      ? 'border-white/20 bg-white/10 hover:bg-white/15'
                      : 'border-artisan-primary/10 bg-artisan-primary-wash/35 hover:bg-artisan-primary-wash'
                  } transition-[background-color,border-color,box-shadow] duration-200`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isMine ? 'bg-white/15' : 'border border-artisan-primary/10 bg-white'
                    }`}
                  >
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {msg.attachmentName || 'Attachment'}
                    </p>
                    <p className="text-xs opacity-75">Tap to open or download</p>
                  </div>

                  <Download size={16} />
                </a>
              )}
            </div>
          ) : null}

          <div className="text-[11px] opacity-70 mt-2">
            {formatTime(msg.createdAt)}
          </div>
        </div>
      </div>
    );
  };

  const renderedSupportStream = useMemo(() => {
    if (!supportMessages?.length) return [];

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

      const isMine = isAdminLike ? !!msg.isAdminReply : !msg.isAdminReply;

      out.push({
        _type: 'msg',
        id: msg.id,
        msg,
        isMine,
      });

      prevMillis = millis;
    }

    return out;
  }, [supportMessages, isAdminLike]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/95 p-10 text-center text-artisan-text shadow-xl shadow-[#2D0E5A]/15">
          <h1 className="font-nunito text-3xl font-bold text-red-600">Login Required</h1>
          <p className="mt-3 text-artisan-text-muted">
            Please log in first to view the message center.
          </p>
          <Button
            className="mt-6"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Message Center - D.A.B.S. Co.</title>
      </Helmet>

      <div className="min-h-screen py-10 sm:py-14" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-[calc(100dvh-6rem)] min-h-[36rem] max-h-[780px] flex-col overflow-hidden rounded-[2rem] border border-white/55 bg-white/95 shadow-2xl shadow-[#2D0E5A]/20 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#2D0E5A] via-artisan-primary to-artisan-primary-mid px-5 py-5 text-white sm:px-8 sm:py-6">
              <div className="flex items-center gap-4 min-w-0">
                <Button
                  variant="outline"
                  onClick={() => navigate(isAdminLike ? '/admin-panel' : '/')}
                  className="border-white/35 bg-white/10 text-white hover:border-white/60 hover:bg-white/20 hover:text-white"
                >
                  <ArrowLeft className="mr-2" size={16} />
                  Back
                </Button>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-artisan-primary-pale">
                    {isAdminLike ? 'Admin Support' : 'Your Support'}
                  </p>
                  <h1 className="truncate font-nunito text-2xl font-bold sm:text-3xl">
                    {isAdminLike ? 'Customer Message Center' : 'Message Center'}
                  </h1>
                </div>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[360px_1fr]">
              <div className={`${selectedConvo ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-b border-artisan-primary/10 bg-artisan-primary-wash/35 lg:border-b-0 lg:border-r`}>
                <div className="shrink-0 border-b border-artisan-primary/10 p-4">
                  {isAdminLike ? (
                    <div className="relative">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-faint"
                      />
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search customer, email, subject..."
                        className="w-full rounded-2xl border border-artisan-border bg-white py-3 pl-11 pr-4 text-sm text-artisan-text outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-artisan-text">Your Conversations</p>
                      <p className="mt-1 text-sm text-artisan-text-muted">
                        View your support chats in a bigger page.
                      </p>
                    </div>
                  )}
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {messagesLoading ? (
                    <div className="px-6 py-16 text-center text-artisan-text-muted">
                      Loading recent conversations...
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="px-6 py-16 text-center text-artisan-text-muted">
                      <p className="font-medium text-artisan-text">No conversations found</p>
                      <p className="text-sm mt-1">
                        {searchTerm
                          ? 'Search includes the conversations loaded so far.'
                          : 'Support threads will show here.'}
                      </p>
                    </div>
                  ) : (
                    visibleConversations.map((convo) => {
                      const isActive = selectedConvo?.key === convo.key;
                      const displayName = isAdminLike ? getDisplayName(convo) : convo.subject;
                      const avatarTone = getAvatarTone(
                        convo.buyerEmail || convo.buyerName || convo.key
                      );

                      return (
                        <button
                          key={convo.key}
                          onClick={() => setSelectedConvo(convo)}
                          className={`w-full rounded-2xl border px-3 py-3 text-left transition-[background-color,border-color,box-shadow] duration-200 shadow-sm ${
                            isActive
                              ? 'border-artisan-primary/35 bg-white shadow-artisan-sm'
                              : 'border-transparent bg-white/60 hover:border-artisan-primary/20 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarTone}`}
                            >
                              {getInitials(displayName)}
                              {convo.hasUnread && (
                                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-artisan-text">
                                    {displayName}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-artisan-text-muted">
                                    {isAdminLike
                                      ? convo.buyerEmail || 'No email'
                                      : 'D.A.B.S. Support'}
                                  </p>
                                </div>

                                <div className="shrink-0 pt-0.5 text-[11px] text-artisan-text-faint">
                                  {formatListTime(convo.latestMillis)}
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center rounded-full bg-artisan-primary-wash px-2.5 py-1 text-[11px] font-medium text-artisan-primary">
                                  {convo.subject || 'General Support'}
                                </span>

                                {convo.hasUnread && (
                                  <span className="inline-flex items-center rounded-full bg-red-50 text-red-600 px-2.5 py-1 text-[11px] font-medium">
                                    New
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 truncate text-sm text-artisan-text-muted">
                                <span className="font-medium text-artisan-text-mid">
                                  {convo.lastSenderLabel}:
                                </span>{' '}
                                {convo.lastPreview || 'Open conversation'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}

                  <div className="pt-2 text-center">
                    {messagesError && (
                      <p className="mb-2 text-xs text-red-600">{messagesError}</p>
                    )}
                    {filteredConversations.length > visibleConversationCount && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleConversationCount((count) => count + 5)}
                      >
                        Load 5 more conversations
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className={`${selectedConvo ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col bg-white`}>
                {!selectedConvo ? (
                  <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-artisan-primary-wash/45 to-white p-8">
                    <div className="max-w-md text-center">
                      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-artisan-primary text-white shadow-artisan-md">
                        <MessageCircle size={34} />
                      </div>
                      <h2 className="font-nunito text-3xl font-bold text-artisan-text">
                        Select a conversation
                      </h2>
                      <p className="mt-2 text-artisan-text-muted">
                        Open a support thread from the left to continue chatting in a bigger view.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex shrink-0 items-center gap-3 border-b border-artisan-primary/10 bg-white px-5 py-4 sm:px-6">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedConvo(null)}
                        className="shrink-0 lg:hidden"
                        aria-label="Back to conversations"
                      >
                        <ArrowLeft size={17} />
                      </Button>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 ${getAvatarTone(
                          selectedConvo.buyerEmail ||
                            selectedConvo.buyerName ||
                            selectedConvo.subject
                        )}`}
                      >
                        {getInitials(isAdminLike ? getDisplayName(selectedConvo) : selectedConvo.subject)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-artisan-text">
                          {isAdminLike ? getDisplayName(selectedConvo) : 'D.A.B.S. Support'}
                        </p>
                        <p className="truncate text-xs text-artisan-text-muted">
                          {isAdminLike ? selectedConvo.buyerEmail : selectedConvo.subject}
                        </p>
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full bg-artisan-primary-wash px-2 py-0.5 text-[11px] font-medium text-artisan-primary">
                            {selectedConvo.subject}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div ref={threadScrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-artisan-primary-wash/35 to-white p-4 sm:p-6">
                      <div className="text-center">
                        {messagesError && <p className="mb-2 text-xs text-red-600">{messagesError}</p>}
                      </div>

                      {messagesLoading ? (
                        <p className="py-10 text-center text-sm text-artisan-text-muted">Loading messages...</p>
                      ) : renderedSupportStream.length === 0 ? (
                        <p className="py-10 text-center text-sm text-artisan-text-muted">No messages in this conversation yet.</p>
                      ) : null}

                      {renderedSupportStream.map((item) => {
                        if (item._type === 'date') {
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-center my-2"
                            >
                              <div className="rounded-full border border-artisan-primary/10 bg-white px-3 py-1 text-xs text-artisan-text-muted shadow-sm">
                                {item.label}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <Bubble
                            key={item.id}
                            msg={item.msg}
                            isMine={item.isMine}
                          />
                        );
                      })}

                      <div ref={bottomRef} />
                    </div>

                    <div className="shrink-0 border-t border-artisan-primary/10 bg-white p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            placeholder="Type your message..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendSupportReply({ text: replyInput });
                              }
                            }}
                            className="flex-1 rounded-2xl border border-artisan-border bg-white px-4 py-3 text-sm text-artisan-text outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                            disabled={sending || uploading}
                          />

                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleAttachmentPick}
                          />

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={sending || uploading}
                            className="shrink-0"
                            title="Attach image or file"
                          >
                            <Paperclip size={16} />
                          </Button>

                          <Button
                            type="button"
                            onClick={() => sendSupportReply({ text: replyInput })}
                            disabled={sending || uploading || !replyInput.trim()}
                            className="shrink-0"
                          >
                            <Send size={16} />
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-artisan-text-muted">
                          <div className="flex items-center gap-1">
                            <ImageIcon size={14} />
                            Images supported
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText size={14} />
                            Files supported
                          </div>
                          {(sending || uploading) && (
                            <span className="font-medium text-artisan-primary">
                              {uploading ? 'Uploading attachment...' : 'Sending...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageCenterPage;

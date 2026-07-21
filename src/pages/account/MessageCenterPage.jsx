import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth, db, storage } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
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

  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [replyInput, setReplyInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

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

  useEffect(() => {
    if (!user?.email) return;

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
  buyerId: isAdminLike
  ? selectedConvo?.buyerId || null
  : user?.uid || null,
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
  }, [user?.email, isAdminLike]);

  useEffect(() => {
    if (!selectedConvo || !user?.email) return;

    const buyerEmail = isAdminLike ? selectedConvo.buyerEmail : user.email;

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
  }, [selectedConvo, user?.email, isAdminLike]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

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
              ? 'bg-[#118C8C] text-white border-[#118C8C]/20'
              : 'bg-white text-gray-800 border-gray-200'
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-red-600">Login Required</h1>
          <p className="text-gray-600 mt-3">
            Please log in first to view the message center.
          </p>
          <Button
            className="mt-6 bg-[#118C8C] hover:bg-[#0d7070]"
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

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden min-h-[78vh] flex flex-col">
            <div className="border-b bg-gradient-to-r from-[#118C8C]/10 via-white to-[#F2BB16]/10 px-6 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Button
                  variant="outline"
                  onClick={() => navigate(isAdminLike ? '/admin-panel' : '/')}
                  className="rounded-2xl"
                >
                  <ArrowLeft className="mr-2" size={16} />
                  Back
                </Button>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#118C8C]">
                    {isAdminLike ? 'Admin Support' : 'Your Support'}
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {isAdminLike ? 'Customer Message Center' : 'Message Center'}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr]">
              <div className="border-r bg-white flex flex-col min-h-0">
                <div className="p-4 border-b shrink-0">
                  {isAdminLike ? (
                    <div className="relative">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search customer, email, subject..."
                        className="w-full border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-gray-900">Your Conversations</p>
                      <p className="text-sm text-gray-500 mt-1">
                        View your support chats in a bigger page.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-gray-50/60">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center text-gray-500 px-6 py-16">
                      <p className="font-medium text-gray-700">No conversations found</p>
                      <p className="text-sm mt-1">
                        Support threads will show here.
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map((convo) => {
                      const isActive = selectedConvo?.key === convo.key;
                      const displayName = isAdminLike ? getDisplayName(convo) : convo.subject;
                      const avatarTone = getAvatarTone(
                        convo.buyerEmail || convo.buyerName || convo.key
                      );

                      return (
                        <button
                          key={convo.key}
                          onClick={() => setSelectedConvo(convo)}
                          className={`w-full text-left rounded-2xl px-3 py-3 border transition shadow-sm ${
                            isActive
                              ? 'bg-[#118C8C]/8 border-[#118C8C]/25'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
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
                                  <p className="font-semibold text-gray-900 truncate">
                                    {displayName}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {isAdminLike
                                      ? convo.buyerEmail || 'No email'
                                      : 'D.A.B.S. Support'}
                                  </p>
                                </div>

                                <div className="shrink-0 text-[11px] text-gray-400 pt-0.5">
                                  {formatListTime(convo.latestMillis)}
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                                {convo.lastPreview || 'Open conversation'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-col min-h-0 bg-white">
                {!selectedConvo ? (
                  <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white">
                    <div className="text-center max-w-md">
                      <div className="w-20 h-20 rounded-full bg-[#118C8C]/10 text-[#118C8C] flex items-center justify-center mx-auto mb-5">
                        <MessageCircle size={34} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Select a conversation
                      </h2>
                      <p className="text-gray-600 mt-2">
                        Open a support thread from the left to continue chatting in a bigger view.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-4 border-b bg-white flex items-center gap-3 shrink-0">
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
                        <p className="font-semibold text-gray-900 truncate">
                          {isAdminLike ? getDisplayName(selectedConvo) : 'D.A.B.S. Support'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {isAdminLike ? selectedConvo.buyerEmail : selectedConvo.subject}
                        </p>
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full bg-[#118C8C]/10 text-[#118C8C] px-2 py-0.5 text-[11px] font-medium">
                            {selectedConvo.subject}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white space-y-3">
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
                            msg={item.msg}
                            isMine={item.isMine}
                          />
                        );
                      })}

                      <div ref={bottomRef} />
                    </div>

                    <div className="border-t bg-white p-4 shrink-0">
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
                            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
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
                            className="rounded-2xl"
                            title="Attach image or file"
                          >
                            <Paperclip size={16} />
                          </Button>

                          <Button
                            type="button"
                            onClick={() => sendSupportReply({ text: replyInput })}
                            disabled={sending || uploading || !replyInput.trim()}
                            className="rounded-2xl bg-[#118C8C] hover:bg-[#0d7070]"
                          >
                            <Send size={16} />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <ImageIcon size={14} />
                            Images supported
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText size={14} />
                            Files supported
                          </div>
                          {(sending || uploading) && (
                            <span className="text-[#118C8C] font-medium">
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
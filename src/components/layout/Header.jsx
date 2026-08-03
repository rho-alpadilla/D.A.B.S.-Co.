// src/components/layout/Header.jsx
// Design A — Artisan Canvas reskin.
// ── ALL ORIGINAL FUNCTIONS PRESERVED ────────────────────────────────────
//   • Scroll-progress listener (requestAnimationFrame-throttled)
//   • onSnapshot auth + role detection (isAdmin, photoURL)
//   • Buyer notification listener (onSnapshot → buyerNotifications)
//   • Per-account staff alert history (backfill + live order/message alerts)
//   • Clear-all / read-state actions (Firestore notification documents)
//   • handleLogout (signOut + reset all dropdowns)
//   • goToHighlight / goToHighlightsHome (smooth scroll + nav)
//   • Currency switcher (useCurrency, CURRENCIES, setCurrency, searchQuery)
//   • Cart badge (useCart → cartCount)
//   • CircularText logo mark (kept + logo image centered inside ring)
//   • Mobile hamburger menu (full feature parity with desktop)
//   • All nav links: Home/Dashboard, Highlights dropdown, Gallery,
//     Pricing, About, Contact (admin-aware)
//   • User avatar dropdown: Dashboard, Profile, Logout
//   • Login / Join buttons for guest users
// ── WHAT CHANGED (visual only) ──────────────────────────────────────────
//   • Color palette: teal #118C8C → artisan purple #5C2D91
//   • Scroll-glassmorphism: warm cream → lavender white
//   • Nav link underline: yellow → purple gradient
//   • Currency pill: teal border → purple border
//   • Login button: teal gradient → purple gradient
//   • Join button: yellow → mauve gradient
//   • Notification badge: yellow → purple
//   • Cart badge: yellow → purple
//   • Dropdown panels: teal accent → purple accent
//   • Mobile menu: teal active states → purple
//   • Logo: CircularText ring in purple + PNG image centered inside ring

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ShoppingCart,
  LogOut,
  Settings,
  Globe,
  Search,
  User,
  ChevronDown,
  Bell,
  CheckCheck,
  Package,
  MessageSquareText,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  limit,
  query,
  orderBy,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import CircularText from '@/components/effects/CircularText';
import dabsLogo from '@/assets/dabs-logo-square.png';
import {
  backfillAdminAlertHistory,
  clearAdminAlertHistory,
  createLiveMessageAlert,
  createLiveOrderAlert,
  persistNewAdminAlert,
} from '@/lib/adminAlertHistory';

const MAX_VISIBLE_NOTIFICATIONS = 20;
const ARTISAN_EASE_OUT = [0.23, 1, 0.32, 1];

const Header = () => {
  // ── STATE ──────────────────────────────────────────────────────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [photoURL, setPhotoURL] = useState('');
  const [scrollPct, setScrollPct] = useState(0);
  const [adminAlertHistoryBackfilledAt, setAdminAlertHistoryBackfilledAt] =
    useState(null);
  const [adminAlertsClearedAt, setAdminAlertsClearedAt] = useState(null);

  const [buyerNotifications, setBuyerNotifications] = useState([]);
  const [adminAlerts, setAdminAlerts] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [adminAlertCursor, setAdminAlertCursor] = useState(null);
  const [hasMoreAdminAlerts, setHasMoreAdminAlerts] = useState(false);
  const [loadingMoreAdminAlerts, setLoadingMoreAdminAlerts] = useState(false);
  const [isAdminHistoryInitialising, setIsAdminHistoryInitialising] =
    useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const rafRef = useRef(null);
  const headerRef = useRef(null);

  const authData = useAuth();
  const user = authData?.user || null;
  const loading = authData?.loading || false;
  const { cartCount } = useCart();
  const { currency, setCurrency, CURRENCIES } = useCurrency();
  const shouldReduceMotion = useReducedMotion();

  const desktopPopoverMotion = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12, ease: ARTISAN_EASE_OUT },
      }
    : {
        initial: { opacity: 0, transform: 'translateY(-8px) scale(0.96)' },
        animate: { opacity: 1, transform: 'translateY(0) scale(1)' },
        exit: { opacity: 0, transform: 'translateY(-8px) scale(0.96)' },
        transition: { duration: 0.18, ease: ARTISAN_EASE_OUT },
      };

  const homeLabel = isAdmin ? 'Dashboard' : 'Home';
  const homePath = '/';

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toMillis = (value) => {
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

  // ── EFFECTS / LISTENERS ────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrollPct(Math.min(window.scrollY / 80, 1));
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const closeHeaderOverlays = () => {
      setIsMenuOpen(false);
      setIsCurrencyOpen(false);
      setIsUserMenuOpen(false);
      setIsHighlightsOpen(false);
      setIsNotifOpen(false);
    };

    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        closeHeaderOverlays();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeHeaderOverlays();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsCurrencyOpen(false);
    setIsUserMenuOpen(false);
    setIsHighlightsOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setPhotoURL('');
      setIsAdmin(false);
      setAdminAlertHistoryBackfilledAt(null);
      setAdminAlertsClearedAt(null);
      setIsAdminHistoryInitialising(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setPhotoURL(d.photoURL || '');
        setIsAdmin(d.role === 'admin' || d.role === 'sub-admin');
        setAdminAlertHistoryBackfilledAt(d.adminAlertHistoryBackfilledAt || null);
        setAdminAlertsClearedAt(d.adminAlertsClearedAt || null);
      }
    });

    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user?.uid || isAdmin) {
      setBuyerNotifications([]);
      return;
    }

    setNotifLoading(true);

    const notifQuery = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(MAX_VISIBLE_NOTIFICATIONS)
    );

    const unsub = onSnapshot(
      notifQuery,
      (snap) => {
        setBuyerNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setNotifLoading(false);
      },
      (err) => {
        console.error('Buyer notification listener failed:', err);
        setNotifLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid, isAdmin]);

  useEffect(() => {
    if (!user?.uid || !isAdmin) {
      setAdminAlerts([]);
      setAdminAlertCursor(null);
      setHasMoreAdminAlerts(false);
      setIsAdminHistoryInitialising(false);
      return;
    }

    setNotifLoading(true);
    setAdminAlerts([]);
    setAdminAlertCursor(null);
    setHasMoreAdminAlerts(false);

    const notifQuery = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(MAX_VISIBLE_NOTIFICATIONS)
    );

    const unsub = onSnapshot(
      notifQuery,
      (snap) => {
        setAdminAlerts(snap.docs.map((notification) => ({
          id: notification.id,
          ...notification.data(),
        })));
        setAdminAlertCursor(snap.docs.at(-1) || null);
        setHasMoreAdminAlerts(snap.size === MAX_VISIBLE_NOTIFICATIONS);
        setNotifLoading(false);
      },
      (err) => {
        console.error('Admin alert history listener failed:', err);
        setNotifLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid, isAdmin]);

  useEffect(() => {
    if (!user?.uid || !isAdmin) return undefined;

    let cancelled = false;
    let unsubOrders = () => {};
    let unsubMessages = () => {};

    const saveLiveAlert = (alert) => {
      void persistNewAdminAlert({
        uid: user.uid,
        alert,
        clearedAt: adminAlertsClearedAt,
      }).catch((err) => {
        console.error('Failed to save an admin alert:', err);
      });
    };

    const startLiveListeners = () => {
      const listenerStartedAt = Date.now();

      unsubOrders = onSnapshot(
        query(
          collection(db, 'orders'),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc'),
          limit(MAX_VISIBLE_NOTIFICATIONS)
        ),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const order = { id: change.doc.id, ...change.doc.data() };
            if (
              change.type === 'added' &&
              toMillis(order.createdAt) > listenerStartedAt
            ) {
              saveLiveAlert(createLiveOrderAlert(order));
            }
          });
        },
        (err) => console.error('Admin order alert listener failed:', err)
      );

      unsubMessages = onSnapshot(
        query(
          collection(db, 'messages'),
          where('status', '==', 'unread'),
          where('isAdminReply', '==', false),
          orderBy('createdAt', 'desc'),
          limit(MAX_VISIBLE_NOTIFICATIONS)
        ),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const message = { id: change.doc.id, ...change.doc.data() };
            if (
              change.type === 'added' &&
              toMillis(message.createdAt) > listenerStartedAt
            ) {
              saveLiveAlert(createLiveMessageAlert(message));
            }
          });
        },
        (err) => console.error('Admin message alert listener failed:', err)
      );
    };

    const initialiseAlertHistory = async () => {
      try {
        if (!adminAlertHistoryBackfilledAt) {
          setIsAdminHistoryInitialising(true);
          setNotifLoading(true);
          await backfillAdminAlertHistory({
            uid: user.uid,
            clearedAt: adminAlertsClearedAt,
          });
        }
      } catch (err) {
        console.error('Admin alert history backfill failed:', err);
      } finally {
        if (!cancelled) {
          setIsAdminHistoryInitialising(false);
          setNotifLoading(false);
          startLiveListeners();
        }
      }
    };

    void initialiseAlertHistory();

    return () => {
      cancelled = true;
      unsubOrders();
      unsubMessages();
    };
  }, [
    user?.uid,
    isAdmin,
    adminAlertHistoryBackfilledAt,
    adminAlertsClearedAt,
  ]);

  const visibleNotifications = useMemo(
    () => (isAdmin ? adminAlerts : buyerNotifications),
    [isAdmin, adminAlerts, buyerNotifications]
  );

  const unreadNotifCount = useMemo(() => {
    return visibleNotifications.filter((n) => !n.read).length;
  }, [visibleNotifications]);

  const formatNotifTime = (ts) => {
    const ms = toMillis(ts);
    if (!ms) return '';

    const d = new Date(ms);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getNotifMeta = (notif) => {
    const type = notif.alertType || notif.type;

    if (type === 'order') {
      return {
        icon: <Package size={16} />,
        chip: 'Order',
        iconWrap: 'bg-amber-100 text-amber-700',
        chipWrap: 'bg-amber-50 text-amber-700',
      };
    }

    if (type === 'message') {
      return {
        icon: <MessageSquareText size={16} />,
        chip: 'Message',
        iconWrap: 'bg-artisan-primary-wash text-artisan-primary',
        chipWrap: 'bg-artisan-primary-wash text-artisan-primary',
      };
    }

    return {
      icon: <Bell size={16} />,
      chip: 'Update',
      iconWrap: 'bg-gray-100 text-gray-600',
      chipWrap: 'bg-gray-100 text-gray-600',
    };
  };

  // ── EVENT HANDLERS ─────────────────────────────────────────────────────
  const handleNotifClick = async (notif) => {
    try {
      if (!notif.read && user?.uid) {
        await updateDoc(doc(db, 'users', user.uid, 'notifications', notif.id), {
          read: true,
        });
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    setIsNotifOpen(false);
    navigate(notif.link || '/');
  };

  const markAllNotifsRead = async () => {
    if (!user?.uid) return;

    try {
      const unread = buyerNotifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((notif) =>
          updateDoc(doc(db, 'users', user.uid, 'notifications', notif.id), {
            read: true,
          })
        )
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const clearAllAdminAlerts = async () => {
    if (!user?.uid || isAdminHistoryInitialising) return;

    try {
      setNotifLoading(true);
      await clearAdminAlertHistory(user.uid);
      setAdminAlerts([]);
      setAdminAlertCursor(null);
      setHasMoreAdminAlerts(false);
    } catch (err) {
      console.error('Failed to clear admin alert history:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  const loadMoreAdminAlerts = async () => {
    if (
      !user?.uid ||
      !isAdmin ||
      !adminAlertCursor ||
      !hasMoreAdminAlerts ||
      loadingMoreAdminAlerts
    ) {
      return;
    }

    try {
      setLoadingMoreAdminAlerts(true);
      const nextPage = await getDocs(
        query(
          collection(db, 'users', user.uid, 'notifications'),
          orderBy('createdAt', 'desc'),
          startAfter(adminAlertCursor),
          limit(MAX_VISIBLE_NOTIFICATIONS)
        )
      );

      const olderAlerts = nextPage.docs.map((notification) => ({
        id: notification.id,
        ...notification.data(),
      }));

      setAdminAlerts((currentAlerts) => {
        const alertsById = new Map(
          [...currentAlerts, ...olderAlerts].map((alert) => [alert.id, alert])
        );

        return [...alertsById.values()].sort(
          (first, second) => toMillis(second.createdAt) - toMillis(first.createdAt)
        );
      });
      setAdminAlertCursor(nextPage.docs.at(-1) || adminAlertCursor);
      setHasMoreAdminAlerts(nextPage.size === MAX_VISIBLE_NOTIFICATIONS);
    } catch (err) {
      console.error('Failed to load older admin alerts:', err);
    } finally {
      setLoadingMoreAdminAlerts(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsCurrencyOpen(false);
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    setIsHighlightsOpen(false);
    setIsNotifOpen(false);
    navigate('/');
  };

  const goToHighlightsHome = () => {
    setIsHighlightsOpen(false);
    setIsMenuOpen(false);
    setIsCurrencyOpen(false);
    setIsUserMenuOpen(false);
    setIsNotifOpen(false);

    if (location.pathname === '/highlights') {
      window.history.replaceState(null, '', '/highlights');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/highlights');
    }
  };

  const goToHighlight = (section) => {
    setIsHighlightsOpen(false);
    setIsMenuOpen(false);
    setIsCurrencyOpen(false);
    setIsUserMenuOpen(false);
    setIsNotifOpen(false);

    const smoothScrollToSection = () => {
      const el = document.getElementById(section);
      if (!el) return;

      const headerOffset = 110;
      const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
      const targetTop = Math.max(elementTop - headerOffset, 0);

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    };

    if (location.pathname === '/highlights') {
      window.history.replaceState(null, '', `/highlights#${section}`);
      requestAnimationFrame(() => {
        setTimeout(smoothScrollToSection, 60);
      });
    } else {
      navigate(`/highlights#${section}`);
    }
  };

  if (loading) return null;

  // ── SCROLL-DRIVEN STYLE VALUES (Design A purple) ───────────────────────
  const p = scrollPct;
  const lerp = (a, b, t) => a + (b - a) * t;

  // Background: opaque lavender-white → frosted glass
  const hdrBgA = lerp(0.92, 0.82, p);
  const hdrBg = `rgba(250, 248, 255, ${hdrBgA.toFixed(3)})`;
  const hdrBlur = p > 0.05 ? `blur(${(p * 20).toFixed(1)}px)` : 'none';

  // Border: subtle purple
  const hdrBorderA = lerp(0.08, 0.18, p);
  const hdrBorderColor = `rgba(92, 45, 145, ${hdrBorderA.toFixed(3)})`;

  // Shadow: purple-tinted
  const hdrShadow =
    p > 0.15 ? `0 4px 24px rgba(92, 45, 145, ${(p * 0.12).toFixed(3)})` : 'none';

  // Nav link color (active: artisan primary, inactive: text-mid)
  const linkColor = (active) => (active ? '#5C2D91' : '#4A2560');

  // Currency pill
  const currBg =
    p < 0.45
      ? 'linear-gradient(135deg, rgba(92,45,145,0.10), rgba(92,45,145,0.06))'
      : 'linear-gradient(135deg, rgba(92,45,145,0.14), rgba(92,45,145,0.09))';
  const currBorder = 'rgba(92,45,145,0.35)';
  const currColor = '#5C2D91';

  // Login button: purple gradient
  const loginBg = 'linear-gradient(135deg, #5C2D91, #7B3FA0)';
  const loginBorder = 'rgba(92,45,145,0.85)';
  const loginColor = '#ffffff';

  // Avatar ring
  const avatarBorder = 'rgba(92,45,145,0.35)';

  // Icon color
  const iconColor = '#4A2560';

  const isActive = (path) => location.pathname === path;
  const isHighlightsPage = location.pathname === '/highlights';

  const desktopLinks = [
    { type: 'link', path: homePath, label: homeLabel },
    { type: 'dropdown', label: 'Highlights' },
    { type: 'link', path: '/gallery', label: 'Gallery' },
    { type: 'link', path: '/pricelists', label: 'Pricing' },
    ...(isAdmin
      ? []
      : [
          { type: 'link', path: '/about', label: 'About' },
          { type: 'link', path: '/contact', label: 'Contact' },
        ]),
  ];

  // ── RENDER HELPERS ─────────────────────────────────────────────────────
  const renderNotificationList = (mobile = false) => (
    <div className={mobile ? 'max-h-80 overflow-y-auto' : 'max-h-96 overflow-y-auto'}>
      {notifLoading ? (
        <div className="p-8 text-sm text-artisan-text-muted text-center">
          Loading notifications...
        </div>
      ) : visibleNotifications.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-artisan-primary-wash text-artisan-primary flex items-center justify-center mx-auto mb-3">
            <Bell size={20} />
          </div>
          <p className="text-sm font-medium text-artisan-text">All caught up</p>
          <p className="text-xs text-artisan-text-muted mt-1">
            {isAdmin ? 'No saved admin alerts yet.' : 'No notifications yet.'}
          </p>
        </div>
      ) : (
        <div className="p-2 space-y-2">
          {(isAdmin
            ? visibleNotifications
            : visibleNotifications.slice(0, mobile ? 10 : 12)
          ).map((notif) => {
            const meta = getNotifMeta(notif);
            const isUnreadNotification = !notif.read;

            return (
              <button
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`w-full text-left rounded-2xl border px-3 py-3 transition ${
                  isUnreadNotification
                    ? 'bg-artisan-primary-wash/50 border-artisan-primary-light/20 hover:bg-artisan-primary-wash'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${meta.iconWrap}`}
                  >
                    {meta.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-artisan-text">
                          {notif.title || 'Notification'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chipWrap}`}
                          >
                            {meta.chip}
                          </span>
                          {isUnreadNotification && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-artisan-primary-pale/30 text-artisan-primary">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-artisan-text-faint shrink-0 pt-0.5">
                        {formatNotifTime(notif.createdAt)}
                      </div>
                    </div>

                    <p className="text-sm text-artisan-text-muted mt-2 break-words leading-relaxed">
                      {notif.body || ''}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {isAdmin && hasMoreAdminAlerts && (
            <button
              type="button"
              onClick={loadMoreAdminAlerts}
              disabled={loadingMoreAdminAlerts}
              className="w-full rounded-xl border border-artisan-primary-light/25 px-3 py-2 text-xs font-semibold text-artisan-primary transition hover:bg-artisan-primary-wash disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMoreAdminAlerts ? 'Loading older alerts...' : 'Load older alerts'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ── Artisan Canvas Header Styles ───────────────────────────────── */
        .hdr {
          position: sticky;
          top: 0;
          z-index: 50;
        }

        /* Centered nav links (desktop) */
        .hdr-nav-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          align-items: center;
          gap: 2rem;
          z-index: 2;
        }

        /* Nav link — Inter font, purple palette */
        .hdr-link {
          font-family: var(--font-ui);
          font-weight: 400;
          font-size: 0.9375rem;
          letter-spacing: 0.02em;
          text-decoration: none;
          padding: 0.375rem 0;
          position: relative;
          white-space: nowrap;
          transition: color 0.32s ease;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        /* Ink-reveal underline in purple gradient */
        .hdr-link::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #5C2D91, #A87DC8);
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
        }

        .hdr-link:hover::after,
        .hdr-link.active::after {
          transform: scaleX(1);
        }

        /* Currency pill */
        .hdr-curr {
          font-family: var(--font-ui);
          font-size: 0.84rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.58rem 1rem;
          border-radius: 999px;
          border: 1px solid;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.25s ease;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(92,45,145,0.14);
        }

        .hdr-curr:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(92,45,145,0.22);
        }

        /* Cart / icon buttons */
        .hdr-cart {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s ease, transform 0.2s ease, background 0.25s ease;
          cursor: pointer;
          border-radius: 999px;
        }

        .hdr-cart:hover {
          transform: scale(1.08);
          background: rgba(92,45,145,0.08);
        }

        /* Login / Join buttons */
        .hdr-login,
        .hdr-join {
          font-family: var(--font-ui);
          font-size: 0.875rem;
          font-weight: 700;
          min-height: 2.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
        }

        .hdr-login {
          padding: 0 1.15rem;
          border: 1px solid;
          transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.25s ease;
          box-shadow: 0 6px 18px rgba(92,45,145,0.28);
        }

        .hdr-login:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
          box-shadow: 0 10px 24px rgba(92,45,145,0.36);
        }

        .hdr-join {
          padding: 0 1.35rem;
          border-radius: 100px;
          border: none;
          background: linear-gradient(135deg, #7B4A72, #C47AB8);
          color: #fff;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 2px 14px rgba(123,74,114,0.38);
          transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
        }

        .hdr-join:hover {
          filter: brightness(1.08);
          box-shadow: 0 4px 22px rgba(123,74,114,0.52);
          transform: translateY(-1px);
        }

        /* Avatar ring */
        .hdr-avatar {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid;
          transition: border-color 0.35s ease, box-shadow 0.22s ease;
        }

        .hdr-avatar:hover {
          box-shadow: 0 0 0 3px rgba(168,125,200,0.35);
        }

        /* Dropdown panel */
        .hdr-dropdown {
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(92,45,145,0.12);
          border-radius: 1.25rem;
          box-shadow: 0 20px 60px rgba(92,45,145,0.18), 0 4px 16px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        /* Mobile menu panel */
        .hdr-mobile {
          background: rgba(250,248,255,0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(92,45,145,0.10);
          border-radius: 0 0 1.5rem 1.5rem;
          box-shadow: 0 12px 40px rgba(92,45,145,0.15);
        }

        /* Logo mark container — holds CircularText ring + centered logo img */
        .hdr-logo-mark {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 56px;
          height: 56px;
        }

        /* Logo image inside the circular ring */
        .hdr-logo-img {
          position: absolute;
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 50%;
          /* multiply blend makes the white background transparent on the glass nav */
          mix-blend-mode: multiply;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      <header
        ref={headerRef}
        className="hdr"
        style={{
          background: hdrBg,
          backdropFilter: hdrBlur,
          WebkitBackdropFilter: hdrBlur,
          borderBottom: `1px solid ${hdrBorderColor}`,
          boxShadow: hdrShadow,
          transition:
            'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        <nav className="container mx-auto relative flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

          {/* ── LOGO ── CircularText ring + centered PNG logo ── */}
          <Link to={homePath} className="hdr-logo-mark">
            <CircularText
              text="DABS.Co.•"
              onHover="speedUp"
              spinDuration={20}
              size={56}
              fontSize="0.48rem"
              className="!text-artisan-primary"
            />
            {/* PNG logo centered inside the spinning ring */}
            <img
              src={dabsLogo}
              alt="D.A.B.S. Co. logo"
              className="hdr-logo-img"
            />
          </Link>

          {/* ── DESKTOP NAV LINKS ── */}
          <div className="hidden md:flex hdr-nav-center">
            {desktopLinks.map((item) => {
              if (item.type === 'dropdown') {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setIsHighlightsOpen(true)}
                    onMouseLeave={() => setIsHighlightsOpen(false)}
                  >
                    <button
                      onClick={goToHighlightsHome}
                      className={`hdr-link flex items-center gap-1${isHighlightsPage ? ' active' : ''}`}
                      style={{
                        color: linkColor(isHighlightsPage),
                        fontWeight: isHighlightsPage ? 600 : 400,
                      }}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          isHighlightsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isHighlightsOpen && (
                        <motion.div
                          initial={desktopPopoverMotion.initial}
                          animate={desktopPopoverMotion.animate}
                          exit={desktopPopoverMotion.exit}
                          transition={desktopPopoverMotion.transition}
                          style={{ transformOrigin: 'top center' }}
                          className="hdr-dropdown absolute left-1/2 top-full mt-3 w-64 -translate-x-1/2 z-[9999] p-2"
                        >
                          {[
                            { id: 'spotlight', label: "Artist's Spotlight" },
                            { id: 'favorites', label: "Collector's Favorites" },
                            { id: 'recent', label: 'Recent Works' },
                            { id: 'commission', label: 'Commission' },
                          ].map((sect) => (
                            <button
                              key={sect.id}
                              onClick={() => goToHighlight(sect.id)}
                              className="w-full text-left px-4 py-3 rounded-xl text-sm text-artisan-text-mid hover:bg-artisan-primary-wash hover:text-artisan-primary transition font-medium"
                            >
                              {sect.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`hdr-link${isActive(item.path) ? ' active' : ''}`}
                  style={{
                    color: linkColor(isActive(item.path)),
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ── DESKTOP RIGHT CONTROLS ── */}
          <div className="hidden md:flex items-center gap-2.5" style={{ zIndex: 2 }}>

            {/* Currency switcher */}
            <div className="relative">
              <button
                id="currency-switcher-btn"
                className="hdr-curr"
                onClick={() => {
                  setIsCurrencyOpen((v) => !v);
                  setIsUserMenuOpen(false);
                  setIsHighlightsOpen(false);
                  setIsNotifOpen(false);
                }}
                style={{
                  background: currBg,
                  borderColor: currBorder,
                  color: currColor,
                }}
              >
                <Globe size={15} strokeWidth={2} />
                <span>
                  {CURRENCIES.find((c) => c.code === currency)?.symbol} {currency}
                </span>
                <motion.svg
                  animate={{ rotate: isCurrencyOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  width="11"
                  height="11"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{ opacity: 0.75 }}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </button>

              <AnimatePresence>
                {isCurrencyOpen && (
                  <motion.div
                    initial={desktopPopoverMotion.initial}
                    animate={desktopPopoverMotion.animate}
                    exit={desktopPopoverMotion.exit}
                    transition={desktopPopoverMotion.transition}
                    style={{ transformOrigin: 'top right' }}
                    className="hdr-dropdown absolute right-0 top-full mt-2.5 w-80 z-50"
                  >
                    {/* Search */}
                    <div className="p-4 border-b border-artisan-primary-wash">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-artisan-text-faint"
                          size={15}
                        />
                        <input
                          type="text"
                          placeholder="Search currency..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 border border-artisan-primary-wash rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-artisan-primary/20 focus:border-artisan-primary-light transition"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Currency list */}
                    <div className="max-h-72 overflow-y-auto">
                      {filteredCurrencies.length === 0 ? (
                        <p className="p-6 text-center text-artisan-text-faint text-sm">
                          No currency found
                        </p>
                      ) : (
                        filteredCurrencies.map((curr) => (
                          <button
                            key={curr.code}
                            onClick={() => {
                              setCurrency(curr.code);
                              setIsCurrencyOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-5 py-3 hover:bg-artisan-primary-wash/40 transition flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg w-6 text-center">{curr.symbol}</span>
                              <div>
                                <p
                                  className={`font-medium ${
                                    currency === curr.code
                                      ? 'text-artisan-primary'
                                      : 'text-artisan-text'
                                  }`}
                                >
                                  {curr.name}
                                </p>
                                <p className="text-xs text-artisan-text-faint">{curr.code}</p>
                              </div>
                            </div>
                            {currency === curr.code && (
                              <div className="w-2 h-2 rounded-full bg-artisan-primary" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification bell (logged-in users only) */}
            {user && (
              <div className="relative">
                <button
                  id="notification-bell-btn"
                  onClick={() => {
                    setIsNotifOpen((v) => !v);
                    setIsCurrencyOpen(false);
                    setIsUserMenuOpen(false);
                    setIsHighlightsOpen(false);
                  }}
                  className="hdr-cart p-2.5"
                  style={{ color: iconColor }}
                >
                  <Bell size={20} strokeWidth={1.75} />
                  {unreadNotifCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 bg-artisan-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                      style={{ minWidth: 18, minHeight: 18, padding: '0 3px' }}
                    >
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div
                      initial={desktopPopoverMotion.initial}
                      animate={desktopPopoverMotion.animate}
                      exit={desktopPopoverMotion.exit}
                      transition={desktopPopoverMotion.transition}
                      style={{ transformOrigin: 'top right' }}
                      className="hdr-dropdown absolute right-0 top-full mt-2.5 w-[26rem] z-[9999]"
                    >
                      {/* Notif header */}
                      <div className="px-4 py-4 border-b border-artisan-primary-wash bg-gradient-to-r from-artisan-primary-wash/60 via-white to-artisan-primary-pale/20">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-artisan-text">
                              {isAdmin ? 'Admin Alerts' : 'Notifications'}
                            </p>
                            <p className="text-xs text-artisan-text-muted mt-0.5">
                              {isAdmin
                                ? `${unreadNotifCount} unread alert${
                                    unreadNotifCount === 1 ? '' : 's'
                                  }`
                                : `${unreadNotifCount} unread`}
                            </p>
                          </div>

                          {visibleNotifications.length > 0 && (
                            <button
                              onClick={isAdmin ? clearAllAdminAlerts : markAllNotifsRead}
                              disabled={isAdmin && isAdminHistoryInitialising}
                              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-artisan-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCheck size={14} />
                              {isAdmin ? 'Clear all' : 'Mark all as read'}
                            </button>
                          )}
                        </div>
                      </div>

                      {renderNotificationList(false)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Cart (buyers only) */}
            {!isAdmin && (
              <Link
                to="/cart"
                id="cart-link"
                className="hdr-cart p-2.5"
                style={{ color: iconColor }}
              >
                <ShoppingCart size={20} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-artisan-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                    style={{ minWidth: 18, minHeight: 18, padding: '0 3px' }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* User avatar / Login+Join */}
            {user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => {
                    setIsUserMenuOpen((v) => !v);
                    setIsCurrencyOpen(false);
                    setIsHighlightsOpen(false);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full px-1 py-1 transition"
                  style={{
                    background: isUserMenuOpen
                      ? 'rgba(92,45,145,0.08)'
                      : 'transparent',
                  }}
                >
                  <div className="hdr-avatar" style={{ borderColor: avatarBorder }}>
                    {photoURL ? (
                      <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-artisan-primary to-artisan-primary-mid flex items-center justify-center text-white font-bold text-sm">
                        {user.email[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <span className="hidden lg:block bg-gradient-to-r from-artisan-primary-light to-artisan-mauve text-white text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider shadow-sm">
                      Admin
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={desktopPopoverMotion.initial}
                      animate={desktopPopoverMotion.animate}
                      exit={desktopPopoverMotion.exit}
                      transition={desktopPopoverMotion.transition}
                      style={{ transformOrigin: 'top right' }}
                      className="hdr-dropdown absolute right-0 top-full mt-2.5 w-60 z-[9999]"
                    >
                      {/* User info header */}
                      <div className="p-4 border-b border-artisan-primary-wash bg-gradient-to-br from-artisan-primary-wash/50 to-transparent">
                        <p className="font-medium text-artisan-text text-sm truncate">
                          {user.email}
                        </p>
                        {isAdmin && (
                          <span className="text-xs font-bold text-artisan-primary-mid tracking-wide">
                            Administrator
                          </span>
                        )}
                      </div>

                      {!isAdmin && (
                        <Link
                          to="/buyer-dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-artisan-text-mid hover:bg-artisan-primary-wash hover:text-artisan-primary transition"
                        >
                          <Settings size={15} strokeWidth={1.75} /> Dashboard
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-artisan-text-mid hover:bg-artisan-primary-wash hover:text-artisan-primary transition"
                      >
                        <User size={15} strokeWidth={1.75} /> Profile
                      </Link>

                      <div className="border-t border-artisan-primary-wash">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition text-left"
                        >
                          <LogOut size={15} strokeWidth={1.75} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  id="login-btn"
                  className="hdr-login"
                  style={{
                    background: loginBg,
                    borderColor: loginBorder,
                    color: loginColor,
                  }}
                >
                  Login
                </Link>

                <Link to="/register" id="join-btn" className="hdr-join">
                  Join
                </Link>
              </div>
            )}
          </div>

          {/* ── MOBILE RIGHT CONTROLS ── */}
          <div
            className="md:hidden flex items-center gap-3"
            style={{ color: iconColor, transition: 'color 0.35s ease', zIndex: 2 }}
          >
            {/* Mobile notification bell */}
            {user && (
              <button
                onClick={() => {
                  setIsNotifOpen((v) => !v);
                  setIsCurrencyOpen(false);
                  setIsUserMenuOpen(false);
                  setIsHighlightsOpen(false);
                  setIsMenuOpen(false);
                }}
                className="relative rounded-full p-1"
                style={{ color: iconColor }}
              >
                <Bell size={22} strokeWidth={1.75} />
                {unreadNotifCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 bg-artisan-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                    style={{ minWidth: 17, minHeight: 17, padding: '0 2px' }}
                  >
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile cart */}
            {!isAdmin && (
              <Link to="/cart" className="relative rounded-full p-1">
                <ShoppingCart size={22} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 bg-artisan-primary text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                    style={{ minWidth: 17, minHeight: 17, padding: '0 2px' }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Hamburger */}
            <button
              id="mobile-menu-btn"
              onClick={() => {
                setIsMenuOpen((v) => !v);
                setIsHighlightsOpen(false);
                setIsCurrencyOpen(false);
                setIsUserMenuOpen(false);
                setIsNotifOpen(false);
              }}
            >
              <motion.div animate={{ rotate: isMenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {isMenuOpen ? (
                  <X size={26} strokeWidth={1.75} />
                ) : (
                  <Menu size={26} strokeWidth={1.75} />
                )}
              </motion.div>
            </button>
          </div>
        </nav>

        {/* ── MOBILE NOTIFICATION PANEL ── */}
        <AnimatePresence>
          {isNotifOpen && user && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="hdr-mobile px-4 pb-4 pt-2">
                <div className="hdr-dropdown w-full">
                  <div className="px-4 py-4 border-b border-artisan-primary-wash bg-gradient-to-r from-artisan-primary-wash/60 via-white to-artisan-primary-pale/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-artisan-text">
                          {isAdmin ? 'Admin Alerts' : 'Notifications'}
                        </p>
                        <p className="text-xs text-artisan-text-muted mt-0.5">
                          {isAdmin
                            ? `${unreadNotifCount} unread alert${
                                unreadNotifCount === 1 ? '' : 's'
                              }`
                            : `${unreadNotifCount} unread`}
                        </p>
                      </div>

                      {visibleNotifications.length > 0 && (
                        <button
                          onClick={isAdmin ? clearAllAdminAlerts : markAllNotifsRead}
                          disabled={isAdmin && isAdminHistoryInitialising}
                          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-artisan-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCheck size={14} />
                          {isAdmin ? 'Clear all' : 'Mark all as read'}
                        </button>
                      )}
                    </div>
                  </div>

                  {renderNotificationList(true)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MOBILE MENU ── */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="hdr-mobile px-4 pb-5 pt-3 space-y-1">

                {/* Currency selector */}
                <div className="px-3 pt-2 pb-3 mb-1">
                  <p className="text-xs font-semibold text-artisan-text-faint uppercase tracking-widest mb-2">
                    Currency
                  </p>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 border border-artisan-primary-wash rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-artisan-primary/20 text-artisan-text"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-px bg-artisan-primary-wash mx-3 mb-2" />

                {/* Home / Dashboard */}
                <Link
                  to={homePath}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                  style={{
                    background: isActive('/') ? 'linear-gradient(135deg,#5C2D91,#7B3FA0)' : 'transparent',
                    color: isActive('/') ? '#fff' : '#4A2560',
                  }}
                >
                  {homeLabel}
                  {isActive('/') && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-artisan-primary-pale" />
                  )}
                </Link>

                {/* Highlights top-level */}
                <button
                  onClick={goToHighlightsHome}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                  style={{
                    background: isHighlightsPage
                      ? 'linear-gradient(135deg,#5C2D91,#7B3FA0)'
                      : 'transparent',
                    color: isHighlightsPage ? '#fff' : '#4A2560',
                  }}
                >
                  Highlights
                  {isHighlightsPage && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-artisan-primary-pale" />
                  )}
                </button>

                {/* Highlights sub-items */}
                <div className="mx-1 rounded-xl bg-artisan-primary-wash/50 border border-artisan-primary-wash p-2">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-artisan-primary">
                    Highlights
                  </p>
                  {[
                    { id: 'spotlight', label: "Artist's Spotlight" },
                    { id: 'favorites', label: "Collector's Favorites" },
                    { id: 'recent', label: 'Recent Works' },
                    { id: 'commission', label: 'Commission' },
                  ].map((sect) => (
                    <button
                      key={sect.id}
                      onClick={() => goToHighlight(sect.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-artisan-text-mid hover:bg-white hover:text-artisan-primary transition"
                    >
                      {sect.label}
                    </button>
                  ))}
                </div>

                {/* Gallery */}
                <Link
                  to="/gallery"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                  style={{
                    background: isActive('/gallery')
                      ? 'linear-gradient(135deg,#5C2D91,#7B3FA0)'
                      : 'transparent',
                    color: isActive('/gallery') ? '#fff' : '#4A2560',
                  }}
                >
                  Gallery
                  {isActive('/gallery') && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-artisan-primary-pale" />
                  )}
                </Link>

                {/* Pricing */}
                <Link
                  to="/pricelists"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                  style={{
                    background: isActive('/pricelists')
                      ? 'linear-gradient(135deg,#5C2D91,#7B3FA0)'
                      : 'transparent',
                    color: isActive('/pricelists') ? '#fff' : '#4A2560',
                  }}
                >
                  Pricing
                  {isActive('/pricelists') && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-artisan-primary-pale" />
                  )}
                </Link>

                {/* About + Contact (buyer only) */}
                {!isAdmin && (
                  <>
                    <Link
                      to="/about"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                      style={{
                        background: isActive('/about')
                          ? 'linear-gradient(135deg,#5C2D91,#7B3FA0)'
                          : 'transparent',
                        color: isActive('/about') ? '#fff' : '#4A2560',
                      }}
                    >
                      About
                      {isActive('/about') && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-artisan-primary-pale" />
                      )}
                    </Link>

                    <Link
                      to="/contact"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                      style={{
                        background: isActive('/contact')
                          ? 'linear-gradient(135deg,#5C2D91,#7B3FA0)'
                          : 'transparent',
                        color: isActive('/contact') ? '#fff' : '#4A2560',
                      }}
                    >
                      Contact
                      {isActive('/contact') && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-artisan-primary-pale" />
                      )}
                    </Link>
                  </>
                )}

                {/* User section */}
                {user ? (
                  <div className="pt-2 mt-2 border-t border-artisan-primary-wash space-y-1">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-artisan-primary-wash/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-artisan-primary to-artisan-primary-mid flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-artisan-text truncate max-w-[160px]">
                          {user.email}
                        </p>
                        {isAdmin && (
                          <span className="text-[10px] text-artisan-primary font-bold">Admin</span>
                        )}
                      </div>
                    </div>

                    {!isAdmin && (
                      <Link
                        to="/buyer-dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-artisan-primary font-medium hover:bg-artisan-primary-wash rounded-xl transition"
                      >
                        <Settings size={15} /> Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-artisan-primary font-medium hover:bg-artisan-primary-wash rounded-xl transition"
                    >
                      <User size={15} /> Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl transition text-left"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-3 px-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition"
                      style={{ background: 'linear-gradient(135deg,#5C2D91,#7B3FA0)' }}
                    >
                      Login
                    </Link>

                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl text-white text-sm font-bold transition"
                      style={{ background: 'linear-gradient(135deg,#7B4A72,#C47AB8)' }}
                    >
                      Join
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;

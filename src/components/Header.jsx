// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, LogOut, Settings, Globe, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import CircularText from '@/components/ui-bits/CircularText';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen]         = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [isAdmin, setIsAdmin]               = useState(false);
  const [photoURL, setPhotoURL]             = useState('');
  const [scrollPct, setScrollPct]           = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const rafRef   = useRef(null);

  const authData = useAuth();
  const user     = authData?.user    || null;
  const loading  = authData?.loading || false;
  const { cartCount }                         = useCart();
  const { currency, setCurrency, CURRENCIES } = useCurrency();

  const filteredCurrencies = CURRENCIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── rAF-throttled scroll listener ── */
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

  /* ── Firestore user snapshot ── */
  useEffect(() => {
    if (!user) { setPhotoURL(''); setIsAdmin(false); return; }
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setPhotoURL(d.photoURL || '');
        setIsAdmin(d.role === 'admin');
      }
    });
    return unsub;
  }, [user]);

  const baseLinks     = [{ path: '/',          label: 'Home'    },
                         { path: '/gallery',    label: 'Gallery' },
                         { path: '/pricelists', label: 'Pricing' }];
  const customerLinks = [{ path: '/about',   label: 'About'   },
                         { path: '/contact', label: 'Contact'  }];
  const navLinks  = isAdmin ? baseLinks : [...baseLinks, ...customerLinks];
  const isActive  = p => location.pathname === p;

  const handleLogout = async () => {
    await signOut(auth);
    setIsCurrencyOpen(false); setIsUserMenuOpen(false); setIsMenuOpen(false);
    navigate('/');
  };

  if (loading) return null;

  const p = scrollPct;
  const lerp = (a, b, t) => a + (b - a) * t;

  const hdrBgA         = lerp(1, 0.5, p);
  const hdrBg          = `rgba(250,248,241,${hdrBgA.toFixed(3)})`;
  const hdrBlur        = p > 0.05 ? `blur(${(p * 18).toFixed(1)}px)` : 'none';
  const hdrBorderA     = lerp(0.12, 0.22, p);
  const hdrBorderColor = `rgba(180,170,145,${hdrBorderA.toFixed(3)})`;
  const hdrShadow      = p > 0.15
    ? `0 4px 24px rgba(100,90,70,${(p * 0.1).toFixed(3)})`
    : 'none';

  const linkColor  = active => active ? '#118C8C' : '#374151';
  const linkShadow = 'none';
  const iconColor  = '#374151';
  const currBg     = p < 0.45 ? 'rgba(17,140,140,0.07)' : 'rgba(17,140,140,0.1)';
  const currBorder = p < 0.45 ? 'rgba(17,140,140,0.22)' : 'rgba(17,140,140,0.3)';
  const currColor  = '#374151';
  const loginBorder  = 'rgba(17,140,140,0.4)';
  const loginColor   = '#118C8C';
  const avatarBorder = 'rgba(17,140,140,0.3)';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        .hdr { position: sticky; top: 0; z-index: 50; }


 
        /* ── Nav link ── */
        .hdr-nav-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 2.25rem;
          z-index: 2;
        }

        .hdr-link {
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          font-size: 0.9375rem;
          letter-spacing: 0.02em;
          text-decoration: none;
          padding: 0.375rem 0;
          position: relative;
          white-space: nowrap;
          transition: color 0.32s ease, text-shadow 0.32s ease;
        }
        .hdr-link::after {
          content: '';
          position: absolute;
          bottom: -3px; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #F2BB16, #ffd84d);
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
        }
        .hdr-link:hover::after, .hdr-link.active::after { transform: scaleX(1); }

        /* ── Currency pill ── */
        .hdr-curr {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.9rem;
          border-radius: 100px;
          border: 1px solid;
          cursor: pointer;
          transition: background 0.35s ease, border-color 0.35s ease, color 0.35s ease;
          white-space: nowrap;
        }
        .hdr-curr:hover { filter: brightness(1.1); }

        .hdr-cart {
          position: relative;
          display: flex;
          align-items: center;
          transition: color 0.3s ease, transform 0.2s ease;
          cursor: pointer;
        }
        .hdr-cart:hover { transform: scale(1.1); }

        .hdr-login {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.45rem 1.2rem;
          border-radius: 100px;
          background: transparent;
          border: 1px solid;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.35s ease, color 0.35s ease, background 0.22s ease;
        }
        .hdr-login:hover { background: rgba(255,255,255,0.1); }

        .hdr-join {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.45rem 1.35rem;
          border-radius: 100px;
          border: none;
          background: linear-gradient(135deg, #F2BB16, #e8ac0e);
          color: #1a1209;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 2px 14px rgba(242,187,22,0.42);
          transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
          white-space: nowrap;
        }
        .hdr-join:hover {
          filter: brightness(1.08);
          box-shadow: 0 4px 22px rgba(242,187,22,0.58);
          transform: translateY(-1px);
        }

        .hdr-avatar {
          width: 2.25rem; height: 2.25rem;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid;
          transition: border-color 0.35s ease, box-shadow 0.22s ease;
        }
        .hdr-avatar:hover { box-shadow: 0 0 0 3px rgba(242,187,22,0.4); }

        .hdr-dropdown {
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(17,140,140,0.13);
          border-radius: 1.25rem;
          box-shadow: 0 20px 60px rgba(17,140,140,0.2), 0 4px 16px rgba(0,0,0,0.07);
          overflow: hidden;
        }

        .hdr-mobile {
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(17,140,140,0.1);
          border-radius: 0 0 1.5rem 1.5rem;
          box-shadow: 0 12px 40px rgba(17,140,140,0.18);
        }
      `}</style>

      <header
        className="hdr"
        style={{
          background:           hdrBg,
          backdropFilter:       hdrBlur,
          WebkitBackdropFilter: hdrBlur,
          borderBottom:         `1px solid ${hdrBorderColor}`,
          boxShadow:            hdrShadow,
          transition:           'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        <nav className="container mx-auto px-6 py-3.5 relative flex items-center justify-between">

          {/* ── Circular Text Logo ── */}
<Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
  <CircularText
    text=" D.a.b.s. Co."
    onHover="speedUp"
    spinDuration={20}
    size={50}
    fontSize="0.50rem"
    className="!text-[#118C8C]"
  />
</Link>

          {/* Centered desktop nav */}
          <div className="hidden md:flex hdr-nav-center">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`hdr-link${isActive(link.path) ? ' active' : ''}`}
                style={{
                  color:      linkColor(isActive(link.path)),
                  fontWeight: isActive(link.path) ? 500 : 400,
                  textShadow: linkShadow,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2.5" style={{ zIndex: 2 }}>

            {/* Currency */}
            <div className="relative">
              <button
                className="hdr-curr"
                onClick={() => { setIsCurrencyOpen(v => !v); setIsUserMenuOpen(false); }}
                style={{ background: currBg, borderColor: currBorder, color: currColor }}
              >
                <Globe size={14} strokeWidth={1.75} />
                <span>{CURRENCIES.find(c => c.code === currency)?.symbol} {currency}</span>
                <motion.svg
                  animate={{ rotate: isCurrencyOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  width="11" height="11" viewBox="0 0 12 12" fill="none"
                  style={{ opacity: 0.6 }}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </button>

              <AnimatePresence>
                {isCurrencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="hdr-dropdown absolute right-0 top-full mt-2.5 w-80 z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                          type="text"
                          placeholder="Search currency..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/25 focus:border-[#118C8C] transition"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {filteredCurrencies.length === 0
                        ? <p className="p-6 text-center text-gray-400 text-sm">No currency found</p>
                        : filteredCurrencies.map(curr => (
                          <button
                            key={curr.code}
                            onClick={() => { setCurrency(curr.code); setIsCurrencyOpen(false); setSearchQuery(''); }}
                            className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg w-6 text-center">{curr.symbol}</span>
                              <div>
                                <p className={`font-medium ${currency === curr.code ? 'text-[#118C8C]' : 'text-gray-800'}`}>{curr.name}</p>
                                <p className="text-xs text-gray-400">{curr.code}</p>
                              </div>
                            </div>
                            {currency === curr.code && <div className="w-2 h-2 rounded-full bg-[#118C8C]" />}
                          </button>
                        ))
                      }
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            {!isAdmin && (
              <Link to="/cart" className="hdr-cart p-2" style={{ color: iconColor }}>
                <ShoppingCart size={20} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-[#F2BB16] text-[10px] font-bold text-gray-900 rounded-full flex items-center justify-center"
                    style={{ minWidth: 18, minHeight: 18, padding: '0 3px' }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu or Login/Join */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setIsUserMenuOpen(v => !v); setIsCurrencyOpen(false); }}
                  className="flex items-center gap-2 rounded-full px-1 py-1 transition"
                  style={{ background: isUserMenuOpen ? currBg : 'transparent' }}
                >
                  <div className="hdr-avatar" style={{ borderColor: avatarBorder }}>
                    {photoURL
                      ? <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-[#118C8C] to-[#0d7070] flex items-center justify-center text-white font-bold text-sm">
                          {user.email[0].toUpperCase()}
                        </div>
                    }
                  </div>
                  {isAdmin && (
                    <span className="hidden lg:block bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider shadow-sm">
                      Admin
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="hdr-dropdown absolute right-0 top-full mt-2.5 w-60 z-[9999]"
                    >
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-[#118C8C]/5 to-transparent">
                        <p className="font-medium text-gray-900 text-sm truncate">{user.email}</p>
                        {isAdmin && <span className="text-xs font-bold text-amber-500 tracking-wide">Administrator</span>}
                      </div>
                      <Link to={isAdmin ? '/admin-panel' : '/buyer-dashboard'} onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#118C8C]/5 hover:text-[#118C8C] transition">
                        <Settings size={15} strokeWidth={1.75} /> Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#118C8C]/5 hover:text-[#118C8C] transition">
                        <User size={15} strokeWidth={1.75} /> Profile
                      </Link>
                      <div className="border-t border-gray-100">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition text-left">
                          <LogOut size={15} strokeWidth={1.75} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hdr-login" style={{ borderColor: loginBorder, color: loginColor }}>
                  Login
                </Link>
                <Link to="/register" className="hdr-join">Join</Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMenuOpen(v => !v)}
            className="md:hidden flex items-center gap-3"
            style={{ color: iconColor, transition: 'color 0.35s ease', zIndex: 2 }}
          >
            {!isAdmin && (
              <Link to="/cart" onClick={e => e.stopPropagation()} className="relative">
                <ShoppingCart size={22} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 bg-[#F2BB16] text-[10px] font-bold text-gray-900 rounded-full flex items-center justify-center"
                    style={{ minWidth: 17, minHeight: 17, padding: '0 2px' }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <motion.div animate={{ rotate: isMenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              {isMenuOpen ? <X size={26} strokeWidth={1.75} /> : <Menu size={26} strokeWidth={1.75} />}
            </motion.div>
          </button>
        </nav>

        {/* Mobile drawer */}
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
                <div className="px-3 pt-2 pb-3 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Currency</p>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/25"
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>)}
                  </select>
                </div>

                <div className="h-px bg-gray-100 mx-3 mb-2" />

                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition"
                    style={{
                      background: isActive(link.path) ? '#118C8C' : 'transparent',
                      color:      isActive(link.path) ? '#fff'     : '#374151',
                    }}
                  >
                    {link.label}
                    {isActive(link.path) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F2BB16]" />}
                  </Link>
                ))}

                {user ? (
                  <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#118C8C]/5 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#118C8C] to-[#0d7070] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{user.email}</p>
                        {isAdmin && <span className="text-[10px] text-amber-500 font-bold">Admin</span>}
                      </div>
                    </div>
                    <Link to={isAdmin ? '/admin-panel' : '/buyer-dashboard'} onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[#118C8C] font-medium hover:bg-gray-50 rounded-xl transition">
                      <Settings size={15} /> Dashboard
                    </Link>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[#118C8C] font-medium hover:bg-gray-50 rounded-xl transition">
                      <User size={15} /> Profile
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl transition text-left">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-3 px-2">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl border border-[#118C8C] text-[#118C8C] text-sm font-medium hover:bg-[#118C8C]/5 transition">
                      Login
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl bg-[#F2BB16] text-gray-900 text-sm font-bold hover:bg-[#e8ac0e] transition">
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
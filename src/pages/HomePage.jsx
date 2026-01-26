// src/pages/HomePage.jsx
// FULL-PAGE BACKGROUND (NO WHITE SECTIONS) — ~20% opacity (lighter background)
// ✅ Featured slider is BACK
// ✅ Top Sellers + New Arrivals show ONLY 4 + "View all" button -> /gallery

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  TrendingUp,
  Palette,
  Brush,
  Heart,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useCurrency } from '@/context/CurrencyContext';

const HomePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email?.includes('admin');
  const { formatPrice } = useCurrency();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const qFeatured = query(collection(db, 'pricelists'), orderBy('createdAt', 'desc'), limit(6));
    const qTopSellers = query(collection(db, 'pricelists'), orderBy('totalSold', 'desc'), limit(8));
    const qNewArrivals = query(collection(db, 'pricelists'), orderBy('createdAt', 'desc'), limit(8));

    const unsubFeatured = onSnapshot(qFeatured, (snap) =>
      setFeaturedProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubTopSellers = onSnapshot(qTopSellers, (snap) =>
      setTopSellers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => (p.totalSold || 0) > 0)
      )
    );

    const unsubNewArrivals = onSnapshot(qNewArrivals, (snap) =>
      setNewArrivals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubFeatured();
      unsubTopSellers();
      unsubNewArrivals();
    };
  }, []);

  const nextSlide = () =>
    setCurrentIndex((prev) => (featuredProducts.length ? (prev + 1) % featuredProducts.length : 0));
  const prevSlide = () =>
    setCurrentIndex((prev) =>
      featuredProducts.length ? (prev - 1 + featuredProducts.length) % featuredProducts.length : 0
    );

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const renderStars = (rating) => {
    const r = Number(rating || 0);
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={16}
            className={i <= r ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  // ✅ ONLY SHOW 4 ITEMS PER SECTION
  const topSellersToShow = topSellers.slice(0, 4);
  const newArrivalsToShow = newArrivals.slice(0, 4);

  if (featuredProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F1]">
        <div className="flex items-center gap-3">
          <Palette size={32} className="text-[#118C8C] animate-spin" />
          <div className="text-2xl font-light text-slate-700">Loading artworks...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>D.A.B.S. Co. - Where Art Comes to Life</title>
      </Helmet>

      {/* ✅ ONE WRAPPER THAT CONTROLS THE ENTIRE PAGE BACKGROUND */}
      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          backgroundColor: '#FAF8F1',
          backgroundImage: `
            radial-gradient(rgba(17,140,140,0.20) 1px, transparent 1px),
            radial-gradient(rgba(242,187,22,0.12) 1px, transparent 1px),
            linear-gradient(180deg, rgba(17,140,140,0.18) 0%, rgba(250,248,241,0.92) 35%, rgba(242,187,22,0.14) 100%)
          `,
          backgroundSize: '22px 22px, 34px 34px, 100% 100%',
          backgroundPosition: '0 0, 10px 12px, 0 0',
        }}
      >
        {/* extra “flow” waves that continue down the page */}
        <div className="pointer-events-none absolute inset-0">
          {/* top waves */}
          <svg
            className="absolute left-0 top-[12vh] w-[140%] -translate-x-[12%]"
            viewBox="0 0 1400 520"
            preserveAspectRatio="none"
            style={{ opacity: 1 }}
          >
            <path
              d="M0,120 C180,70 360,190 620,120 C880,50 1100,170 1400,90 L1400,520 L0,520 Z"
              fill="#118C8C"
              opacity="0.18"
            />
            <path
              d="M0,285 C260,200 480,360 760,270 C1040,180 1220,340 1400,250"
              stroke="#F2BB16"
              strokeWidth="16"
              fill="none"
              opacity="0.30"
              strokeLinecap="round"
            />
            <path
              d="M0,345 C260,260 500,420 780,325 C1060,230 1240,405 1400,315"
              stroke="#118C8C"
              strokeWidth="12"
              fill="none"
              opacity="0.26"
              strokeLinecap="round"
            />
          </svg>

          {/* mid waves */}
          <svg
            className="absolute left-0 top-[95vh] w-[140%] -translate-x-[12%]"
            viewBox="0 0 1400 520"
            preserveAspectRatio="none"
            style={{ opacity: 0.95 }}
          >
            <path
              d="M0,140 C220,60 380,240 640,140 C900,40 1110,230 1400,120 L1400,520 L0,520 Z"
              fill="#118C8C"
              opacity="0.14"
            />
            <path
              d="M0,300 C260,210 500,390 780,295 C1060,200 1220,370 1400,270"
              stroke="#F2BB16"
              strokeWidth="15"
              fill="none"
              opacity="0.26"
              strokeLinecap="round"
            />
            <path
              d="M0,360 C260,270 510,440 800,350 C1090,260 1240,420 1400,330"
              stroke="#118C8C"
              strokeWidth="11"
              fill="none"
              opacity="0.22"
              strokeLinecap="round"
            />
          </svg>

          {/* lower waves */}
          <svg
            className="absolute left-0 top-[175vh] w-[140%] -translate-x-[12%]"
            viewBox="0 0 1400 520"
            preserveAspectRatio="none"
            style={{ opacity: 0.9 }}
          >
            <path
              d="M0,140 C240,80 420,260 700,150 C980,40 1160,240 1400,140 L1400,520 L0,520 Z"
              fill="#118C8C"
              opacity="0.12"
            />
            <path
              d="M0,300 C280,220 520,410 820,300 C1120,190 1260,380 1400,280"
              stroke="#F2BB16"
              strokeWidth="14"
              fill="none"
              opacity="0.22"
              strokeLinecap="round"
            />
            <path
              d="M0,360 C280,280 540,460 840,350 C1140,240 1280,430 1400,330"
              stroke="#118C8C"
              strokeWidth="10"
              fill="none"
              opacity="0.18"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-b from-transparent to-[#FAF8F1]" />
        </div>

        {/* ================= HERO ================= */}
        <section className="relative min-h-[92vh] flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6 relative z-10 text-center py-20">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-md rounded-full mb-8 shadow-lg border-2 border-[#118C8C]/25">
              <Palette size={20} className="text-[#118C8C]" />
              <span className="text-sm font-semibold text-slate-700">Handcrafted by Artists</span>
              <Brush size={20} className="text-[#F2BB16]" />
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 relative inline-block">
              <span
                className="bg-gradient-to-r from-[#118C8C] via-[#0d7070] to-[#118C8C] bg-clip-text text-transparent"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                D.A.B.S. Co.
              </span>
              <svg
                className="absolute -bottom-4 left-0 w-full h-8"
                viewBox="0 0 500 40"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,20 Q125,10 250,20 T500,20"
                  stroke="#F2BB16"
                  strokeWidth="6"
                  fill="none"
                  opacity="0.8"
                  strokeLinecap="round"
                />
              </svg>
            </h1>

            <p className="text-xl md:text-2xl font-light mb-4 max-w-3xl mx-auto text-slate-700 italic leading-relaxed">
              "Every piece tells a story, every stroke carries emotion"
            </p>

            <p className="text-base md:text-lg mb-12 max-w-2xl mx-auto text-slate-700/90 leading-relaxed">
              Discover unique artworks crafted with passion, creativity, and soul
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/gallery">
                <Button
                  size="lg"
                  className="bg-[#118C8C] hover:bg-[#0b5f5f] text-white font-semibold text-lg px-10 py-7 rounded-2xl shadow-xl shadow-[#118C8C]/45 hover:shadow-2xl hover:shadow-[#118C8C]/55 transition-all hover:scale-[1.03]"
                >
                  <Palette className="mr-2" size={22} />
                  Explore Gallery
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/pricelists">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-3 border-[#118C8C] text-[#0b5f5f] bg-white/55 hover:bg-[#118C8C] hover:text-white font-semibold text-lg px-10 py-7 rounded-2xl backdrop-blur-sm transition-all hover:scale-[1.03]"
                >
                  <Brush className="mr-2" size={22} />
                  View Pricing
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-col items-center gap-2">
              <div className="animate-bounce flex flex-col items-center gap-2">
                <Brush size={24} className="text-[#0d7070]/70" />
                <span className="text-xs text-slate-700 font-medium">Scroll to explore</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURED (ADDED BACK) ================= */}
        <section className="relative py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="flex items-end justify-between mb-12">
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles size={24} className="text-[#F2BB16]" />
                  <span className="text-sm font-bold text-[#0d7070] uppercase tracking-widest">
                    Featured Collection
                  </span>
                </div>
                <h2
                  className="text-4xl md:text-6xl font-bold text-slate-900 relative inline-block"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Artist&apos;s Spotlight
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-6"
                    viewBox="0 0 400 30"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,15 Q100,5 200,15 T400,15"
                      stroke="#118C8C"
                      strokeWidth="4"
                      fill="none"
                      opacity="0.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </h2>
              </div>

              <Link to="/gallery" className="hidden md:block">
                <Button
                  variant="outline"
                  className="rounded-xl border-2 border-[#118C8C] text-[#0b5f5f] bg-white/60 hover:bg-[#118C8C] hover:text-white backdrop-blur-sm"
                >
                  View All Artworks
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div
                className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white/80 relative bg-white/22 backdrop-blur-md"
                style={{
                  boxShadow: '0 20px 60px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(17,140,140,0.14)',
                }}
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iY2FudmFzIiB4PSIwIiB5PSIwIiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0iI2YwZjBmMCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjY2FudmFzKSIvPjwvc3ZnPg==')] opacity-30 pointer-events-none z-10"></div>

                <div
                  className="flex transition-transform duration-1000 ease-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {featuredProducts.map((p) => (
                    <div key={p.id} className="w-full flex-shrink-0">
                      <div className="bg-transparent">
                        <div className="grid lg:grid-cols-2 gap-10 p-8 lg:p-12">
                          {/* LEFT IMAGE */}
                          <div className="relative group">
                            <div
                              className="aspect-square rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-[#118C8C]/14 relative"
                              style={{ boxShadow: 'inset 0 0 30px rgba(17,140,140,0.12)' }}
                            >
                              {p.imageUrl ? (
                                <>
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                                  />
                                  <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.10)] pointer-events-none" />
                                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 via-black/18 to-transparent">
                                    <div className="text-white font-semibold text-lg leading-tight line-clamp-1">
                                      {p.name}
                                    </div>
                                    <div className="text-white/85 text-sm">{formatPrice(p.price)}</div>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                  <Palette size={80} className="text-gray-300 mb-4" />
                                  <span className="text-gray-400 font-light">Artwork Preview</span>
                                </div>
                              )}
                            </div>

                            {p.category && (
                              <div className="absolute -top-3 -left-3 px-4 py-2 bg-gradient-to-r from-[#118C8C] to-[#0b5f5f] text-white rounded-xl shadow-lg transform -rotate-2">
                                <span className="text-xs font-bold uppercase tracking-wider">{p.category}</span>
                              </div>
                            )}

                            <div className="absolute -bottom-3 -right-3 px-4 py-2 bg-white rounded-xl shadow-lg border-2 border-[#F2BB16]/35 italic font-serif text-[#0b5f5f]">
                              D.A.B.S.
                            </div>
                          </div>

                          {/* RIGHT DETAILS */}
                          <div className="flex flex-col justify-center relative">
                            <div className="inline-flex items-center gap-2 text-[#0b5f5f] mb-4 bg-[#118C8C]/12 px-4 py-2 rounded-full w-fit">
                              <Palette size={18} className="fill-current" />
                              <span className="text-sm font-bold uppercase tracking-wider">Featured Artwork</span>
                            </div>

                            <h3
                              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight"
                              style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                              {p.name}
                            </h3>

                            <p className="text-lg text-slate-800/90 mb-8 leading-relaxed italic">
                              "
                              {p.description ||
                                'A masterpiece crafted with passion, where every detail speaks to the soul.'}
                              "
                            </p>

                            <div className="flex flex-wrap items-center gap-4 mb-8">
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-[#0b5f5f]">
                                  {formatPrice(p.price)}
                                </span>
                              </div>

                              {p.averageRating > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50/90 rounded-xl border border-amber-200 backdrop-blur-sm">
                                  {renderStars(p.averageRating)}
                                  <span className="text-sm text-gray-700 font-medium">
                                    ({p.reviewCount || 0} reviews)
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-4">
                              <Link to={`/product/${p.id}`}>
                                <Button className="bg-gradient-to-r from-[#118C8C] to-[#0b5f5f] hover:from-[#0b5f5f] hover:to-[#118C8C] text-white px-8 py-6 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.03]">
                                  <Brush className="mr-2" size={20} />
                                  View Artwork
                                  <ArrowRight className="ml-2" size={18} />
                                </Button>
                              </Link>

                              <Button
                                variant="outline"
                                className="px-8 py-6 rounded-2xl font-semibold border-2 border-[#118C8C] text-[#0b5f5f] bg-white/60 hover:bg-[#118C8C]/14 backdrop-blur-sm transition-all"
                              >
                                <Heart className="mr-2" size={20} />
                                Add to Wishlist
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {featuredProducts.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 bg-white/88 backdrop-blur-md p-4 rounded-full shadow-2xl hover:scale-105 transition z-20 border-2 border-[#118C8C]/24 hover:border-[#118C8C]"
                  >
                    <ChevronLeft size={28} className="text-[#0b5f5f]" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute -right-5 top-1/2 -translate-y-1/2 bg-white/88 backdrop-blur-md p-4 rounded-full shadow-2xl hover:scale-105 transition z-20 border-2 border-[#118C8C]/24 hover:border-[#118C8C]"
                  >
                    <ChevronRight size={28} className="text-[#0b5f5f]" />
                  </button>

                  <div className="flex justify-center gap-3 mt-8">
                    {featuredProducts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all ${
                          idx === currentIndex
                            ? 'w-12 h-3 bg-gradient-to-r from-[#118C8C] to-[#0b5f5f] rounded-full shadow-lg'
                            : 'w-3 h-3 bg-white/70 rounded-full hover:bg-white/90 border border-black/5'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ================= TOP SELLERS ================= */}
        {topSellersToShow.length > 0 && (
          <section className="relative py-20 md:py-24">
            <div className="mx-auto max-w-7xl px-6 relative z-10">
              <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <TrendingUp size={28} className="text-[#F2BB16]" />
                  <span className="text-sm font-bold text-[#F2BB16] uppercase tracking-widest">
                    Best Sellers
                  </span>
                </div>
                <h2
                  className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 relative inline-block"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Collector&apos;s Favorites
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F2BB16] to-transparent opacity-70" />
                </h2>
                <p className="text-lg md:text-xl text-slate-800/90 italic">
                  Most loved by art enthusiasts worldwide
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {topSellersToShow.map((item, idx) => (
                  <Link to={`/product/${item.id}`} key={item.id} className="group">
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/60 hover:border-[#118C8C]/35 hover:-translate-y-2 relative">
                      <div className="aspect-square relative overflow-hidden bg-white/35">
                        {item.imageUrl ? (
                          <>
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.10)] pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Palette size={56} className="text-gray-300" />
                          </div>
                        )}

                        <div className="absolute -top-2 -right-2 w-16 h-16 transform rotate-12">
                          <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-xl border-3 border-white">
                            <span className="text-white font-bold text-xs">#{idx + 1}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3
                          className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-[#0b5f5f] transition-colors"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {item.name}
                        </h3>

                        {item.averageRating > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            {renderStars(item.averageRating)}
                            <span className="text-xs text-slate-700/80">({item.reviewCount || 0})</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-[#0b5f5f]">{formatPrice(item.price)}</span>
                          <div className="w-10 h-10 rounded-full bg-[#118C8C] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <ArrowRight size={20} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <Link to="/gallery">
                  <Button
                    size="lg"
                    className="bg-white/70 hover:bg-white text-[#0b5f5f] border-2 border-[#118C8C]/40 backdrop-blur-md rounded-2xl px-10 py-6 font-semibold shadow-lg"
                  >
                    View all
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ================= NEW ARRIVALS ================= */}
        <section className="relative py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles size={28} className="text-[#118C8C]" />
                <span className="text-sm font-bold text-[#0d7070] uppercase tracking-widest">
                  Fresh from Studio
                </span>
              </div>
              <h2
                className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 relative inline-block"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                New Arrivals
                <svg className="absolute -bottom-2 left-0 w-full h-6" viewBox="0 0 500 30" preserveAspectRatio="none">
                  <path
                    d="M0,15 Q125,10 250,15 T500,15"
                    stroke="#118C8C"
                    strokeWidth="5"
                    fill="none"
                    opacity="0.42"
                    strokeLinecap="round"
                  />
                </svg>
              </h2>
              <p className="text-lg md:text-xl text-slate-800/90 italic">
                Latest creations still drying on the easel
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {newArrivalsToShow.map((item) => (
                <Link to={`/product/${item.id}`} key={item.id} className="group">
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/60 hover:border-[#118C8C]/35 hover:-translate-y-2">
                    <div className="aspect-square relative overflow-hidden bg-white/35">
                      {item.imageUrl ? (
                        <>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.10)] pointer-events-none" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Brush size={56} className="text-gray-300" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 px-4 py-2 bg-gradient-to-r from-[#118C8C] to-[#0b5f5f] text-white rounded-xl font-bold text-xs uppercase shadow-xl border-2 border-white transform rotate-2">
                        Fresh
                      </div>
                    </div>

                    <div className="p-6">
                      <h3
                        className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-[#0b5f5f] transition-colors"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {item.name}
                      </h3>

                      {item.averageRating > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          {renderStars(item.averageRating)}
                          <span className="text-xs text-slate-700/80">({item.reviewCount || 0})</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[#0b5f5f]">{formatPrice(item.price)}</span>
                        <div className="w-10 h-10 rounded-full bg-[#118C8C] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <ArrowRight size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Link to="/gallery">
                <Button
                  size="lg"
                  className="bg-white/70 hover:bg-white text-[#0b5f5f] border-2 border-[#118C8C]/40 backdrop-blur-md rounded-2xl px-10 py-6 font-semibold shadow-lg"
                >
                  View all
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        {!isAdmin && (
          <section className="relative py-28 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#118C8C] via-[#0d7070] to-[#0a5555]" />
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="none">
                <path
                  d="M0,250 Q250,150 500,250 T1000,250"
                  stroke="white"
                  strokeWidth="30"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M0,300 Q250,200 500,300 T1000,300"
                  stroke="#F2BB16"
                  strokeWidth="20"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="mx-auto max-w-6xl px-6 relative z-10 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full mb-8 border-2 border-white/30">
                <Palette size={20} className="text-[#F2BB16]" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Limited Commission Slots</span>
                <Brush size={20} className="text-white" />
              </div>

              <h2
                className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Let&apos;s Create Your Masterpiece
              </h2>

              <p className="text-lg md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto italic">
                "Art is not what you see, but what you make others see"
              </p>

              <p className="text-base md:text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
                Commission a custom artwork and work directly with our artists to bring your vision to life
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/pricelists">
                  <Button
                    size="lg"
                    className="bg-[#F2BB16] hover:bg-[#e6af0f] text-slate-900 font-bold text-xl px-12 py-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:shadow-[#F2BB16]/30 transition-all hover:scale-[1.03]"
                  >
                    <Palette className="mr-3" size={24} />
                    Start Commission
                    <ArrowRight className="ml-3" size={24} />
                  </Button>
                </Link>
                <Link to="/gallery">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-3 border-white text-white hover:bg-white hover:text-[#118C8C] font-bold text-xl px-12 py-8 rounded-2xl backdrop-blur-sm transition-all hover:scale-[1.03]"
                  >
                    <Brush className="mr-3" size={24} />
                    View Gallery
                  </Button>
                </Link>
              </div>

              <div className="mt-16 pt-10 border-t border-white/20">
                <p className="text-white/70 font-serif italic text-lg">Crafted with passion by D.A.B.S. Co.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default HomePage;

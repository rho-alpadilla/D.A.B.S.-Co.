// src/pages/HomePage.jsx
// FIX SUMMARY:
// 1. Root wrapper uses `relative` + `bg-[#daf0ee]` as base color for Grainient to render over
// 2. Grainient container is `absolute inset-0 z-0` — stretches with page content, never covers footer
// 3. Grainient opacity is 1 (was 0.28 which made it invisible)
// 4. All page content sits in `relative z-10` wrapper so it's always above the background
// Footer is rendered by your layout/router OUTSIDE this component, so it's unaffected.

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
import Grainient from '@/components/ui-bits/Grainient';
import ShinyText from '@/components/ui-bits/ShinyText'; 
import Particles from '@/components/ui-bits/Particles';
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

      {/*
        ROOT WRAPPER
        - `relative` creates the stacking context so `absolute inset-0` on the
          Grainient container is scoped to THIS div, not the whole page.
        - `bg-[#daf0ee]` is the neutral teal base the Grainient renders on top of.
        - NO overflow-hidden, NO min-h-screen — lets the div grow naturally with
          content so the footer (injected by your layout outside this component)
          is never covered or hidden.
      */}
      <div className="relative bg-[#daf0ee]">

        {/*
          GRAINIENT BACKGROUND
          - `absolute inset-0` fills the root wrapper exactly — grows with page content.
          - Because it's `absolute` (not `fixed`), it stops at the bottom of this
            component. Your layout footer renders after this div and is unaffected.
          - `z-0` keeps it below all content layers.
          - opacity: 1 (was 0.28 — that's why it was invisible before).
        */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
  <Grainient
    color1="#118c8c"
    color2="#118c8c"
    color3="#fbfe9f"
    timeSpeed={0.25}
    colorBalance={-0.06}
    warpStrength={1.5}
    warpFrequency={3.8}
    warpSpeed={2}
    warpAmplitude={50}
    blendAngle={0}
    blendSoftness={1}
    rotationAmount={500}
    noiseScale={2}
    grainAmount={0.1}
    grainScale={2}
    grainAnimated={false}
    contrast={1.5}
    gamma={1}
    saturation={1}
    centerX={0}
    centerY={0}
    zoom={0.9}
  />
      {/* Particles background — pointer-events-none so clicks pass through */}
    <div className="absolute inset-0 pointer-events-none">
      <Particles
        particleCount={400}
        particleSpread={10}
        speed={0.1}
        particleColors={["#faf8f1","#118c8c", "#f1bb19"]}
        moveParticlesOnHover
        particleHoverFactor={1}
        alphaParticles={false}
        particleBaseSize={150}
        sizeRandomness={1.7}
        cameraDistance={53}
        disableRotation={false}
      />
    </div>
        </div>

        {/* All page content sits above the Grainient via z-10 */}
        <div className="relative z-10">

          {/* ================= HERO ================= */}
<section className="relative min-h-[92vh] flex items-center">
  <div className="mx-auto w-full max-w-6xl px-6 relative z-10 text-center py-20">
  
    <h1
      className="text-7xl md:text-9xl tracking-tight leading-none relative inline-block"
      style={{ fontFamily: "'Agbalumo', cursive" }}
    >
      {/* Emboss shadow layer */}
      <span
        className="absolute inset-0"
        style={{
          color: "#faf8f1",
          textShadow: `
            0 -2px 0 rgba(255,255,255,0.9),
            0 -1px 0 rgba(255,255,255,0.7),
            0 1px 0 rgba(0,0,0,0.4),
            0 3px 4px rgba(0,0,0,0.45),
            0 6px 10px rgba(0,0,0,0.4),
            0 14px 28px rgba(0,0,0,0.45),
            0 20px 40px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.5)
          `,
        }}
      >
        D.a.b.s. Co.
      </span>
      <span className="relative z-10">
        <ShinyText
          text="D.a.b.s. Co."
          speed={5}
          delay={0}
          color="#faf8f1"
          shineColor="#f2bb16"
          spread={120}
          direction="left"
          yoyo={false}
          pauseOnHover={false}
          disabled={false}
        />
      </span>
    </h1>


    {/* ── Tagline ── */}
    <p
      className="text-lg md:text-xl font-light text-[#FAF8F1]/90 italic leading-relaxed"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      "Every piece tells a story, every stroke carries emotion"
    </p>

    {/* ── CTA Buttons ── */}
    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8">
      <Link to="/gallery">
        <Button
          size="lg"
          className="bg-[#0d7070] hover:bg-[#f2bb16] text-white font-semibold text-base px-9 py-6 rounded-2xl shadow-xl shadow-[#0d7070]/40 hover:shadow-[#f2bb16]/50 transition-all duration-300 hover:scale-[1.03]"
        >
          <Palette className="mr-2" size={20} />
          Explore Gallery
          <ArrowRight className="ml-2" size={18} />
        </Button>
      </Link>
      <Link to="/pricelists">
        <Button
          size="lg"
          variant="outline"
          className="border-2 border-white/40 text-white bg-white/15 hover:bg-[#f2bb16] hover:border-[#f2bb16] hover:text-white font-semibold text-base px-9 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.03]"
        >
          <Brush className="mr-2" size={20} />
          View Pricing
        </Button>
      </Link>
    </div>

    {/* ── Scroll Indicator ── */}
    <div className="mt-4 flex flex-col items-center gap-1.5 animate-bounce">
      <Brush size={20} className="text-[#faf8f1]/60" />
      <span className="text-xs tracking-widest uppercase text-[#FAF8F1]/60 font-medium">
        Scroll to explore
      </span>
    </div>

  </div>
</section>

          {/* ================= FEATURED (SLIDER) ================= */}
          <section className="relative py-8 md:py-10">
            <div className="mx-auto max-w-6xl px-6 relative z-10">
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Sparkles size={18} className="text-[#F2BB16]" />
                  <span className="text-xs font-bold text-[#faf8f1] uppercase tracking-widest">
                    Featured Collection
                  </span>
                </div>

                <h2
                  className="text-3xl md:text-5xl font-bold text-[#FAF8F1] inline-block relative"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Artist's Spotlight
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

                <div className="mt-4">
                  <Link to="/gallery">
                    <Button
                      variant="outline"
                      className="rounded-xl border-2 border-[#118C8C] text-[#0b5f5f] bg-white/60 hover:bg-[#118C8C] hover:text-white backdrop-blur-sm"
                    >
                      View All Artworks
                      <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div
                  className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 bg-white/30 backdrop-blur-md"
                  style={{
                    boxShadow: '0 20px 60px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(17,140,140,0.14)',
                  }}
                >
                  <div
                    className="flex transition-transform duration-1000 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {featuredProducts.map((p) => (
                      <div key={p.id} className="w-full flex-shrink-0">
                        <div className="grid lg:grid-cols-2 gap-6 p-6 items-center">
                          <div className="relative group">
                            <div
                              className="aspect-[4/3] lg:aspect-[5/4] rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-[#118C8C]/14"
                              style={{ boxShadow: 'inset 0 0 30px rgba(17,140,140,0.12)' }}
                            >
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                  <Palette size={64} className="text-gray-300 mb-3" />
                                  <span className="text-gray-400 font-light text-sm">Artwork Preview</span>
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

                          <div className="flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 text-[#0b5f5f] mb-3 bg-[#118C8C]/12 px-4 py-2 rounded-full w-fit">
                              <Palette size={16} className="fill-current" />
                              <span className="text-xs font-bold uppercase tracking-wider">Featured Artwork</span>
                            </div>

                            <h3
                              className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FAF8F1] mb-3 leading-tight"
                              style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                              {p.name}
                            </h3>

                            <p className="text-base text-[#FAF8F1] mb-6 leading-relaxed italic">
                              "
                              {p.description ||
                                'A masterpiece crafted with passion, where every detail speaks to the soul.'}
                              "
                            </p>

                            <div className="flex flex-wrap items-center gap-4 mb-6">
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-[#0b5f5f]">
                                  {formatPrice(p.price)}
                                </span>
                              </div>

                              {p.averageRating > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50/90 rounded-xl border border-amber-200 backdrop-blur-sm">
                                  {renderStars(p.averageRating)}
                                  <span className="text-xs text-gray-700 font-medium">
                                    ({p.reviewCount || 0} reviews)
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-4">
                              <Link to={`/product/${p.id}`}>
                                <Button className="bg-gradient-to-r from-[#118C8C] to-[#0b5f5f] hover:from-[#0b5f5f] hover:to-[#118C8C] text-white px-7 py-5 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
                                  <Brush className="mr-2" size={18} />
                                  View Artwork
                                  <ArrowRight className="ml-2" size={16} />
                                </Button>
                              </Link>

                              <Button
                                variant="outline"
                                className="px-7 py-5 rounded-2xl font-semibold border-2 border-[#118C8C] text-[#0b5f5f] bg-white/60 hover:bg-[#118C8C]/14 backdrop-blur-sm transition-all"
                              >
                                <Heart className="mr-2" size={18} />
                                Add to Wishlist
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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

                      <div className="flex justify-center gap-3 mt-6">
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
            </div>
          </section>

          {/* ================= TOP SELLERS ================= */}
          {topSellersToShow.length > 0 && (
            <section className="relative py-20 md:py-24">
              <div className="mx-auto max-w-7xl px-6 relative z-10">
                <div className="text-center mb-16">
                  <h2
                    className="text-4xl md:text-6xl font-bold text-[#FAF8F1] mb-4 relative inline-block"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Collector's Favorites
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F2BB16] to-transparent opacity-70" />
                  </h2>
                  <p className="text-lg md:text-xl text-[#FAF8F1]/90 italic">
                    Most loved by art enthusiasts worldwide
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {topSellersToShow.map((item, idx) => (
                    <Link to={`/product/${item.id}`} key={item.id} className="group block">
                      <div className="bg-white backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 hover:border-[#118C8C]/35 hover:-translate-y-2">
                        <div className="aspect-square relative overflow-hidden bg-white/35">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
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
                            className="text-xl font-bold text-[#118c8c] mb-3 line-clamp-2 group-hover:text-[#0b5f5f] transition-colors"
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
                            <div className="w-10 h-10 rounded-full bg-[#f2bb16] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
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
                      className="bg-[#118C8C]/60 hover:bg-[#f2bb16] text-[#faf8f1] border-2 border-[#118C8C]/50 backdrop-blur-md rounded-2xl px-10 py-6 font-semibold shadow-lg"
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
                  <Sparkles size={28} className="text-[#FAF8F1]" />
                  <span className="text-sm font-bold text-[#FAF8F1] uppercase tracking-widest">
                    Fresh from Studio
                  </span>
                </div>
                <h2
                  className="text-4xl md:text-6xl font-bold text-[#FAF8F1] mb-4 relative inline-block"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Recent Works
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
                <p className="text-lg md:text-xl text-[#FAF8F1]/90 italic">
                  Latest creations still drying on the easel
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {newArrivalsToShow.map((item) => (
                  <Link to={`/product/${item.id}`} key={item.id} className="group block">
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/60 hover:border-[#118C8C]/35 hover:-translate-y-2">
                      <div className="aspect-square relative overflow-hidden bg-white/35">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
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
                    className="bg-[#118C8C]/60 hover:bg-[#f2bb16] text-[#faf8f1] border-2 border-[#118C8C]/50 backdrop-blur-md rounded-2xl px-10 py-6 font-semibold shadow-lg"
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
    {/* Base color fallback */}


    {/* Particles background — pointer-events-none so clicks pass through */}


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
        Let's Create Your Masterpiece
      </h2>

      <p className="text-base md:text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
        Commission a custom artwork and work directly with our artists to bring your vision to life
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/pricelists">
          <Button
            size="lg"
            className="bg-[#118c8c] hover:bg-[#e6af0f] text-[#faf8f1] font-bold text-xl px-12 py-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:shadow-[#F2BB16]/30 transition-all hover:scale-[1.03]"
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
           className="border-2 border-white/40 text-white bg-white/15 hover:bg-[#f2bb16] hover:border-[#f2bb16] hover:text-white font-semibold text-base px-12 py-8 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.03]"
          >
            <Brush className="mr-3" size={24} />
            View Gallery
          </Button>
        </Link>
      </div>
    </div>
  </section>
)}

        </div>{/* end relative z-10 content wrapper */}
      </div>{/* end root wrapper — footer renders AFTER this div via your layout */}
    </>
  );
};

export default HomePage;
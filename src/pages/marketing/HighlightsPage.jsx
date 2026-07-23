// src/pages/marketing/HighlightsPage.jsx
// Design A — Artisan Canvas reskin. All Firebase listeners preserved.
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Sparkles, Palette, Heart } from 'lucide-react';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

const HighlightsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email?.includes('admin');
  const { formatPrice } = useCurrency();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    const qFeatured = query(collection(db, 'pricelists'), orderBy('createdAt', 'desc'), limit(6));
    const qTopSellers = query(collection(db, 'pricelists'), orderBy('totalSold', 'desc'), limit(8));
    const qNewArrivals = query(collection(db, 'pricelists'), orderBy('createdAt', 'desc'), limit(8));

    const unsubFeatured = onSnapshot(qFeatured, (snap) => {
      setFeaturedProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubTopSellers = onSnapshot(qTopSellers, (snap) => {
      setTopSellers(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => (p.totalSold || 0) > 0));
    });
    const unsubNewArrivals = onSnapshot(qNewArrivals, (snap) => {
      setNewArrivals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubFeatured(); unsubTopSellers(); unsubNewArrivals(); };
  }, []);

  const renderStars = (rating) => {
    const r = Number(rating || 0);
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} size={16} className={i <= r ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
        ))}
      </div>
    );
  };

  const EmptyStateCard = ({ title, text }) => (
    <div className="col-span-full">
      <div className="rounded-3xl border border-white/25 bg-white/10 p-8 text-center shadow-xl backdrop-blur-md md:p-10">
        <h3 className="font-artisan-display text-2xl font-bold text-white md:text-3xl">{title}</h3>
        <p className="mx-auto mt-3 max-w-2xl text-white/85">{text}</p>
      </div>
    </div>
  );

  const ProductCard = ({ item, badge }) => {
    const primaryImageUrl = item.imageUrls?.find(
      (imageUrl) => typeof imageUrl === 'string' && imageUrl.trim()
    ) || item.imageUrl;

    return (
    <Link to={`/product/${item.id}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-lg backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-artisan-primary/35 hover:shadow-2xl">
        <div className="aspect-square relative overflow-hidden bg-artisan-primary-wash/30">
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Palette size={56} className="text-artisan-primary-pale" />
          </div>
          {primaryImageUrl && (
            <img
              src={primaryImageUrl}
              alt={item.name || 'Handmade product'}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
              className="relative h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}
          {badge && (
            <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-artisan-primary to-artisan-primary-mid text-white rounded-xl font-bold text-xs uppercase shadow-xl border-2 border-white">
              {badge}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-3 min-h-[3.5rem] text-xl font-bold text-artisan-text line-clamp-2 transition-colors group-hover:text-artisan-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            {item.name}
          </h3>

          <div className="mb-4 flex min-h-5 items-center gap-2">
            {item.averageRating > 0 && (
              <>{renderStars(item.averageRating)}<span className="text-xs text-artisan-text-muted">({item.reviewCount || 0})</span></>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between">
            <span className="text-2xl font-bold text-artisan-primary">{formatPrice(item.price)}</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-artisan-primary to-artisan-primary-mid flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <ArrowRight size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
    );
  };

  const SectionHeading = ({ id, title, subtitle, align = 'center' }) => (
    <div id={id} className={`mb-10 scroll-mt-28 md:mb-12 ${align === 'left' ? 'text-left' : 'text-center'}`}>
      <p className="font-artisan-script text-xl text-artisan-primary-pale">D.A.B.S. selections</p>
      <h2 className="mt-2 font-artisan-display text-4xl font-bold text-white md:text-5xl">{title}</h2>
      <p className="mt-3 italic text-white/85">{subtitle}</p>
    </div>
  );

  return (
    <>
      <Helmet><title>Highlights - DABS Co.</title></Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient color1="#5C2D91" color2="#7B3FA0" color3="#C9A0DC" timeSpeed={0.25} colorBalance={-0.06} warpStrength={1.5} warpFrequency={3.8} warpSpeed={2} warpAmplitude={50} blendAngle={0} blendSoftness={1} rotationAmount={500} noiseScale={2} grainAmount={0.1} grainScale={2} grainAnimated={false} contrast={1.5} gamma={1} saturation={1} centerX={0} centerY={0} zoom={0.9} />
          <div className="absolute inset-0 pointer-events-none">
            <Particles particleCount={180} particleSpread={10} speed={0.1} particleColors={['#FAF8FF','#E8D8F3','#C9A0DC']} moveParticlesOnHover particleHoverFactor={1} alphaParticles={false} particleBaseSize={120} sizeRandomness={1.4} cameraDistance={53} disableRotation={false} />
          </div>
        </div>

        <div className="relative z-10">
          {/* Hero section */}
          <section className="py-16 md:py-20">
            <div className="container mx-auto max-w-6xl px-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest mb-6">
                <Sparkles size={14} className="text-artisan-primary-pale" />
                DABS Highlights
              </div>
              <h1 className="font-artisan-display text-5xl font-bold leading-[0.95] text-white md:text-6xl">
                Explore Our Featured Sections
              </h1>
              <p className="mt-4 text-white/80 max-w-2xl mx-auto">
                Browse our spotlight pieces, customer favorites, latest works, and custom commission services in one place.
              </p>
            </div>
          </section>

          {/* Artist's Spotlight */}
          <section className="py-14 md:py-20">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading id="spotlight" title="Artist's Spotlight" subtitle="Featured artworks currently highlighted by DABS Co." />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.length > 0 ? featuredProducts.slice(0,4).map((item) => <ProductCard key={item.id} item={item} badge="Featured" />) : <EmptyStateCard title="Artist's Spotlight" text="No featured works yet. Add artwork to your pricelists collection and this section will automatically populate." />}
              </div>
            </div>
          </section>

          {/* Collector's Favorites */}
          <section className="py-14 md:py-20">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading id="favorites" title="Collector's Favorites" subtitle="Most loved by customers and art enthusiasts." />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {topSellers.length > 0 ? topSellers.slice(0,4).map((item,idx) => <ProductCard key={item.id} item={item} badge={`#${idx+1}`} />) : <EmptyStateCard title="Collector's Favorites" text="No best-selling pieces yet. Once orders start coming in, your top favorites will appear here." />}
              </div>
            </div>
          </section>

          {/* Recent Works */}
          <section className="py-14 md:py-20">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading id="recent" title="Recent Works" subtitle="Latest creations and newly added pieces." />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {newArrivals.length > 0 ? newArrivals.slice(0,4).map((item) => <ProductCard key={item.id} item={item} badge="Fresh" />) : <EmptyStateCard title="Recent Works" text="No recent works yet. As soon as new products are added, this section will show them here." />}
              </div>
            </div>
          </section>

          {/* Commission CTA (buyers only) */}
          {!isAdmin && (
            <section id="commission" className="py-12 md:py-20 scroll-mt-28">
              <div className="container mx-auto max-w-5xl px-4 text-center">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/75 mb-3">
                  <Heart size={14} className="text-artisan-primary-pale" />
                  Custom Commissions
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Let&apos;s Create Your Masterpiece
                </h2>
                <p className="text-white/80 text-base md:text-lg mt-4 max-w-2xl mx-auto">
                  Work directly with our artists for portraits, stitch-ready designs, and handmade custom pieces.
                </p>
                <div className="mx-auto mt-8 grid w-full max-w-[520px] grid-cols-1 gap-4 sm:grid-cols-2">
                  <Link to="/pricelists" className="w-full">
                    <Button size="lg" className="h-14 w-full rounded-2xl font-semibold text-artisan-primary" style={{ background: 'rgba(255,255,255,0.95)' }}>
                      Start Commission
                    </Button>
                  </Link>
                  <Link to="/gallery" className="w-full">
                    <Button size="lg" variant="outline" className="h-14 w-full rounded-2xl border-2 border-white/40 bg-transparent px-6 py-0 font-semibold text-white hover:bg-white/10">
                      View Gallery
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default HighlightsPage;

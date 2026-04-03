import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Star,
  Sparkles,
  Palette,
  Heart,
} from 'lucide-react';
import Grainient from '@/components/ui-bits/Grainient';
import Particles from '@/components/ui-bits/Particles';

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
      setTopSellers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => (p.totalSold || 0) > 0)
      );
    });

    const unsubNewArrivals = onSnapshot(qNewArrivals, (snap) => {
      setNewArrivals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubFeatured();
      unsubTopSellers();
      unsubNewArrivals();
    };
  }, []);

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

  const EmptyStateCard = ({ title, text }) => (
    <div className="col-span-full">
      <div className="rounded-3xl border border-white/30 bg-white/15 backdrop-blur-md p-8 md:p-10 text-center shadow-xl">
        <h3
          className="text-2xl md:text-3xl font-bold text-[#FAF8F1]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h3>
        <p className="mt-3 text-white/90 max-w-2xl mx-auto">
          {text}
        </p>
      </div>
    </div>
  );

  const ProductCard = ({ item, badge }) => (
    <Link to={`/product/${item.id}`} className="group block">
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

          {badge && (
            <div className="absolute top-3 right-3 px-4 py-2 bg-gradient-to-r from-[#118C8C] to-[#0b5f5f] text-white rounded-xl font-bold text-xs uppercase shadow-xl border-2 border-white">
              {badge}
            </div>
          )}
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
  );

  return (
    <>
      <Helmet>
        <title>Highlights - DABS Co.</title>
      </Helmet>

      <div className="relative bg-[#daf0ee] min-h-screen">
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

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={400}
              particleSpread={10}
              speed={0.1}
              particleColors={['#faf8f1', '#118c8c', '#f1bb19']}
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

        <div className="relative z-10">
          <section className="py-16 md:py-20">
            <div className="mx-auto max-w-6xl px-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm text-[#FAF8F1] text-xs font-bold uppercase tracking-widest mb-6">
                <Sparkles size={14} className="text-[#F2BB16]" />
                DABS Highlights
              </div>

              <h1
                className="text-4xl md:text-6xl font-bold text-[#FAF8F1]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Explore Our Featured Sections
              </h1>

              <p className="mt-4 text-white/90 max-w-2xl mx-auto">
                Browse our spotlight pieces, customer favorites, latest works, and custom commission services in one place.
              </p>
            </div>
          </section>

          <section id="spotlight" className="py-16 md:py-20 scroll-mt-28">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center mb-12">
                <h2
                  className="text-4xl md:text-5xl font-bold text-[#FAF8F1]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Artist&apos;s Spotlight
                </h2>
                <p className="text-white/85 mt-3 italic">Featured artworks currently highlighted by DABS Co.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.length > 0 ? (
                  featuredProducts.slice(0, 4).map((item) => (
                    <ProductCard key={item.id} item={item} badge="Featured" />
                  ))
                ) : (
                  <EmptyStateCard
                    title="Artist’s Spotlight"
                    text="No featured works yet. Add artwork to your pricelists collection and this section will automatically populate."
                  />
                )}
              </div>
            </div>
          </section>

          <section id="favorites" className="py-16 md:py-20 scroll-mt-28">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center mb-12">
                <h2
                  className="text-4xl md:text-5xl font-bold text-[#FAF8F1]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Collector&apos;s Favorites
                </h2>
                <p className="text-white/85 mt-3 italic">Most loved by customers and art enthusiasts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {topSellers.length > 0 ? (
                  topSellers.slice(0, 4).map((item, idx) => (
                    <ProductCard key={item.id} item={item} badge={`#${idx + 1}`} />
                  ))
                ) : (
                  <EmptyStateCard
                    title="Collector’s Favorites"
                    text="No best-selling pieces yet. Once orders start coming in, your top favorites will appear here."
                  />
                )}
              </div>
            </div>
          </section>

          <section id="recent" className="py-16 md:py-20 scroll-mt-28">
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center mb-12">
                <h2
                  className="text-4xl md:text-5xl font-bold text-[#FAF8F1]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Recent Works
                </h2>
                <p className="text-white/85 mt-3 italic">Latest creations and newly added pieces.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {newArrivals.length > 0 ? (
                  newArrivals.slice(0, 4).map((item) => (
                    <ProductCard key={item.id} item={item} badge="Fresh" />
                  ))
                ) : (
                  <EmptyStateCard
                    title="Recent Works"
                    text="No recent works yet. As soon as new products are added, this section will show them here."
                  />
                )}
              </div>
            </div>
          </section>

          {!isAdmin && (
            <section id="commission" className="py-16 md:py-24 scroll-mt-28">
              <div className="mx-auto max-w-5xl px-6">
                <div className="bg-[#118C8C] text-white rounded-3xl p-8 md:p-12 shadow-2xl text-center">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80 mb-3">
                    <Heart size={14} className="text-[#F2BB16]" />
                    Custom Commissions
                  </div>

                  <h2
                    className="text-3xl md:text-5xl font-bold"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Let&apos;s Create Your Masterpiece
                  </h2>

                  <p className="text-white/85 text-base md:text-lg mt-4 max-w-2xl mx-auto">
                    Work directly with our artists for portraits, stitch-ready designs, and handmade custom pieces.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/pricelists">
                      <Button
                        size="lg"
                        className="bg-[#F2BB16] hover:bg-[#e0ab13] text-white rounded-2xl px-8 py-6 font-semibold"
                      >
                        Start Commission
                      </Button>
                    </Link>

                    <Link to="/gallery">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-2 border-white/40 text-white bg-transparent hover:bg-white/10 rounded-2xl px-8 py-6 font-semibold"
                      >
                        View Gallery
                      </Button>
                    </Link>
                  </div>
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
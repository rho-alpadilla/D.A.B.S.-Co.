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
import { ArrowRight, Star, Palette } from 'lucide-react';

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

  const EmptyState = ({ text }) => (
    <p className="col-span-full border-y border-artisan-primary/15 py-10 text-center text-artisan-text-mid md:py-12">
      {text}
    </p>
  );

  const ProductCard = ({ item }) => {
    const primaryImageUrl = item.imageUrls?.find(
      (imageUrl) => typeof imageUrl === 'string' && imageUrl.trim()
    ) || item.imageUrl;

    return (
    <Link to={`/product/${item.id}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-lg backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-artisan-primary/35 hover:shadow-2xl">
        <div className="aspect-square relative overflow-hidden bg-artisan-primary-wash/30">
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Palette size={56} className="text-artisan-primary" />
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
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-3 min-h-[3.5rem] font-artisan-display text-xl font-bold text-artisan-text line-clamp-2 transition-colors group-hover:text-artisan-primary">
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

  const SectionHeading = ({ id, title }) => (
    <div id={id} className="mb-8 scroll-mt-28 border-t border-artisan-primary/20 pt-6 md:mb-10 md:pt-8">
      <h2 className="font-artisan-display text-4xl font-bold tracking-[-0.035em] text-artisan-primary md:text-5xl">{title}</h2>
    </div>
  );

  return (
    <>
      <Helmet><title>Highlights - DABS Co.</title></Helmet>

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10">
          {/* Hero section */}
          <section className="pb-10 pt-16 md:pb-14 md:pt-20">
            <header className="container mx-auto max-w-7xl px-4">
              <h1 className="max-w-3xl font-artisan-display text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-artisan-primary md:text-7xl">
                Highlights
              </h1>
              <p className="mt-4 max-w-xl text-artisan-text-mid md:text-lg">
                Selected work, collector favorites, and new arrivals.
              </p>
            </header>
          </section>

          {/* Artist's Spotlight */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading id="spotlight" title="Artist's Spotlight" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.length > 0 ? featuredProducts.slice(0,4).map((item) => <ProductCard key={item.id} item={item} />) : <EmptyState text="No featured work yet." />}
              </div>
            </div>
          </section>

          {/* Collector's Favorites */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading id="favorites" title="Collector's Favorites" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {topSellers.length > 0 ? topSellers.slice(0,4).map((item) => <ProductCard key={item.id} item={item} />) : <EmptyState text="No collector favorites yet." />}
              </div>
            </div>
          </section>

          {/* Recent Works */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading id="recent" title="Recent Works" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {newArrivals.length > 0 ? newArrivals.slice(0,4).map((item) => <ProductCard key={item.id} item={item} />) : <EmptyState text="No recent work yet." />}
              </div>
            </div>
          </section>

          {/* Commission CTA (buyers only) */}
          {!isAdmin && (
            <section id="commission" className="scroll-mt-28 py-12 md:py-16">
              <div className="container mx-auto max-w-7xl border-t border-artisan-primary/20 px-4 pt-8 md:pt-10">
                <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
                  <div>
                    <h2 className="font-artisan-display text-4xl font-bold tracking-[-0.035em] text-artisan-primary md:text-5xl">
                      Commission a canvas
                    </h2>
                    <p className="mt-3 max-w-xl text-artisan-text-mid md:text-lg">
                      Share your design and we&apos;ll prepare a quote.
                    </p>
                  </div>
                  <div className="grid w-full gap-3 sm:grid-cols-2 md:w-[31rem]">
                    <Link to="/pricelists" className="w-full">
                      <Button size="lg" className="h-14 w-full bg-artisan-primary font-semibold text-white hover:bg-[#4A247B]">
                        Start Commission
                      </Button>
                    </Link>
                    <Link to="/gallery" className="w-full">
                      <Button size="lg" variant="outline" className="h-14 w-full border-2 border-artisan-primary/40 bg-white/70 px-6 py-0 font-semibold text-artisan-primary hover:bg-white">
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

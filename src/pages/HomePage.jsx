// src/pages/HomePage.jsx ← FINAL: ARTISTIC + ZERO ERRORS
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Package } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useCurrency } from '@/context/CurrencyContext';

const HomePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email.includes('admin');
  const { formatPrice } = useCurrency();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const qFeatured = query(collection(db, "pricelists"), orderBy("createdAt", "desc"), limit(6));
    const qTopSellers = query(collection(db, "pricelists"), orderBy("totalSold", "desc"), limit(8));
    const qNewArrivals = query(collection(db, "pricelists"), orderBy("createdAt", "desc"), limit(8));

    const unsubFeatured = onSnapshot(qFeatured, snap => 
      setFeaturedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubTopSellers = onSnapshot(qTopSellers, snap => 
      setTopSellers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => (p.totalSold || 0) > 0))
    );

    const unsubNewArrivals = onSnapshot(qNewArrivals, snap => 
      setNewArrivals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // FIXED: Correct variable name in cleanup
    return () => {
      unsubFeatured();
      unsubTopSellers();
      unsubNewArrivals();  // ← WAS unsubArrivals → ERROR!
    };
  }, []);

  const nextSlide = () => setCurrentIndex(prev => (prev + 1) % featuredProducts.length);
  const prevSlide = () => setCurrentIndex(prev => (prev - 1 + featuredProducts.length) % featuredProducts.length);

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const renderStars = (rating) => {
    const r = Number(rating || 0);
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={18} className={i <= r ? "text-yellow-500 fill-current drop-shadow" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  if (featuredProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#118C8C] to-[#0d7070]">
        <div className="text-white text-2xl font-light animate-pulse">Crafting beauty...</div>
      </div>
    );
  }

  const product = featuredProducts[currentIndex];

  return (
    <>
      <Helmet><title>D.A.B.S. Co. - Handcrafted Masterpieces</title></Helmet>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b5c5c] via-[#118C8C] to-[#0a4a4a] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center text-white py-32">
          <h1 className="text-6xl md:text-8xl font-bold tracking-wider mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            D.A.B.S. Co.
          </h1>
          <p className="text-2xl md:text-4xl font-light mb-12 max-w-4xl mx-auto leading-relaxed">
            Where every brushstroke tells a story,<br />every thread weaves emotion.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            <Link to="/gallery">
              <Button size="lg" className="bg-[#F2BB16] hover:bg-[#e6af0f] text-gray-900 font-bold text-xl px-12 py-8 rounded-full shadow-2xl hover:shadow-[#F2BB16]/30 transition-all">
                Explore Gallery <ArrowRight className="ml-3" size={24} />
              </Button>
            </Link>
            <Link to="/pricelists">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#118C8C] font-bold text-xl px-12 py-8 rounded-full backdrop-blur">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED CAROUSEL */}
      <section className="py-24 bg-gradient-to-b from-[#FAF8F1] to-white relative">
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold text-center text-[#118C8C] mb-20" style={{ fontFamily: "'Playfair Display', serif" }}>
            Featured Masterpieces
          </h2>

          <div className="relative max-w-7xl mx-auto">
            <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-3xl bg-gradient-to-br from-[#FAF8F1] to-white border-8 border-[#118C8C]/10">
              <div className="flex h-full transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {featuredProducts.map(p => (
                  <div key={p.id} className="w-full flex-shrink-0 h-full flex flex-col lg:flex-row items-center">
                    <div className="w-full lg:w-1/2 h-full p-10">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain drop-shadow-2xl" />
                      ) : (
                        <div className="bg-gray-100 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
                          <Package size={80} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="w-full lg:w-1/2 p-12 lg:p-20 text-center lg:text-left">
                      <span className="inline-block px-6 py-2 bg-[#F2BB16]/20 text-[#118C8C] font-bold uppercase tracking-widest text-sm mb-6 rounded-full">
                        {p.category}
                      </span>
                      <h3 className="text-4xl md:text-6xl font-bold text-[#118C8C] mb-8 leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-xl text-gray-700 mb-12 leading-relaxed max-w-2xl">
                        {p.description || "A timeless creation born from passion and precision."}
                      </p>
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <span className="text-5xl font-bold text-[#F2BB16]">{formatPrice(p.price)}</span>
                        <Link to={`/product/${p.id}`}>
                          <Button className="bg-[#118C8C] hover:bg-[#0d7070] text-white px-12 py-5 rounded-full text-xl font-semibold shadow-xl hover:shadow-2xl transition-all">
                            View Details <ArrowRight className="inline ml-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {featuredProducts.length > 1 && (
              <>
                <button onClick={prevSlide} className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-lg p-5 rounded-full shadow-2xl hover:scale-110 transition z-20">
                  <ChevronLeft size={48} className="text-[#118C8C]" />
                </button>
                <button onClick={nextSlide} className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-lg p-5 rounded-full shadow-2xl hover:scale-110 transition z-20">
                  <ChevronRight size={48} className="text-[#118C8C]" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* TOP SELLERS */}
      {topSellers.length > 0 && (
        <section className="py-24 bg-gradient-to-b from-white to-[#FAF8F1]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-7xl font-bold text-[#118C8C] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Top Sellers
              </h2>
              <p className="text-2xl text-gray-600">Most cherished by collectors worldwide</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
              {topSellers.map(item => (
                <Link to={`/product/${item.id}`} key={item.id} className="group relative">
                  <div className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white border border-gray-100">
                    <div className="aspect-square relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Package size={60} className="text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-[#F2BB16] to-yellow-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg">
                        BEST SELLER
                      </div>
                    </div>
                    <div className="p-8 text-center">
                      <h3 className="text-2xl font-bold text-[#118C8C] mb-4">{item.name}</h3>
                      <div className="flex justify-center gap-2 mb-4">
                        {renderStars(item.averageRating || 0)}
                        <span className="text-gray-600">({item.reviewCount})</span>
                      </div>
                      <p className="text-3xl font-bold text-[#F2BB16]">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NEW ARRIVALS */}
      <section className="py-24 bg-gradient-to-b from-[#FAF8F1] to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold text-[#118C8C] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              New Arrivals
            </h2>
            <p className="text-2xl text-gray-600">Just added — fresh from our studio</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {newArrivals.map(item => (
              <Link to={`/product/${item.id}`} key={item.id} className="group">
                <div className="relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 bg-white">
                  <div className="aspect-square relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <Package size={60} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-[#118C8C] text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg">
                      NEW
                    </div>
                  </div>
                  <div className="p-8 text-center">
                    <h3 className="text-2xl font-bold text-[#118C8C] mb-4">{item.name}</h3>
                    <div className="flex justify-center gap-2 mb-4">
                      {renderStars(item.averageRating || 0)}
                    </div>
                    <p className="text-3xl font-bold text-[#F2BB16]">{formatPrice(item.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      {!isAdmin && (
        <section className="bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white py-32 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              Own a Masterpiece Today
            </h2>
            <p className="text-2xl mb-12 max-w-4xl mx-auto leading-relaxed opacity-90">
              Commission your vision. Let us bring your dream artwork to life.
            </p>
            <Link to="/pricelists">
              <Button size="lg" className="bg-[#F2BB16] hover:bg-[#e6af0f] text-gray-900 font-bold text-2xl px-20 py-10 rounded-full shadow-2xl hover:shadow-[#F2BB16]/40 transition-all transform hover:scale-105">
                Start Your Commission <ArrowRight className="ml-4" size={32} />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </>
  );
};

export default HomePage;
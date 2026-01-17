// src/pages/HomePage.jsx ← ARTISTIC MODERN DESIGN
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Star, Package, Sparkles, TrendingUp, Clock, Palette, Brush, Heart } from 'lucide-react';
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

    return () => {
      unsubFeatured();
      unsubTopSellers();
      unsubNewArrivals();
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
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={16} className={i <= r ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  if (featuredProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF8F1] to-white">
        <div className="flex items-center gap-3">
          <Palette size={32} className="text-[#118C8C] animate-spin" />
          <div className="text-2xl font-light text-slate-700">Loading artworks...</div>
        </div>
      </div>
    );
  }

  const product = featuredProducts[currentIndex];

  return (
    <>
      <Helmet><title>D.A.B.S. Co. - Where Art Comes to Life</title></Helmet>

      {/* ARTISTIC HERO WITH PAINT STROKES */}
      <section className="relative min-h-screen flex items-center justify-center bg-[#FAF8F1] overflow-hidden">
        {/* Paint stroke backgrounds */}
        <div className="absolute inset-0 opacity-30">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path d="M0,300 Q250,100 500,300 T1000,300 L1000,0 L0,0 Z" fill="#118C8C" opacity="0.1" />
            <path d="M0,600 Q250,500 500,600 T1000,600 L1000,1000 L0,1000 Z" fill="#F2BB16" opacity="0.1" />
          </svg>
        </div>

        {/* Floating artistic elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#118C8C]/20 blur-2xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-40 h-40 rounded-full bg-[#F2BB16]/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-36 h-36 rounded-full bg-purple-300/20 blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Paint splatter SVGs */}
          <svg className="absolute top-32 right-1/4 w-24 h-24 text-[#118C8C]/10" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="currentColor" />
            <circle cx="35" cy="35" r="15" fill="currentColor" />
            <circle cx="70" cy="60" r="12" fill="currentColor" />
          </svg>
          <svg className="absolute bottom-40 right-1/3 w-32 h-32 text-[#F2BB16]/10" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="25" fill="currentColor" />
            <circle cx="70" cy="40" r="18" fill="currentColor" />
            <circle cx="40" cy="70" r="15" fill="currentColor" />
          </svg>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center py-20">
          {/* Artist badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-md rounded-full mb-8 shadow-lg border-2 border-[#118C8C]/20">
            <Palette size={20} className="text-[#118C8C]" />
            <span className="text-sm font-semibold text-slate-700">Handcrafted by Artists</span>
            <Brush size={20} className="text-[#F2BB16]" />
          </div>

          <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-6 relative inline-block">
            <span className="bg-gradient-to-r from-[#118C8C] via-[#0d7070] to-[#118C8C] bg-clip-text text-transparent" style={{ fontFamily: "'Playfair Display', serif" }}>
              D.A.B.S. Co.
            </span>
            {/* Brush stroke underline */}
            <svg className="absolute -bottom-4 left-0 w-full h-8" viewBox="0 0 500 40" preserveAspectRatio="none">
              <path d="M0,20 Q125,10 250,20 T500,20" stroke="#F2BB16" strokeWidth="6" fill="none" opacity="0.6" strokeLinecap="round" />
            </svg>
          </h1>
          
          <p className="text-2xl md:text-3xl font-light mb-4 max-w-3xl mx-auto text-slate-700 italic">
            "Every piece tells a story, every stroke carries emotion"
          </p>
          
          <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto text-slate-600">
            Discover unique artworks crafted with passion, creativity, and soul
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/gallery">
              <Button size="lg" className="bg-[#118C8C] hover:bg-[#0d7070] text-white font-semibold text-lg px-10 py-7 rounded-2xl shadow-xl shadow-[#118C8C]/30 hover:shadow-2xl hover:shadow-[#118C8C]/40 transition-all hover:scale-105 hover:rotate-1">
                <Palette className="mr-2" size={22} />
                Explore Gallery
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Link to="/pricelists">
              <Button size="lg" variant="outline" className="border-3 border-[#118C8C] text-[#118C8C] hover:bg-[#118C8C] hover:text-white font-semibold text-lg px-10 py-7 rounded-2xl backdrop-blur-sm hover:scale-105 transition-all hover:-rotate-1">
                <Brush className="mr-2" size={22} />
                View Pricing
              </Button>
            </Link>
          </div>

          {/* Artistic stats with paint palette theme */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20 pt-12 border-t-2 border-[#118C8C]/20 relative">
            {/* Paint palette decoration */}
            <svg className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 text-[#118C8C]" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="40" ry="35" fill="currentColor" opacity="0.2" />
              <circle cx="30" cy="35" r="6" fill="currentColor" />
              <circle cx="50" cy="30" r="6" fill="currentColor" />
              <circle cx="70" cy="35" r="6" fill="currentColor" />
              <circle cx="40" cy="55" r="6" fill="currentColor" />
              <circle cx="60" cy="55" r="6" fill="currentColor" />
            </svg>
            
            <div className="relative">
              <div className="text-4xl font-bold text-[#118C8C] mb-1">500+</div>
              <div className="text-sm text-slate-600">Art Collectors</div>
              <Brush className="absolute -top-2 -right-2 text-[#F2BB16]/30" size={20} />
            </div>
            <div className="relative">
              <div className="text-4xl font-bold text-[#118C8C] mb-1">1000+</div>
              <div className="text-sm text-slate-600">Artworks Created</div>
              <Palette className="absolute -top-2 -right-2 text-[#118C8C]/30" size={20} />
            </div>
            <div className="relative">
              <div className="text-4xl font-bold text-[#118C8C] mb-1">4.9</div>
              <div className="text-sm text-slate-600">Artist Rating</div>
              <Heart className="absolute -top-2 -right-2 text-red-400/30" size={20} />
            </div>
          </div>
        </div>

        {/* Artistic scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <Brush size={24} className="text-[#118C8C]/50" />
          <span className="text-xs text-slate-600 font-medium">Scroll to explore</span>
        </div>
      </section>

      {/* FEATURED CAROUSEL - CANVAS STYLE */}
      <section className="py-20 bg-gradient-to-b from-white to-[#FAF8F1] relative">
        {/* Watercolor background effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-[#118C8C]/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-[#F2BB16]/30 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between mb-12">
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles size={24} className="text-[#F2BB16]" />
                <span className="text-sm font-bold text-[#118C8C] uppercase tracking-widest">Featured Collection</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 relative inline-block" style={{ fontFamily: "'Playfair Display', serif" }}>
                Artist's Spotlight
                {/* Paint brush stroke */}
                <svg className="absolute -bottom-2 left-0 w-full h-6" viewBox="0 0 400 30" preserveAspectRatio="none">
                  <path d="M0,15 Q100,5 200,15 T400,15" stroke="#118C8C" strokeWidth="4" fill="none" opacity="0.3" strokeLinecap="round" />
                </svg>
              </h2>
            </div>
            <Link to="/pricelists" className="hidden md:block">
              <Button variant="outline" className="rounded-xl border-2 border-[#118C8C] text-[#118C8C] hover:bg-[#118C8C] hover:text-white">
                View All Artworks
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          </div>

          <div className="relative">
            {/* Canvas frame effect */}
            <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white relative" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(17,140,140,0.1)' }}>
              {/* Canvas texture overlay */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iY2FudmFzIiB4PSIwIiB5PSIwIiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0iI2YwZjBmMCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjY2FudmFzKSIvPjwvc3ZnPg==')] opacity-30 pointer-events-none z-10"></div>
              
              <div className="flex transition-transform duration-1000 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {featuredProducts.map(p => (
                  <div key={p.id} className="w-full flex-shrink-0">
                    <div className="bg-gradient-to-br from-[#FAF8F1] to-white">
                      <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-12">
                        {/* Artwork with frame */}
                        <div className="relative group">
                          <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-[#118C8C]/10 relative" style={{ boxShadow: 'inset 0 0 30px rgba(17,140,140,0.1)' }}>
                            {p.imageUrl ? (
                              <>
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                {/* Frame inner shadow */}
                                <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.1)] pointer-events-none"></div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                <Palette size={80} className="text-gray-300 mb-4" />
                                <span className="text-gray-400 font-light">Artwork Preview</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Category badge with artistic style */}
                          {p.category && (
                            <div className="absolute -top-3 -left-3 px-4 py-2 bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white rounded-xl shadow-lg transform -rotate-3">
                              <span className="text-xs font-bold uppercase tracking-wider">{p.category}</span>
                            </div>
                          )}

                          {/* Artist signature style */}
                          <div className="absolute -bottom-3 -right-3 px-4 py-2 bg-white rounded-xl shadow-lg border-2 border-[#F2BB16]/30 italic font-serif text-[#118C8C]">
                            D.A.B.S.
                          </div>
                        </div>

                        {/* Artwork details */}
                        <div className="flex flex-col justify-center relative">
                          {/* Paint splatter decoration */}
                          <svg className="absolute -top-6 -right-6 w-24 h-24 text-[#F2BB16]/10 pointer-events-none" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="30" fill="currentColor" />
                            <circle cx="35" cy="35" r="15" fill="currentColor" />
                            <circle cx="70" cy="60" r="12" fill="currentColor" />
                          </svg>

                          <div className="inline-flex items-center gap-2 text-[#118C8C] mb-4 bg-[#118C8C]/5 px-4 py-2 rounded-full w-fit">
                            <Palette size={18} className="fill-current" />
                            <span className="text-sm font-bold uppercase tracking-wider">Featured Artwork</span>
                          </div>
                          
                          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {p.name}
                          </h3>
                          
                          <p className="text-lg text-gray-600 mb-8 leading-relaxed italic">
                            "{p.description || "A masterpiece crafted with passion, where every detail speaks to the soul."}"
                          </p>

                          <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-bold text-[#118C8C]">{formatPrice(p.price)}</span>
                            </div>
                            {p.averageRating > 0 && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
                                {renderStars(p.averageRating)}
                                <span className="text-sm text-gray-600 font-medium">({p.reviewCount || 0} reviews)</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4">
                            <Link to={`/product/${p.id}`}>
                              <Button className="bg-gradient-to-r from-[#118C8C] to-[#0d7070] hover:from-[#0d7070] hover:to-[#118C8C] text-white px-8 py-6 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105 hover:rotate-1">
                                <Brush className="mr-2" size={20} />
                                View Artwork
                                <ArrowRight className="ml-2" size={18} />
                              </Button>
                            </Link>
                            <Button variant="outline" className="px-8 py-6 rounded-2xl font-semibold border-2 border-[#118C8C] text-[#118C8C] hover:bg-[#118C8C]/5 hover:-rotate-1 transition-all">
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
                <button onClick={prevSlide} className="absolute -left-6 top-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition z-20 border-2 border-[#118C8C]/20 hover:border-[#118C8C]">
                  <ChevronLeft size={28} className="text-[#118C8C]" />
                </button>
                <button onClick={nextSlide} className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition z-20 border-2 border-[#118C8C]/20 hover:border-[#118C8C]">
                  <ChevronRight size={28} className="text-[#118C8C]" />
                </button>
                
                {/* Artistic dots */}
                <div className="flex justify-center gap-3 mt-8">
                  {featuredProducts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`transition-all ${
                        idx === currentIndex 
                          ? 'w-12 h-3 bg-gradient-to-r from-[#118C8C] to-[#0d7070] rounded-full shadow-lg' 
                          : 'w-3 h-3 bg-gray-300 rounded-full hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* TOP SELLERS - GALLERY WALL STYLE */}
      {topSellers.length > 0 && (
        <section className="py-20 bg-[#FAF8F1] relative overflow-hidden">
          {/* Artistic background */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
              <path d="M0,400 Q250,300 500,400 T1000,400" stroke="#118C8C" strokeWidth="2" fill="none" />
              <path d="M0,600 Q250,500 500,600 T1000,600" stroke="#F2BB16" strokeWidth="2" fill="none" />
            </svg>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrendingUp size={28} className="text-[#F2BB16]" />
                <span className="text-sm font-bold text-[#F2BB16] uppercase tracking-widest">Best Sellers</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 relative inline-block" style={{ fontFamily: "'Playfair Display', serif" }}>
                Collector's Favorites
                {/* Paint streak */}
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F2BB16] to-transparent opacity-50"></div>
              </h2>
              <p className="text-xl text-gray-600 italic">Most loved by art enthusiasts worldwide</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {topSellers.map((item, idx) => (
                <Link to={`/product/${item.id}`} key={item.id} className="group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-4 border-white hover:border-[#F2BB16]/30 hover:-translate-y-2 hover:rotate-1 relative">
                    {/* Gallery frame effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 pointer-events-none z-10"></div>
                    
                    <div className="aspect-square relative overflow-hidden bg-gray-50">
                      {item.imageUrl ? (
                        <>
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          {/* Inner frame shadow */}
                          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette size={56} className="text-gray-300" />
                        </div>
                      )}
                      
                      {/* Best seller badge */}
                      <div className="absolute -top-2 -right-2 w-16 h-16 transform rotate-12">
                        <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-xl border-3 border-white">
                          <span className="text-white font-bold text-xs">#{idx + 1}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 relative">
                      {/* Paint splatter decoration */}
                      <svg className="absolute -top-4 left-4 w-8 h-8 text-[#118C8C]/10" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="15" fill="currentColor" />
                        <circle cx="12" cy="12" r="8" fill="currentColor" />
                      </svg>

                      <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-[#118C8C] transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {item.name}
                      </h3>
                      
                      {item.averageRating > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          {renderStars(item.averageRating)}
                          <span className="text-xs text-gray-500">({item.reviewCount || 0})</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[#118C8C]">{formatPrice(item.price)}</span>
                        <div className="w-10 h-10 rounded-full bg-[#118C8C] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <ArrowRight size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NEW ARRIVALS - FRESH CANVAS STYLE */}
      <section className="py-20 bg-gradient-to-b from-white to-[#FAF8F1]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles size={28} className="text-[#118C8C]" />
              <span className="text-sm font-bold text-[#118C8C] uppercase tracking-widest">Fresh from Studio</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 relative inline-block" style={{ fontFamily: "'Playfair Display', serif" }}>
              New Arrivals
              {/* Brush stroke */}
              <svg className="absolute -bottom-2 left-0 w-full h-6" viewBox="0 0 500 30" preserveAspectRatio="none">
                <path d="M0,15 Q125,10 250,15 T500,15" stroke="#118C8C" strokeWidth="5" fill="none" opacity="0.4" strokeLinecap="round" />
              </svg>
            </h2>
            <p className="text-xl text-gray-600 italic">Latest creations still drying on the easel</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map(item => (
              <Link to={`/product/${item.id}`} key={item.id} className="group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-4 border-white hover:border-[#118C8C]/30 hover:-translate-y-2 hover:-rotate-1">
                  <div className="aspect-square relative overflow-hidden bg-gray-50">
                    {item.imageUrl ? (
                      <>
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Brush size={56} className="text-gray-300" />
                      </div>
                    )}
                    
                    {/* New badge with paint effect */}
                    <div className="absolute top-3 right-3 px-4 py-2 bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white rounded-xl font-bold text-xs uppercase shadow-xl border-2 border-white transform rotate-3">
                      Fresh
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-[#118C8C] transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {item.name}
                    </h3>
                    
                    {item.averageRating > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        {renderStars(item.averageRating)}
                        <span className="text-xs text-gray-500">({item.reviewCount || 0})</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#118C8C]">{formatPrice(item.price)}</span>
                      <div className="w-10 h-10 rounded-full bg-[#118C8C] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <ArrowRight size={20} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ARTISTIC CTA WITH PAINT STROKES */}
      {!isAdmin && (
        <section className="relative py-32 bg-gradient-to-br from-[#118C8C] via-[#0d7070] to-[#0a5555] overflow-hidden">
          {/* Paint strokes and splatters */}
          <div className="absolute inset-0">
            <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 1000 500" preserveAspectRatio="none">
              <path d="M0,250 Q250,150 500,250 T1000,250" stroke="white" strokeWidth="30" fill="none" strokeLinecap="round" />
              <path d="M0,300 Q250,200 500,300 T1000,300" stroke="#F2BB16" strokeWidth="20" fill="none" strokeLinecap="round" />
            </svg>
            <svg className="absolute bottom-0 right-0 w-64 h-64 text-white/10" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="currentColor" />
              <circle cx="60" cy="60" r="40" fill="currentColor" />
              <circle cx="140" cy="120" r="35" fill="currentColor" />
            </svg>
          </div>

          <div className="container mx-auto px-6 relative z-10 text-center">
            {/* Artist badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full mb-8 border-2 border-white/30">
              <Palette size={20} className="text-[#F2BB16]" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Limited Commission Slots</span>
              <Brush size={20} className="text-white" />
            </div>

            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Let's Create Your Masterpiece
            </h2>
            
            <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto italic">
              "Art is not what you see, but what you make others see"
            </p>
            
            <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
              Commission a custom artwork and work directly with our artists to bring your vision to life
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricelists">
                <Button size="lg" className="bg-[#F2BB16] hover:bg-[#e6af0f] text-slate-900 font-bold text-xl px-12 py-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:shadow-[#F2BB16]/30 transition-all hover:scale-105 hover:rotate-2">
                  <Palette className="mr-3" size={24} />
                  Start Commission
                  <ArrowRight className="ml-3" size={24} />
                </Button>
              </Link>
              <Link to="/gallery">
                <Button size="lg" variant="outline" className="border-3 border-white text-white hover:bg-white hover:text-[#118C8C] font-bold text-xl px-12 py-8 rounded-2xl backdrop-blur-sm hover:scale-105 transition-all hover:-rotate-2">
                  <Brush className="mr-3" size={24} />
                  View Gallery
                </Button>
              </Link>
            </div>

            {/* Artist signature */}
            <div className="mt-16 pt-12 border-t border-white/20">
              <p className="text-white/70 font-serif italic text-lg">Crafted with passion by D.A.B.S. Co.</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default HomePage;
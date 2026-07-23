// src/pages/marketing/GalleryPage.jsx
// Design A — Artisan Canvas reskin. All Firebase + filter/sort/pagination logic preserved.
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Search, ArrowUpDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/lib/firebase';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

const GalleryPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [imageIndices, setImageIndices] = useState({});
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email?.includes('admin');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pricelists'), async (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), inStock: doc.data().inStock !== false, stockQuantity: doc.data().stockQuantity || 0, totalSold: doc.data().totalSold || 0 }));
      const enriched = await Promise.all(productsData.map(async (product) => {
        const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
        const snap = await getDocs(q);
        const reviews = snap.docs.map((d) => d.data());
        const avg = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
        return { ...product, averageRating: Number(avg.toFixed(1)), reviewCount: reviews.length };
      }));
      setProducts(enriched);
      setFilteredProducts(enriched);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let filtered = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (sortOrder === 'lowToHigh') filtered = [...filtered].sort((a, b) => a.price - b.price);
    else if (sortOrder === 'highToLow') filtered = [...filtered].sort((a, b) => b.price - a.price);
    else if (sortOrder === 'topSellers') filtered = [...filtered].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
    setFilteredProducts(filtered);
  }, [products, searchQuery, sortOrder]);

  const getCategoryItems = (category) => category === 'all' ? filteredProducts : filteredProducts.filter((p) => p.category === category);
  const getNavIdsForTab = (tabId) => getCategoryItems(tabId).map((p) => p.id);

  const getStockText = (product) => {
    if (!product.inStock || product.stockQuantity === 0) return <span className="text-red-500 font-semibold">Out of stock</span>;
    if (product.stockQuantity <= 5) return <span className="text-orange-500 font-semibold">Only {product.stockQuantity} left</span>;
    return <span className="text-emerald-600 font-semibold">{product.stockQuantity} available</span>;
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => <Star key={i} size={14} className={i <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'} />)}
    </div>
  );

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'Hand-painted needlepoint canvas', label: 'Needlepoint Canvas' },
    { id: 'Crocheted products', label: 'Crochet' },
    { id: 'Sample portraitures', label: 'Portraiture' },
    { id: 'Painting on Canvas', label: 'Canvas Paintings' },
  ];

  return (
    <>
      <Helmet><title>Gallery - D.A.B.S. Co.</title></Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient color1="#5C2D91" color2="#7B3FA0" color3="#C9A0DC" timeSpeed={0.25} colorBalance={-0.06} warpStrength={1.5} warpFrequency={3.8} warpSpeed={2} warpAmplitude={50} blendAngle={0} blendSoftness={1} rotationAmount={500} noiseScale={2} grainAmount={0.1} grainScale={2} grainAnimated={false} contrast={1.5} gamma={1} saturation={1} centerX={0} centerY={0} zoom={0.9} />
          <div className="absolute inset-0 pointer-events-none">
            <Particles particleCount={180} particleSpread={10} speed={0.1} particleColors={['#FAF8FF','#E8D8F3','#C9A0DC']} moveParticlesOnHover particleHoverFactor={1} alphaParticles={false} particleBaseSize={120} sizeRandomness={1.4} cameraDistance={53} disableRotation={false} />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="py-4 md:py-8">
            <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }} className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                Discover Handmade Creations
              </div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Discover our crafted gallery
              </h1>
              <p className="text-base leading-relaxed text-white/85 md:text-lg">
                Browse handmade pieces designed with care — from needlepoint and crochet to portraits and canvas paintings.
              </p>
            </motion.div>

            {/* Search + Sort bar */}
            <div className="mb-8 rounded-[2rem] border border-white/70 bg-white/80 px-4 py-4 shadow-[0_14px_36px_rgba(92,45,145,0.10)] backdrop-blur-md md:px-6 md:py-5">
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-5 xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-muted" size={18} />
                  <input type="text" placeholder="Search products, categories, or descriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-12 rounded-2xl border border-artisan-primary-wash bg-white pl-11 pr-4 text-sm md:text-base outline-none transition focus:border-artisan-primary-light focus:ring-4 focus:ring-artisan-primary/10" />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto xl:justify-end">
                  <div className="flex items-center gap-2 rounded-2xl border border-artisan-primary-wash bg-white px-3 h-12 w-full sm:w-auto">
                    <ArrowUpDown size={17} className="text-artisan-text-muted shrink-0" />
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-transparent w-full sm:w-auto text-sm md:text-base text-artisan-text outline-none">
                      <option value="default">Featured</option>
                      <option value="lowToHigh">Price: Low to High</option>
                      <option value="highToLow">Price: High to Low</option>
                      <option value="topSellers">Top Sellers</option>
                    </select>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => navigate('/add-product')} className="h-12 rounded-full px-5 font-semibold shadow-sm">
                      <Plus size={17} className="mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8 md:mb-10">
                <TabsList className="flex h-auto flex-wrap justify-center gap-2 bg-transparent p-0 shadow-none">
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id}
                      className="border border-artisan-primary/12 bg-white/85 px-5 py-2.5 text-sm font-medium text-artisan-text-mid shadow-sm hover:border-artisan-primary md:text-[15px]">
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="mt-0">
                  {loading ? (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 border-4 border-white/40 border-t-artisan-primary-pale rounded-full animate-spin mx-auto" />
                       <p className="mt-4 text-white/85">Loading gallery...</p>
                    </div>
                  ) : getCategoryItems(cat.id).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 md:gap-6">
                      {getCategoryItems(cat.id).map((item, index) => {
                        const isTopSeller = item.totalSold > 0 && sortOrder === 'topSellers';
                        const showBadge = isTopSeller || item.totalSold >= 5;
                        const allImages = item.imageUrls?.length > 0 ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
                        const currentIndex = imageIndices[item.id] || 0;
                        const currentImage = allImages[currentIndex] || null;
                        const nextImage = (e) => { e.stopPropagation(); setImageIndices((prev) => ({ ...prev, [item.id]: (currentIndex + 1) % allImages.length })); };
                        const prevImage = (e) => { e.stopPropagation(); setImageIndices((prev) => ({ ...prev, [item.id]: (currentIndex - 1 + allImages.length) % allImages.length })); };

                        return (
                          <motion.div key={item.id} initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay: index*0.04 }}
                            onClick={() => navigate(`/product/${item.id}`, { state: { ids: getNavIdsForTab(cat.id), fromTab: cat.id } })}
                            className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/90 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-artisan-primary/25">
                            <div className="relative">
                              {showBadge && (
                                <div className="absolute top-4 left-4 z-20 rounded-full bg-red-500 text-white text-[11px] font-bold px-3 py-1.5 shadow-md">BEST SELLER</div>
                              )}
                              <div className="relative h-56 sm:h-52 md:h-56 lg:h-60 overflow-hidden bg-artisan-primary-wash/20">
                                {currentImage ? (
                                  <img src={currentImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={42} className="text-artisan-primary-pale" /></div>
                                )}
                                {allImages.length > 1 && (
                                  <>
                                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition duration-300 z-10"><ChevronLeft size={18} /></button>
                                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition duration-300 z-10"><ChevronRight size={18} /></button>
                                  </>
                                )}
                                {allImages.length > 1 && (
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                    {allImages.map((_, idx) => (
                                      <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/70'}`} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="min-h-[3.5rem] text-lg font-semibold leading-snug text-artisan-text line-clamp-2 md:text-xl">{item.name}</h3>
                                <span className="shrink-0 text-lg md:text-xl font-bold text-artisan-primary">{formatPrice(item.price)}</span>
                              </div>
                              <p className="mb-3 min-h-5 text-sm text-artisan-text-muted line-clamp-1">{item.category || 'Handmade Product'}</p>
                              <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
                                {item.reviewCount > 0 ? (
                                  <div className="flex items-center gap-2 min-w-0">{renderStars(item.averageRating)}<span className="text-sm text-artisan-text-muted whitespace-nowrap">({item.reviewCount})</span></div>
                                ) : (
                                  <span className="text-sm text-artisan-text-faint">No reviews yet</span>
                                )}
                                <div className="text-xs md:text-sm text-right">{getStockText(item)}</div>
                              </div>
                              <p className="mb-4 min-h-12 text-sm leading-relaxed text-artisan-text-muted line-clamp-2">{item.description || 'Beautifully made handcrafted item.'}</p>
                              <Button className="mt-auto h-12 w-full rounded-2xl font-semibold">View Product</Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-24">
                      <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm"><ShoppingBag size={38} className="text-artisan-primary-pale" /></div>
                       <p className="text-lg text-white/85">{searchQuery ? 'No products found matching your search.' : 'No items in this category yet.'}</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default GalleryPage;

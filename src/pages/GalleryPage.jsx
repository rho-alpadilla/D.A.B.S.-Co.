// src/pages/GalleryPage.jsx
// UI REFRESH ONLY:
// - Modern ecommerce-style layout
// - Centered category tabs
// - Better spacing/alignment
// - Smaller, more appealing product images
// - Cleaner product card hierarchy
// - Kept your existing logic and features intact

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Star,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/lib/firebase';

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

  // Admin check
  const { user } = useAuth();
  const isAdmin = user?.email?.includes('admin');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pricelists'), async (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        inStock: doc.data().inStock !== false,
        stockQuantity: doc.data().stockQuantity || 0,
        totalSold: doc.data().totalSold || 0,
      }));

      const enriched = await Promise.all(
        productsData.map(async (product) => {
          const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
          const snap = await getDocs(q);
          const reviews = snap.docs.map((d) => d.data());
          const avg =
            reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 0;

          return {
            ...product,
            averageRating: Number(avg.toFixed(1)),
            reviewCount: reviews.length,
          };
        })
      );

      setProducts(enriched);
      setFilteredProducts(enriched);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Search + Sort
  useEffect(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    if (sortOrder === 'lowToHigh') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'highToLow') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'topSellers') {
      filtered = [...filtered].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, sortOrder]);

  const getCategoryItems = (category) => {
    if (category === 'all') return filteredProducts;
    return filteredProducts.filter((p) => p.category === category);
  };

  const getNavIdsForTab = (tabId) => getCategoryItems(tabId).map((p) => p.id);

  const getStockText = (product) => {
    if (!product.inStock || product.stockQuantity === 0) {
      return <span className="text-red-500 font-semibold">Out of stock</span>;
    }

    if (product.stockQuantity <= 5) {
      return (
        <span className="text-orange-500 font-semibold">
          Only {product.stockQuantity} left
        </span>
      );
    }

    return (
      <span className="text-emerald-600 font-semibold">
        {product.stockQuantity} available
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={i <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'Hand-painted needlepoint canvas', label: 'Needlepoint Canvas' },
    { id: 'Crocheted products', label: 'Crochet' },
    { id: 'Sample portraitures', label: 'Portraiture' },
    { id: 'Painting on Canvas', label: 'Canvas Paintings' },
  ];

  return (
    <>
      <Helmet>
        <title>Gallery - D.A.B.S. Co.</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          {/* HERO */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-center max-w-3xl mx-auto mb-10 md:mb-12"
          >


<h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#118C8C] mb-4">
  Discover our crafted gallery
</h1>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Browse handmade pieces designed with care — from needlepoint and crochet
              to portraits and canvas paintings.
            </p>
          </motion.div>

          {/* SEARCH + SORT + ADMIN */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-sm px-4 md:px-6 py-4 md:py-5 mb-8">
            <div className="flex flex-col xl:flex-row gap-4 xl:gap-5 xl:items-center xl:justify-between">
              {/* Search */}
              <div className="relative w-full xl:max-w-md">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search products, categories, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm md:text-base outline-none transition focus:border-[#118C8C] focus:ring-4 focus:ring-[#118C8C]/10"
                />
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto xl:justify-end">
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 h-12 w-full sm:w-auto">
                  <ArrowUpDown size={17} className="text-gray-500 shrink-0" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-transparent w-full sm:w-auto text-sm md:text-base text-gray-700 outline-none"
                  >
                    <option value="default">Featured</option>
                    <option value="lowToHigh">Price: Low to High</option>
                    <option value="highToLow">Price: High to Low</option>
                    <option value="topSellers">Top Sellers</option>
                  </select>
                </div>

                {isAdmin && (
                  <Button
                    onClick={() => navigate('/add-product')}
                    className="h-12 rounded-2xl bg-[#118C8C] hover:bg-[#0d7070] text-white font-semibold px-5 shadow-sm"
                  >
                    <Plus size={17} className="mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* CENTERED CATEGORY BUTTONS */}
            <div className="flex justify-center mb-8 md:mb-10">
              <TabsList className="flex flex-wrap justify-center gap-3 bg-transparent h-auto p-0 shadow-none">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm md:text-[15px] font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-[#118C8C] hover:text-[#118C8C] data-[state=active]:bg-[#118C8C] data-[state=active]:text-white data-[state=active]:border-[#118C8C]"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="mt-0">
                {loading ? (
                  <div className="text-center py-24">
                    <div className="w-14 h-14 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading gallery...</p>
                  </div>
                ) : getCategoryItems(cat.id).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 md:gap-6">
                    {getCategoryItems(cat.id).map((item, index) => {
                      const isTopSeller = item.totalSold > 0 && sortOrder === 'topSellers';
                      const showBadge = isTopSeller || item.totalSold >= 5;

                      const allImages =
                        item.imageUrls?.length > 0
                          ? item.imageUrls
                          : item.imageUrl
                          ? [item.imageUrl]
                          : [];

                      const currentIndex = imageIndices[item.id] || 0;
                      const currentImage = allImages[currentIndex] || null;

                      const nextImage = (e) => {
                        e.stopPropagation();
                        setImageIndices((prev) => ({
                          ...prev,
                          [item.id]: (currentIndex + 1) % allImages.length,
                        }));
                      };

                      const prevImage = (e) => {
                        e.stopPropagation();
                        setImageIndices((prev) => ({
                          ...prev,
                          [item.id]: (currentIndex - 1 + allImages.length) % allImages.length,
                        }));
                      };

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: index * 0.04 }}
                          onClick={() =>
                            navigate(`/product/${item.id}`, {
                              state: { ids: getNavIdsForTab(cat.id), fromTab: cat.id },
                            })
                          }
                          className="group cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                          {/* IMAGE AREA */}
                          <div className="relative">
                            {showBadge && (
                              <div className="absolute top-4 left-4 z-20 rounded-full bg-red-500 text-white text-[11px] font-bold px-3 py-1.5 shadow-md">
                                BEST SELLER
                              </div>
                            )}

                            <div className="relative h-56 sm:h-52 md:h-56 lg:h-60 overflow-hidden bg-gray-100">
                              {currentImage ? (
                                <img
                                  src={currentImage}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag size={42} className="text-gray-400" />
                                </div>
                              )}

                              {allImages.length > 1 && (
                                <>
                                  <button
                                    onClick={prevImage}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition duration-300 z-10"
                                  >
                                    <ChevronLeft size={18} />
                                  </button>

                                  <button
                                    onClick={nextImage}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition duration-300 z-10"
                                  >
                                    <ChevronRight size={18} />
                                  </button>
                                </>
                              )}

                              {allImages.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                  {allImages.map((_, idx) => (
                                    <div
                                      key={idx}
                                      className={`h-1.5 rounded-full transition-all duration-300 ${
                                        idx === currentIndex
                                          ? 'w-5 bg-white'
                                          : 'w-1.5 bg-white/70'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* CONTENT */}
                          <div className="p-5">
                            {/* Title + Price */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="text-lg md:text-xl font-semibold text-gray-900 line-clamp-2 leading-snug">
                                {item.name}
                              </h3>

                              <span className="shrink-0 text-lg md:text-xl font-bold text-[#118C8C]">
                                {formatPrice(item.price)}
                              </span>
                            </div>

                            {/* Category */}
                            <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                              {item.category || 'Handmade Product'}
                            </p>

                            {/* Ratings + Stock */}
                            <div className="flex items-center justify-between gap-3 mb-3">
                              {item.reviewCount > 0 ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  {renderStars(item.averageRating)}
                                  <span className="text-sm text-gray-500 whitespace-nowrap">
                                    ({item.reviewCount})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No reviews yet</span>
                              )}

                              <div className="text-xs md:text-sm text-right">
                                {getStockText(item)}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4 min-h-[40px]">
                              {item.description || 'Beautifully made handcrafted item.'}
                            </p>

                            {/* CTA */}
                            <Button className="w-full h-11 rounded-2xl bg-[#118C8C] hover:bg-[#0d7070] text-white font-semibold shadow-sm">
                              View Product
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-24">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                      <ShoppingBag size={38} className="text-gray-400" />
                    </div>
                    <p className="text-lg text-gray-500">
                      {searchQuery
                        ? 'No products found matching your search.'
                        : 'No items in this category yet.'}
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default GalleryPage;
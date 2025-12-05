// src/pages/GalleryPage.jsx ← FINAL: TOP SELLERS WORKS 100% + VISUAL BADGE
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Star, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';

const GalleryPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pricelists"), async (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        inStock: doc.data().inStock !== false,
        stockQuantity: doc.data().stockQuantity || 0,
        totalSold: doc.data().totalSold || 0  // ← MAKE SURE THIS IS LOADED
      }));

      const enriched = await Promise.all(
        productsData.map(async (product) => {
          const q = query(collection(db, "reviews"), where("productId", "==", product.id));
          const snap = await getDocs(q);
          const reviews = snap.docs.map(d => d.data());
          const avg = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;
          return { 
            ...product, 
            averageRating: Number(avg.toFixed(1)), 
            reviewCount: reviews.length 
          };
        })
      );

      setProducts(enriched);
      setFilteredProducts(enriched);
      setLoading(false);
    });

    return unsub;
  }, []);

  // SEARCH + SORT
  useEffect(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    if (sortOrder === "lowToHigh") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortOrder === "highToLow") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortOrder === "topSellers") {
      filtered = [...filtered].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, sortOrder]);

  const getCategoryItems = (category) => {
    if (category === 'all') return filteredProducts;
    return filteredProducts.filter(p => p.category === category);
  };

  const getStockText = (product) => {
    if (!product.inStock || product.stockQuantity === 0) 
      return <span className="text-red-600 font-bold">Out of stock</span>;
    if (product.stockQuantity <= 5) 
      return <span className="text-orange-600 font-bold">Only {product.stockQuantity} left!</span>;
    return <span className="text-green-600 font-bold">{product.stockQuantity} available</span>;
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={14} className={i <= rating ? "text-yellow-500 fill-current" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'Hand-painted needlepoint canvas', label: 'Needlepoint Canvas' },
    { id: 'Crocheted products', label: 'Crochet' },
    { id: 'Sample portraitures', label: 'Portraiture' },
    { id: 'Painting on Canvas', label: 'Canvas Paintings' }
  ];

  return (
    <>
      <Helmet><title>Gallery - D.A.B.S. Co.</title></Helmet>

      <div className="container mx-auto px-4 py-12">
        <motion.div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-4">Our Gallery</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every piece tells a story. Handmade with love, just for you.
          </p>
        </motion.div>

        {/* SEARCH + SORT */}
        <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#118C8C] focus:outline-none text-lg"
            />
          </div>

          <div className="flex items-center gap-3">
            <ArrowUpDown size={20} className="text-gray-600" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#118C8C] focus:outline-none text-lg"
            >
              <option value="default">Featured</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
              <option value="topSellers">Top Sellers</option>
            </select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-12 bg-white shadow-sm">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="data-[state=active]:bg-[#118C8C] data-[state=active]:text-white font-medium">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id}>
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : getCategoryItems(cat.id).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {getCategoryItems(cat.id).map((item, index) => {
                    const isTopSeller = item.totalSold > 0 && sortOrder === "topSellers";
                    const showBadge = isTopSeller || item.totalSold >= 5; // Show even if not sorted

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group relative"
                      >
                        {/* BEST SELLER BADGE — SHOWS EVEN IF NOT SORTED */}
                        {showBadge && (
                          <div className="absolute top-4 left-4 z-10 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse">
                            BEST SELLER
                          </div>
                        )}

                        <div className="aspect-square overflow-hidden relative bg-gray-100">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <ShoppingBag size={48} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Link to={`/product/${item.id}`}>
                              <Button variant="secondary" size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                                <Eye size={20} className="mr-2" /> View Details
                              </Button>
                            </Link>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-bold text-[#118C8C] line-clamp-2">{item.name}</h3>
                            <span className="text-2xl font-bold text-[#F2BB16]">
                              {formatPrice(item.price)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            {item.reviewCount > 0 ? (
                              <div className="flex items-center gap-2">
                                {renderStars(item.averageRating)}
                                <span className="text-sm text-gray-600">({item.reviewCount})</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No reviews yet</span>
                            )}
                            <div className="text-sm">
                              {getStockText(item)}
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{item.description}</p>
                          <Link to={`/product/${item.id}`} className="block">
                            <Button className="w-full bg-[#118C8C] hover:bg-[#0d7070]">
                              View Product
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
                  <p className="text-xl text-gray-500">
                    {searchQuery ? "No products found matching your search." : "No items in this category yet."}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
};

export default GalleryPage;
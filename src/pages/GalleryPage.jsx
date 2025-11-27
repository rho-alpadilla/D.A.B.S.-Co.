// src/pages/GalleryPage.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GalleryPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products from Firestore (same collection as Admin Panel)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pricelists"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);
      setLoading(false);
    }, (err) => {
      console.error("Error loading products:", err);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Filter by category
  const getCategoryItems = (category) => {
    if (category === 'all') return products;
    return products.filter(p => p.category === category);
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
      <Helmet>
        <title>Gallery - D.A.B.S. Co.</title>
        <meta name="description" content="Browse our handcrafted needlepoint, crochet, portraits, and canvas paintings." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-4">Our Gallery</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every piece tells a story. Handmade with love, just for you.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-12 bg-white shadow-sm">
            {categories.map(cat => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-[#118C8C] data-[state=active]:text-white font-medium"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id}>
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-6 text-gray-600">Loading your beautiful creations...</p>
                </div>
              ) : getCategoryItems(cat.id).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {getCategoryItems(cat.id).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group"
                    >
                      <div className="aspect-square overflow-hidden relative bg-gray-100">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
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
                          <span className="text-2xl font-bold text-[#F2BB16]">${item.price}</span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{item.description}</p>
                        <div className="flex gap-3">
                          <Link to={`/product/${item.id}`} className="flex-1">
                            <Button className="w-full bg-[#118C8C] hover:bg-[#0d7070]">
                              View Product
                            </Button>
                          </Link>
                          <Button size="icon" variant="outline" className="border-[#118C8C] text-[#118C8C]">
                            <ShoppingBag size={20} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
                  <p className="text-xl text-gray-500">No items in this category yet.</p>
                  <p className="text-gray-400 mt-2">Check back soon — new pieces are always in the works!</p>
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
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/context/StoreContext';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GalleryPage = () => {
  const [activeTab, setActiveTab] = useState('needlepoint');
  const { products } = useStore();

  // Group products by category
  const getCategoryItems = (cat) => products.filter(p => p.category === cat);

  const categories = [
    { id: 'needlepoint', label: 'Needlepoint' },
    { id: 'crochet', label: 'Crochet' },
    { id: 'canvas', label: 'Canvas Paintings' },
    { id: 'portraiture', label: 'Portraiture' } // Note: May be empty in mock data, using fallback
  ];

  return (
    <>
      <Helmet>
        <title>Gallery - D.A.B.S. Co.</title>
        <meta name="description" content="Browse our collection of hand-painted needlepoint canvases, crochet creations, portraiture, and canvas paintings at D.A.B.S. Co." />
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
            Explore our diverse collection of handcrafted artisan pieces. Click on any item for more details.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-white">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id} 
                className="data-[state=active]:bg-[#118C8C] data-[state=active]:text-white"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getCategoryItems(cat.id).length > 0 ? (
                  getCategoryItems(cat.id).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group"
                    >
                      <div className="aspect-square overflow-hidden relative">
                         <img alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://images.unsplash.com/photo-1604187360824-b84016bb01e5" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <Link to={`/product/${item.id}`}>
                             <Button variant="secondary" size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                               <Eye size={16} className="mr-2" /> View Details
                             </Button>
                           </Link>
                         </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-semibold text-[#118C8C]">{item.title}</h3>
                          <span className="font-bold text-[#F2BB16]">${item.price}</span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{item.description}</p>
                        <Link to={`/product/${item.id}`}>
                          <Button variant="outline" className="w-full border-[#118C8C] text-[#118C8C] hover:bg-[#e0f2f2]">
                            View Product
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12 text-gray-500">
                    <p>No items currently available in this category.</p>
                    <p className="text-sm">Check back soon or contact us for commissions!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
};

export default GalleryPage;
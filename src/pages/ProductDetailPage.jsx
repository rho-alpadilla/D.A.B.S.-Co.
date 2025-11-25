import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, ArrowLeft, Package, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { getProduct, products } = useStore();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const found = getProduct(id);
    setProduct(found);
    
    // Simple recommendation engine logic (same category)
    if (found) {
      const related = products
        .filter(p => p.category === found.category && p.id !== found.id)
        .slice(0, 3);
      setRelatedProducts(related);
    }
    
    // n8n-ready: Track view event
    console.log(`[n8n Trigger] Product View Event: ${id}`);
  }, [id, getProduct, products]);

  if (!product) {
    return <div className="container mx-auto p-20 text-center">Product not found</div>;
  }

  return (
    <>
      <Helmet>
        <title>{product.title} - D.A.B.S. Co.</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <Link to="/gallery" className="inline-flex items-center text-gray-500 hover:text-[#118C8C] mb-8">
          <ArrowLeft size={18} className="mr-2" />
          Back to Gallery
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-2 rounded-xl shadow-lg"
          >
             <img alt={product.title} className="w-full h-auto rounded-lg object-cover aspect-square" src="https://images.unsplash.com/photo-1689608651320-9f04a1880fb0" />
          </motion.div>

          {/* Details Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-sm font-bold text-[#118C8C] uppercase tracking-wider bg-[#e0f2f2] px-3 py-1 rounded-full">
              {product.category}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-2">{product.title}</h1>
            
            <div className="flex items-center mb-6">
              <div className="flex text-[#F2BB16]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-gray-500 text-sm ml-2">({product.reviews} reviews)</span>
            </div>

            <p className="text-3xl font-bold text-gray-900 mb-6">${product.price}</p>
            <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

            <div className="mb-8 border-t border-b border-gray-100 py-6">
              <h3 className="font-semibold text-gray-900 mb-3">Specifications:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-500 capitalize">{key}: </span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex items-center text-green-600 text-sm font-medium">
                <Package size={18} className="mr-2" />
                {product.inventory > 0 ? 'In Stock & Ready to Ship' : 'Made to Order'}
              </div>
              <div className="flex items-center text-[#118C8C] text-sm font-medium">
                <ShieldCheck size={18} className="mr-2" />
                Quality Guarantee
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => addToCart(product)}
                className="flex-1 bg-[#118C8C] hover:bg-[#0d7070] h-12 text-lg"
              >
                <ShoppingCart className="mr-2" />
                Add to Cart
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map(item => (
                <Link key={item.id} to={`/product/${item.id}`} className="group">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1580460848325-6b8d06d628cc" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 group-hover:text-[#118C8C]">{item.title}</h3>
                      <p className="text-[#F2BB16] font-medium mt-1">${item.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetailPage;
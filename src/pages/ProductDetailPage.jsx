// src/pages/ProductDetailPage.jsx ← FINAL VERSION: ADD TO CART WORKS 100%
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';  // ← Add this for cart functionality
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();  // ← Get addToCart from your CartContext

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "pricelists", id), (snap) => {
      if (snap.exists()) {
        setProduct({ id: snap.id, ...snap.data() });
      } else {
        setProduct(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

// In ProductDetailPage.jsx — Replace this function
const handleAddToCart = () => {
  if (!product) return;

  // Add to cart using CartContext
  addToCart(product);

};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Product Not Found</h1>
          <Link to="/gallery">
            <Button className="bg-[#118C8C] hover:bg-[#0d7070]">
              Back to Gallery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - D.A.B.S. Co.</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Back Link */}
          <Link to="/gallery" className="inline-flex items-center gap-2 text-[#118C8C] hover:underline mb-8">
            <ArrowLeft size={20} /> Back to Gallery
          </Link>

          {/* Product Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-96 md:h-full">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <ShoppingBag size={80} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
              <div>
                <span className="text-sm font-bold text-[#F2BB16] uppercase tracking-wider mb-3">
                  {product.category}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-6">
                  {product.name}
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed mb-10">
                  {product.description}
                </p>
              </div>

              <div className="py-6">
                <span className="text-5xl font-bold text-[#F2BB16]">
                  ${product.price}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleAddToCart}  // ← Now calls CartContext addToCart
                  className="bg-[#118C8C] hover:bg-[#0d7070] flex-1 font-semibold"
                >
                  <ShoppingBag className="mr-3" size={22} />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline" className="border-[#118C8C] text-[#118C8C] flex-1">
                  Contact for Custom Order
                </Button>
              </div>

              <p className="text-sm text-gray-500 pt-8 border-t">
                Product ID: {product.id} • {product.inStock ? "In Stock" : "Out of Stock"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
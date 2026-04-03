// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import {
  doc, onSnapshot, updateDoc, collection, query, where,
  orderBy, getDocs, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, ShoppingBag, Edit, Save, X, Upload,
  Star, MessageCircle, ChevronLeft, ChevronRight, Trash2, Plus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// ✅ ADDED (background)
import Grainient from '@/components/ui-bits/Grainient';
import Particles from '@/components/ui-bits/Particles';

const CATEGORIES = [
  "Hand-painted needlepoint canvas",
  "Crocheted products",
  "Sample portraitures",
  "Painting on Canvas"
];

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.email.includes('admin');
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const itemsPerPage = window.innerWidth < 768 ? 2 : window.innerWidth < 1024 ? 3 : 4;

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!id) return;

    const unsubProduct = onSnapshot(doc(db, "pricelists", id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setProduct(data);
        setForm({
          ...data,
          inStock: data.inStock !== false,
          stockQuantity: data.stockQuantity || 0,
          imageUrls: data.imageUrls || (data.imageUrl ? [data.imageUrl] : [])
        });
        setMainImageIndex(0);
      } else setProduct(null);
      setLoading(false);
    });

    const loadReviews = async () => {
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", id),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const reviewsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData);

      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg.toFixed(1));
        setTotalReviews(reviewsData.length);
      }
    };

    loadReviews();
    return () => unsubProduct();
  }, [id]);

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
        <h1 className="text-3xl font-bold text-red-600">Product Not Found</h1>
      </div>
    );
  }

  const allImages = form.imageUrls?.length ? form.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const currentImage = allImages[mainImageIndex];

  return (
    <>
      <Helmet><title>{product.name} - D.A.B.S. Co.</title></Helmet>

      {/* ✅ BACKGROUND APPLIED */}
      <div className="relative min-h-screen bg-[#daf0ee] overflow-hidden">

        {/* Background layer */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#118c8c"
            color2="#118c8c"
            color3="#fbfe9f"
            timeSpeed={0.25}
            colorBalance={-0.06}
            warpStrength={1.5}
            warpFrequency={3.8}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={1}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={400}
              particleSpread={10}
              speed={0.1}
              particleColors={['#faf8f1', '#118c8c', '#f1bb19']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={150}
              sizeRandomness={1.7}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 py-12">
          <div className="container mx-auto px-6 max-w-5xl">

            <Link to="/gallery" className="text-[#ffffff] flex items-center gap-2 mb-6">
              <ArrowLeft /> Back
            </Link>

            <div className="bg-white rounded-3xl shadow-2xl grid md:grid-cols-2">
              <div className="aspect-square bg-gray-100">
                {currentImage && (
                  <img src={currentImage} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="p-10">
                <h1 className="text-4xl font-bold text-[#118C8C] mb-4">
                  {product.name}
                </h1>

                <p className="text-gray-600 mb-6">{product.description}</p>

                <p className="text-4xl font-bold text-[#F2BB16] mb-6">
                  {formatPrice(product.price)}
                </p>

                {!isAdmin && (
                  <Button
                    onClick={() => addToCart(product)}
                    className="bg-[#118C8C] w-full"
                  >
                    Add to Cart
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
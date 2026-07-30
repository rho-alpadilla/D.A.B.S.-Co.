// src/pages/ProductDetailPage.jsx ← FINAL: MULTI-IMAGE EDITING (ADD/REMOVE IMAGES IN ADMIN MODE)
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
  const [visibleReviewCount, setVisibleReviewCount] = useState(5);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Multi-image state
  const [mainImageIndex, setMainImageIndex] = useState(0);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const itemsPerPage = window.innerWidth < 768 ? 2 : window.innerWidth < 1024 ? 3 : 4;

  // Admin reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!id) return;
    setVisibleReviewCount(5);

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
      } else {
        setProduct(null);
      }
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

  // Load recommendations (unchanged)
  useEffect(() => {
    if (!product?.category) return;

    const loadRecommendations = async () => {
      const similarQ = query(
        collection(db, "pricelists"),
        where("category", "==", product.category),
        limit(10)
      );
      const topSellersQ = query(
        collection(db, "pricelists"),
        orderBy("totalSold", "desc"),
        limit(10)
      );
      const newArrivalsQ = query(
        collection(db, "pricelists"),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const [similarSnap, topSnap, newSnap] = await Promise.all([
        getDocs(similarQ),
        getDocs(topSellersQ),
        getDocs(newArrivalsQ)
      ]);

      const similar = similarSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== id);
      const topSellers = topSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== id && (p.totalSold || 0) > 0);
      const newArrivals = newSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== id);

      const combined = [
        ...similar.slice(0, 6),
        ...topSellers.slice(0, 4),
        ...newArrivals.slice(0, 4)
      ];

      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values())
        .sort(() => Math.random() - 0.5);

      setRecommended(unique);
    };

    loadRecommendations();
  }, [product?.category, id]);

  // Carousel navigation (unchanged)
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + itemsPerPage) % recommended.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - itemsPerPage + recommended.length) % recommended.length);
  };

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "dabs-co-unsigned");

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        return data.secure_url;
      } catch (err) {
        toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        return null;
      }
    });

    const newUrls = (await Promise.all(uploadPromises)).filter(url => url);
    setForm(prev => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), ...newUrls]
    }));

    setUploading(false);
    toast({ title: "Success", description: `${newUrls.length} new images added!` });
  };

  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
    // Adjust main index if removed current one
    if (index === mainImageIndex) {
      setMainImageIndex(prev => Math.max(0, prev - 1));
    } else if (index < mainImageIndex) {
      setMainImageIndex(prev => prev - 1);
    }
  };

  const saveEdits = async () => {
    try {
      await updateDoc(doc(db, "pricelists", id), {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        category: form.category,
        imageUrls: form.imageUrls || [], // Save as array
        inStock: form.inStock,
        stockQuantity: Number(form.stockQuantity) || 0,
        updatedAt: new Date()
      });
      setEditing(false);
      toast({ title: "Success", description: "Product updated!" });
    } catch (err) {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
      console.error(err);
    }
  };

  const sendReply = async (reviewId) => {
    if (!replyText.trim()) return;

    try {
      await updateDoc(doc(db, "reviews", reviewId), {
        adminReply: replyText.trim(),
        adminRepliedAt: new Date(),
        adminRepliedBy: user.email
      });

      setReplyText("");
      setReplyingTo(null);
      toast({ title: "Success", description: "Reply sent!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
      console.error(err);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <Star
            key={i}
            size={18}
            className={i <= rating ? "fill-current text-[#C992D8]" : "text-[#E7DDEB]"}
          />
        ))}
      </div>
    );
  };

  const getBuyerStockStatus = () => {
    if (!product.inStock) return <span className="text-red-600 font-bold">Out of Stock</span>;
    if (product.stockQuantity > 0 && product.stockQuantity <= 5)
      return <span className="text-orange-600 font-bold">Only {product.stockQuantity} left!</span>;
    return <span className="text-green-600 font-bold">In Stock</span>;
  };

  const getAdminStockStatus = () => {
    if (!product.inStock) return <span className="text-red-600 font-bold">Out of Stock (0)</span>;
    return <span className="text-gray-800 font-bold">In Stock: {product.stockQuantity}</span>;
  };

  if (loading) {
    return (
      <div className="artisan-grid-page min-h-screen flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#5C2D91] border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="artisan-grid-page min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Product Not Found</h1>
          <Link to="/gallery">
            <Button className="bg-[#5C2D91] hover:bg-[#4A2578]">Back to Gallery</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get all images (support old imageUrl and new imageUrls array)
  const allImages = form.imageUrls && form.imageUrls.length > 0 
    ? form.imageUrls 
    : product.imageUrl 
      ? [product.imageUrl] 
      : [];

  const currentImage = allImages[mainImageIndex] || null;

  const nextImage = () => {
    setMainImageIndex(prev => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setMainImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <>
      <Helmet><title>{product.name} - D.A.B.S. Co.</title></Helmet>

      <div className="artisan-grid-page min-h-screen py-10 sm:py-16">
        <div className="container mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <header className="mb-8 flex items-center justify-between gap-4 border-b border-white/70 pb-5">
            <Link to="/gallery" className="inline-flex items-center gap-2 rounded-full bg-white/65 px-4 py-2 font-semibold text-[#5C2D91] shadow-sm backdrop-blur-sm transition-colors hover:text-[#4A2578] hover:underline">
              <ArrowLeft size={20} /> Back to Gallery
            </Link>
            {isAdmin && !editing && (
              <Button onClick={() => setEditing(true)} variant="outline" className="border-[#5C2D91] text-[#5C2D91] hover:bg-[#F0E6F7]">
                <Edit className="mr-2" /> Edit Product
              </Button>
            )}
          </header>

          {/* MAIN PRODUCT CARD */}
          <article className="mb-12 grid grid-cols-1 overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-2xl shadow-[#2D0E5A]/15 backdrop-blur-md md:grid-cols-[1.05fr_0.95fr]">
            {/* Images Section */}
            <div className="relative">
              {/* Main Image */}
              <div className="group relative aspect-square overflow-hidden bg-[#F5EFF8]">
                {currentImage ? (
                  <img 
                    src={currentImage} 
                    alt={`${product.name} - view ${mainImageIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={80} className="text-gray-400" />
                  </div>
                )}

                {/* Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/35 bg-[#5C2D91]/80 p-3 text-white opacity-100 shadow-lg backdrop-blur-sm transition-colors hover:bg-[#4A2578] md:opacity-0 md:group-hover:opacity-100"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/35 bg-[#5C2D91]/80 p-3 text-white opacity-100 shadow-lg backdrop-blur-sm transition-colors hover:bg-[#4A2578] md:opacity-0 md:group-hover:opacity-100"
                    >
                      <ChevronRight size={32} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails / Previews (editable in edit mode) */}
              {allImages.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 bg-[#FAF6FC] p-4">
                  {allImages.map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20">
                      <button
                        onClick={() => setMainImageIndex(idx)}
                        className={`w-full h-full rounded-lg overflow-hidden border-2 transition-all ${
                          idx === mainImageIndex ? 'border-[#5C2D91] shadow-lg scale-105' : 'border-[#DCCBE7] hover:border-[#5C2D91]/50'
                        }`}
                      >
                        <img src={img} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>

                      {editing && (
                        <button
                          onClick={() => {
                            const newImages = allImages.filter((_, i) => i !== idx);
                            setForm(prev => ({ ...prev, imageUrls: newImages }));
                            if (idx === mainImageIndex) setMainImageIndex(0);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Images Button (only in edit mode) */}
              {editing && (
                <div className="bg-[#FAF6FC] p-4 text-center">
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleAddImages} 
                    className="hidden" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploading}
                    className="border-[#5C2D91] text-[#5C2D91] hover:bg-[#F0E6F7]"
                  >
                    <Plus className="mr-2" /> {uploading ? "Uploading..." : "Add More Images"}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">Upload multiple images for different angles/views</p>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="flex flex-col justify-center space-y-7 p-7 md:p-10 lg:p-12">
              {editing ? (
                <>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border-b-2 border-[#DCCBE7] text-4xl font-bold text-[#5C2D91] outline-none focus:border-[#5C2D91] md:text-5xl" required />
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-lg text-gray-700 border rounded-lg p-4 h-40" required />
                  <div className="space-y-2">
                    <label className="text-xl font-bold text-[#5C2D91]">Price in PHP (₱)</label>
                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full border-b-4 border-[#C992D8] bg-transparent text-5xl font-bold text-[#7B3FA0] outline-none focus:border-[#5C2D91]" placeholder="12000" required />
                    <p className="text-lg text-gray-600">Current: {formatPrice(product.price)}</p>
                  </div>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-4 py-3 border rounded-lg text-lg">
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <div className="space-y-6 pt-6 border-t">
                    <label className="flex items-center gap-4 text-lg">
                      <input type="checkbox" checked={form.inStock} onChange={e => setForm({ ...form, inStock: e.target.checked })} className="h-6 w-6 rounded text-[#5C2D91] focus:ring-[#5C2D91]" />
                      <span className="font-medium">In Stock</span>
                    </label>
                    <div>
                      <label className="block text-lg font-medium mb-2">Stock Quantity</label>
                      <input type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} className="w-full rounded-xl border-2 border-[#DCCBE7] px-5 py-4 text-xl focus:border-[#5C2D91]" placeholder="0" min="0" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="mb-3 inline-flex w-fit rounded-full bg-[#F0E6F7] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#7B3FA0]">
                    {product.category}
                  </span>
                  <h1 className="mb-6 font-artisan-display text-4xl font-bold leading-[0.98] tracking-[-0.03em] text-[#2A1739] md:text-5xl">
                    {product.name}
                  </h1>

                  {totalReviews > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      {renderStars(Math.round(averageRating))}
                      <span className="text-2xl font-bold text-[#5C2D91]">{averageRating}</span>
                      <span className="text-gray-600">({totalReviews} reviews)</span>
                    </div>
                  )}

                  <p className="text-lg text-gray-700 leading-relaxed mb-10">
                    {product.description}
                  </p>

                  <div className="mb-6">
                    <p className="text-xl font-bold">
                      {isAdmin ? getAdminStockStatus() : getBuyerStockStatus()}
                    </p>
                  </div>
                </>
              )}

              <div className="py-6">
                <span className="text-5xl font-bold tabular-nums text-[#7B3FA0]">
                  {formatPrice(product.price)}
                </span>
              </div>

              {!isAdmin && !editing && product.inStock && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => addToCart(product)} className="flex-1 bg-[#5C2D91] font-semibold hover:bg-[#4A2578]" disabled={product.stockQuantity === 0}>
                    {product.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 border-[#5C2D91] text-[#5C2D91] hover:bg-[#F0E6F7]">
                    Contact for Custom Order
                  </Button>
                </div>
              )}

              {isAdmin && editing && (
                <div className="flex gap-4">
                  <Button size="lg" onClick={saveEdits} className="bg-green-600 hover:bg-green-700">
                    <Save className="mr-2" /> Save Changes
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setEditing(false)}>
                    <X className="mr-2" /> Cancel
                  </Button>
                </div>
              )}

              <p className="text-sm text-gray-500 pt-8 border-t">
                Product ID: {product.id}
              </p>
            </div>
          </article>

          {/* REVIEWS SECTION */}
          {totalReviews > 0 && (
            <section className="mb-12 mt-12 rounded-[2rem] border border-white/60 bg-white/95 p-7 shadow-xl shadow-[#2D0E5A]/10 backdrop-blur-md md:p-10">
              <h2 className="mb-8 font-artisan-display text-4xl font-bold text-[#2A1739]">Customer Reviews</h2>
              <div className="space-y-8">
                {reviews.slice(0, visibleReviewCount).map(review => (
                  <div key={review.id} className="border-b pb-8 last:border-0">
                    <div className="flex items-start gap-4">
                      {review.buyerPhoto ? (
                        <img src={review.buyerPhoto} alt={review.buyerName} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5C2D91] text-xl font-bold text-white">
                          {review.buyerName[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-lg">{review.buyerName}</p>
                            <div className="flex gap-1 mt-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {review.createdAt?.toDate?.().toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-700 mt-3">{review.comment || "No comment"}</p>
                      </div>
                    </div>

                    {review.adminReply ? (
                      <div className="ml-0 mt-6 rounded-xl border-l-4 border-[#7B3FA0] bg-[#F7F0FA] p-6 sm:ml-20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5C2D91] font-bold text-white">
                            A
                          </div>
                          <div>
                            <p className="font-bold text-[#5C2D91]">Admin Reply</p>
                            <p className="text-xs text-gray-600">
                              {review.adminRepliedAt?.toDate?.().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-800">{review.adminReply}</p>
                      </div>
                    ) : isAdmin && (
                      <div className="ml-0 mt-6 sm:ml-20">
                        {replyingTo === review.id ? (
                          <div className="flex gap-3">
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 px-4 py-3 border rounded-lg resize-none h-24"
                            />
                            <div className="flex flex-col gap-2">
                              <Button onClick={() => sendReply(review.id)} size="sm" className="bg-[#5C2D91] hover:bg-[#4A2578]">
                                Send
                              </Button>
                              <Button onClick={() => { setReplyingTo(null); setReplyText(""); }} variant="outline" size="sm">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setReplyingTo(review.id)}
                            variant="outline"
                            size="sm"
                            className="border-[#5C2D91] text-[#5C2D91] hover:bg-[#F0E6F7]"
                          >
                            <MessageCircle className="mr-2" size={16} /> Reply
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {reviews.length > visibleReviewCount && (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setVisibleReviewCount((count) => count + 5)}
                    >
                      Load 5 more reviews
                    </Button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* UNIFIED "YOU MAY ALSO LIKE" CAROUSEL */}
          {recommended.length > 0 && (
            <section className="mt-16 rounded-[2rem] border border-white/60 bg-white/95 p-7 shadow-2xl shadow-[#2D0E5A]/15 backdrop-blur-md md:p-10">
              <h2 className="mb-12 text-center font-artisan-display text-4xl font-bold text-[#2A1739]">
                You May Also Like
              </h2>

              <div className="relative">
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-700 ease-out gap-6"
                    style={{ transform: `translateX(-${currentSlide * (100 / itemsPerPage)}%)` }}
                  >
                    {recommended.map(item => (
                      <Link 
                        key={item.id} 
                        to={`/product/${item.id}`}
                        className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 group"
                      >
                        <div className="artisan-card-hover overflow-hidden rounded-2xl border border-[#E6DDEB] bg-[#FAF6FC] shadow-lg">
                          <div className="aspect-square relative">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <ShoppingBag size={48} className="text-gray-400" />
                              </div>
                            )}

                            {(item.totalSold > 5 || item === recommended[0]) && (
                              <div className="absolute top-3 left-3 bg-red-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow">
                                BEST SELLER
                              </div>
                            )}
                            {new Date(item.createdAt?.seconds * 1000) > new Date(Date.now() - 7*24*60*60*1000) && (
                              <div className="absolute right-3 top-3 rounded-full bg-[#5C2D91] px-4 py-1 text-xs font-bold text-white shadow">
                                NEW
                              </div>
                            )}
                          </div>

                          <div className="p-6 text-center">
                            <h3 className="mb-3 line-clamp-2 font-bold text-[#5C2D91] transition-colors group-hover:text-[#4A2578]">
                              {item.name}
                            </h3>
                            <div className="flex justify-center gap-2 mb-3">
                              {renderStars(Math.round(item.averageRating || 0))}
                            </div>
                            <p className="text-2xl font-bold text-[#7B3FA0]">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {recommended.length > itemsPerPage && (
                  <>
                    <button 
                      onClick={prevSlide}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg p-5 rounded-full shadow-2xl hover:scale-110 transition z-10 border border-gray-200"
                    >
                      <ChevronLeft size={32} className="text-[#5C2D91]" />
                    </button>
                    <button 
                      onClick={nextSlide}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white/90 backdrop-blur-lg p-5 rounded-full shadow-2xl hover:scale-110 transition z-10 border border-gray-200"
                    >
                      <ChevronRight size={32} className="text-[#5C2D91]" />
                    </button>
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;

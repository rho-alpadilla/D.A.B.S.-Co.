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
            className={i <= rating ? "text-yellow-500 fill-current" : "text-gray-300"}
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
            <Button className="bg-[#118C8C] hover:bg-[#0d7070]">Back to Gallery</Button>
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

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <Link to="/gallery" className="inline-flex items-center gap-2 text-[#118C8C] hover:underline">
              <ArrowLeft size={20} /> Back to Gallery
            </Link>
            {isAdmin && !editing && (
              <Button onClick={() => setEditing(true)} variant="outline" className="border-[#118C8C] text-[#118C8C]">
                <Edit className="mr-2" /> Edit Product
              </Button>
            )}
          </div>

          {/* MAIN PRODUCT CARD */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 mb-12">
            {/* Images Section */}
            <div className="relative">
              {/* Main Image */}
              <div className="aspect-square overflow-hidden bg-gray-100 relative group">
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
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 backdrop-blur-sm"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 backdrop-blur-sm"
                    >
                      <ChevronRight size={32} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails / Previews (editable in edit mode) */}
              {allImages.length > 0 && (
                <div className="flex gap-2 p-4 bg-gray-50 flex-wrap justify-center">
                  {allImages.map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20">
                      <button
                        onClick={() => setMainImageIndex(idx)}
                        className={`w-full h-full rounded-lg overflow-hidden border-2 transition-all ${
                          idx === mainImageIndex ? 'border-[#118C8C] shadow-lg scale-105' : 'border-gray-300 hover:border-[#118C8C]/50'
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
                <div className="p-4 bg-gray-50 text-center">
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
                    className="border-[#118C8C] text-[#118C8C] hover:bg-[#118C8C]/10"
                  >
                    <Plus className="mr-2" /> {uploading ? "Uploading..." : "Add More Images"}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">Upload multiple images for different angles/views</p>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
              {editing ? (
                <>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="text-4xl md:text-5xl font-bold text-[#118C8C] border-b-2 border-gray-300 focus:border-[#118C8C] outline-none" required />
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-lg text-gray-700 border rounded-lg p-4 h-40" required />
                  <div className="space-y-2">
                    <label className="text-xl font-bold text-[#118C8C]">Price in PHP (₱)</label>
                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="text-5xl font-bold text-[#F2BB16] w-full border-b-4 border-[#F2BB16] focus:border-[#118C8C] outline-none bg-transparent" placeholder="12000" required />
                    <p className="text-lg text-gray-600">Current: {formatPrice(product.price)}</p>
                  </div>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-4 py-3 border rounded-lg text-lg">
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <div className="space-y-6 pt-6 border-t">
                    <label className="flex items-center gap-4 text-lg">
                      <input type="checkbox" checked={form.inStock} onChange={e => setForm({ ...form, inStock: e.target.checked })} className="w-6 h-6 text-[#118C8C] rounded focus:ring-[#118C8C]" />
                      <span className="font-medium">In Stock</span>
                    </label>
                    <div>
                      <label className="block text-lg font-medium mb-2">Stock Quantity</label>
                      <input type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} className="w-full px-5 py-4 border-2 rounded-xl focus:border-[#118C8C] text-xl" placeholder="0" min="0" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-[#F2BB16] uppercase tracking-wider mb-3">
                    {product.category}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-6">
                    {product.name}
                  </h1>

                  {totalReviews > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      {renderStars(Math.round(averageRating))}
                      <span className="text-2xl font-bold text-[#118C8C]">{averageRating}</span>
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
                <span className="text-5xl font-bold text-[#F2BB16]">
                  {formatPrice(product.price)}
                </span>
              </div>

              {!isAdmin && !editing && product.inStock && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => addToCart(product)} className="bg-[#118C8C] hover:bg-[#0d7070] flex-1 font-semibold" disabled={product.stockQuantity === 0}>
                    {product.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                  <Button size="lg" variant="outline" className="border-[#118C8C] text-[#118C8C] flex-1">
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
          </div>

          {/* REVIEWS SECTION */}
          {totalReviews > 0 && (
            <div className="mt-12 bg-white rounded-3xl shadow-lg p-10 mb-12">
              <h2 className="text-3xl font-bold text-[#118C8C] mb-8">Customer Reviews</h2>
              <div className="space-y-8">
                {reviews.map(review => (
                  <div key={review.id} className="border-b pb-8 last:border-0">
                    <div className="flex items-start gap-4">
                      {review.buyerPhoto ? (
                        <img src={review.buyerPhoto} alt={review.buyerName} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 bg-[#118C8C] rounded-full flex items-center justify-center text-white font-bold text-xl">
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
                      <div className="mt-6 ml-20 p-6 bg-blue-50 rounded-xl border-l-4 border-[#118C8C]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-[#118C8C] rounded-full flex items-center justify-center text-white font-bold">
                            A
                          </div>
                          <div>
                            <p className="font-bold text-[#118C8C]">Admin Reply</p>
                            <p className="text-xs text-gray-600">
                              {review.adminRepliedAt?.toDate?.().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-800">{review.adminReply}</p>
                      </div>
                    ) : isAdmin && (
                      <div className="mt-6 ml-20">
                        {replyingTo === review.id ? (
                          <div className="flex gap-3">
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 px-4 py-3 border rounded-lg resize-none h-24"
                            />
                            <div className="flex flex-col gap-2">
                              <Button onClick={() => sendReply(review.id)} size="sm" className="bg-[#118C8C]">
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
                            className="text-[#118C8C] border-[#118C8C] hover:bg-[#118C8C]/10"
                          >
                            <MessageCircle className="mr-2" size={16} /> Reply
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UNIFIED "YOU MAY ALSO LIKE" CAROUSEL */}
          {recommended.length > 0 && (
            <div className="mt-16 bg-white rounded-3xl shadow-2xl p-10">
              <h2 className="text-4xl font-bold text-center text-[#118C8C] mb-12">
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
                        <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
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
                              <div className="absolute top-3 right-3 bg-[#118C8C] text-white px-4 py-1 rounded-full text-xs font-bold shadow">
                                NEW
                              </div>
                            )}
                          </div>

                          <div className="p-6 text-center">
                            <h3 className="font-bold text-[#118C8C] line-clamp-2 mb-3 group-hover:text-[#0d7070] transition-colors">
                              {item.name}
                            </h3>
                            <div className="flex justify-center gap-2 mb-3">
                              {renderStars(Math.round(item.averageRating || 0))}
                            </div>
                            <p className="text-2xl font-bold text-[#F2BB16]">
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
                      <ChevronLeft size={32} className="text-[#118C8C]" />
                    </button>
                    <button 
                      onClick={nextSlide}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white/90 backdrop-blur-lg p-5 rounded-full shadow-2xl hover:scale-110 transition z-10 border border-gray-200"
                    >
                      <ChevronRight size={32} className="text-[#118C8C]" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
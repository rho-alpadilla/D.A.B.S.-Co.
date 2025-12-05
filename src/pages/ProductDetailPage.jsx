// src/pages/ProductDetailPage.jsx ← FINAL: ADMIN CAN REPLY TO REVIEWS (FULL CODE)
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Edit, Save, X, Upload, Star, MessageCircle } from 'lucide-react';

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

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

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
          stockQuantity: data.stockQuantity || 0
        });
        setImagePreview(data.imageUrl || "");
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "dabs-co-unsigned");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setForm(prev => ({ ...prev, imageUrl: data.secure_url }));
      setImagePreview(data.secure_url);
    } catch (err) {
      alert("Upload failed");
    }
    setUploading(false);
  };

  const saveEdits = async () => {
    try {
      await updateDoc(doc(db, "pricelists", id), {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        category: form.category,
        imageUrl: form.imageUrl,
        inStock: form.inStock,
        stockQuantity: Number(form.stockQuantity) || 0,
        updatedAt: new Date()
      });
      setEditing(false);
      alert("Product updated!");
    } catch (err) {
      alert("Save failed");
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
      alert("Reply sent!");
    } catch (err) {
      alert("Failed to send reply");
      console.error(err);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <Star
            key={i}
            size={20}
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

          {/* Product Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-96 md:h-full">
              {editing ? (
                <div className="relative h-full">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload className="mr-2" /> {uploading ? "Uploading..." : "Change Image"}
                    </Button>
                  </div>
                </div>
              ) : product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <ShoppingBag size={80} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Details */}
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

          {/* REVIEWS SECTION — ADMIN CAN REPLY */}
          {totalReviews > 0 && (
            <div className="mt-12 bg-white rounded-3xl shadow-lg p-10">
              <h2 className="text-3xl font-bold text-[#118C8C] mb-8">Customer Reviews</h2>
              <div className="space-y-8">
                {reviews.map(review => (
                  <div key={review.id} className="border-b pb-8 last:border-0">
                    {/* Customer Review */}
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

                    {/* Admin Reply */}
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
                              onChange={(e) => setReplyText(e.target.value)}
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
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
// src/pages/ProductDetailPage.jsx ← FINAL: LIVE CURRENCY API + DROPDOWN
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext'; // ← NEW: Global currency
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Edit, Save, X, Upload } from 'lucide-react';

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
  const { currency, formatPrice } = useCurrency(); // ← LIVE CURRENCY FROM API

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "pricelists", id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setProduct(data);
        setForm(data);
        setImagePreview(data.imageUrl || "");
      } else {
        setProduct(null);
      }
      setLoading(false);
    });

    return () => unsub();
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
        price: Number(form.price), // ← ALWAYS PHP
        description: form.description.trim(),
        category: form.category,
        imageUrl: form.imageUrl,
        inStock: form.inStock,
        updatedAt: new Date()
      });
      setEditing(false);
      alert("Product updated!");
    } catch (err) {
      alert("Save failed");
    }
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
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="text-4xl md:text-5xl font-bold text-[#118C8C] border-b-2 border-gray-300 focus:border-[#118C8C] outline-none"
                    required
                  />
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="text-lg text-gray-700 border rounded-lg p-4 h-40"
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-xl font-bold text-[#118C8C]">Price in PHP (₱)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="text-5xl font-bold text-[#F2BB16] w-full border-b-4 border-[#F2BB16] focus:border-[#118C8C] outline-none bg-transparent"
                      placeholder="12000"
                      required
                    />
                    <p className="text-lg text-gray-600">
                      Current in {currency}: {formatPrice(product.price)}
                    </p>
                  </div>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="px-4 py-3 border rounded-lg text-lg"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={e => setForm({ ...form, inStock: e.target.checked })}
                    />
                    <span className="text-gray-700">In Stock</span>
                  </label>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-[#F2BB16] uppercase tracking-wider mb-3">
                    {product.category}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#118C8C] mb-6">
                    {product.name}
                  </h1>
                  <p className="text-lg text-gray-700 leading-relaxed mb-10">
                    {product.description}
                  </p>
                </>
              )}

              {/* PRICE — LIVE FROM API */}
              <div className="py-6">
                <span className="text-5xl font-bold text-[#F2BB16]">
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* BUYER BUTTONS */}
              {!isAdmin && !editing && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => addToCart(product)} className="bg-[#118C8C] hover:bg-[#0d7070] flex-1 font-semibold">
                    <ShoppingBag className="mr-3" size={22} />
                    Add to Cart
                  </Button>
                  <Button size="lg" variant="outline" className="border-[#118C8C] text-[#118C8C] flex-1">
                    Contact for Custom Order
                  </Button>
                </div>
              )}

              {/* ADMIN EDIT BUTTONS */}
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
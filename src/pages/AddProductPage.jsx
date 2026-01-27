// src/pages/AddProductPage.jsx ← UPDATED: MULTIPLE IMAGE UPLOAD SUPPORT
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Save, X, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = [
  "Hand-painted needlepoint canvas",
  "Crocheted products",
  "Sample portraitures",
  "Painting on Canvas"
];

const AddProductPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email?.includes('admin');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    imageUrls: [], // ← Changed to array for multiple images
    inStock: true,
    stockQuantity: 0
  });

  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]); // array of preview URLs
  const fileInputRef = useRef(null);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admins only</p>
          <Button onClick={() => navigate('/')} className="mt-6 bg-[#118C8C]">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    // Create local previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);

    // Upload each file sequentially
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

    Promise.all(uploadPromises).then(urls => {
      const validUrls = urls.filter(url => url); // remove failed uploads
      setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...validUrls] }));
      setUploading(false);
      toast({ title: "Success", description: `${validUrls.length} images uploaded!` });
    });
  };

  const removePreview = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.imageUrls.length || !form.category || !form.name || !form.price) {
      toast({ title: "Error", description: "All fields required (including at least one image)", variant: "destructive" });
      return;
    }

    try {
      await addDoc(collection(db, "pricelists"), {
        ...form,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({ title: "Success", description: "Product added with multiple images!" });
      navigate('/pricelists');
    } catch (err) {
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Add New Product - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => navigate('/pricelists')}>
              <ArrowLeft size={20} className="mr-2" /> Back to Pricelists
            </Button>
            <h1 className="text-3xl font-bold text-[#118C8C]">Add New Product</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-4 border-2 rounded-xl focus:border-[#118C8C] text-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (PHP)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-5 py-4 border-2 rounded-xl focus:border-[#118C8C] text-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-5 py-4 border-2 rounded-xl h-40 focus:border-[#118C8C]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-5 py-4 border-2 rounded-xl focus:border-[#118C8C] text-lg"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (multiple allowed)</label>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImagesChange} 
                  className="hidden" 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading}
                >
                  <Upload className="mr-2" /> {uploading ? "Uploading..." : "Upload Images"}
                </Button>
                <p className="text-sm text-gray-500 mt-2">You can select multiple images at once (different angles, details, etc.)</p>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`preview ${index}`} 
                        className="w-full h-40 object-cover rounded-lg shadow" 
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={e => setForm({ ...form, inStock: e.target.checked })}
                    className="w-6 h-6 text-[#118C8C] rounded"
                  />
                  <label className="text-lg font-medium">In Stock</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full px-5 py-4 border-2 rounded-xl focus:border-[#118C8C] text-lg"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-6 mt-12">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="bg-[#118C8C] hover:bg-[#0d7070] px-12 py-6 text-xl font-bold"
                  disabled={uploading || !form.imageUrls.length}
                >
                  <Save className="mr-3" /> Add Product
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigate('/pricelists')}
                >
                  <X className="mr-3" /> Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProductPage;
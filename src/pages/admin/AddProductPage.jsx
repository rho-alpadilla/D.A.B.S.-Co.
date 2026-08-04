// src/pages/AddProductPage.jsx ← UPDATED: MULTIPLE IMAGE UPLOAD SUPPORT
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Save, X, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

const CATEGORIES = [
  "Hand-painted needlepoint canvas",
  "Crocheted products",
  "Sample portraitures",
  "Painting on Canvas"
];

const FIELD_LABEL_CLASS = 'mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-muted';
const FIELD_INPUT_CLASS = 'w-full rounded-xl border border-artisan-border bg-white px-4 py-3 text-base text-artisan-text shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15';

const AddProductPage = () => {
  const { isProductManager, loading: roleLoading } = useUserRole();
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

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-label="Checking access">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-artisan-primary border-t-transparent" />
      </div>
    );
  }

  if (!isProductManager) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/95 p-10 text-center shadow-xl shadow-[#2D0E5A]/15">
          <h1 className="font-nunito text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-artisan-text-muted">Product managers only</p>
          <Button onClick={() => navigate('/')} className="mt-6">
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
        totalSold: 0,
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

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#5C2D91"
            color2="#7B3FA0"
            color3="#C9A0DC"
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
              particleCount={180}
              particleSpread={10}
              speed={0.1}
              particleColors={['#FAF8FF', '#E8D8F3', '#C9A0DC']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={120}
              sizeRandomness={1.4}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 py-14 md:py-20">
          <div className="container mx-auto max-w-5xl px-5 sm:px-8">
            <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/35 bg-gradient-to-br from-[#2D0E5A] via-artisan-primary to-artisan-primary-mid p-7 text-white shadow-2xl shadow-[#2D0E5A]/25 sm:p-10">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-artisan-primary-pale/25 blur-3xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary-pale">Inventory management</p>
                  <h1 className="mt-2 font-nunito text-4xl font-bold sm:text-5xl">Add New Product</h1>
                  <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">Create a product listing with pricing, stock information, images, and a clear customer-facing description.</p>
                </div>
              <Button variant="outline" onClick={() => navigate('/pricelists')} className="border-white/65 bg-white/90 text-artisan-primary hover:border-white hover:bg-white hover:text-artisan-primary">
                <ArrowLeft size={20} className="mr-2" /> Back to Pricelists
              </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-2xl shadow-[#2D0E5A]/15 backdrop-blur-md sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Product information</p>
                  <h2 className="mt-1 font-nunito text-3xl font-bold text-artisan-text">Listing details</h2>
                  <p className="mt-2 text-sm text-artisan-text-muted">Fields marked by the form validation are required before you can publish the product.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className={FIELD_LABEL_CLASS}>Product Name</label>
                    <input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className={FIELD_INPUT_CLASS}
                      required
                    />
                  </div>

                  <div>
                    <label className={FIELD_LABEL_CLASS}>Price (PHP)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className={FIELD_INPUT_CLASS}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={FIELD_LABEL_CLASS}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className={`${FIELD_INPUT_CLASS} h-40 resize-y`}
                    required
                  />
                </div>

                <div>
                  <label className={FIELD_LABEL_CLASS}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className={FIELD_INPUT_CLASS}
                    required
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-artisan-primary/30 bg-artisan-primary-wash/35 p-5 sm:p-6">
                  <label className={FIELD_LABEL_CLASS}>Product Images (multiple allowed)</label>
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
                  <p className="mt-3 text-sm text-artisan-text-muted">You can select multiple images at once for different angles and product details.</p>
                </div>

                {previews.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {previews.map((preview, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-xl border border-artisan-primary/10 bg-white shadow-sm">
                        <img 
                          src={preview} 
                          alt={`preview ${index}`} 
                          className="h-36 w-full object-cover sm:h-40"
                        />
                        <button
                          type="button"
                          onClick={() => removePreview(index)}
                          aria-label={`Remove preview ${index + 1}`}
                          className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-100 shadow-sm transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 rounded-[1.5rem] border border-artisan-primary/10 bg-white p-5 md:grid-cols-2 md:items-end sm:p-6">
                  <div className="flex items-center gap-3 rounded-xl bg-artisan-primary-wash/40 p-4">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={e => setForm({ ...form, inStock: e.target.checked })}
                      className="h-5 w-5 rounded border-artisan-primary text-artisan-primary focus:ring-artisan-primary"
                    />
                    <label className="font-semibold text-artisan-text">In Stock</label>
                  </div>

                  <div>
                    <label className={FIELD_LABEL_CLASS}>Stock Quantity</label>
                    <input
                      type="number"
                      value={form.stockQuantity}
                      onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                      className={FIELD_INPUT_CLASS}
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse justify-end gap-3 border-t border-artisan-primary/10 pt-8 sm:flex-row">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full px-8 sm:w-auto"
                    disabled={uploading || !form.imageUrls.length}
                  >
                    <Save className="mr-3" /> Add Product
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg" 
                    onClick={() => navigate('/pricelists')}
                    className="w-full sm:w-auto"
                  >
                    <X className="mr-3" /> Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProductPage;

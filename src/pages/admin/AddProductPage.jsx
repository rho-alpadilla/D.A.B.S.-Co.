// src/pages/AddProductPage.jsx ← UPDATED: MULTIPLE IMAGE UPLOAD SUPPORT
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Upload, Save, X, ArrowLeft, Trash2, ImagePlus, PackageCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = [
  "Hand-painted needlepoint canvas",
  "Crocheted products",
  "Sample portraitures",
  "Painting on Canvas"
];

const FIELD_LABEL_CLASS = 'mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-muted';
const FIELD_INPUT_CLASS = 'w-full rounded-lg border border-artisan-border bg-white px-4 py-3 text-base text-artisan-text shadow-sm outline-none transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15';

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

      <div className="relative min-h-screen overflow-x-hidden bg-[#FAF8F1]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(92,45,145,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(92,45,145,0.08)_1px,transparent_1px)] [background-size:2rem_2rem]" />

        <main className="relative py-10 sm:py-14">
          <div className="container mx-auto max-w-6xl px-5 sm:px-8">
            <header className="mb-8 flex flex-col gap-5 border-b border-artisan-primary/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Product catalog</p>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-artisan-text sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>Add a product</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-artisan-text-muted">Add the information customers will see in the gallery.</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/pricelists')} className="w-full border-artisan-primary/30 bg-white/80 text-artisan-primary transition-[transform,background-color,border-color] duration-200 ease-out active:scale-[0.97] sm:w-auto">
                <ArrowLeft size={18} className="mr-2" /> Back to pricelists
              </Button>
            </header>

            <div className="border border-artisan-primary/15 bg-white/95 shadow-[0_20px_50px_rgba(45,14,90,0.10)]">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
                <section className="p-6 sm:p-8 lg:border-r lg:border-artisan-primary/10 lg:p-10">
                  <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Product details</p>
                    <h2 className="mt-1 text-3xl font-bold text-artisan-text" style={{ fontFamily: 'var(--font-display)' }}>The essentials</h2>
                  </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className={FIELD_LABEL_CLASS} htmlFor="product-name">Product name</label>
                    <input
                      id="product-name"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className={FIELD_INPUT_CLASS}
                      required
                    />
                  </div>

                  <div>
                    <label className={FIELD_LABEL_CLASS} htmlFor="product-price">Price (PHP)</label>
                    <input
                      id="product-price"
                      type="number"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className={FIELD_INPUT_CLASS}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className={FIELD_LABEL_CLASS} htmlFor="product-description">Description</label>
                  <textarea
                    id="product-description"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className={`${FIELD_INPUT_CLASS} h-36 resize-y leading-6`}
                    required
                  />
                </div>

                <div className="mt-6">
                  <label className={FIELD_LABEL_CLASS} htmlFor="product-category">Category</label>
                  <select
                    id="product-category"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className={FIELD_INPUT_CLASS}
                    required
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-artisan-primary/10 pt-6 sm:flex-row">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full px-8 transition-transform duration-150 ease-out active:scale-[0.97] sm:w-auto"
                    disabled={uploading || !form.imageUrls.length}
                  >
                    <Save className="mr-3" /> Add product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/pricelists')}
                    className="w-full transition-transform duration-150 ease-out active:scale-[0.97] sm:w-auto"
                  >
                    <X className="mr-3" /> Cancel
                  </Button>
                </div>
                </section>

                <aside className="border-t border-artisan-primary/10 bg-[#FCFAF7] p-6 sm:p-8 lg:border-t-0 lg:p-10">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Media and stock</p>
                    <h2 className="mt-1 text-3xl font-bold text-artisan-text" style={{ fontFamily: 'var(--font-display)' }}>Ready to list</h2>
                  </div>

                <div className="mt-8 border-y border-artisan-primary/10 py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <label className={FIELD_LABEL_CLASS}>Product images</label>
                      <p className="text-sm leading-6 text-artisan-text-muted">Upload one or more product views.</p>
                    </div>
                    <ImagePlus className="shrink-0 text-artisan-primary" size={22} />
                  </div>
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
                    className="mt-5 w-full border-artisan-primary/30 bg-white transition-[transform,border-color,background-color] duration-200 ease-out active:scale-[0.97]"
                  >
                    <Upload className="mr-2" /> {uploading ? "Uploading..." : "Upload Images"}
                  </Button>
                </div>

                {previews.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                    {previews.map((preview, index) => (
                      <div key={index} className="group relative overflow-hidden border border-artisan-primary/10 bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
                        <img 
                          src={preview} 
                          alt={`Product preview ${index + 1}`}
                          className="h-32 w-full object-cover sm:h-36"
                        />
                        <button
                          type="button"
                          onClick={() => removePreview(index)}
                          aria-label={`Remove preview ${index + 1}`}
                          className="absolute right-2 top-2 rounded-md bg-red-600 p-1.5 text-white shadow-sm transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 border-t border-artisan-primary/10 pt-6">
                  <div className="mb-5 flex items-center gap-2 text-artisan-primary">
                    <PackageCheck size={20} />
                    <p className="text-xs font-bold uppercase tracking-[0.16em]">Availability</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="product-in-stock"
                      type="checkbox"
                      checked={form.inStock}
                      onChange={e => setForm({ ...form, inStock: e.target.checked })}
                      className="h-5 w-5 rounded border-artisan-primary text-artisan-primary focus:ring-artisan-primary"
                    />
                    <label htmlFor="product-in-stock" className="font-semibold text-artisan-text">Available to purchase</label>
                  </div>

                  <div className="mt-5">
                    <label className={FIELD_LABEL_CLASS} htmlFor="product-stock">Stock quantity</label>
                    <input
                      id="product-stock"
                      type="number"
                      value={form.stockQuantity}
                      onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                      className={FIELD_INPUT_CLASS}
                      min="0"
                    />
                  </div>
                </div>
                </aside>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AddProductPage;

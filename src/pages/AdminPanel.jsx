// src/pages/AdminPanel.jsx  ← FULLY WORKING (Cloudinary + Firestore)
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Save, X, Edit, Trash2, Lock, LogOut } from "lucide-react";

const CATEGORIES = [
  "Hand-painted needlepoint canvas",
  "Crocheted products",
  "Sample portraitures",
  "Painting on Canvas"
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "", price: "", description: "", category: "", imageUrl: "", inStock: true
  });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), snap => {
      setIsAdmin(snap.exists() && snap.data()?.role === "admin");
    });
    const unsubProducts = onSnapshot(collection(db, "pricelists"), snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub(); unsubProducts(); };
  }, [user]);

  // CLOUDINARY UPLOAD (FREE FOREVER)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "dabs-co-unsigned"); // ← Create this in Cloudinary

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setForm(prev => ({ ...prev, imageUrl: data.secure_url }));
    } catch (err) {
      alert("Upload failed. Check console.");
      console.error(err);
    }
    setUploading(false);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      price: p.price || "",
      description: p.description || "",
      category: p.category || "",
      imageUrl: p.imageUrl || "",
      inStock: p.inStock ?? true
    });
    setImagePreview(p.imageUrl || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", price: "", description: "", category: "", imageUrl: "", inStock: true });
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.imageUrl || !form.category) return alert("Image & category required!");

    const data = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      category: form.category,
      imageUrl: form.imageUrl,
      inStock: form.inStock,
      updatedAt: new Date()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "pricelists", editingId), data);
      } else {
        await addDoc(collection(db, "pricelists"), { ...data, createdAt: new Date() });
      }
      cancelEdit();
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete forever?")) {
      await deleteDoc(doc(db, "pricelists", id));
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Admin - D.A.B.S. Co.</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-7xl">

          <motion.div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border-l-4 border-[#118C8C] flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-[#118C8C] font-bold"><Lock /> ADMIN PANEL</div>
              <h1 className="text-3xl font-bold">Product Management</h1>
            </div>
            <Button variant="outline" onClick={() => signOut(auth).then(() => navigate("/"))} className="text-red-600">
              <LogOut className="mr-2" /> Logout
            </Button>
          </motion.div>

          <Tabs defaultValue="products">
            <TabsList className="grid w-full grid-cols-1 mb-8">
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              {/* FORM */}
              <div className="bg-white p-10 rounded-2xl shadow-lg mb-10">
                <h2 className="text-2xl font-bold mb-8">{editingId ? "Edit" : "Add New"} Product</h2>
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                  <input className="w-full px-4 py-3 border rounded-lg" placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <input className="w-full px-4 py-3 border rounded-lg" type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  <textarea className="w-full px-4 py-3 border rounded-lg h-32" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                  
                  <select className="w-full px-4 py-3 border rounded-lg" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload className="mr-2" /> {uploading ? "Uploading..." : "Upload Image (Cloudinary)"}
                    </Button>
                  </div>

                  {imagePreview && <img src={imagePreview} alt="preview" className="w-96 h-96 object-cover rounded-xl shadow-lg" />}

                  <div className="flex gap-4">
                    <Button type="submit" size="lg" className="bg-[#118C8C]">
                      <Save className="mr-2" /> {editingId ? "Update" : "Add"} Product
                    </Button>
                    {editingId && <Button type="button" variant="outline" size="lg" onClick={cancelEdit}><X className="mr-2" /> Cancel</Button>}
                  </div>
                </form>
              </div>

              {/* TABLE */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-6 text-left">Image</th>
                      <th className="p-6 text-left">Name</th>
                      <th className="p-6 text-left">Category</th>
                      <th className="p-6 text-left">Price</th>
                      <th className="p-6 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-t hover:bg-gray-50">
                        <td className="p-6">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-20 h-20 object-cover rounded" /> : <div className="w-20 h-20 bg-gray-200 rounded" />}
                        </td>
                        <td className="p-6 font-medium">{p.name}</td>
                        <td className="p-6">{p.category || "—"}</td>
                        <td className="p-6 font-bold">${p.price}</td>
                        <td className="p-6">
                          <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="mr-2"><Edit size={16} /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
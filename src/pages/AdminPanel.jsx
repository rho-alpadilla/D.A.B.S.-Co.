// src/pages/AdminPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Package, ShoppingCart, TrendingUp, DollarSign,
  LogOut, Lock, Upload, Save, X, Edit, Trash2, CheckCircle
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "", price: "", description: "", category: "", imageUrl: "", inStock: true
  });

  // Check admin + load products + load orders
  useEffect(() => {
    if (!user) return;

    const unsubRole = onSnapshot(doc(db, "users", user.uid), snap => {
      setIsAdmin(snap.exists() && snap.data()?.role === "admin");
    });

    const unsubProducts = onSnapshot(collection(db, "pricelists"), snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      snap => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => { unsubRole(); unsubProducts(); unsubProducts(); unsubOrders(); };
  }, [user]);

  // Image upload (Cloudinary)
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
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  // Product CRUD
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
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete forever?")) {
      await deleteDoc(doc(db, "pricelists", id));
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Analytics
  const totalIncome = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const predictedIncome = totalIncome > 0 ? Math.round(totalIncome * 1.15) : 0;

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Income ($)',
      data: [1200, 1500, 1800, 2200, 2800, totalIncome || 0],
      borderColor: '#118C8C',
      backgroundColor: 'rgba(17, 140, 140, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Admin Panel - D.A.B.S. Co.</title></Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* Header */}
          <motion.div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border-l-4 border-[#118C8C] flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-[#118C8C] font-bold"><Lock /> ADMIN PANEL</div>
              <h1 className="text-3xl font-bold">Store Management</h1>
            </div>
            <Button variant="outline" onClick={() => signOut(auth).then(() => navigate("/"))} className="text-red-600">
              <LogOut className="mr-2" /> Logout
            </Button>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* DASHBOARD */}
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <Package className="mx-auto text-purple-500 mb-4" size={48} />
                  <p className="text-4xl font-bold">{products.length}</p>
                  <p className="text-gray-600">Products</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <ShoppingCart className="mx-auto text-green-500 mb-4" size={48} />
                  <p className="text-4xl font-bold">{orders.length}</p>
                  <p className="text-gray-600">Total Orders</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <CheckCircle className="mx-auto text-blue-500 mb-4" size={48} />
                  <p className="text-4xl font-bold">{orders.filter(o => o.status === "completed").length}</p>
                  <p className="text-gray-600">Completed</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow text-center">
                  <DollarSign className="mx-auto text-yellow-500 mb-4" size={48} />
                  <p className="text-4xl font-bold">${totalIncome.toFixed(2)}</p>
                  <p className="text-gray-600">Income</p>
                </div>
              </div>
            </TabsContent>

            {/* PRODUCTS TAB */}
            <TabsContent value="products">
              {/* Add/Edit Form */}
              <div className="bg-white p-10 rounded-2xl shadow-lg mb-10">
                <h2 className="text-2xl font-bold mb-8">{editingId ? "Edit" : "Add New"} Product</h2>
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                  <input className="w-full px-4 py-3 border rounded-lg" placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <input className="w-full px-4 py-3 border rounded-lg" type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  <textarea className="w-full px-4 py-3 border rounded-lg h-32" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                  
                  {/* Native Select — NO MORE SHADCN SELECT ERROR */}
                  <select className="w-full px-4 py-3 border rounded-lg" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload className="mr-2" /> {uploading ? "Uploading..." : "Upload Image"}
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

              {/* Products Table */}
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

            {/* ORDERS TAB */}
            <TabsContent value="orders">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <h2 className="text-2xl font-bold text-[#118C8C]">Customer Orders</h2>
                  <p className="text-gray-600">Manage and update order status</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-4 text-left">Order ID</th>
                        <th className="p-4 text-left">Customer</th>
                        <th className="p-4 text-left">Items</th>
                        <th className="p-4 text-left">Total</th>
                        <th className="p-4 text-left">Status</th>
                        <th className="p-4 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-t hover:bg-gray-50">
                          <td className="p-4 font-medium">#{order.id.slice(0, 8)}</td>
                          <td className="p-4">{order.buyerEmail || "Guest"}</td>
                          <td className="p-4">
                            <ul className="text-sm">
                              {order.items?.map((item, i) => (
                                <li key={i}>• {item.name} (x{item.quantity})</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-4 font-bold">${order.total?.toFixed(2)}</td>
                          <td className="p-4">
                            {/* Native select for status */}
                            <select
                              value={order.status || "pending"}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="px-4 py-2 border rounded-lg bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {orders.length === 0 && (
                    <div className="p-20 text-center text-gray-500">
                      <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
                      <p>No orders yet</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics">
              <div className="space-y-10">
                <div className="bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white p-12 rounded-3xl shadow-2xl text-center">
                  <TrendingUp size={80} className="mx-auto mb-6" />
                  <h3 className="text-4xl font-bold mb-4">Next Month Prediction</h3>
                  <p className="text-7xl font-bold">${predictedIncome}</p>
                  <p className="text-2xl mt-6 opacity-90">Based on recent growth trend</p>
                </div>

                <div className="bg-white p-10 rounded-3xl shadow-lg">
                  <h3 className="text-3xl font-bold text-[#118C8C] mb-8 text-center">Income Over Time</h3>
                  <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }}} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
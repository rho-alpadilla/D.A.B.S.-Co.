// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Edit, Trash2, Plus, Save, X, Package, ShoppingCart, TrendingUp, LogOut, Lock } from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', inStock: true });

  // Check if user is admin via Firestore role field
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoadingRole(false);
      return;
    }

    const userDoc = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDoc, (docSnap) => {
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoadingRole(false);
    });

    return unsubscribe;
  }, [user]);

  // Load products only if admin
  useEffect(() => {
    if (!isAdmin) return;

    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, 'pricelists'));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(data);
    };
    fetchProducts();
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'pricelists', editingId), form);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'pricelists'), { ...form, inStock: true });
      }
      setForm({ name: '', price: '', description: '', inStock: true });
      // Refresh list
      const snapshot = await getDocs(collection(db, 'pricelists'));
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, price: p.price, description: p.description, inStock: p.inStock });
    setEditingId(p.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product permanently?')) {
      await deleteDoc(doc(db, 'pricelists', id));
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Loading or not admin
  if (!user || loadingRole || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  const totalProducts = products.length;
  const inStockCount = products.filter(p => p.inStock).length;

  return (
    <>
      <Helmet>
        <title>Admin Panel - D.A.B.S. Co.</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#118C8C]"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock size={16} className="text-[#118C8C]" />
                <span className="text-sm font-bold text-[#118C8C] uppercase tracking-wider">Admin Access</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button variant="outline" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white p-1 rounded-lg border border-gray-200">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            {/* Dashboard */}
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
                    <Package className="text-purple-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">In Stock</h3>
                    <ShoppingCart className="text-green-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{inStockCount}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Out of Stock</h3>
                    <TrendingUp className="text-red-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{totalProducts - inStockCount}</p>
                </div>
              </div>
            </TabsContent>

            {/* Products Management */}
            <TabsContent value="products">
              {/* Add/Edit Form */}
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Plus size={24} />
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder="Product Name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="px-4 py-3 border rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="px-4 py-3 border rounded-lg"
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="px-4 py-3 border rounded-lg md:col-span-2 h-28"
                    required
                  />
                  <div className="flex gap-3 md:col-span-2">
                    <Button type="submit" className="bg-[#118C8C] hover:bg-[#0d7070]">
                      <Save size={18} className="mr-2" />
                      {editingId ? 'Update' : 'Add'} Product
                    </Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={() => {
                        setEditingId(null);
                        setForm({ name: '', price: '', description: '', inStock: true });
                      }}>
                        <X size={18} className="mr-2" /> Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-left font-medium text-gray-600">Name</th>
                      <th className="p-4 text-left font-medium text-gray-600">Price</th>
                      <th className="p-4 text-left font-medium text-gray-600">Description</th>
                      <th className="p-4 text-left font-medium text-gray-600">Status</th>
                      <th className="p-4 text-left font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium">{p.name}</td>
                        <td className="p-4">${p.price}</td>
                        <td className="p-4 text-gray-600 max-w-xs truncate">{p.description}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                              <Edit size={16} />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
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
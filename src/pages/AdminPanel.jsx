import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Edit, FileText, LogOut, Lock, Package, ShoppingCart, TrendingUp } from 'lucide-react';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const { orders, products, updateOrderStatus, updateInventory } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || user.role !== 'admin') {
    setTimeout(() => navigate('/login'), 100);
    return null;
  }

  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const activeOrders = orders.filter(o => o.status !== 'Completed').length;

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
               <span className="text-sm text-gray-500">Welcome, {user.name}</span>
              <Button variant="outline" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white p-1 rounded-lg border border-gray-200">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#118C8C] data-[state=active]:text-white">Dashboard</TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-[#118C8C] data-[state=active]:text-white">Orders</TabsTrigger>
              <TabsTrigger value="inventory" className="data-[state=active]:bg-[#118C8C] data-[state=active]:text-white">Inventory</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-[#118C8C] data-[state=active]:text-white">Analytics</TabsTrigger>
            </TabsList>

            {/* Dashboard Overview */}
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                    <TrendingUp className="text-green-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">${totalRevenue}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Active Orders</h3>
                    <ShoppingCart className="text-blue-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{activeOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Products</h3>
                    <Package className="text-purple-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                <p className="text-gray-500 text-sm italic">No recent activity logs available.</p>
              </div>
            </TabsContent>

            {/* Orders Management */}
            <TabsContent value="orders">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-medium text-gray-600">Order ID</th>
                      <th className="p-4 font-medium text-gray-600">Customer</th>
                      <th className="p-4 font-medium text-gray-600">Date</th>
                      <th className="p-4 font-medium text-gray-600">Total</th>
                      <th className="p-4 font-medium text-gray-600">Status</th>
                      <th className="p-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium">{order.id}</td>
                        <td className="p-4">{order.customer}</td>
                        <td className="p-4 text-gray-500">{order.date}</td>
                        <td className="p-4">${order.total}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Inventory Management */}
            <TabsContent value="inventory">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-medium text-gray-600">Product</th>
                      <th className="p-4 font-medium text-gray-600">Category</th>
                      <th className="p-4 font-medium text-gray-600">Price</th>
                      <th className="p-4 font-medium text-gray-600">Stock</th>
                      <th className="p-4 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y divide-gray-100">
                    {products.map(product => (
                      <tr key={product.id}>
                        <td className="p-4 font-medium">{product.title}</td>
                        <td className="p-4 capitalize text-gray-500">{product.category}</td>
                        <td className="p-4">${product.price}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateInventory(product.id, Math.max(0, product.inventory - 1))}
                              className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{product.inventory}</span>
                             <button 
                              onClick={() => updateInventory(product.id, product.inventory + 1)}
                              className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          {product.inventory < 3 ? (
                            <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-green-500 text-xs">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                   </tbody>
                 </table>
              </div>
            </TabsContent>

            {/* Analytics Placeholder */}
            <TabsContent value="analytics">
              <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                <BarChart3 size={64} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Detailed traffic insights, customer demographics, and conversion tracking will be available here once the data pipeline (n8n) is fully connected.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
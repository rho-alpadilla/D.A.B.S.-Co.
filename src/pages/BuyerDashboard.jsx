import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Tag, LogOut, Sparkles, ChevronRight } from 'lucide-react';

const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    // Redirect if accessing protected route without auth
    // In a real app, use a ProtectedRoute wrapper
    setTimeout(() => navigate('/login'), 100);
    return null;
  }

  const cards = [
    {
      title: 'Explore Gallery',
      icon: <ShoppingBag className="text-[#118C8C]" size={32} />,
      description: 'Discover our latest hand-painted needlepoint and crochet creations.',
      link: '/gallery',
      action: 'View Gallery'
    },
    {
      title: 'View Pricing',
      icon: <Tag className="text-[#F2BB16]" size={32} />,
      description: 'Check our current price lists for commissions and standard items.',
      link: '/pricelists',
      action: 'See Prices'
    },
    {
      title: 'AI Patterns (Coming Soon)',
      icon: <Sparkles className="text-purple-500" size={32} />,
      description: 'Future feature: Generate custom patterns using AI.',
      link: '#',
      action: 'Notify Me',
      disabled: true
    }
  ];

  return (
    <>
      <Helmet>
        <title>My Dashboard - D.A.B.S. Co.</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12 min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-gray-200 pb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#118C8C]">Welcome, {user.name}!</h1>
              <p className="text-gray-600 mt-1">Your personal buyer dashboard.</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
              <LogOut size={18} />
              Logout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                whileHover={!card.disabled ? { y: -5 } : {}}
                className={`bg-white p-8 rounded-xl shadow-md border ${card.disabled ? 'border-gray-100 opacity-80' : 'border-gray-100'}`}
              >
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{card.title}</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">{card.description}</p>
                
                {card.disabled ? (
                  <Button disabled className="w-full bg-gray-100 text-gray-400">
                    {card.action}
                  </Button>
                ) : (
                  <Link to={card.link}>
                    <Button className="w-full bg-[#118C8C] hover:bg-[#0d7070] text-white font-semibold group">
                      {card.action}
                      <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* Placeholder for future integrations */}
          <div className="mt-12 p-8 bg-[#FAF8F1] rounded-xl border border-[#118C8C]/20 border-dashed text-center">
            <h3 className="text-lg font-semibold text-[#118C8C] mb-2">Activity History</h3>
            <p className="text-gray-500 text-sm">Your order history and commissioned pieces will appear here in the future.</p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default BuyerDashboard;
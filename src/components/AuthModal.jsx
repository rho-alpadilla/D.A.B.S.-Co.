// src/components/AuthModal.jsx
import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, useAuth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function AuthModal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If user is logged in → show NOTHING
  if (user) {
    return null;
  }

  // Only show modal when NOT logged in
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-2xl">
        {/* Close button (switch between login/register) */}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-center mb-8 text-[#118C8C]">
          {isLogin ? 'Welcome Back!' : 'Join D.A.B.S. Co.'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#118C8C]/20 focus:border-[#118C8C] transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#118C8C]/20 focus:border-[#118C8C] transition"
            required
          />

          <Button
            type="submit"
            className="w-full bg-[#118C8C] hover:bg-[#0d7070] text-white font-bold py-6 text-lg rounded-xl"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#118C8C] font-bold hover:underline"
          >
            {isLogin ? 'Register Now' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
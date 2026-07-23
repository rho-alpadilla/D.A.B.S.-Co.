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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#210A46]/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-[#FCFAFF] p-6 shadow-[0_24px_80px_rgba(33,10,70,0.38)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-artisan-primary-pale/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-artisan-mauve/20 blur-3xl" />
        {/* Close button (switch between login/register) */}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="absolute right-5 top-5 z-10 rounded-full p-2 text-artisan-text-muted transition hover:bg-artisan-primary-wash hover:text-artisan-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary/40"
        >
          <X size={24} />
        </button>

        <h2
          className="relative text-center font-artisan-display text-3xl font-bold text-artisan-text mb-8"
          style={{ color: '#5C2D91', fontFamily: "'Playfair Display', serif" }}
        >
          {isLogin ? 'Welcome Back!' : 'Join D.A.B.S. Co.'}
        </h2>

        <form onSubmit={handleSubmit} className="relative space-y-5">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-2xl border border-artisan-primary/15 bg-white/85 px-5 py-3 text-artisan-text outline-none transition focus:border-artisan-primary-light focus:ring-4 focus:ring-artisan-primary/15"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-2xl border border-artisan-primary/15 bg-white/85 px-5 py-3 text-artisan-text outline-none transition focus:border-artisan-primary-light focus:ring-4 focus:ring-artisan-primary/15"
            required
          />

          <Button
            type="submit"
            className="h-12 w-full rounded-full text-lg font-bold text-white shadow-artisan-sm"
            style={{ background: 'linear-gradient(135deg, #5C2D91, #7B3FA0)' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <p className="relative mt-6 text-center text-artisan-text-muted">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-artisan-primary font-bold hover:underline"
          >
            {isLogin ? 'Register Now' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}

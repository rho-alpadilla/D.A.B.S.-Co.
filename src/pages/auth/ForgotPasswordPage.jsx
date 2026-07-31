import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { getAuthenticationErrorMessage } from '@/lib/authProviders';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSending(true);
    setStatus({ type: '', message: '' });

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setStatus({ type: 'success', message: 'If an account exists for this address, a password reset link has been sent.' });
    } catch (error) {
      if (error?.code === 'auth/user-not-found') {
        setStatus({ type: 'success', message: 'If an account exists for this address, a password reset link has been sent.' });
      } else {
        setStatus({ type: 'error', message: getAuthenticationErrorMessage(error) });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Helmet><title>Reset Password - D.A.B.S. Co.</title></Helmet>
      <div className="artisan-grid-page flex min-h-screen items-center px-5 py-12 sm:px-6">
        <main className="mx-auto w-full max-w-md rounded-3xl border border-[#E7DED3] bg-[#FAF8F1]/95 p-6 shadow-[0_18px_42px_rgba(36,16,31,0.14)] sm:p-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#47003C] hover:underline"><ArrowLeft size={16} /> Back to login</Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#88538C]">Account recovery</p>
          <h1 className="mt-2 font-artisan-display text-4xl font-bold text-[#01243A]">Reset your password</h1>
          <p className="mt-3 leading-7 text-[#495968]">Enter your account email and we will send a reset link.</p>

          {status.message && <p className={`mt-6 rounded-xl border px-4 py-3 text-sm leading-6 ${status.type === 'success' ? 'border-[#1D5C54]/25 bg-[#EDF7F3] text-[#1D5C54]' : 'border-[#9F1239]/25 bg-[#FFF1F2] text-[#9F1239]'}`}>{status.message}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-semibold text-[#01243A]" htmlFor="reset-email">Email address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88538C]" size={18} />
              <input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#D9C9E3] bg-white py-3 pl-11 pr-4 text-[#01243A] outline-none transition focus:border-[#88538C] focus:ring-4 focus:ring-[#88538C]/15" placeholder="you@example.com" />
            </div>
            <Button type="submit" disabled={isSending} className="h-12 w-full rounded-xl bg-[#47003C] text-white hover:bg-[#5A124E]">{isSending ? 'Sending…' : 'Send reset link'}</Button>
          </form>
        </main>
      </div>
    </>
  );
};

export default ForgotPasswordPage;

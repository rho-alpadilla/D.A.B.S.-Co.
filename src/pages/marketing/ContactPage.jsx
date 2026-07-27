// src/pages/marketing/ContactPage.jsx
// Design A — Artisan Canvas reskin.
// ALL Firebase functions preserved:
//   • addDoc(db, 'messages') with all fields (buyerEmail, buyerName, subject,
//     message, status, createdAt, isAdminReply, source, productInterest)
//   • useEffect auto-fills name/email from user
//   • handleSubmit: auth gate → Firestore write → isSuccess state
//   • useToast for success/failure feedback
//   • navigate('/register') when guest tries to submit
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

const ContactPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
    productInterest: 'None',
  });

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: user.displayName || prev.name || user.email?.split('@')[0] || '',
      email: user.email || prev.email || '',
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Register Required',
        description: 'Please create an account first so your message can be tracked in support chat.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'messages'), {
        buyerEmail: user.email || formData.email,
        buyerName:
          formData.name?.trim() ||
          user.displayName ||
          user.email?.split('@')[0] ||
          'Guest Buyer',
        subject: formData.subject?.trim() || 'General Inquiry',
        message: formData.message?.trim(),
        status: 'unread',
        createdAt: serverTimestamp(),
        isAdminReply: false,
        source: 'contact-page',
        productInterest: formData.productInterest || 'None',
      });

      setIsSuccess(true);
      toast({ title: 'Message Sent!', description: 'Your message was sent to support successfully.' });
    } catch (err) {
      console.error('Contact page send error:', err);
      toast({ title: 'Failed to Send', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared input style
  const inputCls =
    'w-full rounded-xl border border-[#D9C9E3] bg-[#FFFDFF] px-4 py-3 text-[#22152D] shadow-sm transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#766880] focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15 disabled:cursor-not-allowed disabled:border-[#E6DDEB] disabled:bg-[#F2EDF5] disabled:text-[#51445D]';
  const labelCls = 'text-sm font-semibold text-[#342342]';

  return (
    <>
      <Helmet>
        <title>Contact Us - D.A.B.S. Co.</title>
      </Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#5C2D91" color2="#7B3FA0" color3="#C9A0DC"
            timeSpeed={0.25} colorBalance={-0.06} warpStrength={1.5}
            warpFrequency={3.8} warpSpeed={2} warpAmplitude={50}
            blendAngle={0} blendSoftness={1} rotationAmount={500}
            noiseScale={2} grainAmount={0.1} grainScale={2}
            grainAnimated={false} contrast={1.5} gamma={1}
            saturation={1} centerX={0} centerY={0} zoom={0.9}
          />
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={400} particleSpread={10} speed={0.1}
              particleColors={['#FAF8FF', '#A87DC8', '#C9A0DC']}
              moveParticlesOnHover particleHoverFactor={1}
              alphaParticles={false} particleBaseSize={150}
              sizeRandomness={1.7} cameraDistance={53} disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-5 py-14 md:px-8 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/45 bg-white/95 shadow-2xl shadow-[#2D0E5A]/30 backdrop-blur-md"
          >
            {/* ── Form header ── */}
            <div
              className="relative grid gap-8 overflow-hidden p-7 text-white sm:p-10 md:grid-cols-[1.1fr_0.9fr] md:items-end"
              style={{ background: 'linear-gradient(135deg, #5C2D91, #7B3FA0)' }}
            >
              {/* Decorative blobs */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <div className="absolute -top-10 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-10 left-0 w-40 h-40 bg-artisan-primary-pale rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-4">
                  <Sparkles size={14} />
                  Contact D.A.B.S. Co.
                </div>
                <h1
                  className="font-artisan-display text-4xl font-bold leading-[0.95] sm:text-5xl"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Let&apos;s start a conversation.
                </h1>
              </div>
              <p className="relative z-10 border-white/30 text-base leading-7 text-white/90 md:border-l md:pl-8">
                Have a question or want to discuss a custom commission? Send the details and our support team can review your request.
                </p>
            </div>

            {/* ── Form body ── */}
            <div className="p-6 sm:p-10">
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-artisan-text mb-2">Message received</h2>
                  <p className="text-artisan-text-muted mb-6">
                    Thank you for reaching out. Your message is now in the admin support inbox.
                  </p>
                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData({
                        name: user?.displayName || user?.email?.split('@')[0] || '',
                        email: user?.email || '',
                        subject: 'General Inquiry',
                        message: '',
                        productInterest: 'None',
                      });
                    }}
                    variant="outline"
                    className="rounded-2xl"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Guest warning */}
                  {!user && (
                    <div className="rounded-xl border border-[#E2B366] bg-[#FFF6E6] px-4 py-3 text-sm leading-6 text-[#6B4100]">
                      You need to register first before sending a contact message so it can appear properly in support chat.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className={labelCls}>Full Name</label>
                      <input id="name" name="name" required className={inputCls} value={formData.name} onChange={handleChange} disabled={!!user} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className={labelCls}>Email Address</label>
                      <input id="email" name="email" type="email" required className={inputCls} value={formData.email} onChange={handleChange} disabled={!!user} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="subject" className={labelCls}>Subject</label>
                      <input id="subject" name="subject" required className={inputCls} value={formData.subject} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="productInterest" className={labelCls}>Interest</label>
                      <select id="productInterest" name="productInterest" className={inputCls} value={formData.productInterest} onChange={handleChange}>
                        <option value="None">General Inquiry</option>
                        <option value="Needlepoint">Needlepoint Canvas</option>
                        <option value="Crochet">Crochet Item</option>
                        <option value="Commission">Custom Commission</option>
                        <option value="Support">Order Support</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className={labelCls}>Message</label>
                    <textarea
                      id="message" name="message" rows="5" required
                      className={`${inputCls} resize-none`}
                      value={formData.message} onChange={handleChange}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl py-6 text-base font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #5C2D91, #7B3FA0)', boxShadow: '0 8px 24px rgba(92,45,145,0.28)' }}
                  >
                    {isSubmitting
                      ? 'Sending...'
                      : user
                      ? 'Send Message to Support'
                      : 'Register to Send Message'}
                    {!isSubmitting && <Send size={18} className="ml-2" />}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;

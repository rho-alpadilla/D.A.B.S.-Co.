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
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/firebase';
import { sendSupportMessage } from '@/lib/contactMessages';

const ContactPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const customOrderProduct = React.useMemo(() => {
    const query = new URLSearchParams(location.search);
    const productId = query.get('productId')?.trim();
    const productName = query.get('productName')?.trim();
    const quantity = Math.max(1, Math.floor(Number(query.get('quantity')) || 1));
    return productId || productName ? { productId, productName: productName || 'Selected product', quantity } : null;
  }, [location.search]);

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

  useEffect(() => {
    if (!customOrderProduct) return;

    setFormData((prev) => ({
      ...prev,
      subject: 'Custom Order Request',
      productInterest: 'Commission',
      message: '',
    }));
  }, [customOrderProduct]);

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
      await sendSupportMessage({
        user,
        ...formData,
        source: customOrderProduct ? 'product-detail-contact' : 'contact-page',
        productId: customOrderProduct?.productId,
        productName: customOrderProduct?.productName,
        requestedQuantity: customOrderProduct?.quantity,
      });

      setIsSuccess(true);
      toast({ title: 'Message sent', description: 'Your message is now in the support inbox.' });
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

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10 container mx-auto px-5 py-14 md:px-8 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto max-w-5xl"
          >
            {/* ── Form header ── */}
            <div
              className="grid gap-8 border-l-4 border-[#B78B4A] bg-artisan-primary p-7 text-white sm:p-10 md:grid-cols-[1.1fr_0.9fr] md:items-end"
            >
              <div>
                <h1
                  className="font-artisan-display text-4xl font-bold leading-[0.95] sm:text-5xl"
                >
                  Contact us
                </h1>
              </div>
              <p className="border-white/30 text-base leading-7 text-white/90 md:border-l md:pl-8">
                Share your question or custom-order details and our support team will review it.
                </p>
            </div>

            {/* ── Form body ── */}
            <div className="border-x border-b border-[#E7DED3] bg-[#FAF8F1]/95 p-6 sm:p-10">
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <CheckCircle size={32} />
                  </div>
                  <h2 className="font-nunito text-2xl font-bold text-artisan-text mb-2">Message received</h2>
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
                    className="rounded-lg"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {customOrderProduct && (
                    <section className="border-l-2 border-[#88538C] bg-[#F7F0FA] px-5 py-4" aria-label="Custom order product">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7B3FA0]">Custom order for</p>
                      <p className="mt-1 font-artisan-display text-2xl font-bold text-[#342342]">{customOrderProduct.productName}</p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#51445D]">
                        {customOrderProduct.productId && <span>Product ID: {customOrderProduct.productId}</span>}
                        <span>Requested quantity: {customOrderProduct.quantity}</span>
                      </div>
                    </section>
                  )}
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
                    className="w-full bg-artisan-primary py-6 text-base font-bold text-white shadow-[0_8px_24px_rgba(92,45,145,0.2)] hover:bg-[#4A247B]"
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

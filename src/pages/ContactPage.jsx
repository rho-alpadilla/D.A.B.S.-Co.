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
import Grainient from '@/components/ui-bits/Grainient';
import Particles from '@/components/ui-bits/Particles';

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
      toast({
        title: 'Message Sent!',
        description: 'Your message was sent to support successfully.',
      });
    } catch (err) {
      console.error('Contact page send error:', err);
      toast({
        title: 'Failed to Send',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - D.A.B.S. Co.</title>
      </Helmet>

      <div className="relative min-h-screen bg-[#daf0ee] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#118c8c"
            color2="#118c8c"
            color3="#fbfe9f"
            timeSpeed={0.25}
            colorBalance={-0.06}
            warpStrength={1.5}
            warpFrequency={3.8}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={1}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={400}
              particleSpread={10}
              speed={0.1}
              particleColors={['#faf8f1', '#118c8c', '#f1bb19']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={150}
              sizeRandomness={1.7}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/30"
          >
            <div className="bg-[#118C8C]/95 backdrop-blur-md p-8 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-10 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-10 left-0 w-40 h-40 bg-[#F2BB16] rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-4">
                  <Sparkles size={14} />
                  Contact D.A.B.S. Co.
                </div>

                <h1 className="text-3xl font-bold mb-2">Get in Touch</h1>
                <p className="text-[#d8f5f5]">
                  Have a question or want to discuss a custom commission?
                </p>
              </div>
            </div>

            <div className="p-8">
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Message Received!</h2>

                  <p className="text-gray-600 mb-6">
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
                  {!user && (
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                      You need to register first before sending a contact message so it can appear properly in support chat.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#118C8C] focus:outline-none bg-white"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!!user}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#118C8C] focus:outline-none bg-white"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!!user}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#118C8C] focus:outline-none bg-white"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="productInterest" className="text-sm font-medium text-gray-700">
                        Interest
                      </label>
                      <select
                        id="productInterest"
                        name="productInterest"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#118C8C] focus:outline-none bg-white"
                        value={formData.productInterest}
                        onChange={handleChange}
                      >
                        <option value="None">General Inquiry</option>
                        <option value="Needlepoint">Needlepoint Canvas</option>
                        <option value="Crochet">Crochet Item</option>
                        <option value="Commission">Custom Commission</option>
                        <option value="Support">Order Support</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#118C8C] focus:outline-none bg-white resize-none"
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-6 rounded-2xl text-base"
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
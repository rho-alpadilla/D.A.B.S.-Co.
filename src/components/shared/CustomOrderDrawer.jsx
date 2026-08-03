import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ImageOff, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/lib/firebase';
import { sendSupportMessage } from '@/lib/contactMessages';

const CustomOrderDrawer = () => {
  const { customOrderRequest, closeCustomOrderRequest } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMessage('');
    setRequestedQuantity(Math.max(1, Number(customOrderRequest?.requestedQuantity) || 1));
  }, [customOrderRequest?.productId, customOrderRequest?.requestedQuantity]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      closeCustomOrderRequest();
      navigate('/register');
      return;
    }

    setIsSending(true);
    try {
      await sendSupportMessage({
        user,
        name: user.displayName || user.email?.split('@')[0],
        email: user.email,
        subject: 'Custom Order Request',
        message,
        productInterest: 'Commission',
        source: 'stock-limit-drawer',
        productId: customOrderRequest.productId,
        productName: customOrderRequest.productName,
        requestedQuantity,
      });
      toast({ title: 'Request sent', description: 'Our team can review your request in support chat.' });
      closeCustomOrderRequest();
    } catch (error) {
      toast({ title: 'Message not sent', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog.Root open={Boolean(customOrderRequest)} onOpenChange={(open) => !open && closeCustomOrderRequest()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#24101F]/35 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-[#E7DED3] bg-[#FAF8F1] shadow-[-24px_0_60px_rgba(36,16,31,0.2)] outline-none md:w-1/2">
          <header className="flex items-start justify-between border-b border-[#E7DED3] bg-[#47003C] px-6 py-6 text-white sm:px-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Custom order details</p>
              <Dialog.Title className="font-artisan-display text-3xl font-bold">Request additional pieces</Dialog.Title>
              <Dialog.Description className="mt-2 max-w-md text-sm leading-6 text-white/80">Tell us what you need. Your message goes directly to the support inbox.</Dialog.Description>
            </div>
            <Dialog.Close asChild><button className="rounded-full border border-white/25 p-2 text-white transition-colors hover:bg-white/10" aria-label="Close custom order panel"><X size={20} /></button></Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <section className="rounded-2xl border border-[#E7DED3] bg-white/70 p-5" aria-label="Selected product">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88538C]">Selected product</p>
              <div className="mt-3 flex gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E7DED3] text-[#88538C]">
                  {customOrderRequest?.productImage ? <img src={customOrderRequest.productImage} alt="" className="h-full w-full object-cover" /> : <ImageOff size={24} aria-hidden="true" />}
                </div>
                <div className="min-w-0">
                  <p className="font-artisan-display text-2xl font-bold leading-tight text-[#01243A]">{customOrderRequest?.productName}</p>
                  <p className="mt-2 text-sm text-[#495968]">Available now: <span className="font-semibold text-[#01243A]">{customOrderRequest?.availableStock}</span></p>
                  <label className="mt-3 block text-sm text-[#495968]" htmlFor="custom-order-quantity">
                    Requested quantity
                    <input
                      id="custom-order-quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={requestedQuantity}
                      onChange={(event) => setRequestedQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
                      className="mt-1 block w-24 rounded-lg border border-[#D9C9E3] bg-white px-3 py-1.5 font-semibold tabular-nums text-[#01243A] outline-none transition focus:border-[#88538C] focus:ring-4 focus:ring-[#88538C]/15"
                    />
                  </label>
                </div>
              </div>
            </section>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {!user && <p className="rounded-xl border border-[#B78B4A]/40 bg-[#FFF6E6] px-4 py-3 text-sm text-[#6B4100]">Create an account to send and track this request.</p>}
              <label className="block text-sm font-semibold text-[#01243A]" htmlFor="custom-order-message">Message</label>
              <textarea id="custom-order-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={3000} required={Boolean(user)} rows={7} placeholder="Describe the quantity, deadline, or changes you need." className="w-full resize-y rounded-xl border border-[#D9C9E3] bg-white px-4 py-3 text-[#01243A] outline-none transition focus:border-[#88538C] focus:ring-4 focus:ring-[#88538C]/15" />
              <p className="text-right text-xs text-[#667482]">{message.length}/3000</p>
              <Button type="submit" disabled={isSending} className="h-12 w-full rounded-xl bg-[#47003C] text-white hover:bg-[#5A124E]">{user ? (isSending ? 'Sending…' : 'Send custom-order request') : 'Create an account to send'}<Send size={17} className="ml-2" /></Button>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CustomOrderDrawer;

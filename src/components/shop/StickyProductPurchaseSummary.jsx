import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStockLabel, isPurchasable } from '@/lib/stock';

const StickyProductPurchaseSummary = ({ product, imageUrl, formatPrice, onAddToCart, onCustomOrder }) => {
  const canPurchase = isPurchasable(product);

  const actions = (
    <>
      {canPurchase && (
        <Button onClick={onAddToCart} className="h-11 flex-1 rounded-xl bg-artisan-primary text-white hover:bg-[#4A247B]">
          Add to cart
        </Button>
      )}
      <Button onClick={onCustomOrder} variant={canPurchase ? 'outline' : 'default'} className="h-11 flex-1 rounded-xl border-[#88538C] text-artisan-primary hover:bg-[#F7F0FA]">
        {canPurchase ? 'Custom order' : 'Request custom order'}
        <ArrowRight size={16} className="ml-2" />
      </Button>
    </>
  );

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        aria-label="Quick product purchase controls"
        className="fixed right-6 top-28 z-30 hidden w-80 border border-[#E7DED3] bg-[#FAF8F1]/95 p-4 shadow-[0_18px_42px_rgba(36,16,31,0.18)] backdrop-blur lg:block"
      >
        <div className="flex gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-[#E7DED3] text-artisan-primary">
            {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <ShoppingBag size={22} aria-hidden="true" />}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 font-artisan-display text-lg font-bold leading-tight text-[#01243A]">{product.name}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-artisan-primary">{formatPrice(product.price)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#88538C]">{getStockLabel(product)}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">{actions}</div>
      </motion.aside>

      <motion.aside
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        aria-label="Quick product purchase controls"
        className="fixed inset-x-3 bottom-24 z-30 border border-[#E7DED3] bg-[#FAF8F1]/95 p-3 shadow-[0_14px_34px_rgba(36,16,31,0.18)] backdrop-blur lg:hidden"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="truncate font-semibold text-[#01243A]">{product.name}</p>
          <p className="shrink-0 font-bold tabular-nums text-artisan-primary">{formatPrice(product.price)}</p>
        </div>
        <div className="flex gap-2">{actions}</div>
      </motion.aside>
    </>
  );
};

export default StickyProductPurchaseSummary;

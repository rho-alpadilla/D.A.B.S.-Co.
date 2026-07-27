import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Shared heading for purchase-flow pages. It keeps Cart and Checkout visually
 * connected without owning actions, navigation, or purchase-state logic.
 */
const PurchasePageHero = ({ eyebrow, title, description, action }) => (
  <header className="mb-10 grid gap-6 border-b border-white/60 pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
    <div>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-artisan-primary-light/35 bg-white/65 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-artisan-primary shadow-sm backdrop-blur-sm">
        <Sparkles size={14} aria-hidden="true" />
        {eyebrow}
      </div>
      <h1 className="max-w-2xl font-artisan-display text-4xl font-bold leading-[0.98] tracking-[-0.03em] text-artisan-text sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-artisan-text-mid sm:text-lg">
        {description}
      </p>
    </div>

    {action && <div className="w-full md:w-auto">{action}</div>}
  </header>
);

export default PurchasePageHero;

// src/pages/marketing/FAQsPage.jsx
// Design A — Artisan Canvas reskin. faqs data import + all motion animations preserved.
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { faqs } from '@/data/faqs';
import { Sparkles } from 'lucide-react';

const FAQsPage = () => {
  return (
    <>
      <Helmet>
        <title>FAQs - D.A.B.S. Co.</title>
        <meta
          name="description"
          content="Find answers to frequently asked questions about D.A.B.S. Co.'s handcrafted products, custom orders, shipping, and more."
        />
      </Helmet>

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="h-fit text-[#2D0E5A] lg:sticky lg:top-24"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-artisan-primary/20 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-sm">
              <Sparkles size={14} className="text-artisan-primary" />
              Help Center
            </div>
            <h1 className="mt-6 font-artisan-display text-5xl font-bold leading-[0.95] text-artisan-primary md:text-6xl">
              Answers, made simple.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-artisan-text-mid">
              Find answers to common questions about our products and services.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="mt-10 border-y border-artisan-primary/20 py-6"
            >
              <h2 className="font-artisan-display text-2xl font-bold text-artisan-primary">Still have questions?</h2>
              <p className="mt-3 leading-7 text-artisan-text-mid">Reach out to us directly and we&apos;ll be glad to help.</p>
              <a href="mailto:contact@dabsco.com" className="mt-4 inline-block font-semibold text-artisan-primary underline decoration-artisan-primary/40 underline-offset-4 transition-colors hover:text-[#2D0E5A]">
                contact@dabsco.com
              </a>
            </motion.div>
          </motion.aside>

          <div className="grid gap-4 sm:gap-5">
            {faqs.map((faq, index) => (
              <motion.article
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="artisan-card-hover group grid gap-5 rounded-2xl border border-white/50 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/15 sm:grid-cols-[3.5rem_1fr] sm:p-7"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0E6F7] font-bold text-[#5C2D91]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="font-artisan-display text-2xl font-bold leading-tight text-[#2A1739] transition-colors group-hover:text-[#5C2D91]">
                    {faq.question}
                  </h2>
                  <p className="mt-3 leading-7 text-[#5B4C66]">{faq.answer}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQsPage;

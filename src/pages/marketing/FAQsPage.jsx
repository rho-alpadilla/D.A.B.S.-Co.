// src/pages/marketing/FAQsPage.jsx
// Design A — Artisan Canvas reskin. faqs data import + all motion animations preserved.
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';
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

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="h-fit text-white lg:sticky lg:top-24"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-sm">
              <Sparkles size={14} className="text-artisan-primary-pale" />
              Help Center
            </div>
            <h1 className="mt-6 font-artisan-display text-5xl font-bold leading-[0.95] text-white md:text-6xl">
              Answers, made simple.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/90">
              Find answers to common questions about our products and services.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="mt-10 border-y border-white/25 py-6"
            >
              <h2 className="font-artisan-display text-2xl font-bold text-white">Still have questions?</h2>
              <p className="mt-3 leading-7 text-white/85">Reach out to us directly and we&apos;ll be glad to help.</p>
              <a href="mailto:contact@dabsco.com" className="mt-4 inline-block font-semibold text-artisan-primary-pale underline decoration-white/40 underline-offset-4 transition-colors hover:text-white">
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
                whileHover={{ y: -4 }}
                className="group grid gap-5 rounded-2xl border border-white/50 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/15 transition-shadow hover:shadow-xl sm:grid-cols-[3.5rem_1fr] sm:p-7"
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
